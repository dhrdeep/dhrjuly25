import { drizzle } from "drizzle-orm/neon-serverless";
import { users, patreonTokens, type User, type InsertUser, type PatreonToken, type InsertPatreonToken } from "@shared/schema";
import { eq } from "drizzle-orm";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const db = drizzle(process.env.DATABASE_URL);

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
}

export const storage = new DrizzleStorage();
