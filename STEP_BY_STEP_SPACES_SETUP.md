# Step-by-Step DigitalOcean Spaces Setup

## STEP 1: Access Spaces
From your current DigitalOcean dashboard:
1. Look for "Store static objects" card (bottom right)
2. Click on it
3. OR use left sidebar: Click "Spaces" under "Manage" section

## STEP 2: Create Your First Space
1. Click the blue "Create a Space" button
2. Fill out the form:
   - **Choose a datacenter region**: Select closest to your users
     - NYC3 (New York) - good for US/Europe
     - AMS3 (Amsterdam) - good for Europe  
     - SFO3 (San Francisco) - good for US West Coast
   - **Choose a unique name**: `dhr-music` (or your preferred name)
   - **Select a project**: Leave default
   - **File Listing**: UNCHECK "Restrict File Listing" (we need public access)
   - **CDN**: CHECK "Enable CDN" (faster downloads worldwide)
3. Click "Create a Space"

## STEP 3: Upload Test Files
1. In your new Space, click "Upload Files"
2. Select 2-3 MP3 files from your collection
3. Wait for upload to complete
4. Note the file names (e.g., "test-mix-1.mp3")

## STEP 4: Get API Credentials
1. Click "API" in the left sidebar
2. Click "Spaces Keys" tab
3. Click "Generate New Key" button
4. Name it: "DHR Music API Key"
5. **IMMEDIATELY COPY BOTH VALUES**:
   - Access Key ID: starts with "DO00..."
   - Secret Access Key: long random string
   - ⚠️ The secret key is only shown ONCE!

## STEP 5: Find Your Space URL
In your Space overview, you'll see:
- Space name: `dhr-music`
- Region: `nyc3` (or whatever you chose)
- Your endpoint will be: `https://nyc3.digitaloceanspaces.com`

## STEP 6: Provide Configuration
Tell me these 4 values:
```
S3_ENDPOINT=https://[region].digitaloceanspaces.com
S3_BUCKET=[space-name]
S3_ACCESS_KEY=[access-key-id]
S3_SECRET_KEY=[secret-access-key]
```

## STEP 7: Test Configuration
Once you provide the values, I'll:
1. Add them to your environment
2. Update a test mix to use Spaces
3. Verify streaming and downloads work
4. Show you how to migrate more files

Ready to start? Follow Step 1 and let me know when you're in the Spaces section!