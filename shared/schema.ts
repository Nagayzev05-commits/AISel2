import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── USERS ───────────────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  plan: text("plan").notNull().default("free"), // free | pro | enterprise
  commissionRate: real("commission_rate").notNull().default(0.05), // 5% default
  createdAt: integer("created_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ─── MARKETPLACE CONNECTIONS ─────────────────────────────────────────────────
export const marketplaceConnections = sqliteTable("marketplace_connections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  marketplace: text("marketplace").notNull(), // wb | ozon
  apiKey: text("api_key").notNull(),
  sellerId: text("seller_id"),
  warehouseId: text("warehouse_id"),
  isActive: integer("is_active").notNull().default(1),
  connectedAt: integer("connected_at").notNull(),
});

export const insertConnectionSchema = createInsertSchema(marketplaceConnections).omit({ id: true, connectedAt: true });
export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type MarketplaceConnection = typeof marketplaceConnections.$inferSelect;

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  category: text("category"),
  brand: text("brand"),
  description: text("description"),
  characteristics: text("characteristics"), // JSON
  images: text("images"), // JSON array of image paths
  processedImages: text("processed_images"), // JSON array (bg removed)
  status: text("status").notNull().default("draft"), // draft | processing | active | paused
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// ─── LISTINGS (карточки на маркетплейсах) ────────────────────────────────────
export const listings = sqliteTable("listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull(),
  userId: integer("user_id").notNull(),
  marketplace: text("marketplace").notNull(), // wb | ozon
  externalId: text("external_id"),
  title: text("title"),
  description: text("description"),
  seoKeywords: text("seo_keywords"), // JSON array
  price: real("price"),
  originalPrice: real("original_price"),
  discountPercent: integer("discount_percent").default(0),
  infographics: text("infographics"), // JSON array of generated infographic paths
  status: text("status").notNull().default("draft"), // draft | published | paused | archived
  abTestVariant: text("ab_test_variant"), // A | B
  abTestActive: integer("ab_test_active").default(0),
  rating: real("rating").default(0),
  reviewCount: integer("review_count").default(0),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const insertListingSchema = createInsertSchema(listings).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
export const analytics = sqliteTable("analytics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listingId: integer("listing_id").notNull(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  views: integer("views").default(0),
  clicks: integer("clicks").default(0),
  addToCart: integer("add_to_cart").default(0),
  orders: integer("orders").default(0),
  revenue: real("revenue").default(0),
  conversion: real("conversion").default(0),
  position: integer("position"), // search position
  marketplace: text("marketplace").notNull(),
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({ id: true });
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analytics.$inferSelect;

// ─── AI TASKS ─────────────────────────────────────────────────────────────────
export const aiTasks = sqliteTable("ai_tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  productId: integer("product_id"),
  listingId: integer("listing_id"),
  type: text("type").notNull(), // bg_remove | infographic | description | seo_keywords | price_analysis | competitor_analysis | ab_test
  status: text("status").notNull().default("pending"), // pending | running | done | error
  inputData: text("input_data"), // JSON
  outputData: text("output_data"), // JSON
  errorMessage: text("error_message"),
  createdAt: integer("created_at").notNull(),
  completedAt: integer("completed_at"),
});

export const insertAiTaskSchema = createInsertSchema(aiTasks).omit({ id: true, createdAt: true, completedAt: true });
export type InsertAiTask = z.infer<typeof insertAiTaskSchema>;
export type AiTask = typeof aiTasks.$inferSelect;

// ─── PRICE HISTORY ───────────────────────────────────────────────────────────
export const priceHistory = sqliteTable("price_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listingId: integer("listing_id").notNull(),
  price: real("price").notNull(),
  discountPercent: integer("discount_percent").default(0),
  reason: text("reason"), // manual | ai_recommendation | promo
  changedAt: integer("changed_at").notNull(),
});

export type PriceHistory = typeof priceHistory.$inferSelect;

// ─── COMPETITORS ─────────────────────────────────────────────────────────────
export const competitors = sqliteTable("competitors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  listingId: integer("listing_id"),
  marketplace: text("marketplace").notNull(),
  externalId: text("external_id"),
  name: text("name"),
  price: real("price"),
  rating: real("rating"),
  reviewCount: integer("review_count"),
  position: integer("position"),
  imageUrl: text("image_url"),
  lastChecked: integer("last_checked"),
});

export type Competitor = typeof competitors.$inferSelect;

// ─── PROMOTIONS ──────────────────────────────────────────────────────────────
export const promotions = sqliteTable("promotions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listingId: integer("listing_id").notNull(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // discount | flash_sale | bundle
  discountPercent: integer("discount_percent").notNull(),
  startDate: integer("start_date").notNull(),
  endDate: integer("end_date").notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled | active | ended
});

export const insertPromotionSchema = createInsertSchema(promotions).omit({ id: true });
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;
export type Promotion = typeof promotions.$inferSelect;
