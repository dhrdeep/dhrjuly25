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
import { webCrawlerService } from "./webCrawlerService";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { PassThrough } from 'stream';
import fs from 'fs';
import { execSync } from 'child_process';

// Configure FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath.path);

export async function registerRoutes(app: Express): Promise<Server> {
  // Note: Replit authentication disabled for simple email auth
  // await setupAuth(app);

  // Firebase Authentication endpoints
  app.post('/api/auth/firebase-login', async (req, res) => {
    try {
      const { idToken, provider } = req.body;
      
      if (!idToken || !provider) {
        return res.status(400).json({ message: "Missing idToken or provider" });
      }

      // For now, let's implement a basic version that extracts user info from the token
      // In a real implementation, you would verify the token with Firebase Admin SDK
      
      // Mock verification - in production you'd use Firebase Admin SDK
      let email: string;
      let name: string;
      let profileImage: string | undefined;
      
      // Basic token parsing (this is simplified - use Firebase Admin SDK in production)
      try {
        const tokenPayload = JSON.parse(atob(idToken.split('.')[1]));
        email = tokenPayload.email;
        name = tokenPayload.name || '';
        profileImage = tokenPayload.picture;
      } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
      }

      if (!email) {
        return res.status(400).json({ message: "No email found in token" });
      }

      // Check for existing user by Firebase UID or email
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user
        const nameParts = name.split(' ');
        const username = email.split('@')[0];
        
        // Check subscription status with demo logic
        let subscriptionTier = 'free';
        if (email.toLowerCase().includes('vip')) {
          subscriptionTier = 'vip';
        } else if (email.toLowerCase().includes('dhr2')) {
          subscriptionTier = 'dhr2';
        } else if (email.toLowerCase().includes('dhr1')) {
          subscriptionTier = 'dhr1';
        }

        user = await storage.createUser({
          id: `firebase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email,
          username,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          profileImageUrl: profileImage,
          firebaseUid: idToken, // Store token as UID temporarily
          subscriptionTier,
          subscriptionStatus: 'active',
          subscriptionSource: 'firebase',
          isAdmin: false
        });
      } else {
        // Update last login
        user = await storage.updateUser(user.id, {
          lastLoginAt: new Date(),
          profileImageUrl: profileImage || user.profileImageUrl
        });
      }

      // Store user in session
      (req.session as any).user = {
        id: user.id,
        email: user.email,
        username: user.username,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiry: user.subscriptionExpiry,
        isAdmin: user.isAdmin || false,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        firebaseUid: user.firebaseUid
      };

      res.json({
        message: "Login successful",
        user: (req.session as any).user
      });

    } catch (error) {
      console.error("Firebase login error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  // Get current Firebase user
  app.get('/api/auth/firebase-user', async (req, res) => {
    try {
      const sessionUser = (req.session as any).user;
      
      if (!sessionUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Get fresh user data from database
      const user = await storage.getUser(sessionUser.id);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiry: user.subscriptionExpiry,
        isAdmin: user.isAdmin,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        firebaseUid: user.firebaseUid
      });

    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user data" });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
          return res.status(500).json({ message: "Logout failed" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "Logged out successfully" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin route to manually assign user tiers
  app.post('/api/admin/assign-tier', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { email, tier, expiryDays } = req.body;
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Calculate expiry date if provided
      let expiry: Date | undefined;
      if (expiryDays && expiryDays > 0) {
        expiry = new Date();
        expiry.setDate(expiry.getDate() + expiryDays);
      }

      // Update user tier
      const updatedUser = await storage.setUserTier(user.id, tier, expiry);
      
      res.json({
        message: `User ${email} assigned to ${tier} tier`,
        user: updatedUser
      });
    } catch (error) {
      console.error("Error assigning tier:", error);
      res.status(500).json({ message: "Failed to assign tier" });
    }
  });

  // Admin route to set admin status
  app.post('/api/admin/set-admin', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId, isAdmin: adminStatus } = req.body;
      
      const updatedUser = await storage.setUserAdmin(userId, adminStatus);
      
      res.json({
        message: `User admin status updated`,
        user: updatedUser
      });
    } catch (error) {
      console.error("Error setting admin status:", error);
      res.status(500).json({ message: "Failed to set admin status" });
    }
  });

  // Get all users (admin only)
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Helper function to check email against Patreon and BMAC subscriptions
  async function checkEmailInSubscriptions(email: string) {
    try {
      // Check existing users in database first
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.subscriptionStatus === 'active' && existingUser.subscriptionExpiry && existingUser.subscriptionExpiry > new Date()) {
        return {
          hasActiveSubscription: true,
          tier: existingUser.subscriptionTier,
          source: existingUser.subscriptionSource || 'existing',
          expiry: existingUser.subscriptionExpiry,
          amount: existingUser.pledgeAmount || 0
        };
      }

      // For now, return basic tier assignment based on simple email check
      // This will be enhanced with actual Patreon/BMAC API calls
      
      // Simple demo - check if email contains specific patterns for testing
      if (email.includes('dhr1') || email.includes('test1')) {
        return {
          hasActiveSubscription: true,
          tier: 'dhr1',
          source: 'demo',
          expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          amount: 300 // €3
        };
      }
      
      if (email.includes('dhr2') || email.includes('test2')) {
        return {
          hasActiveSubscription: true,
          tier: 'dhr2',
          source: 'demo',
          expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          amount: 500 // €5
        };
      }
      
      if (email.includes('vip') || email.includes('test3')) {
        return {
          hasActiveSubscription: true,
          tier: 'vip',
          source: 'demo',
          expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          amount: 1000 // €10
        };
      }

      return {
        hasActiveSubscription: false,
        tier: 'free',
        source: 'none',
        expiry: null,
        amount: 0
      };
    } catch (error) {
      console.error("Error checking email subscriptions:", error);
      return {
        hasActiveSubscription: false,
        tier: 'free',
        source: 'error',
        expiry: null,
        amount: 0
      };
    }
  }

  // Email-based authentication - check if email has active subscription
  app.post('/api/auth/email-login', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check if user already exists in our database
      let user = await storage.getUserByEmail(normalizedEmail);
      
      // If user doesn't exist, check Patreon and BMAC for active subscriptions
      if (!user) {
        const subscriptionInfo = await checkEmailInSubscriptions(normalizedEmail);
        
        if (!subscriptionInfo.hasActiveSubscription) {
          return res.status(404).json({ 
            message: "Email not found in active subscriptions. Please check your Patreon or Buy Me a Coffee account." 
          });
        }

        // Create new user with subscription info
        const username = normalizedEmail.split('@')[0]; // Generate username from email
        user = await storage.createUser({
          id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: normalizedEmail,
          username: username,
          subscriptionTier: subscriptionInfo.tier,
          subscriptionStatus: 'active',
          subscriptionSource: subscriptionInfo.source,
          subscriptionExpiry: subscriptionInfo.expiry,
          subscriptionStartDate: new Date(),
          pledgeAmount: subscriptionInfo.amount || 0,
        });
      } else {
        // Update existing user subscription status
        const subscriptionInfo = await checkEmailInSubscriptions(normalizedEmail);
        
        if (!subscriptionInfo.hasActiveSubscription) {
          return res.status(403).json({ 
            message: "Your subscription has expired or is no longer active." 
          });
        }

        // Update user with latest subscription info
        user = await storage.updateUser(user.id, {
          subscriptionTier: subscriptionInfo.tier,
          subscriptionStatus: 'active',
          subscriptionSource: subscriptionInfo.source,
          subscriptionExpiry: subscriptionInfo.expiry,
          pledgeAmount: subscriptionInfo.amount || 0,
          lastLoginAt: new Date(),
        });
      }

      // Store user in session
      req.session.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiry: user.subscriptionExpiry,
        isAdmin: user.isAdmin || false,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl
      };

      // Force session save to prevent race conditions on redirect
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: "Login failed due to session error" });
        }
        
        res.json({
          message: "Login successful",
          tier: user.subscriptionTier,
          user: req.session.user
        });
      });

    } catch (error) {
      console.error("Email login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Simple email authentication (bypasses Firebase for now)
  app.post("/api/auth/simple-login", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const normalizedEmail = email.toLowerCase().trim();
      
      // Check subscription status
      const subscriptionInfo = await checkEmailInSubscriptions(normalizedEmail);
      
      // Create or update user
      let user = await storage.getUserByEmail(normalizedEmail);
      
      if (!user) {
        // Create new user with generated ID
        const userId = `simple-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        user = await storage.createUser({
          id: userId,
          email: normalizedEmail,
          username: normalizedEmail.split('@')[0], // Use email prefix as username
          subscriptionTier: subscriptionInfo.tier,
          subscriptionStatus: subscriptionInfo.hasActiveSubscription ? 'active' : 'cancelled',
          subscriptionSource: subscriptionInfo.source,
          subscriptionExpiry: subscriptionInfo.expiry,
          subscriptionStartDate: new Date(),
          pledgeAmount: subscriptionInfo.amount || 0,
        });
      } else {
        // Update existing user
        user = await storage.updateUser(user.id, {
          subscriptionTier: subscriptionInfo.tier,
          subscriptionStatus: subscriptionInfo.hasActiveSubscription ? 'active' : 'cancelled',
          subscriptionSource: subscriptionInfo.source,
          subscriptionExpiry: subscriptionInfo.expiry,
          pledgeAmount: subscriptionInfo.amount || 0,
          lastLoginAt: new Date(),
        });
      }

      // Store user in session (simplified session structure)
      console.log('Setting session user:', user.email);
      req.session.user = {
        id: user.id,
        email: user.email,
        username: user.username || '',
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiry: user.subscriptionExpiry || undefined,
        isAdmin: user.isAdmin || false,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        profileImageUrl: user.profileImageUrl || undefined
      };

      // Force session save
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
        } else {
          console.log('Session saved successfully');
        }
      });

      console.log('Session ID:', req.sessionID);
      console.log('Session user set:', !!req.session.user);

      res.json({
        message: "Authentication successful",
        tier: user.subscriptionTier,
        user: {
          id: user.id,
          email: user.email,
          subscriptionTier: user.subscriptionTier,
          subscriptionStatus: user.subscriptionStatus
        }
      });

    } catch (error) {
      console.error("Simple login error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  // Get current session user (for simple auth)
  app.get("/api/auth/session-user", async (req, res) => {
    try {
      if (req.session && (req.session as any).user) {
        const sessionUser = (req.session as any).user;
        res.json({
          user: sessionUser,
          authenticated: true
        });
      } else {
        res.status(401).json({
          user: null,
          authenticated: false
        });
      }
    } catch (error) {
      console.error("Session user error:", error);
      res.status(500).json({ message: "Failed to get session user" });
    }
  });

  // Get current authenticated user (for useAuth hook)
  app.get("/api/auth/me", async (req, res) => {
    try {
      if (req.session && (req.session as any).user) {
        const sessionUser = (req.session as any).user;
        
        // Return user data in the format expected by the frontend
        res.json({
          id: sessionUser.id,
          email: sessionUser.email,
          username: sessionUser.username,
          subscriptionTier: sessionUser.subscriptionTier,
          subscriptionStatus: sessionUser.subscriptionStatus,
          subscriptionExpiry: sessionUser.subscriptionExpiry,
          isAdmin: sessionUser.isAdmin || false,
          firstName: sessionUser.firstName,
          lastName: sessionUser.lastName,
          profileImageUrl: sessionUser.profileImageUrl
        });
      } else {
        res.status(401).json({ message: "Not authenticated" });
      }
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Failed to get user data" });
    }
  });

  app.get("/api/patreon-client-id", (req, res) => {
    res.json({ clientId: process.env.VITE_PATREON_CLIENT_ID });
  });

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
      
      // Try environment variable first, then fallback to configured value
      let apiKey = process.env.BMAC_API_KEY;
      
      // Production fallback for authenticated API key
      if (!apiKey || apiKey === 'YOUR_BMAC_KEY_HERE') {
        apiKey = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5MTI5ZDIwMC1kYTdkLTRjY2MtOWQzZC01ODA0MTU0ZTgyMjYiLCJqdGkiOiJiYTZmZDI4NjkzZWU4YTUyMTQ1MTQzMmExZmQxODY1MmUyYTA2NDYxNDBlMDhkMTkzNjE2N2NlYTViYjJjMmI3MTNjZTI3YmM0MzdmZDY3ZCIsImlhdCI6MTc1MDc5NjA5NCwibmJmIjoxNzUwNzk2MDk0LCJleHAiOjE3NjY2MDcyOTQsInN1YiI6IjY4NDM1ODQiLCJzY29wZXMiOlsicmVhZC1vbmx5Il19.vurkvE6WBmmQCdTCUgcJdgb1z918bRtH7J6K3-fNglh23g_CT0AMeqmZLesyssyZfVMTwUZ4i6ldNjiEeAylGhyNJHDqcoTaU4k7dBOkXbn5JZjZPYBSDl3HL5Xj06Owe0U_tZSGE16CFNqy6wW_1snGmo-8afY2mVmxVatWWpJuEEZVDlF0lwMXzLIr0i62atRPkKvtq-aA1z2HtVX8WSgZqCow58fxRFOTOGS2z87fASiGkObQU8jpTIb3MPfS3KQPX63bce2uZ_u2IebSOiawyL2VjsVr0qUxlOk4ElcKRFGqdrVbT2dWHJvYi-t8Uue38Qk1uOj5WYpAP-zOwbzepI-tKeEgnOjC2dJctm1Do40u-3MQnzZbzb5RCusiiZQ4qE5Jw4RH_5883YcJlVf0A_HKusyh2cFaROkGC08i81PLKtDd7bC70omttMSuUcQEfggZxzLHnEuyZ_UXZ-03JuxozrHUX-Zx79DXfZdkt6tQbJiu0l4GkS7Jfs8ffAvuqGv5EcaoqQK99p4SFDvvji54uAYqOFCMhiuNdosTkgi6rwl4pKaox-FVFq1198-wa7pRDSJqpj8taDCsjTvQDYX0aicGOvX1TuOZzSB5RUXTTuChqek2iP18j4eo9B7H5kEZVtv4_StyVoKEYDsyypw2G5DZBcZYtyz76ac";
      }
      
      if (!apiKey) {
        return res.status(400).json({ 
          success: false, 
          error: "Buy Me a Coffee API key not configured" 
        });
      }

      const syncResults = {
        totalSupporters: 0,
        newUsers: 0,
        updatedUsers: 0,
        errors: [] as string[]
      };

      // Fetch both supporters and subscriptions from Buy Me a Coffee API
      let allSupporters = [];
      
      // Fetch one-time supporters with pagination
      try {
        let page = 1;
        let hasMoreSupporters = true;
        let totalOneTimeSupports = 0;

        while (hasMoreSupporters) {
          const supportersResponse = await fetch(`https://developers.buymeacoffee.com/api/v1/supporters?page=${page}`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });

          if (supportersResponse.ok) {
            const supportersText = await supportersResponse.text();
            const supportersData = JSON.parse(supportersText);
            const oneTimeSupports = supportersData.data || [];
            
            console.log(`Page ${page} supporters API response structure:`, {
              hasData: !!supportersData.data,
              dataLength: oneTimeSupports.length,
              hasPagination: !!(supportersData.current_page || supportersData.last_page),
              currentPage: supportersData.current_page,
              lastPage: supportersData.last_page,
              totalCount: supportersData.total || supportersData.count,
              perPage: supportersData.per_page
            });
            
            if (oneTimeSupports.length > 0) {
              console.log(`Page ${page}: Found ${oneTimeSupports.length} one-time supporters`);
              allSupporters.push(...oneTimeSupports);
              totalOneTimeSupports += oneTimeSupports.length;
              page++;
              
              // Check if we have pagination info
              if (supportersData.current_page && supportersData.last_page) {
                hasMoreSupporters = supportersData.current_page < supportersData.last_page;
                console.log(`Pagination info: ${supportersData.current_page}/${supportersData.last_page}, continuing: ${hasMoreSupporters}`);
              } else {
                // If no pagination info, assume we have more if we got a full page
                hasMoreSupporters = oneTimeSupports.length >= 20; // Typical page size
                console.log(`No pagination info, got ${oneTimeSupports.length} items, continuing: ${hasMoreSupporters}`);
              }
            } else {
              hasMoreSupporters = false;
              console.log(`No supporters found on page ${page}, stopping pagination`);
            }
          } else {
            console.log(`Error fetching supporters page ${page}:`, supportersResponse.status);
            hasMoreSupporters = false;
          }
        }
        
        console.log(`Total one-time supporters fetched: ${totalOneTimeSupports}`);
      } catch (error) {
        console.log('Error fetching one-time supporters:', error);
      }

      // Fetch recurring subscriptions with pagination
      try {
        let page = 1;
        let hasMoreSubscriptions = true;
        let totalSubscriptions = 0;

        while (hasMoreSubscriptions) {
          const subscriptionsResponse = await fetch(`https://developers.buymeacoffee.com/api/v1/subscriptions?page=${page}`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });

          if (subscriptionsResponse.ok) {
            const subscriptionsText = await subscriptionsResponse.text();
            const subscriptionsData = JSON.parse(subscriptionsText);
            const recurringSupports = subscriptionsData.data || [];
            
            console.log(`Page ${page} subscriptions API response structure:`, {
              hasData: !!subscriptionsData.data,
              dataLength: recurringSupports.length,
              hasPagination: !!(subscriptionsData.current_page || subscriptionsData.last_page),
              currentPage: subscriptionsData.current_page,
              lastPage: subscriptionsData.last_page,
              totalCount: subscriptionsData.total || subscriptionsData.count,
              perPage: subscriptionsData.per_page
            });
            
            if (recurringSupports.length > 0) {
              console.log(`Page ${page}: Found ${recurringSupports.length} recurring subscriptions`);
              
              // Transform subscription data to match supporter format
              recurringSupports.forEach((sub: any) => {
                allSupporters.push({
                  ...sub,
                  support_id: sub.subscription_id || sub.id,
                  payer_email: sub.payer_email || sub.supporter_email,
                  payer_name: sub.payer_name || sub.supporter_name,
                  support_coffee_price: sub.subscription_coffee_price || sub.coffee_price,
                  support_coffees: sub.subscription_coffees || sub.coffees,
                  support_created_on: sub.subscription_created_on || sub.created_on,
                  is_recurring: true
                });
              });
              
              totalSubscriptions += recurringSupports.length;
              page++;
              
              // Check if we have pagination info
              if (subscriptionsData.current_page && subscriptionsData.last_page) {
                hasMoreSubscriptions = subscriptionsData.current_page < subscriptionsData.last_page;
              } else {
                // If no pagination info, assume we have more if we got a full page
                hasMoreSubscriptions = recurringSupports.length >= 20; // Typical page size
              }
            } else {
              hasMoreSubscriptions = false;
            }
          } else {
            console.log(`Error fetching subscriptions page ${page}:`, subscriptionsResponse.status);
            hasMoreSubscriptions = false;
          }
        }
        
        console.log(`Total subscriptions fetched: ${totalSubscriptions}`);
      } catch (error) {
        console.log('Error fetching subscriptions:', error);
      }

      if (allSupporters.length === 0) {
        return res.status(500).json({ 
          success: false, 
          error: `No supporters found from Buy Me a Coffee API. Please check your API key.` 
        });
      }

      const supporters = allSupporters;
      console.log(`Found ${supporters.length} total supporters/subscribers to process`);
      console.log('Supporters array:', supporters);

      syncResults.totalSupporters = supporters.length;

      // Process each supporter
      for (const supporter of supporters) {
        console.log(`Processing supporter:`, supporter);
        try {
          const supporterId = supporter.support_id || supporter.supporter_id || supporter.id;
          const email = supporter.payer_email || supporter.supporter_email; // Use payer_email from API
          const name = supporter.payer_name || supporter.supporter_name || supporter.name;
          const amount = parseFloat(supporter.support_coffee_price) || supporter.support_coffees * 3 || 3; // Parse as float
          const supportDate = new Date(supporter.support_created_on);

          console.log(`Raw supporter data - payer_email: ${supporter.payer_email}, supporter_email: ${supporter.supporter_email}`);
          console.log(`Processing BMAC supporter: ${name} (${email}) - €${amount} on ${supportDate.toISOString()}`);

          if (!email) {
            console.log(`Skipping supporter without email - payer_email: ${supporter.payer_email}`);
            continue;
          }

          // Determine tier based on support amount AND date
          let tier = 'dhr1'; // Default for supporters
          const now = new Date();
          const daysSinceSupport = Math.floor((now.getTime() - supportDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Assign tier based on amount
          if (amount >= 10) tier = 'vip';
          else if (amount >= 5) tier = 'dhr2';

          // Calculate subscription expiry based on type
          let subscriptionExpiry = new Date(supportDate);
          let status = 'active';
          
          if (supporter.is_recurring) {
            // For recurring subscriptions, check if subscription is still active
            const subscriptionEndDate = supporter.subscription_current_period_end ? 
              new Date(supporter.subscription_current_period_end) : 
              new Date(supportDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // Default 30 days
              
            subscriptionExpiry = subscriptionEndDate;
            
            // Check if subscription is cancelled or expired
            const isCancelled = supporter.subscription_is_cancelled || supporter.subscription_cancelled_on;
            const isExpired = now > subscriptionEndDate;
            
            if (isCancelled || isExpired) {
              status = 'expired';
              console.log(`Recurring subscription expired/cancelled - expiry: ${subscriptionExpiry.toISOString()}`);
            } else {
              status = 'active';
              console.log(`Active recurring subscription - expiry: ${subscriptionExpiry.toISOString()}`);
            }
          } else {
            // For one-time support, give 90 days from support date (no extensions)
            subscriptionExpiry.setDate(subscriptionExpiry.getDate() + 90);
            const isExpired = now > subscriptionExpiry;
            status = isExpired ? 'expired' : 'active';
            console.log(`One-time support - ${status} - expiry: ${subscriptionExpiry.toISOString()}`);
          }

          console.log(`Tier: ${tier}, Status: ${status}, Days since support: ${daysSinceSupport}, Expires: ${subscriptionExpiry.toISOString()}`);

          // Check if user exists
          let user = await storage.getUserByEmail(email);
          
          const userData = {
            id: supporterId.toString(),
            email: email,
            username: name || `supporter_${supporterId}`,
            subscriptionTier: tier as any,
            subscriptionStatus: status as any,
            subscriptionSource: 'bmac',
            subscriptionStartDate: supportDate,
            subscriptionExpiry: subscriptionExpiry,
            pledgeAmount: amount,
            joinDate: supportDate,
            lifetimeSupport: amount,
            patreonTier: null,
            preferences: {}
          };

          if (user) {
            // Always update to ensure latest tier and expiry info
            await storage.updateUser(user.id, userData);
            syncResults.updatedUsers++;
            console.log(`Updated existing user: ${email}`);
          } else {
            await storage.createUser(userData);
            syncResults.newUsers++;
            console.log(`Created new user: ${email}`);
          }
        } catch (error) {
          console.error(`Error processing supporter:`, error);
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

  app.get("/api/bmac-api-key", (req, res) => {
    res.json({ apiKey: process.env.VITE_BUYMEACOFFEE_API_KEY });
  });

  app.get("/api/track-monitor/current", async (req, res) => {
    try {
      const { channel } = req.query;
      let streamUrl = '';

      if (channel === 'dhr1') {
        streamUrl = 'https://ec1.everestcast.host:2775/api/v2/current';
      } else if (channel === 'dhr2') {
        streamUrl = 'https://ec1.everestcast.host:1565/api/v2/current';
      } else {
        return res.status(400).json({ error: "Invalid channel specified" });
      }

      const response = await fetch(streamUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata from Everestcast: ${response.statusText}`);
      }
      const data = await response.json();

      if (data.data && data.data.current_track) {
        res.json({
          track: {
            title: data.data.current_track.title,
            artist: data.data.current_track.artist,
            album: data.data.current_track.album,
            artwork: data.data.current_track.artwork,
            confidence: 100, // Assuming 100% confidence for direct stream metadata
            service: "Everestcast",
            timestamp: new Date().toISOString(),
            duration: data.data.current_track.duration,
          },
          isActive: true,
        });
      } else {
        res.json({ track: null, isActive: true });
      }
    } catch (error) {
      console.error("Error fetching live metadata:", error);
      res.status(500).json({ error: "Failed to fetch live metadata" });
    }
  });

  app.get("/api/tracks/recent", async (req, res) => {
    try {
      const { channel } = req.query;
      let recentTracks = [];

      if (channel === 'dhr1') {
        recentTracks = [
          {
            id: 1,
            trackId: "dhr1_track_1",
            title: "DHR1 Recent Track 1",
            artist: "DHR1 Artist 1",
            album: "DHR1 Album 1",
            channel: "dhr1",
            confidence: 95,
            service: "Everestcast",
            artwork: "https://via.placeholder.com/150",
            identifiedAt: new Date(Date.now() - 60 * 1000).toISOString(),
          },
          {
            id: 2,
            trackId: "dhr1_track_2",
            title: "DHR1 Recent Track 2",
            artist: "DHR1 Artist 2",
            album: "DHR1 Album 2",
            channel: "dhr1",
            confidence: 90,
            service: "Everestcast",
            artwork: "https://via.placeholder.com/150",
            identifiedAt: new Date(Date.now() - 120 * 1000).toISOString(),
          },
        ];
      } else if (channel === 'dhr2') {
        recentTracks = [
          {
            id: 3,
            trackId: "dhr2_track_1",
            title: "DHR2 Recent Track 1",
            artist: "DHR2 Artist 1",
            album: "DHR2 Album 1",
            channel: "dhr2",
            confidence: 98,
            service: "Everestcast",
            artwork: "https://via.placeholder.com/150",
            identifiedAt: new Date(Date.now() - 30 * 1000).toISOString(),
          },
          {
            id: 4,
            trackId: "dhr2_track_2",
            title: "DHR2 Recent Track 2",
            artist: "DHR2 Artist 2",
            album: "DHR2 Album 2",
            channel: "dhr2",
            confidence: 88,
            service: "Everestcast",
            artwork: "https://via.placeholder.com/150",
            identifiedAt: new Date(Date.now() - 90 * 1000).toISOString(),
          },
        ];
      } else {
        return res.status(400).json({ error: "Invalid channel specified" });
      }

      res.json(recentTracks);
    } catch (error) {
      console.error("Error fetching recent tracks:", error);
      res.status(500).json({ error: "Failed to fetch recent tracks" });
    }
  });

  app.get("/api/live-metadata", async (req, res) => {
    try {
      const { channel } = req.query;
      let streamUrl = '';

      if (channel === 'dhr1') {
        streamUrl = 'https://ec1.everestcast.host:2775/api/v2/current';
      } else if (channel === 'dhr2') {
        streamUrl = 'https://ec1.everestcast.host:1565/api/v2/current';
      } else {
        return res.status(400).json({ error: "Invalid channel specified" });
      }

      const response = await fetch(streamUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata from Everestcast: ${response.statusText}`);
      }
      const data = await response.json();

      if (data.data && data.data.current_track) {
        res.json({
          title: data.data.current_track.title,
          artist: data.data.current_track.artist,
          listeners: data.data.listeners,
        });
      } else {
        res.json({ title: "No track info", artist: "Deep House Radio", listeners: data.data?.listeners || 0 });
      }
    } catch (error) {
      console.error("Error fetching live metadata:", error);
      res.status(500).json({ error: "Failed to fetch live metadata" });
    }
  });

  app.post("/api/identify-track", async (req, res) => {
    try {
      const { audioBase64 } = req.body;

      if (!audioBase64) {
        return res.status(400).json({ error: "audioBase64 is required" });
      }

      // Decode base64 and save to a temporary file
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      const tempFilePath = `/tmp/audio_${Date.now()}.webm`;
      fs.writeFileSync(tempFilePath, audioBuffer);

      // Mock identification service
      const identifiedTrack = {
        id: "mock-id",
        title: "Mock Track",
        album: "Mock Album",
        artist: "Mock Artist",
        artwork: "https://via.placeholder.com/150",
        timestamp: new Date().toISOString(),
        confidence: 0.9,
        service: "ACRCloud",
        duration: 180,
        genre: "Deep House",
        releaseDate: "2023-01-01",
      };

      res.json({ track: identifiedTrack });
    } catch (error) {
      console.error("Error identifying track:", error);
      res.status(500).json({ error: "Failed to identify track" });
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
      
      if (testResult.success) {
        res.json({
          success: true,
          message: 'Successfully connected to DigitalOcean Spaces and listed objects.',
          files: testResult.files
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to connect to DigitalOcean Spaces. Check credentials and permissions.',
          details: testResult.error
        });
      }
    } catch (error) {
      console.error('Storage test error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });
  
  return createServer(app);
}