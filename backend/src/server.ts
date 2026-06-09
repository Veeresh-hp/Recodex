import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import projectRoutes from "./routes/projects";
import userRoutes from "./routes/users";
import contactRoutes from "./routes/contacts";

// Initialize environment variables from .env
dotenv.config();

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

    if (origin === frontendUrl || isLocal || !process.env.VERCEL) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Expose built-in JSON body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Standard Request Logging Middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[HTTP] ${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Register API Routes
app.use("/api/projects", projectRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contacts", contactRoutes);

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
  app.listen(PORT, () => {
    console.log("====================================================");
    console.log(`⚡️ RECODEX BACKEND API CORE BOOTED SUCCESSFULLY ⚡️`);
    console.log(`📡 Server active on: http://localhost:${PORT}`);
    console.log(`🌐 Frontend Allowed Origin: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
    console.log("====================================================");
  });
}

export default app;
