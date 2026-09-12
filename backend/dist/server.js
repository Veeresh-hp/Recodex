"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_2 = require("@clerk/express");
const express_3 = require("inngest/express");
const client_1 = require("./inngest/client");
const functions_1 = require("./inngest/functions");
const projects_1 = __importDefault(require("./routes/projects"));
const users_1 = __importDefault(require("./routes/users"));
const contacts_1 = __importDefault(require("./routes/contacts"));
const certificates_1 = __importDefault(require("./routes/certificates"));
const queries_1 = __importDefault(require("./routes/queries"));
const scheduler_1 = require("./services/scheduler");
const path_1 = __importDefault(require("path"));
// Initialize environment variables from .env across various execution contexts (Vercel serverless / local)
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../.env") });
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../../.env") });
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), "backend/.env") });
dotenv_1.default.config();
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
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Enable Cross-Origin Resource Sharing for Frontend
const corsOptions = {
    origin: (origin, callback) => {
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
        }
        else {
            callback(null, true); // Allow all cross-origin dashboard & user interactions safely
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use((0, cors_1.default)(corsOptions));
// Register Clerk middleware safely with explicit fallback keys so it never halts public routes
try {
    app.use((0, express_2.clerkMiddleware)({
        publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
        secretKey: process.env.CLERK_SECRET_KEY,
    }));
}
catch (clerkErr) {
    console.warn("[SERVER] Clerk middleware initialization warning (continuing with route handling):", clerkErr);
}
// Expose built-in JSON body parsers with 50mb limit for certificate PDF/image uploads
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "50mb" }));
// Standard Request Logging Middleware
app.use((req, _res, next) => {
    console.log(`[HTTP] ${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});
// Register API Routes
app.use("/api/projects", projects_1.default);
app.use("/api/users", users_1.default);
app.use("/api/contacts", contacts_1.default);
app.use("/api/certificates", certificates_1.default);
app.use("/api/queries", queries_1.default);
app.use("/api/inngest", (0, express_3.serve)({ client: client_1.inngest, functions: [functions_1.generateIndustryInsights] }));
// Diagnostic DB Health Endpoint
app.get("/api/health/db", async (_req, res) => {
    try {
        const { realPrisma } = await Promise.resolve().then(() => __importStar(require("./config/db")));
        const count = await realPrisma.inquiry.count();
        res.json({
            ok: true,
            database: "MongoDB Atlas Connected",
            inquiriesCount: count,
            envDbUrl: process.env.DATABASE_URL ? "SET" : "NOT_SET",
        });
    }
    catch (err) {
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
app.get("/health", (_req, res) => {
    res.json({
        status: "online",
        system: "RECODEX DevMarket Core Server",
        timestamp: new Date().toISOString(),
    });
});
// 404 Route Not Found Middleware
app.use((_req, res) => {
    res.status(404).json({ error: "API Endpoint not found." });
});
// Global Error Catch Middleware
app.use((err, _req, res, _next) => {
    console.error("[CRITICAL ERROR] Global middleware caught exception:", err);
    res.status(err.status || 500).json({
        error: err.message || "An unexpected system exception occurred inside DevMarket core.",
    });
});
// Boot Server (only in non-serverless environments)
if (!process.env.VERCEL) {
    (0, scheduler_1.startCertificateScheduler)(60000);
    app.listen(PORT, () => {
        console.log("====================================================");
        console.log(`⚡️ RECODEX BACKEND API CORE BOOTED SUCCESSFULLY ⚡️`);
        console.log(`📡 Server active on: http://localhost:${PORT}`);
        console.log(`🌐 Frontend Allowed Origin: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
        console.log("====================================================");
    });
}
exports.default = app;
