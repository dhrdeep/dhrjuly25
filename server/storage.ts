import { db } from "./db";
import { 
  users, 
  patreonTokens,
  vipMixes,
  userDownloads,
  dailyDownloadLimits,
  type User, 
  type InsertUser,
  type PatreonToken,
  type InsertPatreonToken,
  type VipMix,
  type InsertVipMix,
  type UserDownload,
  type InsertUserDownload,
  type DailyDownloadLimit,
  type InsertDailyDownloadLimit
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

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
    return await db.select().from(vipMixes).where(eq(vipMixes.isActive, true)).orderBy(vipMixes.createdAt);
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
    const [updated] = await db.insert(dailyDownloadLimits)
      .values({ ...limitData, userId, downloadDate: today })
      .onConflictDoUpdate({
        target: [dailyDownloadLimits.userId, dailyDownloadLimits.downloadDate],
        set: { 
          downloadsUsed: limitData.downloadsUsed,
          updatedAt: new Date() 
        }
      })
      .returning();
    return updated;
  }
  
  async getRemainingDownloads(userId: string): Promise<number> {
    const limit = await this.getDailyDownloadLimit(userId);
    if (!limit) return 10; // Default VIP limit
    return Math.max(0, limit.maxDownloads - limit.downloadsUsed);
  }
}

export const storage = new DrizzleStorage();
