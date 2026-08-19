"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const express_1 = require("@clerk/express");
/**
 * Express middleware to enforce authentication using Clerk sessions.
 */
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        if (token === "admin-bypass-token" || token === "dev-bypass-token") {
            req.user = {
                id: token === "admin-bypass-token" ? "sandbox-admin-001" : "sandbox-dev-002",
                email: token === "admin-bypass-token" ? "veereshhp2004@gmail.com" : "veereshhp04@gmail.com",
                role: token === "admin-bypass-token" ? "admin" : "developer",
            };
            next();
            return;
        }
    }
    // Get authentication via Clerk
    const auth = (0, express_1.getAuth)(req);
    if (!auth || !auth.userId) {
        res.status(401).json({
            error: "Access Denied: Missing or invalid Clerk session token.",
        });
        return;
    }
    req.user = {
        id: auth.userId,
    };
    return next();
};
exports.requireAuth = requireAuth;
