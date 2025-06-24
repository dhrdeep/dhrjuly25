import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

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

  const httpServer = createServer(app);
  return httpServer;
}
