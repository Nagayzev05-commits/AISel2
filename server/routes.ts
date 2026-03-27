import type { Express, Request, Response, NextFunction } from "express";
import { createServer } from "http";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import type { User } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "marketai-secret-2024";
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  dest: UPLOADS_DIR,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

// Auth middleware
interface AuthRequest extends Request {
  user?: User;
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    const user = storage.getUserById(payload.userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// AI simulation helpers (real integration points)
async function simulateAI(type: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
  await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
  
  if (type === "description") {
    const name = data.name as string;
    const category = data.category as string;
    return {
      title: `${name} — ${category} премиум качества | Быстрая доставка`,
      description: `✅ ${name}\n\n🔥 Почему выбирают нас:\n• Высокое качество материалов\n• Проверено тысячами покупателей\n• Гарантия возврата 30 дней\n• Быстрая доставка по всей России\n\n📦 В комплекте:\n• ${name} — 1 шт.\n• Инструкция по использованию\n\n💯 Характеристики соответствуют описанию. Если у вас есть вопросы — свяжитесь с нами!`,
      features: ["Высокое качество", "Быстрая доставка", "Гарантия возврата"],
    };
  }
  
  if (type === "seo_keywords") {
    const name = (data.name as string).toLowerCase();
    return {
      keywords: [
        name, `купить ${name}`, `${name} цена`, `${name} отзывы`,
        `лучший ${name}`, `${name} недорого`, `${name} официальный`,
        `${name} доставка`, `${name} москва`, `${name} качество`,
      ],
      topKeyword: name,
      searchVolume: Math.floor(Math.random() * 50000) + 5000,
    };
  }
  
  if (type === "price_analysis") {
    const price = data.price as number;
    const competitors = [
      { name: "Конкурент А", price: price * 0.95, position: 1 },
      { name: "Конкурент Б", price: price * 1.05, position: 2 },
      { name: "Конкурент В", price: price * 0.9, position: 3 },
    ];
    return {
      competitors,
      avgPrice: price,
      recommendedPrice: price * 0.97,
      marketPosition: "Средняя позиция",
      suggestion: "Рекомендуем снизить цену на 3% для улучшения конверсии",
    };
  }
  
  if (type === "ab_test") {
    return {
      variantA: { title: data.titleA, conversion: (Math.random() * 3 + 1).toFixed(2) + "%" },
      variantB: { title: data.titleB, conversion: (Math.random() * 3 + 1).toFixed(2) + "%" },
      winner: Math.random() > 0.5 ? "A" : "B",
      confidence: (Math.random() * 20 + 80).toFixed(0) + "%",
    };
  }
  
  if (type === "infographic") {
    return {
      generated: true,
      type: "infographic",
      template: data.template,
    };
  }
  
  return { success: true };
}

// Generate mock analytics data for demo
function generateMockAnalytics(listingId: number, userId: number, marketplace: string) {
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const views = Math.floor(Math.random() * 500) + 50;
    const clicks = Math.floor(views * (0.05 + Math.random() * 0.1));
    const orders = Math.floor(clicks * (0.03 + Math.random() * 0.08));
    const revenue = orders * (Math.random() * 2000 + 500);
    storage.upsertAnalytics({
      listingId, userId, date: dateStr,
      views, clicks, addToCart: Math.floor(clicks * 0.4),
      orders, revenue: Math.round(revenue),
      conversion: Number((orders / views * 100).toFixed(2)),
      position: Math.floor(Math.random() * 20) + 1,
      marketplace,
    });
  }
}

export function registerRoutes(httpServer: ReturnType<typeof createServer>, app: Express) {

  // Health check for Railway
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Serve uploads
  app.use("/uploads", (req, res, next) => {
    const filePath = path.join(UPLOADS_DIR, path.basename(req.path));
    if (fs.existsSync(filePath)) res.sendFile(filePath);
    else next();
  });

  // ─── AUTH ──────────────────────────────────────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name) return res.status(400).json({ error: "Все поля обязательны" });
      const existing = storage.getUserByEmail(email);
      if (existing) return res.status(409).json({ error: "Email уже зарегистрирован" });
      const passwordHash = await bcrypt.hash(password, 10);
      const user = storage.createUser({ email, passwordHash, name, plan: "free", commissionRate: 0.05 });
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan } });
    } catch (e) {
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = storage.getUserByEmail(email);
      if (!user) return res.status(401).json({ error: "Неверный email или пароль" });
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return res.status(401).json({ error: "Неверный email или пароль" });
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan } });
    } catch {
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/auth/me", authMiddleware, (req: AuthRequest, res) => {
    const u = req.user!;
    res.json({ id: u.id, email: u.email, name: u.name, plan: u.plan, commissionRate: u.commissionRate });
  });

  // ─── CONNECTIONS ────────────────────────────────────────────────────────────
  app.get("/api/connections", authMiddleware, (req: AuthRequest, res) => {
    const conns = storage.getConnections(req.user!.id);
    res.json(conns.map(c => ({ ...c, apiKey: "••••" + c.apiKey.slice(-4) })));
  });

  app.post("/api/connections", authMiddleware, (req: AuthRequest, res) => {
    try {
      const { marketplace, apiKey, sellerId, warehouseId } = req.body;
      if (!marketplace || !apiKey) return res.status(400).json({ error: "Маркетплейс и API ключ обязательны" });
      const conn = storage.upsertConnection({
        userId: req.user!.id, marketplace, apiKey, sellerId, warehouseId, isActive: 1
      });
      res.json({ ...conn, apiKey: "••••" + conn.apiKey.slice(-4) });
    } catch {
      res.status(500).json({ error: "Ошибка подключения" });
    }
  });

  app.delete("/api/connections/:id", authMiddleware, (req: AuthRequest, res) => {
    storage.deleteConnection(Number(req.params.id));
    res.json({ success: true });
  });

  // ─── PRODUCTS ────────────────────────────────────────────────────────────────
  app.get("/api/products", authMiddleware, (req: AuthRequest, res) => {
    res.json(storage.getProducts(req.user!.id));
  });

  app.get("/api/products/:id", authMiddleware, (req: AuthRequest, res) => {
    const product = storage.getProduct(Number(req.params.id), req.user!.id);
    if (!product) return res.status(404).json({ error: "Товар не найден" });
    res.json(product);
  });

  app.post("/api/products", authMiddleware, upload.array("images", 10), (req: AuthRequest, res) => {
    try {
      const files = (req.files as Express.Multer.File[]) || [];
      const images = files.map(f => `/uploads/${f.filename}`);
      const { name, category, brand, description, characteristics } = req.body;
      if (!name) return res.status(400).json({ error: "Название товара обязательно" });
      const product = storage.createProduct({
        userId: req.user!.id,
        name, category, brand, description,
        characteristics: characteristics || null,
        images: JSON.stringify(images),
        processedImages: null,
        status: "draft",
      });
      res.json(product);
    } catch {
      res.status(500).json({ error: "Ошибка создания товара" });
    }
  });

  app.patch("/api/products/:id", authMiddleware, (req: AuthRequest, res) => {
    try {
      const product = storage.updateProduct(Number(req.params.id), req.body);
      res.json(product);
    } catch {
      res.status(500).json({ error: "Ошибка обновления" });
    }
  });

  app.delete("/api/products/:id", authMiddleware, (req: AuthRequest, res) => {
    storage.deleteProduct(Number(req.params.id));
    res.json({ success: true });
  });

  // ─── LISTINGS ────────────────────────────────────────────────────────────────
  app.get("/api/listings", authMiddleware, (req: AuthRequest, res) => {
    res.json(storage.getListings(req.user!.id));
  });

  app.get("/api/listings/:id", authMiddleware, (req: AuthRequest, res) => {
    const listing = storage.getListing(Number(req.params.id), req.user!.id);
    if (!listing) return res.status(404).json({ error: "Карточка не найдена" });
    res.json(listing);
  });

  app.post("/api/listings", authMiddleware, (req: AuthRequest, res) => {
    try {
      const listing = storage.createListing({ ...req.body, userId: req.user!.id });
      // Generate mock analytics for demo
      generateMockAnalytics(listing.id, req.user!.id, listing.marketplace);
      res.json(listing);
    } catch {
      res.status(500).json({ error: "Ошибка создания карточки" });
    }
  });

  app.patch("/api/listings/:id", authMiddleware, (req: AuthRequest, res) => {
    try {
      const listing = storage.updateListing(Number(req.params.id), req.body);
      res.json(listing);
    } catch {
      res.status(500).json({ error: "Ошибка обновления карточки" });
    }
  });

  app.delete("/api/listings/:id", authMiddleware, (req: AuthRequest, res) => {
    storage.deleteListing(Number(req.params.id));
    res.json({ success: true });
  });

  // Price update
  app.post("/api/listings/:id/price", authMiddleware, (req: AuthRequest, res) => {
    const { price, discountPercent = 0, reason = "manual" } = req.body;
    storage.updateListing(Number(req.params.id), { price, discountPercent });
    storage.addPriceHistory(Number(req.params.id), price, discountPercent, reason);
    res.json({ success: true });
  });

  app.get("/api/listings/:id/price-history", authMiddleware, (req: AuthRequest, res) => {
    res.json(storage.getPriceHistory(Number(req.params.id)));
  });

  app.get("/api/listings/:id/competitors", authMiddleware, (req: AuthRequest, res) => {
    const listing = storage.getListing(Number(req.params.id), req.user!.id);
    if (!listing) return res.status(404).json({ error: "Не найдено" });
    
    // Generate mock competitors
    const mockComps = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      userId: req.user!.id,
      listingId: listing.id,
      marketplace: listing.marketplace,
      externalId: `ext_${i}`,
      name: `Конкурент ${["Альфа", "Бета", "Гамма", "Дельта", "Эпсилон"][i]}`,
      price: (listing.price || 999) * (0.85 + Math.random() * 0.3),
      rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
      reviewCount: Math.floor(Math.random() * 500) + 10,
      position: i + 1,
      imageUrl: null,
      lastChecked: Date.now(),
    }));
    res.json(mockComps);
  });

  // ─── ANALYTICS ───────────────────────────────────────────────────────────────
  app.get("/api/analytics", authMiddleware, (req: AuthRequest, res) => {
    const days = Number(req.query.days || req.query["days"] || 30);
    const data = storage.getAnalytics(req.user!.id, days);
    
    // Aggregate totals
    const totals = data.reduce((acc, row) => {
      acc.views += row.views || 0;
      acc.clicks += row.clicks || 0;
      acc.orders += row.orders || 0;
      acc.revenue += row.revenue || 0;
      return acc;
    }, { views: 0, clicks: 0, orders: 0, revenue: 0 });
    
    // Group by date
    const byDate: Record<string, typeof totals> = {};
    data.forEach(row => {
      if (!byDate[row.date]) byDate[row.date] = { views: 0, clicks: 0, orders: 0, revenue: 0 };
      byDate[row.date].views += row.views || 0;
      byDate[row.date].clicks += row.clicks || 0;
      byDate[row.date].orders += row.orders || 0;
      byDate[row.date].revenue += row.revenue || 0;
    });
    
    const chartData = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, d]) => ({
      date, ...d
    }));
    
    res.json({ totals, chartData, rows: data });
  });

  app.get("/api/analytics/listing/:id", authMiddleware, (req: AuthRequest, res) => {
    const days = Number(req.query.days) || 30;
    res.json(storage.getListingAnalytics(Number(req.params.id), days));
  });

  // ─── AI TASKS ─────────────────────────────────────────────────────────────────
  app.get("/api/ai-tasks", authMiddleware, (req: AuthRequest, res) => {
    res.json(storage.getAiTasks(req.user!.id));
  });

  app.get("/api/ai-tasks/:id", authMiddleware, (req: AuthRequest, res) => {
    const task = storage.getAiTask(Number(req.params.id));
    if (!task) return res.status(404).json({ error: "Задача не найдена" });
    res.json(task);
  });

  // Generate description + SEO
  app.post("/api/ai/generate-content", authMiddleware, async (req: AuthRequest, res) => {
    const { productId, marketplace } = req.body;
    const product = storage.getProduct(productId, req.user!.id);
    if (!product) return res.status(404).json({ error: "Товар не найден" });

    const task = storage.createAiTask({
      userId: req.user!.id,
      productId,
      type: "description",
      status: "running",
      inputData: JSON.stringify({ name: product.name, category: product.category, marketplace }),
    });

    // Run async
    (async () => {
      try {
        const [desc, keywords] = await Promise.all([
          simulateAI("description", { name: product.name, category: product.category }),
          simulateAI("seo_keywords", { name: product.name }),
        ]);
        storage.updateAiTask(task.id, {
          status: "done",
          outputData: JSON.stringify({ ...desc, ...keywords }),
          completedAt: Date.now(),
        });
      } catch (e) {
        storage.updateAiTask(task.id, { status: "error", errorMessage: String(e), completedAt: Date.now() });
      }
    })();

    res.json({ taskId: task.id });
  });

  // Analyze price
  app.post("/api/ai/analyze-price", authMiddleware, async (req: AuthRequest, res) => {
    const { listingId } = req.body;
    const listing = storage.getListing(listingId, req.user!.id);
    if (!listing) return res.status(404).json({ error: "Карточка не найдена" });

    const task = storage.createAiTask({
      userId: req.user!.id,
      listingId,
      type: "price_analysis",
      status: "running",
      inputData: JSON.stringify({ price: listing.price }),
    });

    (async () => {
      try {
        const result = await simulateAI("price_analysis", { price: listing.price });
        storage.updateAiTask(task.id, {
          status: "done",
          outputData: JSON.stringify(result),
          completedAt: Date.now(),
        });
      } catch (e) {
        storage.updateAiTask(task.id, { status: "error", errorMessage: String(e), completedAt: Date.now() });
      }
    })();

    res.json({ taskId: task.id });
  });

  // A/B test
  app.post("/api/ai/ab-test", authMiddleware, async (req: AuthRequest, res) => {
    const { listingId, titleA, titleB } = req.body;

    const task = storage.createAiTask({
      userId: req.user!.id,
      listingId,
      type: "ab_test",
      status: "running",
      inputData: JSON.stringify({ titleA, titleB }),
    });

    (async () => {
      try {
        const result = await simulateAI("ab_test", { titleA, titleB });
        storage.updateAiTask(task.id, {
          status: "done",
          outputData: JSON.stringify(result),
          completedAt: Date.now(),
        });
      } catch (e) {
        storage.updateAiTask(task.id, { status: "error", errorMessage: String(e), completedAt: Date.now() });
      }
    })();

    res.json({ taskId: task.id });
  });

  // Generate infographic
  app.post("/api/ai/infographic", authMiddleware, async (req: AuthRequest, res) => {
    const { productId, template = "minimal" } = req.body;

    const task = storage.createAiTask({
      userId: req.user!.id,
      productId,
      type: "infographic",
      status: "running",
      inputData: JSON.stringify({ productId, template }),
    });

    (async () => {
      try {
        const result = await simulateAI("infographic", { template });
        storage.updateAiTask(task.id, {
          status: "done",
          outputData: JSON.stringify(result),
          completedAt: Date.now(),
        });
      } catch (e) {
        storage.updateAiTask(task.id, { status: "error", errorMessage: String(e), completedAt: Date.now() });
      }
    })();

    res.json({ taskId: task.id });
  });

  // ─── PROMOTIONS ──────────────────────────────────────────────────────────────
  app.get("/api/promotions", authMiddleware, (req: AuthRequest, res) => {
    res.json(storage.getPromotions(req.user!.id));
  });

  app.post("/api/promotions", authMiddleware, (req: AuthRequest, res) => {
    const promo = storage.createPromotion({ ...req.body, userId: req.user!.id });
    res.json(promo);
  });

  app.patch("/api/promotions/:id", authMiddleware, (req: AuthRequest, res) => {
    const promo = storage.updatePromotion(Number(req.params.id), req.body);
    res.json(promo);
  });

  // ─── DASHBOARD SUMMARY ───────────────────────────────────────────────────────
  app.get("/api/dashboard", authMiddleware, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const products = storage.getProducts(userId);
    const listings = storage.getListings(userId);
    const analytics = storage.getAnalytics(userId, 30);
    const tasks = storage.getAiTasks(userId).slice(0, 5);
    const connections = storage.getConnections(userId);

    const totals = analytics.reduce((acc, row) => {
      acc.revenue += row.revenue || 0;
      acc.orders += row.orders || 0;
      acc.views += row.views || 0;
      return acc;
    }, { revenue: 0, orders: 0, views: 0 });

    // Chart last 7 days
    const last7 = analytics
      .slice(0, 7)
      .map(r => ({ date: r.date, revenue: r.revenue || 0, orders: r.orders || 0 }))
      .reverse();

    res.json({
      stats: {
        products: products.length,
        listings: listings.length,
        activeListings: listings.filter(l => l.status === "active").length,
        revenue: Math.round(totals.revenue),
        orders: totals.orders,
        views: totals.views,
        connections: connections.length,
      },
      recentTasks: tasks,
      chart: last7,
    });
  });

  return httpServer;
}
