
import express, { type Request, Response, NextFunction } from "express";
import fileUpload from "express-fileupload";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { streamMonitor } from "./streamMonitor";
import { storage } from "./storage"; // Assuming storage has session methods
import fs from "fs";
import path from "path";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

const app = express();
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: false, limit: "100mb" }));
app.use(cookieParser());

// Custom session middleware
app.use(async (req: any, res, next) => {
  const sessionId = req.cookies.session_id;
  let sessionData = {};

  if (sessionId) {
    sessionData = (await storage.getSession(sessionId)) || {};
  }

  req.session = {
    ...sessionData,
    save: async (callback: (err?: Error) => void) => {
      const newSessionId = sessionId || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      res.cookie('session_id', newSessionId, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Set to true in production with HTTPS
        sameSite: 'lax',
      });
      await storage.saveSession(newSessionId, req.session);
      callback();
    },
    destroy: async (callback: (err?: Error) => void) => {
      res.clearCookie('session_id');
      if (sessionId) {
        await storage.destroySession(sessionId);
      }
      callback();
    },
  };

  // Ensure req.session.user is always defined, even if empty
  if (!req.session.user) {
    req.session.user = {};
  }

  next();
});

// Add file upload support for CSV imports
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  createParentPath: true
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", async () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }

    // Save session on response finish
    if (req.session && req.session.save) {
      await new Promise(resolve => req.session.save(resolve));
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  serveStatic(app);

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT || 5000;
  server.listen({
    port: Number(port),
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Start the stream monitoring system
    console.log('🎵 Starting DHR Stream Monitoring System...');
    streamMonitor.startMonitoring();
  });
})();
