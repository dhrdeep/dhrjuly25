// Helper script to migrate existing mixes to new hosting
import { db } from './db';
import { vipMixes } from '@shared/schema';
import { eq, or, isNull } from 'drizzle-orm';

export async function testSpacesConnection() {
  const testEndpoint = process.env.S3_ENDPOINT;
  const testBucket = process.env.S3_BUCKET;
  
  if (!testEndpoint || !testBucket) {
    console.log('❌ Spaces not configured yet');
    return false;
  }
  
  console.log(`✅ Spaces configured: ${testEndpoint}/${testBucket}`);
  return true;
}

export async function updateMixWithSpacesUrl(mixId: number, s3Path: string) {
  try {
    const [updated] = await db
      .update(vipMixes)
      .set({ 
        s3Url: s3Path,
        updatedAt: new Date()
      })
      .where(eq(vipMixes.id, mixId))
      .returning();
    
    console.log(`✅ Updated mix ${mixId}: ${updated.title} -> ${s3Path}`);
    return updated;
  } catch (error) {
    console.error(`❌ Failed to update mix ${mixId}:`, error);
    return null;
  }
}

export async function bulkUpdateMixes(updates: Array<{id: number, s3Path: string}>) {
  console.log(`Starting bulk update of ${updates.length} mixes...`);
  
  for (const update of updates) {
    await updateMixWithSpacesUrl(update.id, update.s3Path);
  }
  
  console.log('✅ Bulk update completed');
}

export async function listMixesWithoutSpaces() {
  const mixes = await db
    .select()
    .from(vipMixes)
    .where(isNull(vipMixes.s3Url))
    .limit(10);
  
  console.log(`Found ${mixes.length} mixes without Spaces URLs:`);
  mixes.forEach(mix => {
    console.log(`- ${mix.id}: ${mix.title}`);
  });
  
  return mixes;
}

export async function syncSpaceWithDatabase() {
  try {
    console.log('🔄 Scanning DigitalOcean Space for new files...');
    
    // Get list of files from DigitalOcean Space
    const AWS = await import('aws-sdk');
    const s3 = new AWS.default.S3({
      endpoint: process.env.S3_ENDPOINT || 'https://lon1.digitaloceanspaces.com',
      accessKeyId: process.env.S3_ACCESS_KEY || 'DO00XZCG3UHJKGHWGHK3',
      secretAccessKey: process.env.S3_SECRET_KEY || '43k5T+g++ESLIKOdVhX3u7Zavw3/JNfNrxxxqrltJmc',
      region: 'lon1'
    });

    const params = {
      Bucket: process.env.S3_BUCKET || 'dhrmixes',
      MaxKeys: 1000
    };

    const data = await s3.listObjectsV2(params).promise();
    const spaceFiles = data.Contents?.map((obj: any) => obj.Key) || [];
    
    console.log(`Found ${spaceFiles.length} files in DigitalOcean Space`);

    // Get existing database entries
    const existingMixes = await db.select().from(vipMixes);
    const existingFiles = existingMixes.map(mix => mix.s3Url).filter(Boolean);

    // Find new files not in database
    const newFiles = spaceFiles.filter((file: string) => !existingFiles.includes(file));
    
    if (newFiles.length === 0) {
      console.log('✅ No new files found - database is up to date');
      return { newFiles: [], addedMixes: [] };
    }

    console.log(`📁 Found ${newFiles.length} new files to add:`);
    newFiles.forEach((file: string) => console.log(`  - ${file}`));

    // Add new files to database
    const addedMixes = [];
    for (const filename of newFiles) {
      // Extract title from filename (remove extension and clean up)
      const title = filename
        .replace(/\.[^/.]+$/, '') // Remove extension
        .replace(/^\d+\s*[-_]?\s*/, '') // Remove leading numbers
        .replace(/[-_]/g, ' ') // Replace dashes/underscores with spaces
        .trim();

      const newMix = await db.insert(vipMixes).values({
        title,
        artist: 'Deep House Radio',
        s3Url: filename,
        isActive: true,
        genre: 'deep house',
        tags: JSON.stringify(['deep house', 'electronic', 'dj mix']),
        fileSize: '~150MB' // Placeholder - could be enhanced to get actual size
      }).returning();

      addedMixes.push(newMix[0]);
      console.log(`✅ Added: ${title}`);
    }

    console.log(`🎉 Successfully added ${addedMixes.length} new mixes to database`);
    return { newFiles, addedMixes };

  } catch (error) {
    console.error('❌ Error syncing Space with database:', error);
    throw error;
  }
}