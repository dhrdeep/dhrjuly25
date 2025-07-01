import { db } from "./db";
import { 
  users, 
  patreonTokens,
  vipMixes,
  userDownloads,
  dailyDownloadLimits,
  identifiedTracks,
  googleAdsConfig,
  googleAdsStats,
  articleComments,
  type User, 
  type InsertUser,
  type PatreonToken,
  type InsertPatreonToken,
  type VipMix,
  type InsertVipMix,
  type UserDownload,
  type InsertUserDownload,
  type DailyDownloadLimit,
  type InsertDailyDownloadLimit,
  type IdentifiedTrack,
  type InsertIdentifiedTrack,
  type GoogleAdsConfig,
  type InsertGoogleAdsConfig,
  type GoogleAdsStats,
  type InsertGoogleAdsStats,
  type ArticleComment,
  type InsertArticleComment
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Patreon token methods
  savePatreonTokens(tokens: InsertPatreonToken): Promise<PatreonToken>;
  getPatreonTokens(userId?: string): Promise<PatreonToken | undefined>;
  updatePatreonTokens(id: number, updates: Partial<PatreonToken>): Promise<PatreonToken>;
  deletePatreonTokens(id: number): Promise<void>;
  
  // VIP mix methods
  getAllVipMixes(): Promise<VipMix[]>;
  getVipMix(id: number): Promise<VipMix | undefined>;
  createVipMix(mix: InsertVipMix): Promise<VipMix>;
  updateVipMix(id: number, updates: Partial<VipMix>): Promise<VipMix>;
  deleteVipMix(id: number): Promise<void>;
  
  // Download tracking methods
  recordDownload(download: InsertUserDownload): Promise<UserDownload>;
  getUserDownloads(userId: string): Promise<UserDownload[]>;
  getDailyDownloadLimit(userId: string): Promise<DailyDownloadLimit | undefined>;
  updateDailyDownloadLimit(userId: string, limit: InsertDailyDownloadLimit): Promise<DailyDownloadLimit>;
  getRemainingDownloads(userId: string): Promise<number>;
  
  // Admin methods
  getAllUsers(): Promise<User[]>;
  
  // Track identification methods
  saveIdentifiedTrack(track: InsertIdentifiedTrack): Promise<IdentifiedTrack>;
  getAllIdentifiedTracks(): Promise<IdentifiedTrack[]>;
  getRecentIdentifiedTracks(limit?: number): Promise<IdentifiedTrack[]>;
  getRecentTracksByChannel(channel: 'dhr1' | 'dhr2', limit?: number): Promise<IdentifiedTrack[]>;
  clearTrackHistory(): Promise<void>;
  
  // Google Ads methods
  getAllGoogleAdsConfigs(): Promise<GoogleAdsConfig[]>;
  getGoogleAdsConfig(id: number): Promise<GoogleAdsConfig | undefined>;
  createGoogleAdsConfig(config: InsertGoogleAdsConfig): Promise<GoogleAdsConfig>;
  updateGoogleAdsConfig(id: number, updates: Partial<GoogleAdsConfig>): Promise<GoogleAdsConfig>;
  deleteGoogleAdsConfig(id: number): Promise<void>;
  
  // Google Ads stats methods
  saveGoogleAdsStats(stats: InsertGoogleAdsStats): Promise<GoogleAdsStats>;
  getGoogleAdsStatsByDate(dateFrom: string, dateTo: string): Promise<GoogleAdsStats[]>;
  getGoogleAdsStatsBySlot(adSlotId: string): Promise<GoogleAdsStats[]>;
  getTotalGoogleAdsRevenue(): Promise<string>;

  // Article comment methods
  saveArticleComment(comment: InsertArticleComment): Promise<ArticleComment>;
  getCommentsByArticle(articleId: string): Promise<ArticleComment[]>;
  getRecentComments(limit?: number): Promise<ArticleComment[]>;
  deleteComment(id: number): Promise<void>;
}

export class DrizzleStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values([user]).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Patreon token methods
  async savePatreonTokens(tokens: InsertPatreonToken): Promise<PatreonToken> {
    const result = await db.insert(patreonTokens).values([tokens]).returning();
    return result[0];
  }

  async getPatreonTokens(userId?: string): Promise<PatreonToken | undefined> {
    if (userId) {
      const result = await db.select().from(patreonTokens).where(eq(patreonTokens.userId, userId)).limit(1);
      return result[0];
    }
    
    const result = await db.select().from(patreonTokens).limit(1);
    return result[0];
  }

  async updatePatreonTokens(id: number, updates: Partial<PatreonToken>): Promise<PatreonToken> {
    const result = await db.update(patreonTokens).set(updates).where(eq(patreonTokens.id, id)).returning();
    return result[0];
  }

  async deletePatreonTokens(id: number): Promise<void> {
    await db.delete(patreonTokens).where(eq(patreonTokens.id, id));
  }
  
  // VIP mix methods
  async getAllVipMixes(): Promise<VipMix[]> {
    return await db.select().from(vipMixes).orderBy(vipMixes.createdAt);
  }
  
  async getVipMix(id: number): Promise<VipMix | undefined> {
    const [mix] = await db.select().from(vipMixes).where(eq(vipMixes.id, id));
    return mix;
  }
  
  async createVipMix(mix: InsertVipMix): Promise<VipMix> {
    const [created] = await db.insert(vipMixes).values(mix).returning();
    return created;
  }
  
  async updateVipMix(id: number, updates: Partial<VipMix>): Promise<VipMix> {
    const [updated] = await db.update(vipMixes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vipMixes.id, id))
      .returning();
    return updated;
  }
  
  async deleteVipMix(id: number): Promise<void> {
    await db.delete(vipMixes).where(eq(vipMixes.id, id));
  }
  
  // Download tracking methods
  async recordDownload(download: InsertUserDownload): Promise<UserDownload> {
    const [created] = await db.insert(userDownloads).values(download).returning();
    return created;
  }
  
  async getUserDownloads(userId: string): Promise<UserDownload[]> {
    return await db.select().from(userDownloads).where(eq(userDownloads.userId, userId));
  }
  
  async getDailyDownloadLimit(userId: string): Promise<DailyDownloadLimit | undefined> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const [limit] = await db.select().from(dailyDownloadLimits)
      .where(and(eq(dailyDownloadLimits.userId, userId), eq(dailyDownloadLimits.downloadDate, today)));
    return limit;
  }
  
  async updateDailyDownloadLimit(userId: string, limitData: InsertDailyDownloadLimit): Promise<DailyDownloadLimit> {
    const today = new Date().toISOString().split('T')[0];
    
    // First try to find existing record
    const [existing] = await db.select().from(dailyDownloadLimits)
      .where(and(eq(dailyDownloadLimits.userId, userId), eq(dailyDownloadLimits.downloadDate, today)));
    
    if (existing) {
      // Update existing record
      const [updated] = await db.update(dailyDownloadLimits)
        .set({ 
          downloadsUsed: limitData.downloadsUsed,
          updatedAt: new Date() 
        })
        .where(eq(dailyDownloadLimits.id, existing.id))
        .returning();
      return updated;
    } else {
      // Insert new record
      const [created] = await db.insert(dailyDownloadLimits)
        .values({ ...limitData, userId, downloadDate: today })
        .returning();
      return created;
    }
  }
  
  async getRemainingDownloads(userId: string): Promise<number> {
    const limit = await this.getDailyDownloadLimit(userId);
    if (!limit) {
      // For demo_user, initialize with 2 downloads if no record exists
      if (userId === 'demo_user') {
        const today = new Date().toISOString().split('T')[0];
        await this.updateDailyDownloadLimit(userId, {
          userId,
          downloadDate: today,
          downloadsUsed: 0,
          maxDownloads: 2
        });
        return 2;
      }
      return 2; // Default VIP limit
    }
    return Math.max(0, (limit.maxDownloads || 0) - (limit.downloadsUsed || 0));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Track identification methods
  async saveIdentifiedTrack(track: InsertIdentifiedTrack): Promise<IdentifiedTrack> {
    const result = await db.insert(identifiedTracks).values([track]).returning();
    return result[0];
  }

  async getAllIdentifiedTracks(): Promise<IdentifiedTrack[]> {
    return await db.select().from(identifiedTracks)
      .orderBy(identifiedTracks.identifiedAt.desc());
  }

  async getRecentIdentifiedTracks(limit: number = 50): Promise<IdentifiedTrack[]> {
    return await db.select().from(identifiedTracks)
      .orderBy(identifiedTracks.identifiedAt.desc())
      .limit(limit);
  }

  async getRecentTracksByChannel(channel: 'dhr1' | 'dhr2', limit: number = 10): Promise<IdentifiedTrack[]> {
    return await db.select().from(identifiedTracks)
      .where(eq(identifiedTracks.channel, channel))
      .orderBy(identifiedTracks.identifiedAt.desc())
      .limit(limit);
  }

  async clearTrackHistory(): Promise<void> {
    await db.delete(identifiedTracks);
  }

  // Google Ads methods
  async getAllGoogleAdsConfigs(): Promise<GoogleAdsConfig[]> {
    return await db.select().from(googleAdsConfig).orderBy(googleAdsConfig.createdAt.desc());
  }

  async getGoogleAdsConfig(id: number): Promise<GoogleAdsConfig | undefined> {
    const [config] = await db.select().from(googleAdsConfig).where(eq(googleAdsConfig.id, id));
    return config;
  }

  async createGoogleAdsConfig(configData: InsertGoogleAdsConfig): Promise<GoogleAdsConfig> {
    const [config] = await db.insert(googleAdsConfig).values(configData).returning();
    return config;
  }

  async updateGoogleAdsConfig(id: number, updates: Partial<GoogleAdsConfig>): Promise<GoogleAdsConfig> {
    const [config] = await db.update(googleAdsConfig)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(googleAdsConfig.id, id))
      .returning();
    return config;
  }

  async deleteGoogleAdsConfig(id: number): Promise<void> {
    await db.delete(googleAdsConfig).where(eq(googleAdsConfig.id, id));
  }

  // Google Ads stats methods
  async saveGoogleAdsStats(statsData: InsertGoogleAdsStats): Promise<GoogleAdsStats> {
    const [stats] = await db.insert(googleAdsStats).values(statsData).returning();
    return stats;
  }

  async getGoogleAdsStatsByDate(dateFrom: string, dateTo: string): Promise<GoogleAdsStats[]> {
    return await db.select().from(googleAdsStats)
      .where(and(
        eq(googleAdsStats.dateRecorded, dateFrom), // Simple implementation for single date
        // In real implementation, use proper date range query
      ))
      .orderBy(googleAdsStats.dateRecorded.desc());
  }

  async getGoogleAdsStatsBySlot(adSlotId: string): Promise<GoogleAdsStats[]> {
    return await db.select().from(googleAdsStats)
      .where(eq(googleAdsStats.adSlotId, adSlotId))
      .orderBy(googleAdsStats.dateRecorded.desc());
  }

  async getTotalGoogleAdsRevenue(): Promise<string> {
    const stats = await db.select().from(googleAdsStats);
    const total = stats.reduce((sum, stat) => sum + parseFloat(stat.revenue || '0'), 0);
    return total.toFixed(2);
  }

  // Article comment methods
  async saveArticleComment(commentData: InsertArticleComment): Promise<ArticleComment> {
    const [comment] = await db
      .insert(articleComments)
      .values(commentData)
      .returning();
    return comment;
  }

  async getCommentsByArticle(articleId: string): Promise<ArticleComment[]> {
    return await db.select().from(articleComments)
      .where(and(
        eq(articleComments.articleId, articleId),
        eq(articleComments.isVisible, true)
      ))
      .orderBy(desc(articleComments.createdAt));
  }

  async getRecentComments(limit: number = 10): Promise<ArticleComment[]> {
    return await db.select().from(articleComments)
      .where(eq(articleComments.isVisible, true))
      .orderBy(desc(articleComments.createdAt))
      .limit(limit);
  }

  async deleteComment(id: number): Promise<void> {
    await db.update(articleComments)
      .set({ isVisible: false })
      .where(eq(articleComments.id, id));
  }
}

export const storage = new DrizzleStorage();
