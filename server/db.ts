import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon in server environment
if (typeof WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

// Disable fetch and pipelining for better compatibility
neonConfig.fetchConnectionCache = true;
neonConfig.pipelineConnect = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 1, // Reduce connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000
});
export const db = drizzle({ client: pool, schema });
