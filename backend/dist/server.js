"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const projects_1 = __importDefault(require("./routes/projects"));
const users_1 = __importDefault(require("./routes/users"));
// Initialize environment variables from .env
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Enable Cross-Origin Resource Sharing for the Next.js Frontend
const corsOptions = {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    optionsSuccessStatus: 200,
};
app.use((0, cors_1.default)(corsOptions));
// Expose built-in JSON body parsers
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Standard Request Logging Middleware
app.use((req, _res, next) => {
    console.log(`[HTTP] ${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});
// Register API Routes
app.use("/api/projects", projects_1.default);
app.use("/api/users", users_1.default);
// Basic Health Check Endpoint
app.get("/health", (_req, res) => {
    res.json({
        status: "online",
        system: "CAMCOD DevMarket Core Server",
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
// Boot Server
app.listen(PORT, () => {
    console.log("====================================================");
    console.log(`⚡️ CAMCOD BACKEND API CORE BOOTED SUCCESSFULLY ⚡️`);
    console.log(`📡 Server active on: http://localhost:${PORT}`);
    console.log(`🌐 Frontend Allowed Origin: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
    console.log("====================================================");
});
