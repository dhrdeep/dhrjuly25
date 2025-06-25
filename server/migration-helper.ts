// Helper script to migrate existing mixes to new hosting
import { db } from './db';
import { vipMixes } from '@shared/schema';
import { eq } from 'drizzle-orm';

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
    .where(eq(vipMixes.s3Url, null))
    .limit(10);
  
  console.log(`Found ${mixes.length} mixes without Spaces URLs:`);
  mixes.forEach(mix => {
    console.log(`- ${mix.id}: ${mix.title}`);
  });
  
  return mixes;
}