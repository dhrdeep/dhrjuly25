import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(), // Replit user ID or local ID
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: text("username"),
  firebaseUid: varchar("firebase_uid").unique(),
  subscriptionTier: text("subscription_tier").notNull().default('free'), // 'free', 'dhr1', 'dhr2', 'vip'
  subscriptionStatus: text("subscription_status").notNull().default('active'), // 'active', 'inactive', 'cancelled'
  subscriptionSource: text("subscription_source").default('replit'), // 'replit', 'patreon', 'bmac', 'admin'
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionExpiry: timestamp("subscription_expiry"),
  patreonTier: text("patreon_tier"),
  pledgeAmount: integer("pledge_amount").default(0), // Amount in cents
  joinDate: timestamp("join_date"),
  cancelDate: timestamp("cancel_date"),
  notes: text("notes"),
  privateUrls: jsonb("private_urls").default({}), // Store private URLs for this user
  accessHistory: jsonb("access_history").default([]), // Track access patterns
  lifetimeSupport: integer("lifetime_support").default(0), // Total lifetime contribution in cents
  lastChargeDate: timestamp("last_charge_date"),
  nextChargeDate: timestamp("next_charge_date"),
  totalDownloads: integer("total_downloads").default(0),
  preferences: jsonb("preferences").default({}),
  isAdmin: boolean("is_admin").default(false), // Admin access control
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  fileSize: text("file_size"), 
  filePath: text("file_path"),
  downloadUrl: text("download_url"),
  streamUrl: text("stream_url"),
  artworkUrl: text("artwork_url"),
  description: text("description"),
  rating: integer("rating").default(0),
  totalDownloads: integer("total_downloads").default(0),
  isExclusive: boolean("is_exclusive").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  tags: text("tags"),
  s3Url: text("s3_url")
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

// Track identification history table
export const identifiedTracks = pgTable("identified_tracks", {
  id: serial("id").primaryKey(),
  trackId: text("track_id").notNull(), // unique identifier from ACRCloud
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  album: text("album"),
  channel: text("channel").notNull().default('dhr1'), // 'dhr1' or 'dhr2'
  confidence: integer("confidence").notNull(),
  service: text("service").notNull(), // ACRCloud, Shazam, etc.
  duration: integer("duration"), // in seconds
  releaseDate: text("release_date"),
  artwork: text("artwork"), // URL to track artwork
  youtubeUrl: text("youtube_url"),
  soundcloudUrl: text("soundcloud_url"),
  spotifyUrl: text("spotify_url"),
  identifiedAt: timestamp("identified_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Google Ads configuration table
export const googleAdsConfig = pgTable("google_ads_config", {
  id: serial("id").primaryKey(),
  adSlotId: text("ad_slot_id").notNull(),
  adLocation: text("ad_location").notNull(), // 'header', 'sidebar', 'footer', 'between-content'
  adSize: text("ad_size").notNull(), // '728x90', '300x250', '320x50', etc.
  isActive: boolean("is_active").default(true),
  displayOnPages: text("display_on_pages").default('all'), // 'all', 'home', 'players', 'vip'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Google Ads performance tracking
export const googleAdsStats = pgTable("google_ads_stats", {
  id: serial("id").primaryKey(),
  adSlotId: text("ad_slot_id").notNull(),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  revenue: text("revenue").default('0'), // stored as string to handle decimals
  ctr: text("ctr").default('0'), // click-through rate as percentage
  dateRecorded: text("date_recorded").notNull(), // Format: YYYY-MM-DD
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Article comments for forum news
export const articleComments = pgTable("article_comments", {
  id: serial("id").primaryKey(),
  articleId: text("article_id").notNull(), // RSS item ID or URL hash
  articleTitle: text("article_title").notNull(),
  articleSource: text("article_source").notNull(),
  userId: text("user_id").notNull(),
  userEmail: text("user_email"),
  userName: text("user_name"), 
  userTier: text("user_tier").notNull(), // DHR1, DHR2, VIP
  comment: text("comment").notNull(),
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const insertUserSchema = createInsertSchema(users);
export const insertPatreonTokenSchema = createInsertSchema(patreonTokens);
export const insertVipMixSchema = createInsertSchema(vipMixes);
export const insertUserDownloadSchema = createInsertSchema(userDownloads);
export const insertDailyDownloadLimitSchema = createInsertSchema(dailyDownloadLimits);
export const insertIdentifiedTrackSchema = createInsertSchema(identifiedTracks);
export const insertGoogleAdsConfigSchema = createInsertSchema(googleAdsConfig);
export const insertGoogleAdsStatsSchema = createInsertSchema(googleAdsStats);
export const insertArticleCommentSchema = createInsertSchema(articleComments);

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type PatreonToken = typeof patreonTokens.$inferSelect;
export type InsertPatreonToken = z.infer<typeof insertPatreonTokenSchema>;
export type VipMix = typeof vipMixes.$inferSelect;
export type InsertVipMix = z.infer<typeof insertVipMixSchema>;
export type UserDownload = typeof userDownloads.$inferSelect;
export type InsertUserDownload = z.infer<typeof insertUserDownloadSchema>;
export type DailyDownloadLimit = typeof dailyDownloadLimits.$inferSelect;
export type InsertDailyDownloadLimit = z.infer<typeof insertDailyDownloadLimitSchema>;
export type IdentifiedTrack = typeof identifiedTracks.$inferSelect;
export type InsertIdentifiedTrack = z.infer<typeof insertIdentifiedTrackSchema>;
export type GoogleAdsConfig = typeof googleAdsConfig.$inferSelect;
export type InsertGoogleAdsConfig = z.infer<typeof insertGoogleAdsConfigSchema>;
export type GoogleAdsStats = typeof googleAdsStats.$inferSelect;
export type InsertGoogleAdsStats = z.infer<typeof insertGoogleAdsStatsSchema>;
export type ArticleComment = typeof articleComments.$inferSelect;
export type InsertArticleComment = z.infer<typeof insertArticleCommentSchema>;
