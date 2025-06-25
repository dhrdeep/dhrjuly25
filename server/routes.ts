import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVipMixSchema, insertUserDownloadSchema } from "@shared/schema";

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

  // Download tracking and access control
  app.post("/api/download/:mixId", async (req, res) => {
    try {
      const mixId = parseInt(req.params.mixId);
      const { userId } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "User authentication required" });
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
        downloadsUsed: newUsedCount,
        maxDownloads: 2 // VIP daily limit
      });

      // Update total downloads for the mix
      await storage.updateVipMix(mixId, {
        totalDownloads: (mix.totalDownloads || 0) + 1
      });

      res.json({
        success: true,
        downloadUrl: mix.jumpshareUrl,
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

  const httpServer = createServer(app);
  return httpServer;
}
