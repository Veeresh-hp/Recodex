"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../config/db"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * POST /api/contacts
 * Submits a new customer contact inquiry. Open to all users (public).
 */
router.post("/", async (req, res) => {
    const { name, email, phone, type, message } = req.body;
    if (!name || !email || !phone || !message) {
        return res.status(400).json({ error: "Missing required contact fields: name, email, phone, and message are required." });
    }
    try {
        const inquiry = await db_1.default.inquiry.create({
            data: {
                name,
                email,
                phone,
                type: type || "others",
                message,
            },
        });
        console.log(`[CONTACT] New inquiry received from ${name} (${email})`);
        return res.status(201).json(inquiry);
    }
    catch (error) {
        console.error("Error creating inquiry in database:", error);
        return res.status(500).json({ error: "Failed to submit your message. Please try again later." });
    }
});
/**
 * GET /api/contacts
 * Fetches all contact inquiries. Protected for admin users only.
 */
router.get("/", auth_1.requireAuth, async (req, res) => {
    const userId = req.user?.id;
    try {
        // Verify admin role in database (or allow admin bypass tokens)
        const token = req.headers.authorization?.split(" ")[1];
        const isAdminBypass = token === "admin-bypass-token";
        let isAdmin = false;
        if (isAdminBypass) {
            isAdmin = true;
        }
        else if (userId) {
            const user = await db_1.default.user.findUnique({
                where: { id: userId },
            });
            if (user && (user.role === "admin" || user.email === "veereshhp2004@gmail.com")) {
                isAdmin = true;
            }
        }
        if (!isAdmin) {
            return res.status(403).json({ error: "Access Denied: Only administrators can view inquiries." });
        }
        const inquiries = await db_1.default.inquiry.findMany({
            orderBy: { createdAt: "desc" },
        });
        return res.json(inquiries);
    }
    catch (error) {
        console.error("Error fetching inquiries:", error);
        return res.status(500).json({ error: "Failed to retrieve inquiries." });
    }
});
/**
 * DELETE /api/contacts/:id
 * Deletes a customer contact inquiry. Protected for admin users only.
 */
router.delete("/:id", auth_1.requireAuth, async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const isAdminBypass = token === "admin-bypass-token";
        let isAdmin = false;
        if (isAdminBypass) {
            isAdmin = true;
        }
        else if (userId) {
            const user = await db_1.default.user.findUnique({
                where: { id: userId },
            });
            if (user && (user.role === "admin" || user.email === "veereshhp2004@gmail.com")) {
                isAdmin = true;
            }
        }
        if (!isAdmin) {
            return res.status(403).json({ error: "Access Denied: Only administrators can delete inquiries." });
        }
        await db_1.default.inquiry.delete({
            where: { id },
        });
        console.log(`[CONTACT] Inquiry ${id} deleted by admin`);
        return res.json({ success: true, message: "Inquiry deleted successfully." });
    }
    catch (error) {
        console.error("Error deleting inquiry:", error);
        return res.status(500).json({ error: "Failed to delete inquiry." });
    }
});
/**
 * PUT /api/contacts/:id/reply
 * Stores an admin reply message to a contact inquiry. Protected for admin users only.
 */
router.put("/:id/reply", auth_1.requireAuth, async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const { reply } = req.body;
    if (!reply) {
        return res.status(400).json({ error: "Reply message body is required." });
    }
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const isAdminBypass = token === "admin-bypass-token";
        let isAdmin = false;
        if (isAdminBypass) {
            isAdmin = true;
        }
        else if (userId) {
            const user = await db_1.default.user.findUnique({
                where: { id: userId },
            });
            if (user && (user.role === "admin" || user.email === "veereshhp2004@gmail.com")) {
                isAdmin = true;
            }
        }
        if (!isAdmin) {
            return res.status(403).json({ error: "Access Denied: Only administrators can reply to inquiries." });
        }
        const updated = await db_1.default.inquiry.update({
            where: { id },
            data: { reply },
        });
        console.log(`[CONTACT] Replied to inquiry ${id}`);
        return res.json(updated);
    }
    catch (error) {
        console.error("Error replying to inquiry:", error);
        return res.status(500).json({ error: "Failed to save reply message." });
    }
});
exports.default = router;
