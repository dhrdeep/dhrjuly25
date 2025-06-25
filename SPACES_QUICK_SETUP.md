# Quick DigitalOcean Spaces Setup

## From Your Current Screen:
1. Click on **"Store static objects"** (bottom right card)
2. This will take you to Spaces Object Storage

## OR Navigate Directly:
1. In the left sidebar, look for "Manage" section
2. Click "Spaces" or "Spaces Object Storage"

## Create Your Space:
1. Click "Create a Space"
2. Settings:
   - **Region**: Choose your closest region (e.g., NYC3, AMS3, SFO3)
   - **Space Name**: `dhr-music` (or any name you prefer)
   - **Restrict File Listing**: Leave UNCHECKED (for public access)
   - **CDN**: Enable for faster downloads
3. Click "Create Space"

## Get API Keys:
1. Go to "API" in left sidebar  
2. Click "Spaces Keys" tab
3. Click "Generate New Key"
4. Name: `DHR Music API`
5. Copy both values immediately (secret key only shown once)

## Test Upload:
1. Upload 1-2 MP3 files to test
2. Note the file names for testing

## Provide These 4 Values:
```
S3_ENDPOINT=https://[your-region].digitaloceanspaces.com
S3_BUCKET=[your-space-name]
S3_ACCESS_KEY=[your-access-key]
S3_SECRET_KEY=[your-secret-key]
```

Once you provide these, I'll configure the system and we can test with real audio files!