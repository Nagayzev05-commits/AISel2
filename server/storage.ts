import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import {
  users, products, listings, analytics, aiTasks,
  marketplaceConnections, priceHistory, competitors, promotions,
  type User, type InsertUser,
  type Product, type InsertProduct,
  type Listing, type InsertListing,
  type Analytics, type InsertAnalytics,
  type AiTask, type InsertAiTask,
  type MarketplaceConnection, type InsertConnection,
  type Competitor,
  type Promotion, type InsertPromotion,
  type PriceHistory,
} from "@shared/schema";

const sqlite = new Database("marketai.db");
export const db = drizzle(sqlite);

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    commission_rate REAL NOT NULL DEFAULT 0.05,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS marketplace_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    marketplace TEXT NOT NULL,
    api_key TEXT NOT NULL,
    seller_id TEXT,
    warehouse_id TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    connected_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    brand TEXT,
    description TEXT,
    characteristics TEXT,
    images TEXT,
    processed_images TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    marketplace TEXT NOT NULL,
    external_id TEXT,
    title TEXT,
    description TEXT,
    seo_keywords TEXT,
    price REAL,
    original_price REAL,
    discount_percent INTEGER DEFAULT 0,
    infographics TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    ab_test_variant TEXT,
    ab_test_active INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    add_to_cart INTEGER DEFAULT 0,
    orders INTEGER DEFAULT 0,
    revenue REAL DEFAULT 0,
    conversion REAL DEFAULT 0,
    position INTEGER,
    marketplace TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ai_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER,
    listing_id INTEGER,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    input_data TEXT,
    output_data TEXT,
    error_message TEXT,
    created_at INTEGER NOT NULL,
    completed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    price REAL NOT NULL,
    discount_percent INTEGER DEFAULT 0,
    reason TEXT,
    changed_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS competitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    listing_id INTEGER,
    marketplace TEXT NOT NULL,
    external_id TEXT,
    name TEXT,
    price REAL,
    rating REAL,
    review_count INTEGER,
    position INTEGER,
    image_url TEXT,
    last_checked INTEGER
  );

  CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    discount_percent INTEGER NOT NULL,
    start_date INTEGER NOT NULL,
    end_date INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled'
  );
`);

export interface IStorage {
  // Users
  getUserByEmail(email: string): User | undefined;
  getUserById(id: number): User | undefined;
  createUser(data: InsertUser): User;

  // Connections
  getConnections(userId: number): MarketplaceConnection[];
  getConnection(userId: number, marketplace: string): MarketplaceConnection | undefined;
  upsertConnection(data: InsertConnection): MarketplaceConnection;
  deleteConnection(id: number): void;

  // Products
  getProducts(userId: number): Product[];
  getProduct(id: number, userId: number): Product | undefined;
  createProduct(data: InsertProduct): Product;
  updateProduct(id: number, data: Partial<InsertProduct>): Product;
  deleteProduct(id: number): void;

  // Listings
  getListings(userId: number): Listing[];
  getListing(id: number, userId: number): Listing | undefined;
  getListingsByProduct(productId: number): Listing[];
  createListing(data: InsertListing): Listing;
  updateListing(id: number, data: Partial<InsertListing>): Listing;
  deleteListing(id: number): void;

  // Analytics
  getAnalytics(userId: number, days?: number): Analytics[];
  getListingAnalytics(listingId: number, days?: number): Analytics[];
  upsertAnalytics(data: InsertAnalytics): Analytics;

  // AI Tasks
  createAiTask(data: InsertAiTask): AiTask;
  updateAiTask(id: number, data: Partial<InsertAiTask>): AiTask;
  getAiTasks(userId: number): AiTask[];
  getAiTask(id: number): AiTask | undefined;

  // Price History
  addPriceHistory(listingId: number, price: number, discount: number, reason: string): PriceHistory;
  getPriceHistory(listingId: number): PriceHistory[];

  // Competitors
  getCompetitors(listingId: number): Competitor[];
  upsertCompetitor(data: Omit<Competitor, "id">): Competitor;

  // Promotions
  getPromotions(userId: number): Promotion[];
  createPromotion(data: InsertPromotion): Promotion;
  updatePromotion(id: number, data: Partial<InsertPromotion>): Promotion;
}

class SqliteStorage implements IStorage {
  getUserByEmail(email: string): User | undefined {
    return db.select().from(users).where(eq(users.email, email)).get();
  }
  getUserById(id: number): User | undefined {
    return db.select().from(users).where(eq(users.id, id)).get();
  }
  createUser(data: InsertUser): User {
    return db.insert(users).values({ ...data, createdAt: Date.now() }).returning().get();
  }

  getConnections(userId: number): MarketplaceConnection[] {
    return db.select().from(marketplaceConnections).where(eq(marketplaceConnections.userId, userId)).all();
  }
  getConnection(userId: number, marketplace: string): MarketplaceConnection | undefined {
    return db.select().from(marketplaceConnections)
      .where(and(eq(marketplaceConnections.userId, userId), eq(marketplaceConnections.marketplace, marketplace)))
      .get();
  }
  upsertConnection(data: InsertConnection): MarketplaceConnection {
    const existing = this.getConnection(data.userId, data.marketplace);
    if (existing) {
      db.delete(marketplaceConnections).where(eq(marketplaceConnections.id, existing.id)).run();
    }
    return db.insert(marketplaceConnections).values({ ...data, connectedAt: Date.now() }).returning().get();
  }
  deleteConnection(id: number): void {
    db.delete(marketplaceConnections).where(eq(marketplaceConnections.id, id)).run();
  }

  getProducts(userId: number): Product[] {
    return db.select().from(products).where(eq(products.userId, userId)).orderBy(desc(products.createdAt)).all();
  }
  getProduct(id: number, userId: number): Product | undefined {
    return db.select().from(products).where(and(eq(products.id, id), eq(products.userId, userId))).get();
  }
  createProduct(data: InsertProduct): Product {
    const now = Date.now();
    return db.insert(products).values({ ...data, createdAt: now, updatedAt: now }).returning().get();
  }
  updateProduct(id: number, data: Partial<InsertProduct>): Product {
    return db.update(products).set({ ...data, updatedAt: Date.now() }).where(eq(products.id, id)).returning().get();
  }
  deleteProduct(id: number): void {
    db.delete(products).where(eq(products.id, id)).run();
  }

  getListings(userId: number): Listing[] {
    return db.select().from(listings).where(eq(listings.userId, userId)).orderBy(desc(listings.createdAt)).all();
  }
  getListing(id: number, userId: number): Listing | undefined {
    return db.select().from(listings).where(and(eq(listings.id, id), eq(listings.userId, userId))).get();
  }
  getListingsByProduct(productId: number): Listing[] {
    return db.select().from(listings).where(eq(listings.productId, productId)).all();
  }
  createListing(data: InsertListing): Listing {
    const now = Date.now();
    return db.insert(listings).values({ ...data, createdAt: now, updatedAt: now }).returning().get();
  }
  updateListing(id: number, data: Partial<InsertListing>): Listing {
    return db.update(listings).set({ ...data, updatedAt: Date.now() }).where(eq(listings.id, id)).returning().get();
  }
  deleteListing(id: number): void {
    db.delete(listings).where(eq(listings.id, id)).run();
  }

  getAnalytics(userId: number, days = 30): Analytics[] {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split("T")[0];
    return db.select().from(analytics)
      .where(and(eq(analytics.userId, userId), gte(analytics.date, sinceStr)))
      .orderBy(desc(analytics.date))
      .all();
  }
  getListingAnalytics(listingId: number, days = 30): Analytics[] {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split("T")[0];
    return db.select().from(analytics)
      .where(and(eq(analytics.listingId, listingId), gte(analytics.date, sinceStr)))
      .orderBy(desc(analytics.date))
      .all();
  }
  upsertAnalytics(data: InsertAnalytics): Analytics {
    return db.insert(analytics).values(data).returning().get();
  }

  createAiTask(data: InsertAiTask): AiTask {
    return db.insert(aiTasks).values({ ...data, createdAt: Date.now() }).returning().get();
  }
  updateAiTask(id: number, data: Partial<InsertAiTask>): AiTask {
    return db.update(aiTasks).set(data).where(eq(aiTasks.id, id)).returning().get();
  }
  getAiTasks(userId: number): AiTask[] {
    return db.select().from(aiTasks).where(eq(aiTasks.userId, userId)).orderBy(desc(aiTasks.createdAt)).all();
  }
  getAiTask(id: number): AiTask | undefined {
    return db.select().from(aiTasks).where(eq(aiTasks.id, id)).get();
  }

  addPriceHistory(listingId: number, price: number, discount: number, reason: string): PriceHistory {
    return db.insert(priceHistory).values({
      listingId, price, discountPercent: discount, reason, changedAt: Date.now()
    }).returning().get();
  }
  getPriceHistory(listingId: number): PriceHistory[] {
    return db.select().from(priceHistory).where(eq(priceHistory.listingId, listingId)).orderBy(desc(priceHistory.changedAt)).all();
  }

  getCompetitors(listingId: number): Competitor[] {
    return db.select().from(competitors).where(eq(competitors.listingId, listingId)).all();
  }
  upsertCompetitor(data: Omit<Competitor, "id">): Competitor {
    return db.insert(competitors).values(data).returning().get();
  }

  getPromotions(userId: number): Promotion[] {
    return db.select().from(promotions).where(eq(promotions.userId, userId)).orderBy(desc(promotions.startDate)).all();
  }
  createPromotion(data: InsertPromotion): Promotion {
    return db.insert(promotions).values(data).returning().get();
  }
  updatePromotion(id: number, data: Partial<InsertPromotion>): Promotion {
    return db.update(promotions).set(data).where(eq(promotions.id, id)).returning().get();
  }
}

export const storage = new SqliteStorage();
