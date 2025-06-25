# DigitalOcean Spaces Setup Guide

## Step 1: Create DigitalOcean Account
1. Go to https://digitalocean.com
2. Sign up for an account
3. Verify your email

## Step 2: Create a Space (Bucket)
1. In DigitalOcean dashboard, click "Spaces Object Storage"
2. Click "Create a Space"
3. Choose settings:
   - **Datacenter region**: Choose closest to your users (e.g., NYC3, AMS3, SFO3)
   - **Space name**: `dhr-music` (or your preferred name)
   - **File Listing**: Keep "Restrict File Listing" UNCHECKED for public access
   - **CDN**: Enable CDN for faster downloads worldwide
4. Click "Create a Space"

## Step 3: Get API Keys
1. Go to "API" in left sidebar
2. Click "Spaces Keys" tab
3. Click "Generate New Key"
4. Name it: `DHR Music API Key`
5. **SAVE THESE VALUES** (you'll only see the secret once):
   - Access Key ID: `DO00XXXXXXXXXX`
   - Secret Access Key: `xxxxxxxxxxxxxxxxxxxx`

## Step 4: Configure the Application
I'll need these 4 values:
```
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com  (replace nyc3 with your region)
S3_BUCKET=dhr-music  (your space name)
S3_ACCESS_KEY=DO00XXXXXXXXXX  (your access key)
S3_SECRET_KEY=xxxxxxxxxxxxxxxxxxxx  (your secret key)
```

## Step 5: Upload Test Files
1. In your Space, click "Upload Files"
2. Upload 2-3 MP3 files to test
3. Note the file paths (e.g., `test-mix-1.mp3`)

## Step 6: Test the System
Once configured, I'll update a few database records to use Spaces URLs and we can test streaming/downloading.

## Cost Breakdown
- **Storage**: $5/month for 250GB
- **Bandwidth**: Included in the $5/month
- **CDN**: Included
- **API calls**: Free

For your 1000+ mix collection (~50GB), this will cost exactly $5/month with room to grow.

## Why DigitalOcean Spaces?
- S3-compatible API (industry standard)
- Simple flat pricing
- Built-in CDN for fast global delivery
- Reliable infrastructure
- Easy to manage via web interface
- Can migrate to AWS S3 later if needed

Ready to proceed? Provide the 4 environment variables above and I'll configure the system!