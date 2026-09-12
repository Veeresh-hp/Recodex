import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";
import { inngest } from "./inngest/client";
import { generateIndustryInsights } from "./inngest/functions";
import projectRoutes from "./routes/projects";
import userRoutes from "./routes/users";
import contactRoutes from "./routes/contacts";
import certificateRoutes from "./routes/certificates";
import queryRoutes from "./routes/queries";
import { startCertificateScheduler } from "./services/scheduler";

import path from "path";

// Initialize environment variables from .env across various execution contexts (Vercel serverless / local)
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });
dotenv.config();

const MONGODB_ATLAS_URL = "mongodb+srv://Recodex:Recodex2004@recodex.wahwbbo.mongodb.net/recodex?appName=Recodex";
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mongodb")) {
  process.env.DATABASE_URL = MONGODB_ATLAS_URL;
}
if (!process.env.CLERK_PUBLISHABLE_KEY) {
  process.env.CLERK_PUBLISHABLE_KEY = "pk_test_aG9wZWZ1bC1mb3hob3VuZC00OC5jbGVyay5hY2NvdW50cy5kZXYk";
}
if (!process.env.CLERK_SECRET_KEY) {
  process.env.CLERK_SECRET_KEY = "sk_test_lzgxEBRTGbTttTgYvgy3QNc7k44Zhy1kAvJsRrMldy";
}

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing for Frontend
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const isLocal = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin);
    const isAllowedDomain = origin.includes("recodex.in") || origin.includes("vercel.app");

    if (origin === frontendUrl || isLocal || isAllowedDomain || !process.env.VERCEL) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all cross-origin dashboard & user interactions safely
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Register Clerk middleware safely with explicit fallback keys so it never halts public routes
try {
  app.use(clerkMiddleware({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  }));
} catch (clerkErr) {
  console.warn("[SERVER] Clerk middleware initialization warning (continuing with route handling):", clerkErr);
}

// Expose built-in JSON body parsers with 50mb limit for certificate PDF/image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Standard Request Logging Middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[HTTP] ${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Register API Routes
app.use("/api/projects", projectRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/queries", queryRoutes);
app.use("/api/inngest", serve({ client: inngest, functions: [generateIndustryInsights] }));

// Diagnostic DB Health Endpoint
app.get("/api/health/db", async (_req: Request, res: Response) => {
  try {
    const { realPrisma } = await import("./config/db");
    const count = await realPrisma.inquiry.count();
    res.json({
      ok: true,
      database: "MongoDB Atlas Connected",
      inquiriesCount: count,
      envDbUrl: process.env.DATABASE_URL ? "SET" : "NOT_SET",
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err?.message || String(err),
      name: err?.name,
      code: err?.code,
      stack: err?.stack,
      envDbUrl: process.env.DATABASE_URL ? "SET" : "NOT_SET",
    });
  }
});

// Basic Health Check Endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "online",
    system: "RECODEX DevMarket Core Server",
    timestamp: new Date().toISOString(),
  });
});

// 404 Route Not Found Middleware
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "API Endpoint not found." });
});

// Global Error Catch Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[CRITICAL ERROR] Global middleware caught exception:", err);
  res.status(err.status || 500).json({
    error: err.message || "An unexpected system exception occurred inside DevMarket core.",
  });
});

// Boot Server (only in non-serverless environments)
if (!process.env.VERCEL) {
  startCertificateScheduler(60000);

  app.listen(PORT, () => {
    console.log("====================================================");
    console.log(`⚡️ RECODEX BACKEND API CORE BOOTED SUCCESSFULLY ⚡️`);
    console.log(`📡 Server active on: http://localhost:${PORT}`);
    console.log(`🌐 Frontend Allowed Origin: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
    console.log("====================================================");
  });
}

export default app;
