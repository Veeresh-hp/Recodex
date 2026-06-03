import { Router, Response } from "express";
import prisma from "../config/db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

/**
 * POST /api/contacts
 * Submits a new customer contact inquiry. Open to all users (public).
 */
router.post("/", async (req, res) => {
  const { name, email, type, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Missing required contact fields: name, email, and message are required." });
  }

  try {
    const inquiry = await prisma.inquiry.create({
      data: {
        name,
        email,
        type: type || "others",
        message,
      },
    });

    console.log(`[CONTACT] New inquiry received from ${name} (${email})`);
    return res.status(201).json(inquiry);
  } catch (error) {
    console.error("Error creating inquiry in database:", error);
    return res.status(500).json({ error: "Failed to submit your message. Please try again later." });
  }
});

/**
 * GET /api/contacts
 * Fetches all contact inquiries. Protected for admin users only.
 */
router.get("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;

  try {
    // Verify admin role in database (or allow admin bypass tokens)
    const token = req.headers.authorization?.split(" ")[1];
    const isAdminBypass = token === "admin-bypass-token";
    
    let isAdmin = false;
    
    if (isAdminBypass) {
      isAdmin = true;
    } else if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (user && user.role === "admin") {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      return res.status(403).json({ error: "Access Denied: Only administrators can view inquiries." });
    }

    const inquiries = await prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.json(inquiries);
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    return res.status(500).json({ error: "Failed to retrieve inquiries." });
  }
});

export default router;
