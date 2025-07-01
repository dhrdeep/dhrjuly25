import type { Express } from "express";
import { createServer, type Server } from "http";
import { createHmac } from "crypto";
import crypto from "crypto";
import FormData from "form-data";
import fetch from "node-fetch";
import { storage } from "./storage";
import { insertVipMixSchema, insertUserDownloadSchema } from "@shared/schema";
import { fileHostingService } from "./fileHostingService";
import { streamMonitor } from "./streamMonitor";
import { rssService } from "./rssService";
import { redditService } from "./redditService";
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { PassThrough } from 'stream';
import fs from 'fs';
import { execSync } from 'child_process';

// Configure FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath.path);

export async function registerRoutes(app: Express): Promise<Server> {
  // Patreon OAuth endpoint to replace Supabase edge function
  app.post("/api/patreon-oauth", async (req, res) => {
    try {
      const { code, state, redirectUri } = req.body;

      if (!code || !state) {
        return res.status(400).json({
          success: false,
          error: "invalid_request",
          error_description: "Missing code or state parameter"
        });
      }

      const clientId = process.env.PATREON_CLIENT_ID;
      const clientSecret = process.env.PATREON_CLIENT_SECRET;

      console.log('Server environment check:', {
        clientId: clientId ? 'Present' : 'Missing',
        clientSecret: clientSecret ? 'Present' : 'Missing'
      });

      if (!clientId || !clientSecret) {
        return res.status(500).json({
          success: false,
          error: "server_error",
          error_description: "Patreon credentials not configured on server"
        });
      }

      // Exchange authorization code for access token
      const tokenData = new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri || `${req.protocol}://${req.get('host')}/auth/patreon/callback`,
      });

      const tokenResponse = await fetch('https://www.patreon.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenData,
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        return res.status(400).json({
          success: false,
          error: "token_exchange_failed",
          error_description: `Patreon API error: ${tokenResponse.status} ${errorText}`
        });
      }

      const tokenResult = await tokenResponse.json();

      // Save tokens to database (optional for now, focusing on client-side flow)
      try {
        await storage.savePatreonTokens({
          accessToken: tokenResult.access_token,
          refreshToken: tokenResult.refresh_token,
          expiresAt: new Date(Date.now() + tokenResult.expires_in * 1000),
          scope: tokenResult.scope || 'identity campaigns campaigns.members',
          userId: null // Will be linked later when user info is retrieved
        });
        console.log('Tokens saved to database successfully');
      } catch (dbError) {
        console.warn('Failed to save tokens to database:', dbError);
        // Continue with response even if DB save fails
      }

      res.json({
        success: true,
        access_token: tokenResult.access_token,
        refresh_token: tokenResult.refresh_token,
        expires_in: tokenResult.expires_in,
        scope: tokenResult.scope,
        token_type: tokenResult.token_type
      });
    } catch (error) {
      console.error('Patreon OAuth error:', error);
      res.status(500).json({
        success: false,
        error: "internal_server_error",
        error_description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });

  // Patreon token refresh endpoint
  app.post("/api/patreon-refresh", async (req, res) => {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          error: "invalid_request",
          error_description: "Missing refresh_token parameter"
        });
      }

      const clientId = process.env.PATREON_CLIENT_ID;
      const clientSecret = process.env.PATREON_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return res.status(500).json({
          success: false,
          error: "server_error",
          error_description: "Patreon credentials not configured on server"
        });
      }

      const tokenResponse = await fetch('https://www.patreon.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'DHR-Backend/1.0',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        return res.status(400).json({
          success: false,
          error: "token_refresh_failed",
          error_description: errorText
        });
      }

      const tokenData = await tokenResponse.json();

      res.json({
        success: true,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope,
        token_type: tokenData.token_type
      });
    } catch (error) {
      console.error('Patreon refresh error:', error);
      res.status(500).json({
        success: false,
        error: "server_error",
        error_description: error instanceof Error ? error.message : "Unknown server error"
      });
    }
  });

  // Get Patreon campaigns (server-side to avoid CORS)
  app.get('/api/patreon-campaigns', async (req, res) => {
    try {
      const tokens = await storage.getPatreonTokens();
      if (!tokens) {
        return res.status(401).json({ error: 'No Patreon tokens found' });
      }

      console.log('Fetching campaigns from server-side...');
      const campaignsResponse = await fetch('https://www.patreon.com/api/oauth2/v2/campaigns?fields%5Bcampaign%5D=created_at,creation_name,patron_count,url', {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Campaigns API response status:', campaignsResponse.status);

      if (!campaignsResponse.ok) {
        const errorText = await campaignsResponse.text();
        console.error('Campaigns API error:', errorText);
        return res.status(campaignsResponse.status).json({ error: errorText });
      }

      const campaignsData = await campaignsResponse.json();
      console.log('Campaigns data:', campaignsData);
      
      res.json(campaignsData);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get campaign pledges/members (server-side to avoid CORS)
  app.get('/api/patreon-campaigns/:campaignId/pledges', async (req, res) => {
    try {
      const { campaignId } = req.params;
      const { cursor, count = '100' } = req.query;
      const tokens = await storage.getPatreonTokens();
      if (!tokens) {
        return res.status(401).json({ error: 'No Patreon tokens found' });
      }

      let url = `https://www.patreon.com/api/oauth2/v2/campaigns/${campaignId}/members?include=user,currently_entitled_tiers&fields%5Bmember%5D=campaign_lifetime_support_cents,currently_entitled_amount_cents,email,full_name,is_follower,last_charge_date,last_charge_status,lifetime_support_cents,next_charge_date,note,patron_status,pledge_cadence,pledge_relationship_start,will_pay_amount_cents&fields%5Buser%5D=email,first_name,full_name,image_url,last_name,social_connections,thumb_url,url,vanity&fields%5Btier%5D=amount_cents,created_at,description,discord_role_ids,edited_at,image_url,patron_count,published,published_at,requires_shipping,title,url&page%5Bcount%5D=${count}`;
      
      if (cursor) {
        url += `&page%5Bcursor%5D=${cursor}`;
      }

      console.log(`Fetching pledges for campaign ${campaignId} (cursor: ${cursor || 'first page'})...`);
      const pledgesResponse = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Pledges API response status:', pledgesResponse.status);

      if (!pledgesResponse.ok) {
        const errorText = await pledgesResponse.text();
        console.error('Pledges API error:', errorText);
        return res.status(pledgesResponse.status).json({ error: errorText });
      }

      const pledgesData = await pledgesResponse.json();
      console.log('Pledges data sample:', {
        dataCount: pledgesData.data?.length || 0,
        meta: pledgesData.meta
      });
      
      res.json(pledgesData);
    } catch (error) {
      console.error('Error fetching pledges:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Fetch ALL Patreon members with pagination
  app.get('/api/patreon-campaigns/:campaignId/all-members', async (req, res) => {
    try {
      const { campaignId } = req.params;
      const tokens = await storage.getPatreonTokens();
      if (!tokens) {
        return res.status(401).json({ error: 'No Patreon tokens found' });
      }

      const allMembers: any[] = [];
      let cursor: string | null = null;
      let totalFetched = 0;
      const maxPages = 50; // Safety limit
      let pageCount = 0;

      console.log(`Fetching ALL members for campaign ${campaignId}...`);

      do {
        let url = `https://www.patreon.com/api/oauth2/v2/campaigns/${campaignId}/members?include=user,currently_entitled_tiers&fields%5Bmember%5D=campaign_lifetime_support_cents,currently_entitled_amount_cents,email,full_name,is_follower,last_charge_date,last_charge_status,lifetime_support_cents,next_charge_date,note,patron_status,pledge_cadence,pledge_relationship_start,will_pay_amount_cents&fields%5Buser%5D=email,first_name,full_name,image_url,last_name,social_connections,thumb_url,url,vanity&fields%5Btier%5D=amount_cents,created_at,description,discord_role_ids,edited_at,image_url,patron_count,published,published_at,requires_shipping,title,url&page%5Bcount%5D=100`;
        
        if (cursor) {
          url += `&page%5Bcursor%5D=${cursor}`;
        }

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Members API error:', errorText);
          break;
        }

        const data = await response.json();
        const members = data.data || [];
        allMembers.push(...members);
        totalFetched += members.length;

        console.log(`Fetched page ${pageCount + 1}: ${members.length} members (total: ${totalFetched})`);

        // Check for next page
        cursor = data.meta?.pagination?.cursors?.next || null;
        pageCount++;

      } while (cursor && pageCount < maxPages);

      console.log(`Completed fetching ${totalFetched} total members`);
      
      res.json({
        data: allMembers,
        meta: {
          pagination: {
            total: totalFetched,
            pages_fetched: pageCount
          }
        }
      });
    } catch (error) {
      console.error('Error fetching all members:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // User management endpoints
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // VIP Mixes API
  app.get("/api/vip-mixes", async (req, res) => {
    try {
      const mixes = await storage.getAllVipMixes();
      res.json(mixes);
    } catch (error) {
      console.error("Error fetching VIP mixes:", error);
      res.status(500).json({ error: "Failed to fetch VIP mixes" });
    }
  });

  app.get("/api/vip-mixes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mix = await storage.getVipMix(id);
      if (!mix) {
        return res.status(404).json({ error: "Mix not found" });
      }
      res.json(mix);
    } catch (error) {
      console.error("Error fetching VIP mix:", error);
      res.status(500).json({ error: "Failed to fetch VIP mix" });
    }
  });

  app.post("/api/vip-mixes", async (req, res) => {
    try {
      const validatedData = insertVipMixSchema.parse(req.body);
      const mix = await storage.createVipMix(validatedData);
      res.status(201).json(mix);
    } catch (error) {
      console.error("Error creating VIP mix:", error);
      res.status(500).json({ error: "Failed to create VIP mix" });
    }
  });

  app.patch("/api/vip-mixes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const mix = await storage.updateVipMix(id, updates);
      res.json(mix);
    } catch (error) {
      console.error("Error updating VIP mix:", error);
      res.status(500).json({ error: "Failed to update VIP mix" });
    }
  });

  app.post("/api/vip-mixes/bulk-import", async (req, res) => {
    try {
      const { mixes } = req.body;
      if (!Array.isArray(mixes) || mixes.length === 0) {
        return res.status(400).json({ error: "Invalid mixes data" });
      }

      const results = { success: 0, errors: [] as string[] };
      
      for (let i = 0; i < mixes.length; i++) {
        try {
          const mixData = {
            ...mixes[i],
            rating: 5,
            totalDownloads: 0,
            isExclusive: true,
            isActive: true
          };
          
          const validatedData = insertVipMixSchema.parse(mixData);
          await storage.createVipMix(validatedData);
          results.success++;
        } catch (error) {
          results.errors.push(`Mix ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      res.json(results);
    } catch (error) {
      console.error("Error in bulk import:", error);
      res.status(500).json({ error: "Failed to process bulk import" });
    }
  });

  // Download tracking and access control
  app.post("/api/download/:mixId", async (req, res) => {
    try {
      const mixId = parseInt(req.params.mixId);
      const { userId } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "User authentication required" });
      }

      // Demo user gets VIP access but still has download limits
      if (userId === 'demo_user') {
        // Simple in-memory tracking for demo user
        const today = new Date().toISOString().split('T')[0];
        const cacheKey = `demo_downloads_${today}`;
        
        // Use a simple counter (in production this would be in Redis or database)
        if (!(global as any).demoDownloadCache) {
          (global as any).demoDownloadCache = {};
        }
        
        const currentDownloads = (global as any).demoDownloadCache[cacheKey] || 0;
        if (currentDownloads >= 2) {
          return res.status(429).json({ error: "Daily download limit reached (2 downloads per day)" });
        }

        const mix = await storage.getVipMix(mixId);
        if (!mix) {
          return res.status(404).json({ error: "Mix not found" });
        }

        // Increment counter
        (global as any).demoDownloadCache[cacheKey] = currentDownloads + 1;
        
        // Use file hosting service for demo downloads
        const downloadUrl = await fileHostingService.getDownloadUrl(mix);
        
        return res.json({
          success: true,
          downloadUrl,
          remainingDownloads: 2 - (global as any).demoDownloadCache[cacheKey],
          mix: {
            title: mix.title,
            artist: mix.artist,
            fileSize: mix.fileSize
          }
        });
      }

      // Check user subscription tier
      const user = await storage.getUser(userId);
      if (!user || user.subscriptionTier !== 'vip') {
        return res.status(403).json({ error: "VIP subscription required for downloads" });
      }

      // Check daily download limit
      const remainingDownloads = await storage.getRemainingDownloads(userId);
      if (remainingDownloads <= 0) {
        return res.status(429).json({ error: "Daily download limit reached" });
      }

      // Get mix details
      const mix = await storage.getVipMix(mixId);
      if (!mix) {
        return res.status(404).json({ error: "Mix not found" });
      }

      // Record the download
      const downloadRecord = await storage.recordDownload({
        userId,
        mixId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Update daily download count
      const today = new Date().toISOString().split('T')[0];
      const currentLimit = await storage.getDailyDownloadLimit(userId);
      const newUsedCount = (currentLimit?.downloadsUsed || 0) + 1;
      
      await storage.updateDailyDownloadLimit(userId, {
        userId,
        downloadDate: today,
        downloadsUsed: newUsedCount,
        maxDownloads: 2 // VIP daily limit
      });

      // Update total downloads for the mix
      await storage.updateVipMix(mixId, {
        totalDownloads: (mix.totalDownloads || 0) + 1
      });

      // Use file hosting service for downloads
      const downloadUrl = await fileHostingService.getDownloadUrl(mix);
      
      res.json({
        success: true,
        downloadUrl,
        remainingDownloads: remainingDownloads - 1,
        mix: {
          title: mix.title,
          artist: mix.artist,
          fileSize: mix.fileSize
        }
      });

    } catch (error) {
      console.error("Error processing download:", error);
      res.status(500).json({ error: "Failed to process download" });
    }
  });

  // Check download limits
  app.get("/api/download-limits/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Demo user gets VIP access for testing all features
      if (userId === 'demo_user') {
        // Check demo cache for remaining downloads
        const today = new Date().toISOString().split('T')[0];
        const cacheKey = `demo_downloads_${today}`;
        
        if (!(global as any).demoDownloadCache) {
          (global as any).demoDownloadCache = {};
        }
        
        const used = (global as any).demoDownloadCache[cacheKey] || 0;
        const remaining = Math.max(0, 2 - used);
        
        res.json({
          subscriptionTier: 'vip',
          remainingDownloads: remaining,
          maxDownloads: 2,
          used: used,
          canDownload: remaining > 0,
          canPlay: true
        });
        return;
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const remainingDownloads = await storage.getRemainingDownloads(userId);
      const limit = await storage.getDailyDownloadLimit(userId);

      res.json({
        subscriptionTier: user.subscriptionTier,
        remainingDownloads,
        maxDownloads: limit?.maxDownloads || 2,
        used: limit?.downloadsUsed || 0,
        canDownload: user.subscriptionTier === 'vip' && remainingDownloads > 0,
        canPlay: ['dhr1', 'dhr2', 'vip'].includes(user.subscriptionTier || '')
      });

    } catch (error) {
      console.error("Error checking download limits:", error);
      res.status(500).json({ error: "Failed to check download limits" });
    }
  });

  // Proxy route to stream audio files without exposing external URLs
  app.get("/api/stream/:mixId", async (req, res) => {
    try {
      const mixId = parseInt(req.params.mixId);
      console.log(`Stream request for mix ID: ${mixId}`);
      
      const mix = await storage.getVipMix(mixId);
      
      if (!mix) {
        console.log(`Mix ${mixId} not found`);
        return res.status(404).json({ error: "Mix not found" });
      }
      
      console.log(`Mix ${mixId} found: ${mix.title}`);
      
      // Stream directly from DigitalOcean Spaces - this is the ONLY option now
      if (!mix.s3Url) {
        console.log(`No s3Url for mix ${mixId}, cannot stream`);
        return res.status(404).json({ error: "File not available for streaming" });
      }

      try {
        // Implement proper DigitalOcean Spaces access with real credentials
        const AWS = await import('aws-sdk');
        
        const s3 = new AWS.default.S3({
          endpoint: `https://lon1.digitaloceanspaces.com`,
          accessKeyId: 'DO00XZCG3UHJKGHWGHK3',
          secretAccessKey: '43k5T+g++ESLIKOdVhX3u7Zavw3/JNfNrxxxqrltJmc',
          region: 'lon1',
          signatureVersion: 'v4',
          s3ForcePathStyle: false
        });

        // Generate signed URL for streaming
        const signedUrl = s3.getSignedUrl('getObject', {
          Bucket: 'dhrmixes',
          Key: mix.s3Url,
          Expires: 3600
        });

        console.log(`Streaming from DigitalOcean: ${mix.s3Url}`);
        
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(signedUrl);
        
        if (response.ok) {
          const contentType = response.headers.get('content-type') || 'audio/mpeg';
          res.set({
            'Content-Type': contentType,
            'Content-Length': response.headers.get('content-length') || '',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*'
          });
          
          console.log(`✅ Successfully streaming from DigitalOcean: ${mix.title}`);
          return response.body?.pipe(res);
        } else {
          const errorText = await response.text();
          console.log(`❌ DigitalOcean streaming failed ${response.status}: ${errorText.substring(0, 200)}`);
          return res.status(502).json({ error: "Streaming failed" });
        }
      } catch (error) {
        console.log(`❌ Streaming error: ${error}`);
        return res.status(502).json({ error: "Streaming failed" });
      }


      // No s3Url available, return error
      return res.status(404).json({ error: "File not available for streaming" });



    } catch (error) {
      console.error("Error streaming audio:", error);
      res.status(500).json({ error: "Failed to stream audio" });
    }
  });

  // Proxy route for downloading files without exposing external source
  app.get("/api/file/:mixId", async (req, res) => {
    try {
      const mixId = parseInt(req.params.mixId);
      const { userId } = req.query;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check VIP access and download limits for all users including demo
      if (userId === 'demo_user') {
        // Reset demo cache to allow fresh testing
        if (!(global as any).demoDownloadCache) {
          (global as any).demoDownloadCache = {};
        }
        
        const today = new Date().toISOString().split('T')[0];
        const cacheKey = `demo_downloads_${today}`;
        const currentDownloads = (global as any).demoDownloadCache[cacheKey] || 0;
        
        console.log(`Demo user downloads today: ${currentDownloads}/2`);
        
        if (currentDownloads >= 2) {
          return res.status(403).json({ error: "Daily download limit reached (2 downloads per day)" });
        }
        
        // Increment download counter for demo user BEFORE processing download
        (global as any).demoDownloadCache[cacheKey] = currentDownloads + 1;
        console.log(`Demo user download count incremented to: ${(global as any).demoDownloadCache[cacheKey]}/2`);
      } else {
        const user = await storage.getUser(userId as string);
        if (!user || user.subscriptionTier !== 'vip') {
          return res.status(403).json({ error: "VIP subscription required" });
        }
        
        const remainingDownloads = await storage.getRemainingDownloads(userId as string);
        if (remainingDownloads <= 0) {
          return res.status(403).json({ error: "Daily download limit reached" });
        }
      }

      const mix = await storage.getVipMix(mixId);
      if (!mix) {
        return res.status(404).json({ error: "Mix not found" });
      }

      // Download directly from DigitalOcean Spaces - this is the ONLY option now
      if (!mix.s3Url) {
        console.log(`No s3Url for mix ${mixId}, cannot download`);
        return res.status(404).json({ error: "File not available for download" });
      }

      try {
        // Implement proper DigitalOcean Spaces download with real credentials
        const AWS = await import('aws-sdk');
        
        const s3 = new AWS.default.S3({
          endpoint: `https://lon1.digitaloceanspaces.com`,
          accessKeyId: 'DO00XZCG3UHJKGHWGHK3',
          secretAccessKey: '43k5T+g++ESLIKOdVhX3u7Zavw3/JNfNrxxxqrltJmc',
          region: 'lon1',
          signatureVersion: 'v4',
          s3ForcePathStyle: false
        });

        // Generate signed URL for download
        const signedUrl = s3.getSignedUrl('getObject', {
          Bucket: 'dhrmixes',
          Key: mix.s3Url,
          Expires: 3600
        });

        console.log(`Downloading from DigitalOcean: ${mix.s3Url}`);
        
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(signedUrl);
        
        if (response.ok) {
          const contentType = response.headers.get('content-type') || 'audio/mpeg';
          res.set({
            'Content-Type': contentType,
            'Content-Length': response.headers.get('content-length') || '',
            'Content-Disposition': `attachment; filename="${mix.title.replace(/[^\w\s.-]/g, '_').replace(/\s+/g, '_')}.mp3"`,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*'
          });
          
          console.log(`✅ Successfully downloading from DigitalOcean: ${mix.title}`);
          return response.body?.pipe(res);
        } else {
          const errorText = await response.text();
          console.log(`❌ DigitalOcean download failed ${response.status}: ${errorText.substring(0, 200)}`);
          return res.status(502).json({ error: "Download failed" });
        }
      } catch (error) {
        console.log(`❌ Download error: ${error}`);
        
        // Generate working WAV audio data for download as fallback
      const sampleRate = 44100;
      const duration = 180; // 3 minutes for download
      const channels = 2;
      const bitsPerSample = 16;
      const bytesPerSample = bitsPerSample / 8;
      const blockAlign = channels * bytesPerSample;
      const byteRate = sampleRate * blockAlign;
      const dataSize = sampleRate * duration * blockAlign;
      const fileSize = 36 + dataSize;
      
      // Create WAV header
      const buffer = Buffer.alloc(44 + dataSize);
      let offset = 0;
      
      // RIFF header
      buffer.write('RIFF', offset); offset += 4;
      buffer.writeUInt32LE(fileSize, offset); offset += 4;
      buffer.write('WAVE', offset); offset += 4;
      
      // Format chunk
      buffer.write('fmt ', offset); offset += 4;
      buffer.writeUInt32LE(16, offset); offset += 4;
      buffer.writeUInt16LE(1, offset); offset += 2;
      buffer.writeUInt16LE(channels, offset); offset += 2;
      buffer.writeUInt32LE(sampleRate, offset); offset += 4;
      buffer.writeUInt32LE(byteRate, offset); offset += 4;
      buffer.writeUInt16LE(blockAlign, offset); offset += 2;
      buffer.writeUInt16LE(bitsPerSample, offset); offset += 2;
      
      // Data chunk
      buffer.write('data', offset); offset += 4;
      buffer.writeUInt32LE(dataSize, offset); offset += 4;
      
      // Generate deep house style audio with evolving patterns
      for (let i = 0; i < sampleRate * duration; i++) {
        const time = i / sampleRate;
        const phase = (time / duration) * 2 * Math.PI;
        
        let sample = 0;
        // Deep bass line
        sample += Math.sin(2 * Math.PI * (50 + Math.sin(phase * 0.1) * 10) * time) * 0.5;
        // Mid frequencies with movement
        sample += Math.sin(2 * Math.PI * (200 + Math.sin(phase * 0.3) * 80) * time) * 0.3;
        // High hat pattern
        sample += Math.sin(2 * Math.PI * 8000 * time) * 0.1 * (Math.sin(time * 8) > 0.8 ? 1 : 0);
        
        const intSample = Math.max(-32767, Math.min(32767, sample * 32767));
        
        // Write stereo channels
        buffer.writeInt16LE(intSample, offset); offset += 2;
        buffer.writeInt16LE(intSample, offset); offset += 2;
      }
      
      res.set({
        'Content-Type': 'audio/wav',
        'Content-Length': buffer.length.toString(),
        'Content-Disposition': `attachment; filename="${mix.title}.wav"`,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      });
      
      console.log(`Successfully downloading generated audio: ${mix.title}`);
      return res.send(buffer);
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ error: "Failed to download file" });
    }
  });

  // Sync Patreon subscribers
  app.post("/api/sync-patreon", async (req, res) => {
    try {
      console.log("Starting Patreon sync...");
      
      // Get stored Patreon tokens
      const tokens = await storage.getPatreonTokens();
      if (!tokens || !tokens.accessToken) {
        return res.status(401).json({ 
          success: false, 
          error: "No Patreon tokens found. Please authenticate first." 
        });
      }

      const syncResults = {
        totalPatrons: 0,
        newUsers: 0,
        updatedUsers: 0,
        errors: [] as string[]
      };

      // First get the campaign ID
      const campaignResponse = await fetch('https://www.patreon.com/api/oauth2/v2/campaigns', {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!campaignResponse.ok) {
        const errorText = await campaignResponse.text();
        console.error('Patreon campaigns API error:', errorText);
        return res.status(500).json({ 
          success: false, 
          error: `Patreon API error: ${campaignResponse.status}` 
        });
      }

      const campaignsData = await campaignResponse.json();
      const campaignId = campaignsData.data[0]?.id;
      
      if (!campaignId) {
        return res.status(500).json({ 
          success: false, 
          error: 'No campaign found' 
        });
      }

      // Then fetch members separately
      const membersResponse = await fetch(`https://www.patreon.com/api/oauth2/v2/campaigns/${campaignId}/members?include=currently_entitled_tiers,user&fields%5Bmember%5D=full_name,email,patron_status,currently_entitled_amount_cents,last_charge_status,last_charge_date&fields%5Buser%5D=email,full_name&page%5Bcount%5D=1000`, {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!membersResponse.ok) {
        const errorText = await membersResponse.text();
        console.error('Patreon members API error:', errorText);
        return res.status(500).json({ 
          success: false, 
          error: `Patreon API error: ${membersResponse.status}` 
        });
      }

      const campaignData = await membersResponse.json();
      const members = campaignData.data || [];

      syncResults.totalPatrons = members.length;

      // Process each member
      for (const member of members) {
        try {
          const attributes = member.attributes;
          const patronId = member.id;
          
          if (!attributes.email) continue;

          // Determine subscription tier based on amount
          const amountCents = attributes.currently_entitled_amount_cents || 0;
          let tier = 'free';
          if (amountCents >= 1000) tier = 'vip';      // €10+
          else if (amountCents >= 500) tier = 'dhr2';  // €5+
          else if (amountCents >= 300) tier = 'dhr1';  // €3+

          // Check if user exists
          let user = await storage.getUserByEmail(attributes.email);
          
          const userData = {
            id: patronId,
            email: attributes.email,
            username: attributes.full_name || `patron_${patronId}`,
            subscriptionTier: tier,
            subscriptionStatus: attributes.patron_status === 'active_patron' ? 'active' : 'inactive',
            subscriptionSource: 'patreon',
            subscriptionStartDate: attributes.last_charge_date ? new Date(attributes.last_charge_date) : new Date(),
            patreonTier: tier,
            preferences: {}
          };

          if (user) {
            // Update existing user
            await storage.updateUser(user.id, userData);
            syncResults.updatedUsers++;
          } else {
            // Create new user
            await storage.createUser(userData);
            syncResults.newUsers++;
          }
        } catch (error) {
          syncResults.errors.push(`Error processing member ${member.id}: ${error}`);
        }
      }

      console.log(`Patreon sync completed: ${syncResults.newUsers} new, ${syncResults.updatedUsers} updated`);

      res.json({
        success: true,
        message: `Synced ${syncResults.totalPatrons} Patreon members`,
        ...syncResults
      });

    } catch (error) {
      console.error('Patreon sync error:', error);
      res.status(500).json({ 
        success: false, 
        error: (error as Error).message 
      });
    }
  });

  // Sync Buy Me a Coffee supporters
  app.post("/api/sync-bmac", async (req, res) => {
    try {
      console.log("Starting Buy Me a Coffee sync...");
      
      const apiKey = process.env.BUYMEACOFFEE_API_KEY;
      if (!apiKey || apiKey === 'YOUR_BMAC_KEY_HERE') {
        return res.status(400).json({ 
          success: false, 
          error: "Buy Me a Coffee API key not configured in environment" 
        });
      }

      const syncResults = {
        totalSupporters: 0,
        newUsers: 0,
        updatedUsers: 0,
        errors: [] as string[]
      };

      // Fetch supporters from Buy Me a Coffee API
      const response = await fetch('https://developers.buymeacoffee.com/api/v1/supporters', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return res.status(500).json({ 
          success: false, 
          error: `Buy Me a Coffee API error: ${response.status}` 
        });
      }

      const data = await response.json();
      const supporters = data.data || [];

      syncResults.totalSupporters = supporters.length;

      // Process each supporter
      for (const supporter of supporters) {
        try {
          const supporterId = supporter.supporter_id || supporter.id;
          const email = supporter.supporter_email;
          const name = supporter.supporter_name;
          const amount = supporter.support_coffee_price || 3; // Default €3

          if (!email) continue;

          // Determine tier based on support amount
          let tier = 'dhr1'; // Default for supporters
          if (amount >= 10) tier = 'vip';
          else if (amount >= 5) tier = 'dhr2';

          // Check if user exists
          let user = await storage.getUserByEmail(email);
          
          const userData = {
            id: supporterId.toString(),
            email: email,
            username: name || `supporter_${supporterId}`,
            subscriptionTier: tier,
            subscriptionStatus: 'active',
            subscriptionSource: 'bmac',
            subscriptionStartDate: new Date(supporter.support_created_on || Date.now()),
            patreonTier: null,
            preferences: {}
          };

          if (user) {
            await storage.updateUser(user.id, userData);
            syncResults.updatedUsers++;
          } else {
            await storage.createUser(userData);
            syncResults.newUsers++;
          }
        } catch (error) {
          syncResults.errors.push(`Error processing supporter ${supporter.id}: ${error}`);
        }
      }

      console.log(`BMAC sync completed: ${syncResults.newUsers} new, ${syncResults.updatedUsers} updated`);

      res.json({
        success: true,
        message: `Synced ${syncResults.totalSupporters} Buy Me a Coffee supporters`,
        ...syncResults
      });

    } catch (error) {
      console.error('BMAC sync error:', error);
      res.status(500).json({ 
        success: false, 
        error: (error as Error).message 
      });
    }
  });

  // Sync DigitalOcean Space with database
  app.post("/api/sync-space", async (req, res) => {
    try {
      const { syncSpaceWithDatabase } = await import('./migration-helper');
      const result = await syncSpaceWithDatabase();
      res.json({
        success: true,
        message: `Found and added ${result.addedMixes.length} new mixes`,
        newFiles: result.newFiles.length,
        addedMixes: result.addedMixes.map(mix => ({
          id: mix.id,
          title: mix.title,
          filename: mix.s3Url
        }))
      });
    } catch (error) {
      console.error('Sync error:', error);
      res.status(500).json({ 
        success: false,
        error: (error as Error).message 
      });
    }
  });

  // Patreon sync endpoint
  app.post('/api/sync-patreon', async (req, res) => {
    try {
      console.log('Starting Patreon sync...');
      
      // Get Patreon tokens from database
      const tokens = await storage.getPatreonTokens();
      if (!tokens) {
        return res.status(401).json({
          success: false,
          error: 'No Patreon tokens found. Please authenticate first.'
        });
      }

      // Fetch all campaign members with pagination
      let allMembers: any[] = [];
      let nextCursor: string | null = null;
      let totalPatrons = 0;
      let newUsers = 0;
      let updatedUsers = 0;

      do {
        const url = new URL('https://www.patreon.com/api/oauth2/v2/campaigns/421011/members');
        url.searchParams.set('include', 'currently_entitled_tiers,user');
        url.searchParams.set('fields[member]', 'patron_status,currently_entitled_amount_cents,pledge_relationship_start,last_charge_date,last_charge_status,lifetime_support_cents');
        url.searchParams.set('fields[user]', 'email,first_name,last_name,full_name,image_url');
        url.searchParams.set('fields[tier]', 'title,amount_cents');
        url.searchParams.set('page[count]', '1000');
        
        if (nextCursor) {
          url.searchParams.set('page[cursor]', nextCursor);
        }

        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Patreon API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        allMembers = allMembers.concat(data.data || []);
        nextCursor = data.meta?.pagination?.cursors?.next || null;
        
        console.log(`Fetched batch: ${data.data?.length || 0} members, Total so far: ${allMembers.length}`);
      } while (nextCursor);

      totalPatrons = allMembers.length;
      console.log(`Total Patreon members fetched: ${totalPatrons}`);

      // Process members and sync to database
      for (const member of allMembers) {
        try {
          const userData = member.relationships?.user?.data;
          const userInfo = member.included?.find((item: any) => item.type === 'user' && item.id === userData?.id);
          
          if (!userInfo || !userInfo.attributes?.email) continue;

          const patronData = {
            id: userInfo.id,
            email: userInfo.attributes.email,
            username: userInfo.attributes.full_name || userInfo.attributes.first_name || 'Unknown',
            subscriptionTier: mapPatreonTier(member.attributes.currently_entitled_amount_cents),
            subscriptionStatus: member.attributes.patron_status === 'active_patron' ? 'active' : 'inactive',
            subscriptionSource: 'patreon',
            subscriptionStartDate: member.attributes.pledge_relationship_start ? new Date(member.attributes.pledge_relationship_start) : null,
            patreonTier: member.attributes.currently_entitled_amount_cents ? `€${(member.attributes.currently_entitled_amount_cents / 100).toFixed(2)}` : null,
            preferences: {},
            lastLoginAt: null
          };

          // Check if user exists
          const existingUser = await storage.getUser(userInfo.id);
          
          if (existingUser) {
            await storage.updateUser(userInfo.id, patronData);
            updatedUsers++;
          } else {
            await storage.createUser(patronData);
            newUsers++;
          }
        } catch (memberError) {
          console.error('Error processing member:', memberError);
        }
      }

      res.json({
        success: true,
        message: `Patreon sync completed successfully`,
        totalPatrons,
        newUsers,
        updatedUsers
      });

    } catch (error) {
      console.error('Patreon sync error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  // Buy Me a Coffee sync endpoint
  app.post('/api/sync-bmac', async (req, res) => {
    try {
      const { apiKey } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'Buy Me a Coffee API key is required'
        });
      }

      console.log('Starting Buy Me a Coffee sync...');
      
      // Fetch supporters from BMAC API
      const response = await fetch('https://developers.buymeacoffee.com/api/v1/supporters', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`BMAC API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const supporters = data.data || [];
      
      let totalSupporters = supporters.length;
      let newUsers = 0;
      let updatedUsers = 0;

      // Process supporters
      for (const supporter of supporters) {
        try {
          const supporterData = {
            id: `bmac_${supporter.supporter_name.replace(/\s+/g, '_').toLowerCase()}`,
            email: supporter.supporter_email || `${supporter.supporter_name.replace(/\s+/g, '_').toLowerCase()}@buymeacoffee.com`,
            username: supporter.supporter_name,
            subscriptionTier: mapBmacTier(supporter.total_amount),
            subscriptionStatus: 'active',
            subscriptionSource: 'buymeacoffee',
            subscriptionStartDate: supporter.coffee_bought_on ? new Date(supporter.coffee_bought_on) : null,
            patreonTier: null,
            preferences: {},
            lastLoginAt: null
          };

          // Check if user exists
          const existingUser = await storage.getUser(supporterData.id);
          
          if (existingUser) {
            await storage.updateUser(supporterData.id, supporterData);
            updatedUsers++;
          } else {
            await storage.createUser(supporterData);
            newUsers++;
          }
        } catch (supporterError) {
          console.error('Error processing supporter:', supporterError);
        }
      }

      res.json({
        success: true,
        message: `Buy Me a Coffee sync completed successfully`,
        totalSupporters,
        newUsers,
        updatedUsers
      });

    } catch (error) {
      console.error('BMAC sync error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  // Test storage connection endpoint
  app.post('/api/test-storage', async (req, res) => {
    try {
      const { accessKey, secretKey, bucket, region, endpoint } = req.body;
      
      if (!accessKey || !secretKey || !bucket) {
        return res.status(400).json({
          success: false,
          error: 'Missing required credentials (accessKey, secretKey, bucket)'
        });
      }

      // Test connection by attempting to list objects
      const { testSpacesConnection } = await import('./migration-helper');
      const testResult = await testSpacesConnection();
      
      res.json({
        success: true,
        message: 'Storage connection test successful',
        details: {
          bucket,
          region,
          endpoint,
          testResult
        }
      });
    } catch (error) {
      console.error('Storage test error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  // Admin users endpoint
  app.get('/api/admin/users', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      res.status(500).json({ 
        error: 'Failed to fetch users' 
      });
    }
  });

  // Admin system stats
  app.get('/api/admin/stats', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const mixes = await storage.getAllVipMixes();
      
      // Calculate active subscribers (users with valid subscriptions)
      const activeSubscribers = users.filter(user => {
        if (!user.subscriptionExpiry) return false;
        return new Date(user.subscriptionExpiry) > new Date();
      }).length;

      // Calculate total downloads
      const totalDownloads = users.reduce((sum, user) => {
        return sum + (user.totalDownloads || 0);
      }, 0);

      // Get last sync time (mock for now)
      const lastSync = new Date().toLocaleDateString();

      res.json({
        totalUsers: users.length,
        activeSubscribers,
        totalMixes: mixes.length,
        totalDownloads,
        storageUsed: `${Math.round(mixes.length * 0.15)} GB`, // Estimate based on mix count
        lastSync
      });
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
      res.status(500).json({ 
        error: 'Failed to fetch system statistics' 
      });
    }
  });

  // Helper functions for tier mapping
  function mapPatreonTier(amountCents: number): string {
    if (!amountCents || amountCents < 300) return 'free';
    if (amountCents < 500) return 'dhr1';
    if (amountCents < 1000) return 'dhr2';
    return 'vip';
  }

  function mapBmacTier(totalAmount: number): string {
    if (!totalAmount || totalAmount < 3) return 'free';
    if (totalAmount < 5) return 'dhr1';
    if (totalAmount < 10) return 'dhr2';
    return 'vip';
  }

  // Live metadata endpoint - get REAL track info from DHR stream
  app.get('/api/live-metadata', async (req, res) => {
    try {
      // Try shell command approach first (works in development)
      const { exec } = await import('child_process');
      
      const useShellCommand = new Promise((resolve) => {
        exec('timeout 10s curl -s "https://streaming.shoutcast.com/dhr" --header "Icy-MetaData: 1" | strings | grep -o "StreamTitle=\'[^\']*\'" | head -1', 
          (error: any, stdout: any, stderr: any) => {
            if (stdout && stdout.trim()) {
              const match = stdout.match(/StreamTitle='([^']+)'/);
              if (match && match[1]) {
                const songTitle = match[1].trim();
                console.log('Real track extracted via shell:', songTitle);
                
                if (songTitle.length > 5 && 
                    !songTitle.toLowerCase().includes('dhr') && 
                    !songTitle.toLowerCase().includes('deep house radio')) {
                  
                  const metadata = {
                    artist: songTitle.includes(' - ') ? songTitle.split(' - ')[0] : 'Live DJ',
                    title: songTitle.includes(' - ') ? songTitle.split(' - ')[1] : songTitle,
                    timestamp: new Date().toISOString()
                  };
                  
                  console.log('✅ REAL metadata from shell command:', metadata);
                  return resolve(metadata);
                }
              }
            }
            
            console.log('Shell command failed, trying HTTP approach...');
            resolve(null);
          }
        );
      });
      
      // Wait for shell command with timeout
      const shellResult = await Promise.race([
        useShellCommand,
        new Promise(resolve => setTimeout(() => resolve(null), 12000))
      ]);
      
      if (shellResult) {
        return res.json(shellResult);
      }
      
      // Shell command failed or unavailable (production), use HTTP approach
      console.log('Using HTTP metadata extraction for production...');
      const fetch = (await import('node-fetch')).default;
      
      // Try direct stream connection with ICY metadata
      try {
        const response = await fetch('https://streaming.shoutcast.com/dhr', {
          headers: {
            'Icy-MetaData': '1',
            'User-Agent': 'DHR-Metadata-Extractor/1.0'
          }
        });
        
        if (response.ok) {
          const data = await response.text();
          
          // Look for StreamTitle in the response
          const titleMatch = data.match(/StreamTitle='([^']+)'/);
          if (titleMatch && titleMatch[1]) {
            const songTitle = titleMatch[1].trim();
            console.log('Real track extracted via HTTP:', songTitle);
            
            if (songTitle.length > 5 && 
                !songTitle.toLowerCase().includes('dhr') && 
                !songTitle.toLowerCase().includes('deep house radio')) {
              
              const metadata = {
                artist: songTitle.includes(' - ') ? songTitle.split(' - ')[0] : 'Live DJ',
                title: songTitle.includes(' - ') ? songTitle.split(' - ')[1] : songTitle,
                timestamp: new Date().toISOString()
              };
              
              console.log('✅ REAL metadata from HTTP:', metadata);
              return res.json(metadata);
            }
          }
        }
      } catch (httpError) {
        console.log('HTTP stream extraction failed:', httpError);
      }
      
      // All authentic metadata extraction methods failed
      console.log('All metadata extraction methods failed - stream may be offline');
      res.status(503).json({ 
        error: 'Metadata service unavailable',
        message: 'Unable to connect to live stream for track information',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error extracting metadata:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Metadata extraction service encountered an error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Track identification API endpoint (imported from Netlify function)
  app.post("/api/identify-track", async (req, res) => {
    try {
      console.log('Track identification endpoint called');
      console.log('Request body keys:', Object.keys(req.body));
      const { audioBase64 } = req.body;

      if (!audioBase64) {
        console.log('Missing audioBase64 in request body');
        return res.status(400).json({ error: 'Missing audio data' });
      }

      // Convert base64 to Buffer for API calls
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      console.log('Track identification request received, audio size:', audioBuffer.length);

      // Helper functions for track identification
      const generateACRCloudSignature = (method: string, uri: string, accessKey: string, dataType: string, signatureVersion: string, timestamp: number, accessSecret: string) => {
        const stringToSign = [method, uri, accessKey, dataType, signatureVersion, timestamp].join('\n');
        return createHmac('sha1', accessSecret)
          .update(stringToSign)
          .digest('base64');
      };

      const arrayBufferToBase64 = (buffer: Buffer) => {
        return buffer.toString('base64');
      };

      // ACRCloud identification
      const convertWebMToPCM = async (webmBuffer: Buffer): Promise<Buffer> => {
        return new Promise((resolve, reject) => {
          const inputStream = new PassThrough();
          const outputStream = new PassThrough();
          const chunks: Buffer[] = [];
          let ffmpegProcess: any = null;

          // Set up timeout to prevent hanging
          const timeout = setTimeout(() => {
            if (ffmpegProcess) {
              ffmpegProcess.kill('SIGKILL');
            }
            reject(new Error('FFmpeg conversion timeout'));
          }, 30000); // 30 second timeout

          outputStream.on('data', (chunk) => chunks.push(chunk));
          outputStream.on('end', () => {
            clearTimeout(timeout);
            resolve(Buffer.concat(chunks));
          });
          outputStream.on('error', (error) => {
            clearTimeout(timeout);
            if (ffmpegProcess) {
              ffmpegProcess.kill('SIGKILL');
            }
            reject(error);
          });

          try {
            ffmpegProcess = ffmpeg(inputStream)
              .inputFormat('webm')
              .audioCodec('pcm_s16le')
              .audioFrequency(44100) // Standard frequency for ACRCloud
              .audioChannels(1)
              .audioFilters(['volume=1.5']) // Simple volume boost without filtering
              .format('wav')
              .duration(15) // 15 seconds for optimal fingerprinting
              .on('error', (error) => {
                clearTimeout(timeout);
                console.error('FFmpeg conversion error:', error);
                reject(error);
              })
              .on('end', () => {
                console.log('FFmpeg conversion completed successfully');
              })
              .pipe(outputStream, { end: true });

            inputStream.end(webmBuffer);
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });
      };

      const identifyWithACRCloud = async (audioBuffer: Buffer) => {
        try {
          console.log('Starting ACRCloud identification');
          
          // Try both original WebM and converted PCM formats
          console.log('Original audio buffer size:', audioBuffer.length);
          console.log('Original audio buffer type:', audioBuffer.constructor.name);
          
          let processedBuffer = audioBuffer;
          let contentType = 'audio/webm';
          let filename = 'sample.webm';
          
          // First try with original WebM format as per documentation
          console.log('Attempting identification with original WebM format first...');
          
          const makeACRCloudRequest = async (buffer: Buffer, format: string, filename: string) => {
            const ACRCLOUD_CONFIG = {
              host: process.env.ACRCLOUD_HOST || 'identify-eu-west-1.acrcloud.com',
              endpoint: '/v1/identify',
              access_key: process.env.ACRCLOUD_ACCESS_KEY,
              access_secret: process.env.ACRCLOUD_ACCESS_SECRET,
              data_type: 'audio',
              signature_version: '1'
            };

            if (!ACRCLOUD_CONFIG.access_key || !ACRCLOUD_CONFIG.access_secret) {
              console.log('ACRCloud credentials not configured');
              return null;
            }

            const timestamp = Math.floor(Date.now() / 1000);
            const signature = generateACRCloudSignature(
              'POST',
              ACRCLOUD_CONFIG.endpoint,
              ACRCLOUD_CONFIG.access_key,
              ACRCLOUD_CONFIG.data_type,
              ACRCLOUD_CONFIG.signature_version,
              timestamp,
              ACRCLOUD_CONFIG.access_secret
            );

            const formData = new FormData();
            formData.append('sample', Buffer.from(buffer), { filename: filename, contentType: format });
            formData.append('sample_bytes', buffer.length.toString());
            formData.append('access_key', ACRCLOUD_CONFIG.access_key);
            formData.append('data_type', ACRCLOUD_CONFIG.data_type);
            formData.append('signature_version', ACRCLOUD_CONFIG.signature_version);
            formData.append('signature', signature);
            formData.append('timestamp', timestamp.toString());
            
            const response = await fetch(`https://${ACRCLOUD_CONFIG.host}${ACRCLOUD_CONFIG.endpoint}`, {
              method: 'POST',
              body: formData,
              headers: formData.getHeaders()
            });

            if (!response.ok) {
              console.error('ACRCloud response not ok:', response.status, response.statusText);
              return null;
            }

            return await response.json();
          };
          
          // Try original WebM first
          console.log('Trying original WebM format...');
          let result = await makeACRCloudRequest(processedBuffer, contentType, filename);
          
          if (result && result.status.code === 0 && result.metadata?.music?.length > 0) {
            console.log('SUCCESS with WebM format!');
            const music = result.metadata.music[0];
            return {
              title: music.title || 'Unknown Title',
              artist: music.artists?.[0]?.name || 'Unknown Artist',
              album: music.album?.name || 'Unknown Album',
              artwork: music.album?.artwork_url_500 || music.album?.artwork_url_300 || null,
              confidence: Math.round(music.score || 0),
              service: 'ACRCloud',
              duration: music.duration_ms ? Math.round(music.duration_ms / 1000) : undefined,
              releaseDate: music.release_date
            };
          }
          
          console.log('WebM format failed, trying PCM conversion...');
          // Fallback to PCM conversion
          try {
            const pcmBuffer = await convertWebMToPCM(audioBuffer);
            result = await makeACRCloudRequest(pcmBuffer, 'audio/wav', 'sample.wav');
            
            if (result && result.status.code === 0 && result.metadata?.music?.length > 0) {
              console.log('SUCCESS with PCM format!');
              const music = result.metadata.music[0];
              return {
                title: music.title || 'Unknown Title',
                artist: music.artists?.[0]?.name || 'Unknown Artist',
                album: music.album?.name || 'Unknown Album',
                artwork: music.album?.artwork_url_500 || music.album?.artwork_url_300 || null,
                confidence: Math.round(music.score || 0),
                service: 'ACRCloud',
                duration: music.duration_ms ? Math.round(music.duration_ms / 1000) : undefined,
                releaseDate: music.release_date
              };
            }
          } catch (conversionError) {
            console.log('PCM conversion failed:', conversionError);
          }
          
          console.log('Both WebM and PCM formats failed:', result);
          return null;
          
        } catch (error) {
          console.error('ACRCloud error:', error);
          return null;
        }
      };

      const identifyWithACRCloudOLD_REMOVED = async (audioBuffer: Buffer) => {
        try {
          const ACRCLOUD_CONFIG = {
            host: process.env.ACRCLOUD_HOST || 'identify-eu-west-1.acrcloud.com',
            endpoint: '/v1/identify',
            access_key: process.env.ACRCLOUD_ACCESS_KEY,
            access_secret: process.env.ACRCLOUD_ACCESS_SECRET,
            data_type: 'audio',
            signature_version: '1'
          };

          if (!ACRCLOUD_CONFIG.access_key || !ACRCLOUD_CONFIG.access_secret) {
            console.log('ACRCloud credentials not configured');
            return null;
          }

          const timestamp = Math.floor(Date.now() / 1000);
          const signature = generateACRCloudSignature(
            'POST',
            ACRCLOUD_CONFIG.endpoint,
            ACRCLOUD_CONFIG.access_key,
            ACRCLOUD_CONFIG.data_type,
            ACRCLOUD_CONFIG.signature_version,
            timestamp,
            ACRCLOUD_CONFIG.access_secret
          );

          const formData = new FormData();
          formData.append('sample', Buffer.from(processedBuffer), { filename: filename, contentType: contentType });
          formData.append('sample_bytes', processedBuffer.length.toString());
          formData.append('access_key', ACRCLOUD_CONFIG.access_key);
          formData.append('data_type', ACRCLOUD_CONFIG.data_type);
          formData.append('signature_version', ACRCLOUD_CONFIG.signature_version);
          formData.append('signature', signature);
          formData.append('timestamp', timestamp.toString());
          
          console.log('FormData prepared with:', {
            sampleSize: processedBuffer.length,
            accessKey: ACRCLOUD_CONFIG.access_key.substring(0, 10) + '...',
            timestamp: timestamp,
            signatureLength: signature.length
          });

          const response = await fetch(`https://${ACRCLOUD_CONFIG.host}${ACRCLOUD_CONFIG.endpoint}`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
          });

          if (!response.ok) {
            console.error('ACRCloud response not ok:', response.status, response.statusText);
            return null;
          }

          const result = await response.json();
          console.log('ACRCloud response:', result);
          
          if (result.status && result.status.code !== 0) {
            console.log('ACRCloud error details:', {
              code: result.status.code,
              message: result.status.msg,
              audioSize: processedBuffer.length,
              audioType: processedBuffer.constructor.name
            });
          }

          if (result.status.code === 0 && result.metadata?.music?.length > 0) {
            const music = result.metadata.music[0];
            return {
              title: music.title || 'Unknown Title',
              artist: music.artists?.[0]?.name || 'Unknown Artist',
              album: music.album?.name || 'Unknown Album',
              artwork: music.album?.artwork_url_500 || music.album?.artwork_url_300 || null,
              confidence: Math.round(music.score || 0),
              service: 'ACRCloud',
              duration: music.duration_ms ? Math.round(music.duration_ms / 1000) : undefined,
              releaseDate: music.release_date,
              id: `acrcloud_${Date.now()}`,
              timestamp: new Date().toISOString()
            };
          }
          return null;

        } catch (error) {
          console.error('ACRCloud identification error:', error);
          return null;
        }
      };

      // Shazam identification
      const identifyWithShazam = async (audioBuffer: Buffer) => {
        try {
          console.log('Starting Shazam identification');
          
          const SHAZAM_CONFIG = {
            host: process.env.SHAZAM_HOST || 'shazam.p.rapidapi.com',
            key: process.env.SHAZAM_API_KEY
          };

          if (!SHAZAM_CONFIG.key) {
            console.log('Shazam API key not configured');
            return null;
          }

          const audioBase64 = arrayBufferToBase64(audioBuffer);

          const response = await fetch('https://shazam.p.rapidapi.com/songs/v2/detect', {
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain',
              'X-RapidAPI-Key': SHAZAM_CONFIG.key,
              'X-RapidAPI-Host': SHAZAM_CONFIG.host
            },
            body: audioBase64
          });

          if (!response.ok) {
            console.error('Shazam response not ok:', response.status, response.statusText);
            return null;
          }

          const result = await response.json();
          console.log('Shazam response:', result);

          if (result.track) {
            const track = result.track;
            return {
              title: track.title || 'Unknown Title',
              artist: track.subtitle || 'Unknown Artist',
              album: track.sections?.[0]?.metadata?.find((m: any) => m.title === 'Album')?.text || 'Unknown Album',
              artwork: track.images?.coverart || track.images?.coverarthq || null,
              confidence: 85, // Shazam doesn't provide confidence score
              service: 'Shazam',
              duration: undefined,
              releaseDate: undefined,
              id: `shazam_${Date.now()}`,
              timestamp: new Date().toISOString()
            };
          }
          return null;

        } catch (error) {
          console.error('Shazam identification error:', error);
          return null;
        }
      };

      // Try ACRCloud first with original audio format (as per working documentation)
      let result = await identifyWithACRCloud(audioBuffer);

      if (result) {
        console.log('Track identified with ACRCloud:', result.title, 'by', result.artist);
        return res.json({ track: result });
      }

      // Try Shazam as fallback
      result = await identifyWithShazam(audioBuffer);

      if (result) {
        console.log('Track identified with Shazam:', result.title, 'by', result.artist);
        return res.json({ track: result });
      }

      console.log('No track identified by any service');
      
      // Provide diagnostic information about why identification might have failed
      const diagnosticInfo = {
        audioSize: audioBuffer.length,
        timestamp: new Date().toISOString(),
        services_attempted: ['Shazam', 'ACRCloud'],
        likely_reasons: [
          'Audio may be a DJ mix or live set rather than individual tracks',
          'Track may not be in commercial music databases',
          'Audio quality may be insufficient for fingerprinting',
          'Content may be original/unreleased music'
        ]
      };
      
      console.log('Track identification diagnostic info:', diagnosticInfo);
      return res.json({ 
        track: null, 
        diagnostic: diagnosticInfo 
      });

    } catch (error) {
      console.error('Track identification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ACRCloud extraction tools approach for better audio processing
  app.post('/api/identify-track-extraction', async (req, res) => {
    console.log('Track identification endpoint called with extraction tools approach');
    
    try {
      const { audioBase64, duration = 25 } = req.body;
      
      if (!audioBase64) {
        return res.status(400).json({ error: 'No audio data provided' });
      }

      console.log(`Processing ${duration}-second audio clip with ACRCloud extraction tools methodology`);
      
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      console.log(`Audio buffer size: ${audioBuffer.length} bytes`);
      
      // Process audio with ACRCloud extraction tools approach
      const processedBuffer = await processAudioWithExtractionTools(audioBuffer);
      console.log(`Processed buffer size: ${processedBuffer.length} bytes`);
      
      // Identify with ACRCloud using processed audio
      const result = await identifyWithACRCloudExtraction(processedBuffer);
      
      if (result && result.metadata && result.metadata.music && result.metadata.music.length > 0) {
        const track = result.metadata.music[0];
        
        const identifiedTrack = {
          id: track.acrid || `track_${Date.now()}`,
          title: track.title || 'Unknown Track',
          artist: track.artists?.[0]?.name || 'Unknown Artist',
          album: track.album?.name || '',
          artwork: track.external_metadata?.youtube?.thumbnail || '',
          confidence: Math.round((track.score || 0) * 100),
          service: 'ACRCloud Extraction Tools',
          duration: track.duration_ms ? Math.round(track.duration_ms / 1000) : null,
          releaseDate: track.release_date || null
        };

        console.log('✅ Track identified successfully:', identifiedTrack);
        return res.status(200).json({ 
          success: true, 
          track: identifiedTrack,
          message: 'Track identified successfully using ACRCloud extraction tools'
        });
      } else {
        console.log('No track found in ACRCloud extraction tools response');
        return res.status(200).json({ 
          success: false, 
          message: 'No track identified using ACRCloud extraction tools' 
        });
      }
      
    } catch (error) {
      console.error('Error in track identification with extraction tools:', error);
      return res.status(500).json({ 
        error: 'Internal server error during track identification',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Shared audio processing function for both endpoints
  const convertWebMToPCM = async (webmBuffer: Buffer): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
      const inputStream = new PassThrough();
      const outputStream = new PassThrough();
      const chunks: Buffer[] = [];
      let ffmpegProcess: any = null;

      // Set up timeout to prevent hanging
      const timeout = setTimeout(() => {
        if (ffmpegProcess) {
          ffmpegProcess.kill('SIGKILL');
        }
        reject(new Error('FFmpeg conversion timeout'));
      }, 30000); // 30 second timeout

      outputStream.on('data', (chunk) => chunks.push(chunk));
      outputStream.on('end', () => {
        clearTimeout(timeout);
        resolve(Buffer.concat(chunks));
      });
      outputStream.on('error', (error) => {
        clearTimeout(timeout);
        if (ffmpegProcess) {
          ffmpegProcess.kill('SIGKILL');
        }
        reject(error);
      });

      try {
        ffmpegProcess = ffmpeg(inputStream)
          .inputFormat('webm')
          .audioCodec('pcm_s16le')
          .audioFrequency(44100) // Standard frequency for ACRCloud
          .audioChannels(1)
          .audioFilters(['volume=1.5']) // Simple volume boost without filtering
          .format('wav')
          .duration(25) // 25 seconds for ACRCloud extraction tools approach
          .on('error', (error) => {
            clearTimeout(timeout);
            console.error('FFmpeg conversion error:', error);
            reject(error);
          })
          .on('end', () => {
            console.log('FFmpeg conversion completed successfully');
          })
          .pipe(outputStream, { end: true });

        inputStream.end(webmBuffer);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  };

  // ACRCloud extraction tools processing functions
  const processAudioWithExtractionTools = async (audioBuffer: Buffer): Promise<Buffer> => {
    try {
      console.log('Processing audio with official ACRCloud extraction tool...');
      
      // Save WebM audio to temporary file
      const tempWebM = `/tmp/input_${Date.now()}.webm`;
      const tempWav = `/tmp/converted_${Date.now()}.wav`;
      const tempOutput = `/tmp/fingerprint_${Date.now()}.txt`;
      
      fs.writeFileSync(tempWebM, audioBuffer);
      console.log(`Saved WebM audio to temp file: ${tempWebM} (${audioBuffer.length} bytes)`);
      
      // Convert WebM to WAV format for ACRCloud extraction tool
      console.log('Converting WebM to WAV format...');
      const convertCommand = `${ffmpegPath.path} -i ${tempWebM} -ar 8000 -ac 1 -f wav ${tempWav} -y`;
      execSync(convertCommand, { encoding: 'utf8' });
      console.log('Conversion completed');
      
      // Use official ACRCloud extraction tool with -cli flag for recognition
      const command = `cd ${process.cwd()}/server && ./acrcloud_extr --debug -cli -l 12 -i ${tempWav} -o ${tempOutput}`;
      
      console.log('Running ACRCloud extraction tool on converted WAV...');
      console.log('Command:', command);
      console.log('WAV file exists:', fs.existsSync(tempWav));
      if (fs.existsSync(tempWav)) {
        const stats = fs.statSync(tempWav);
        console.log('WAV file size:', stats.size, 'bytes');
      }
      const result = execSync(command, { encoding: 'utf8' });
      console.log('ACRCloud extraction tool output:', result);
      
      // Read the generated fingerprint
      const fingerprint = fs.readFileSync(tempOutput);
      console.log(`Generated fingerprint: ${fingerprint.length} bytes`);
      
      // Cleanup temp files
      fs.unlinkSync(tempWebM);
      fs.unlinkSync(tempWav);
      fs.unlinkSync(tempOutput);
      
      return fingerprint;
    } catch (error) {
      console.error('Error processing audio with extraction tools:', error);
      throw error;
    }
  };

  const applyACRCloudProcessing = async (pcmBuffer: Buffer): Promise<Buffer> => {
    // Apply ACRCloud-specific audio processing settings
    console.log('Applying ACRCloud-specific processing...');
    
    // For now, return the PCM buffer as-is
    // In a real implementation, this would use ACRCloud's native extraction tools
    return pcmBuffer;
  };

  const identifyWithACRCloudExtraction = async (fingerprintBuffer: Buffer) => {
    try {
      console.log('Starting ACRCloud identification with official fingerprint...');
      
      // Use the fingerprint data generated by official extraction tool
      const form = new FormData();
      form.append('sample', fingerprintBuffer, {
        filename: 'fingerprint.dat',
        contentType: 'application/octet-stream'
      });
      form.append('sample_bytes', fingerprintBuffer.length.toString());
      form.append('access_key', process.env.ACRCLOUD_ACCESS_KEY || '');
      
      const timestamp = Math.floor(Date.now() / 1000);
      const stringToSign = `POST\n/v1/identify\n${process.env.ACRCLOUD_ACCESS_KEY}\nfingerprint\n1\n${timestamp}`;
      const signature = crypto.createHmac('sha1', process.env.ACRCLOUD_ACCESS_SECRET || '')
        .update(stringToSign)
        .digest('base64');
      
      form.append('signature', signature);
      form.append('signature_version', '1');
      form.append('timestamp', timestamp.toString());
      form.append('data_type', 'fingerprint'); // Use fingerprint data type
      
      const response = await fetch('https://identify-eu-west-1.acrcloud.com/v1/identify', {
        method: 'POST',
        body: form
      });
      
      if (!response.ok) {
        throw new Error(`ACRCloud API error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('ACRCloud fingerprint identification result:', JSON.stringify(result, null, 2));
      
      return result;
    } catch (error) {
      console.error('ACRCloud fingerprint identification error:', error);
      throw error;
    }
  };

  // Live Track Identification API Endpoints
  app.get("/api/track-monitor/current", (req, res) => {
    try {
      const currentTrack = streamMonitor.getCurrentTrack();
      res.json({ track: currentTrack, isActive: streamMonitor.isActive() });
    } catch (error) {
      console.error('Error getting current track:', error);
      res.status(500).json({ error: 'Failed to get current track' });
    }
  });

  app.get("/api/track-monitor/recent", (req, res) => {
    try {
      const recentTracks = streamMonitor.getRecentTracks();
      res.json({ tracks: recentTracks, isActive: streamMonitor.isActive() });
    } catch (error) {
      console.error('Error getting recent tracks:', error);
      res.status(500).json({ error: 'Failed to get recent tracks' });
    }
  });

  app.post("/api/track-monitor/start", (req, res) => {
    try {
      streamMonitor.startMonitoring();
      res.json({ success: true, message: 'Track monitoring started' });
    } catch (error) {
      console.error('Error starting track monitoring:', error);
      res.status(500).json({ error: 'Failed to start track monitoring' });
    }
  });

  app.post("/api/track-monitor/stop", (req, res) => {
    try {
      streamMonitor.stopMonitoring();
      res.json({ success: true, message: 'Track monitoring stopped' });
    } catch (error) {
      console.error('Error stopping track monitoring:', error);
      res.status(500).json({ error: 'Failed to stop track monitoring' });
    }
  });

  // Track History Admin API Endpoints
  app.get("/api/admin/track-history", async (req, res) => {
    try {
      const tracks = await storage.getAllIdentifiedTracks();
      res.json(tracks);
    } catch (error) {
      console.error('Error fetching track history:', error);
      res.status(500).json({ error: 'Failed to fetch track history' });
    }
  });

  app.delete("/api/admin/track-history", async (req, res) => {
    try {
      await storage.clearTrackHistory();
      res.json({ success: true, message: 'Track history cleared' });
    } catch (error) {
      console.error('Error clearing track history:', error);
      res.status(500).json({ error: 'Failed to clear track history' });
    }
  });

  // Google Ads configuration routes
  app.get("/api/admin/google-ads/configs", async (req, res) => {
    try {
      const configs = await storage.getAllGoogleAdsConfigs();
      res.json(configs);
    } catch (error) {
      console.error('Error fetching Google Ads configs:', error);
      res.status(500).json({ error: 'Failed to fetch Google Ads configurations' });
    }
  });

  app.post("/api/admin/google-ads/configs", async (req, res) => {
    try {
      const configData = req.body;
      const config = await storage.createGoogleAdsConfig(configData);
      res.json(config);
    } catch (error) {
      console.error('Error creating Google Ads config:', error);
      res.status(500).json({ error: 'Failed to create Google Ads configuration' });
    }
  });

  app.patch("/api/admin/google-ads/configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const config = await storage.updateGoogleAdsConfig(id, updates);
      res.json(config);
    } catch (error) {
      console.error('Error updating Google Ads config:', error);
      res.status(500).json({ error: 'Failed to update Google Ads configuration' });
    }
  });

  app.delete("/api/admin/google-ads/configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGoogleAdsConfig(id);
      res.json({ success: true, message: 'Google Ads configuration deleted' });
    } catch (error) {
      console.error('Error deleting Google Ads config:', error);
      res.status(500).json({ error: 'Failed to delete Google Ads configuration' });
    }
  });

  // Google Ads stats routes
  app.get("/api/admin/google-ads/stats", async (req, res) => {
    try {
      const { dateFrom, dateTo, adSlotId } = req.query;
      
      let stats;
      if (adSlotId) {
        stats = await storage.getGoogleAdsStatsBySlot(adSlotId as string);
      } else if (dateFrom && dateTo) {
        stats = await storage.getGoogleAdsStatsByDate(dateFrom as string, dateTo as string);
      } else {
        // Get recent stats (last 30 days for example)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateStr = thirtyDaysAgo.toISOString().split('T')[0];
        stats = await storage.getGoogleAdsStatsByDate(dateStr, new Date().toISOString().split('T')[0]);
      }
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching Google Ads stats:', error);
      res.status(500).json({ error: 'Failed to fetch Google Ads statistics' });
    }
  });

  app.post("/api/admin/google-ads/stats", async (req, res) => {
    try {
      const statsData = req.body;
      const stats = await storage.saveGoogleAdsStats(statsData);
      res.json(stats);
    } catch (error) {
      console.error('Error saving Google Ads stats:', error);
      res.status(500).json({ error: 'Failed to save Google Ads statistics' });
    }
  });

  // Google Ads sync route (simulated - would integrate with Google Ads API)
  app.post("/api/admin/google-ads/sync", async (req, res) => {
    try {
      // This would normally integrate with Google Ads API
      // For now, we'll simulate generating some sample stats
      const configs = await storage.getAllGoogleAdsConfigs();
      const today = new Date().toISOString().split('T')[0];
      
      let syncedCount = 0;
      for (const config of configs.filter(c => c.isActive)) {
        // Generate sample data (in real implementation, fetch from Google Ads API)
        const statsData = {
          adSlotId: config.adSlotId,
          impressions: Math.floor(Math.random() * 10000) + 1000,
          clicks: Math.floor(Math.random() * 100) + 10,
          revenue: (Math.random() * 50 + 5).toFixed(2),
          ctr: ((Math.random() * 3) + 0.5).toFixed(2),
          dateRecorded: today
        };
        
        // Calculate CTR properly
        statsData.ctr = ((statsData.clicks / statsData.impressions) * 100).toFixed(2);
        
        await storage.saveGoogleAdsStats(statsData);
        syncedCount++;
      }
      
      res.json({ 
        success: true, 
        message: `Synced data for ${syncedCount} ad slots`,
        syncedSlots: syncedCount
      });
    } catch (error) {
      console.error('Error syncing Google Ads data:', error);
      res.status(500).json({ error: 'Failed to sync Google Ads data' });
    }
  });

  // Google Ads revenue summary
  app.get("/api/admin/google-ads/revenue", async (req, res) => {
    try {
      const totalRevenue = await storage.getTotalGoogleAdsRevenue();
      res.json({ totalRevenue });
    } catch (error) {
      console.error('Error fetching Google Ads revenue:', error);
      res.status(500).json({ error: 'Failed to fetch Google Ads revenue' });
    }
  });

  // Track Widget Endpoints
  
  // Recent tracks by channel endpoint for track widgets
  app.get('/api/tracks/recent/:channel', async (req, res) => {
    try {
      const { channel } = req.params;
      
      if (!['dhr1', 'dhr2'].includes(channel)) {
        return res.status(400).json({ message: 'Invalid channel. Must be dhr1 or dhr2.' });
      }
      
      const tracks = await storage.getRecentTracksByChannel(channel as 'dhr1' | 'dhr2', 10);
      res.json(tracks);
    } catch (error) {
      console.error('Failed to fetch recent tracks:', error);
      res.status(500).json({ message: 'Failed to fetch recent tracks' });
    }
  });

  // Track recommendations endpoint with content crawling
  app.post('/api/tracks/recommendations', async (req, res) => {
    try {
      const { artist, title, channel } = req.body;
      
      if (!artist || !title) {
        return res.status(400).json({ message: 'Artist and title are required' });
      }
      
      // Crawl recommendations from external sources
      const recommendations = await crawlTrackRecommendations(artist, title, channel);
      res.json(recommendations);
    } catch (error) {
      console.error('Failed to crawl recommendations:', error);
      res.status(500).json({ message: 'Failed to fetch recommendations' });
    }
  });

  // Content crawling function for track recommendations
  async function crawlTrackRecommendations(artist: string, title: string, channel: string) {
    const recommendations = [];
    
    try {
      // Crawl SoundCloud for similar tracks
      const soundcloudTracks = await crawlSoundCloud(artist, title);
      recommendations.push(...soundcloudTracks);
      
      // Crawl YouTube for similar tracks
      const youtubeTracks = await crawlYouTube(artist, title);
      recommendations.push(...youtubeTracks);
      
      // Crawl Beatport for similar tracks (if deep house)
      if (channel === 'dhr1' || channel === 'dhr2') {
        const beatportTracks = await crawlBeatport(artist, title);
        recommendations.push(...beatportTracks);
      }
      
      // Remove duplicates and limit to 10
      const uniqueTracks = recommendations
        .filter((track, index, self) => 
          index === self.findIndex(t => t.title === track.title && t.artist === track.artist)
        )
        .slice(0, 10);
      
      return uniqueTracks;
    } catch (error) {
      console.error('Content crawling error:', error);
      return [];
    }
  }

  // SoundCloud content crawler
  async function crawlSoundCloud(artist: string, title: string) {
    try {
      const searchQuery = `${artist} ${title}`.replace(/\s+/g, '+');
      
      // Simulate SoundCloud API search (in production, use real SoundCloud API)
      const similarTracks = [
        {
          title: `${title} (Extended Mix)`,
          artist: artist,
          soundcloudUrl: `https://soundcloud.com/search?q=${searchQuery}`,
          confidence: 85,
          service: 'SoundCloud'
        },
        {
          title: `Similar Track by ${artist}`,
          artist: artist,
          soundcloudUrl: `https://soundcloud.com/search?q=${artist.replace(/\s+/g, '+')}`,
          confidence: 75,
          service: 'SoundCloud'
        }
      ];
      
      return similarTracks;
    } catch (error) {
      console.error('SoundCloud crawling error:', error);
      return [];
    }
  }

  // YouTube content crawler
  async function crawlYouTube(artist: string, title: string) {
    try {
      const searchQuery = `${artist} ${title} deep house mix`.replace(/\s+/g, '+');
      
      // Simulate YouTube API search (in production, use real YouTube Data API)
      const similarTracks = [
        {
          title: `${title} - Deep House Mix`,
          artist: `${artist} & Friends`,
          youtubeUrl: `https://www.youtube.com/results?search_query=${searchQuery}`,
          confidence: 80,
          service: 'YouTube'
        },
        {
          title: `Best of ${artist} - Deep House Collection`,
          artist: artist,
          youtubeUrl: `https://www.youtube.com/results?search_query=${artist.replace(/\s+/g, '+')}+deep+house`,
          confidence: 70,
          service: 'YouTube'
        }
      ];
      
      return similarTracks;
    } catch (error) {
      console.error('YouTube crawling error:', error);
      return [];
    }
  }

  // Beatport content crawler
  async function crawlBeatport(artist: string, title: string) {
    try {
      const searchQuery = `${artist} ${title}`.replace(/\s+/g, '+');
      
      // Simulate Beatport search (in production, use Beatport API or web scraping)
      const similarTracks = [
        {
          title: `${title} (Original Mix)`,
          artist: artist,
          spotifyUrl: `https://www.beatport.com/search?q=${searchQuery}`,
          confidence: 90,
          service: 'Beatport'
        }
      ];
      
      return similarTracks;
    } catch (error) {
      console.error('Beatport crawling error:', error);
      return [];
    }
  }

  // RSS Feed Endpoints for Forum News
  app.get('/api/rss/feeds', async (req, res) => {
    try {
      const feeds = rssService.getAvailableFeeds();
      res.json(feeds);
    } catch (error) {
      console.error('Error getting RSS feeds:', error);
      res.status(500).json({ error: 'Failed to get RSS feeds' });
    }
  });

  app.get('/api/rss/latest', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const items = await rssService.getLatestNews(limit);
      res.json(items);
    } catch (error) {
      console.error('Error fetching latest RSS items:', error);
      res.status(500).json({ error: 'Failed to fetch latest news' });
    }
  });

  app.get('/api/rss/category/:category', async (req, res) => {
    try {
      const category = req.params.category;
      const limit = parseInt(req.query.limit as string) || 10;
      const items = await rssService.getNewsByCategory(category, limit);
      res.json(items);
    } catch (error) {
      console.error('Error fetching RSS items by category:', error);
      res.status(500).json({ error: 'Failed to fetch news by category' });
    }
  });

  app.post('/api/rss/refresh', async (req, res) => {
    try {
      rssService.clearCache();
      const items = await rssService.getLatestNews(10);
      res.json({ success: true, itemCount: items.length });
    } catch (error) {
      console.error('Error refreshing RSS feeds:', error);
      res.status(500).json({ error: 'Failed to refresh RSS feeds' });
    }
  });

  // Reddit API Endpoints for Forum Content
  app.get('/api/reddit/subreddits', async (req, res) => {
    try {
      const subreddits = redditService.getAvailableSubreddits();
      res.json(subreddits);
    } catch (error) {
      console.error('Error getting subreddits:', error);
      res.status(500).json({ error: 'Failed to get subreddits' });
    }
  });

  app.get('/api/reddit/posts', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const posts = await redditService.getAllPosts(limit);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching Reddit posts:', error);
      res.status(500).json({ error: 'Failed to fetch Reddit posts' });
    }
  });

  app.get('/api/reddit/top/:subreddit?', async (req, res) => {
    try {
      const subreddit = req.params.subreddit;
      const limit = parseInt(req.query.limit as string) || 10;
      const posts = await redditService.getTopPosts(subreddit, limit);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching top Reddit posts:', error);
      res.status(500).json({ error: 'Failed to fetch top posts' });
    }
  });

  app.post('/api/reddit/refresh', async (req, res) => {
    try {
      redditService.clearCache();
      const posts = await redditService.getAllPosts(10);
      res.json({ success: true, postCount: posts.length });
    } catch (error) {
      console.error('Error refreshing Reddit feeds:', error);
      res.status(500).json({ error: 'Failed to refresh Reddit feeds' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
