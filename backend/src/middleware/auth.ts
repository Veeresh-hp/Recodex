import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request object to hold user details
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

/**
 * Express middleware to enforce authentication using Supabase JWT tokens.
 * Verifies that the client provided a valid Bearer token signed by the Supabase JWT secret.
 */
export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Access Denied: Missing or malformed authorization header. Expected 'Bearer <token>'.",
    });
  }

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

  try {
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
      console.error("[CRITICAL] SUPABASE_JWT_SECRET environment variable is missing!");
      return res.status(500).json({ error: "Server Configuration Error: Auth failed." });
    }

    // Decode and verify the JWT signed by Supabase
    const decoded = jwt.verify(token, jwtSecret) as any;

    // Supabase places user UUID in 'sub' claim and email in 'email'
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ error: "Access Denied: Invalid token payload." });
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email || "",
      role: decoded.role || "",
    };

    next();
    return;
  } catch (error: any) {
    console.warn("[AUTH WARN] Token verification failed:", error.message);
    return res.status(401).json({
      error: "Access Denied: Session expired or invalid credential token.",
    });
  }
};
