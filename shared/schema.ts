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

export const vipMixes = pgTable("vip_mixes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  genre: text("genre"),
  duration: text("duration"),
  file_size: text("file_size"), 
  file_path: text("file_path"),
  download_url: text("download_url"),
  stream_url: text("stream_url"),
  artwork_url: text("artwork_url"),
  description: text("description"),
  rating: integer("rating").default(0),
  total_downloads: integer("total_downloads").default(0),
  is_exclusive: boolean("is_exclusive").default(true),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  jumpshare_url: text("jumpshare_url"),
  jumpshare_preview_url: text("jumpshare_preview_url"),
  tags: text("tags"),
  s3_url: text("s3_url")
});

export const userDownloads = pgTable("user_downloads", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  mixId: integer("mix_id").notNull(),
  downloadedAt: timestamp("downloaded_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent")
});

export const dailyDownloadLimits = pgTable("daily_download_limits", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  downloadDate: text("download_date").notNull(), // Format: YYYY-MM-DD
  downloadsUsed: integer("downloads_used").default(0),
  maxDownloads: integer("max_downloads").default(2), // VIP daily limit
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const insertUserSchema = createInsertSchema(users);
export const insertPatreonTokenSchema = createInsertSchema(patreonTokens);
export const insertVipMixSchema = createInsertSchema(vipMixes);
export const insertUserDownloadSchema = createInsertSchema(userDownloads);
export const insertDailyDownloadLimitSchema = createInsertSchema(dailyDownloadLimits);

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type PatreonToken = typeof patreonTokens.$inferSelect;
export type InsertPatreonToken = z.infer<typeof insertPatreonTokenSchema>;
export type VipMix = typeof vipMixes.$inferSelect;
export type InsertVipMix = z.infer<typeof insertVipMixSchema>;
export type UserDownload = typeof userDownloads.$inferSelect;
export type InsertUserDownload = z.infer<typeof insertUserDownloadSchema>;
export type DailyDownloadLimit = typeof dailyDownloadLimits.$inferSelect;
export type InsertDailyDownloadLimit = z.infer<typeof insertDailyDownloadLimitSchema>;
