import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Support both local IDs and Patreon IDs like "patreon_123"
  email: text("email").notNull().unique(),
  username: text("username").notNull(),
  subscriptionTier: text("subscription_tier").notNull().default('free'), // 'free', 'premium', 'vip'
  subscriptionStatus: text("subscription_status").notNull().default('active'), // 'active', 'inactive', 'cancelled'
  subscriptionSource: text("subscription_source").default('local'), // 'local', 'patreon', 'stripe'
  subscriptionStartDate: timestamp("subscription_start_date"),
  patreonTier: text("patreon_tier"),
  preferences: jsonb("preferences").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at")
});

export const patreonTokens = pgTable("patreon_tokens", {
  id: serial("id").primaryKey(),
  userId: text("user_id"), // Optional - for linking to specific users
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  scope: text("scope").notNull(),
  campaignId: text("campaign_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const insertUserSchema = createInsertSchema(users);
export const insertPatreonTokenSchema = createInsertSchema(patreonTokens);

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type PatreonToken = typeof patreonTokens.$inferSelect;
export type InsertPatreonToken = z.infer<typeof insertPatreonTokenSchema>;
