"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../config/db"));
const router = (0, express_1.Router)();
/**
 * POST /api/contacts
 * Submits a new customer contact inquiry. Open to all users (public / authenticated).
 */
router.post("/", async (req, res) => {
    const { name, email, phone, type, message, id, ticketId } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ error: "Missing required contact fields: name, email, and message are required." });
    }
    const emailClean = email.trim().toLowerCase();
    const assignedTicketId = ticketId || id || `inq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    try {
        const inquiry = await db_1.default.inquiry.create({
            data: {
                ticketId: assignedTicketId,
                name,
                email: emailClean,
                phone: phone || "",
                type: type || "General Inquiry",
                message,
                status: "Pending",
            },
        });
        console.log(`[CONTACT] New inquiry received from ${name} (${emailClean}) [${assignedTicketId}]`);
        // Trigger Google Sheets / Google Docs Webhook if configured
        const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || process.env.GOOGLE_DOC_WEBHOOK_URL || "https://script.google.com/macros/s/AKfycbxzCq2Zsk5b_dCD0eysi3X7MOa5CLgu80EZRFXllz50Djf3GJd0NAAyxsMGFfMoMtxm9w/exec";
        if (webhookUrl) {
            try {
                fetch(webhookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: assignedTicketId,
                        dbId: inquiry.id,
                        timestamp: inquiry.createdAt.toISOString(),
                        date: new Date(inquiry.createdAt).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
                        name,
                        email: emailClean,
                        phone: phone || "",
                        type: type || "General Inquiry",
                        message,
                        status: "Pending",
                    }),
                }).catch((whErr) => console.warn("[CONTACT WEBHOOK] Google Doc/Sheet sync warning:", whErr));
            }
            catch (whErr) {
                console.warn("[CONTACT WEBHOOK] Google Doc/Sheet fetch error:", whErr);
            }
        }
        return res.status(201).json({
            ...inquiry,
            id: assignedTicketId,
            dbId: inquiry.id,
            ticketId: assignedTicketId,
        });
    }
    catch (error) {
        console.error("Error creating inquiry in database:", error);
        return res.status(500).json({ error: "Failed to submit your message. Please try again later." });
    }
});
/**
 * GET /api/contacts
 * Fetches contact inquiries.
 * - If ?email=... query parameter is provided, returns inquiries matching that user's email.
 * - If no query parameter, returns all ecosystem inquiries.
 */
router.get("/", async (req, res) => {
    const { email } = req.query;
    try {
        const where = {};
        if (email) {
            where.email = { equals: String(email).trim().toLowerCase(), mode: "insensitive" };
        }
        let inquiries = await db_1.default.inquiry.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });
        // Backfill any inquiries from Google Sheets that are not yet in MongoDB
        try {
            const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || "https://script.google.com/macros/s/AKfycbxzCq2Zsk5b_dCD0eysi3X7MOa5CLgu80EZRFXllz50Djf3GJd0NAAyxsMGFfMoMtxm9w/exec";
            const sheetRes = await fetch(webhookUrl, { method: "GET" }).catch(() => null);
            if (sheetRes && sheetRes.ok) {
                const sheetData = await sheetRes.json();
                if (Array.isArray(sheetData)) {
                    let hasNew = false;
                    for (const item of sheetData) {
                        if (!item || !item.email || !item.message)
                            continue;
                        const tId = item.id || item.ticketId;
                        const orConditions = [];
                        if (tId)
                            orConditions.push({ ticketId: tId });
                        if (item.email && item.message) {
                            orConditions.push({ email: item.email.toLowerCase().trim(), message: item.message.trim() });
                        }
                        if (orConditions.length === 0)
                            continue;
                        const existingInq = await db_1.default.inquiry.findFirst({
                            where: { OR: orConditions }
                        }).catch(() => null);
                        if (!existingInq) {
                            hasNew = true;
                            await db_1.default.inquiry.create({
                                data: {
                                    ticketId: tId || `inq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                                    name: item.name || "Client",
                                    email: item.email.toLowerCase().trim(),
                                    phone: item.phone || "",
                                    type: item.type || "General Inquiry",
                                    message: item.message,
                                    reply: item.reply || null,
                                    status: item.status || (item.reply ? "Resolved" : "Pending"),
                                    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
                                }
                            }).catch(() => null);
                        }
                    }
                    if (hasNew) {
                        inquiries = await db_1.default.inquiry.findMany({
                            where,
                            orderBy: { createdAt: "desc" },
                        });
                    }
                }
            }
        }
        catch (syncErr) {
            console.warn("[CONTACTS] Google sheet sync warning:", syncErr);
        }
        const formatted = inquiries.map((inq) => ({
            ...inq,
            id: inq.ticketId || inq.id,
            dbId: inq.id,
            ticketId: inq.ticketId || inq.id,
            status: inq.status || (inq.reply ? "Resolved" : "Pending"),
        }));
        return res.json(formatted);
    }
    catch (error) {
        console.error("Error fetching inquiries:", error);
        return res.status(500).json({ error: "Failed to retrieve inquiries." });
    }
});
/**
 * GET /api/contacts/:id
 * Fetches a single contact inquiry by ticketId or ObjectId.
 */
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    try {
        let inquiry = null;
        if (isObjectId) {
            inquiry = await db_1.default.inquiry.findUnique({ where: { id } }).catch(() => null);
        }
        if (!inquiry) {
            inquiry = await db_1.default.inquiry.findFirst({ where: { ticketId: id } }).catch(() => null);
        }
        // If not found in database, check Google Sheets fallback
        if (!inquiry) {
            const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || "https://script.google.com/macros/s/AKfycbxzCq2Zsk5b_dCD0eysi3X7MOa5CLgu80EZRFXllz50Djf3GJd0NAAyxsMGFfMoMtxm9w/exec";
            const sheetRes = await fetch(webhookUrl, { method: "GET" }).catch(() => null);
            if (sheetRes && sheetRes.ok) {
                const sheetData = await sheetRes.json();
                if (Array.isArray(sheetData)) {
                    const match = sheetData.find((item) => item.id === id || item.ticketId === id);
                    if (match) {
                        inquiry = await db_1.default.inquiry.create({
                            data: {
                                ticketId: match.id || id,
                                name: match.name || "Client",
                                email: (match.email || "").toLowerCase().trim(),
                                phone: match.phone || "",
                                type: match.type || "General Inquiry",
                                message: match.message,
                                reply: match.reply || null,
                                status: match.status || (match.reply ? "Resolved" : "Pending"),
                                createdAt: match.createdAt ? new Date(match.createdAt) : new Date(),
                            }
                        }).catch(() => null);
                    }
                }
            }
        }
        if (!inquiry) {
            return res.status(404).json({ error: "Inquiry ticket not found" });
        }
        return res.json({
            ...inquiry,
            id: inquiry.ticketId || inquiry.id,
            dbId: inquiry.id,
            ticketId: inquiry.ticketId || inquiry.id,
            status: inquiry.status || (inquiry.reply ? "Resolved" : "Pending"),
        });
    }
    catch (error) {
        console.error("Error fetching single inquiry:", error);
        return res.status(500).json({ error: "Failed to retrieve inquiry." });
    }
});
/**
 * DELETE /api/contacts/:id
 * Deletes a customer contact inquiry.
 */
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    try {
        if (isObjectId) {
            await db_1.default.inquiry.delete({ where: { id } }).catch(() => { });
        }
        await db_1.default.inquiry.deleteMany({
            where: {
                OR: [{ ticketId: id }, { id: isObjectId ? id : undefined }],
            },
        }).catch(() => { });
        console.log(`[CONTACT] Inquiry ${id} deleted`);
        return res.json({ success: true, message: "Inquiry deleted successfully." });
    }
    catch (error) {
        console.error("Error deleting inquiry:", error);
        return res.status(500).json({ error: "Failed to delete inquiry." });
    }
});
/**
 * PUT /api/contacts/:id/reply
 * Stores an admin reply message and marks inquiry as Resolved.
 */
router.put("/:id/reply", async (req, res) => {
    const { id } = req.params;
    const { reply, email, message, name, phone, type } = req.body;
    if (!reply) {
        return res.status(400).json({ error: "Reply message body is required." });
    }
    try {
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
        let targetInquiry = null;
        if (isObjectId) {
            targetInquiry = await db_1.default.inquiry.findUnique({ where: { id } }).catch(() => null);
        }
        if (!targetInquiry) {
            targetInquiry = await db_1.default.inquiry.findFirst({ where: { ticketId: id } }).catch(() => null);
        }
        if (!targetInquiry && email && message) {
            targetInquiry = await db_1.default.inquiry.findFirst({
                where: {
                    email: String(email).trim().toLowerCase(),
                    message: String(message).trim(),
                },
                orderBy: { createdAt: "desc" },
            }).catch(() => null);
        }
        if (!targetInquiry && email) {
            targetInquiry = await db_1.default.inquiry.findFirst({
                where: { email: String(email).trim().toLowerCase() },
                orderBy: { createdAt: "desc" },
            }).catch(() => null);
        }
        if (targetInquiry) {
            const updated = await db_1.default.inquiry.update({
                where: { id: targetInquiry.id },
                data: {
                    reply,
                    status: "Resolved",
                },
            });
            // Also forward reply to Google Sheet Webhook in background
            try {
                const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || "https://script.google.com/macros/s/AKfycbxzCq2Zsk5b_dCD0eysi3X7MOa5CLgu80EZRFXllz50Djf3GJd0NAAyxsMGFfMoMtxm9w/exec";
                fetch(webhookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "reply",
                        id: updated.ticketId || updated.id,
                        ticketId: updated.ticketId || updated.id,
                        reply,
                        status: "Resolved",
                        email: updated.email,
                    }),
                }).catch(() => { });
            }
            catch (e) { }
            return res.json({
                ...updated,
                id: updated.ticketId || updated.id,
                dbId: updated.id,
            });
        }
        // If not existing in DB, create new inquiry with the reply recorded
        const created = await db_1.default.inquiry.create({
            data: {
                ticketId: id,
                name: name || "Client",
                email: (email || "client@recodex.in").trim().toLowerCase(),
                phone: phone || "",
                type: type || "General Inquiry",
                message: message || "Support inquiry query",
                reply,
                status: "Resolved",
            },
        });
        return res.json({
            ...created,
            id: created.ticketId || created.id,
            dbId: created.id,
        });
    }
    catch (error) {
        console.error("Error replying to inquiry:", error);
        return res.status(500).json({ error: "Failed to save reply message." });
    }
});
/**
 * PUT /api/contacts/:id/status
 * Updates the inquiry resolution status ("Resolved" | "Pending").
 */
router.put("/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status = "Resolved", email, message, reply } = req.body;
    try {
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
        let targetInquiry = null;
        if (isObjectId) {
            targetInquiry = await db_1.default.inquiry.findUnique({ where: { id } }).catch(() => null);
        }
        if (!targetInquiry) {
            targetInquiry = await db_1.default.inquiry.findFirst({ where: { ticketId: id } }).catch(() => null);
        }
        if (!targetInquiry && email && message) {
            targetInquiry = await db_1.default.inquiry.findFirst({
                where: {
                    email: String(email).trim().toLowerCase(),
                    message: String(message).trim(),
                },
                orderBy: { createdAt: "desc" },
            }).catch(() => null);
        }
        if (!targetInquiry && email) {
            targetInquiry = await db_1.default.inquiry.findFirst({
                where: { email: String(email).trim().toLowerCase() },
                orderBy: { createdAt: "desc" },
            }).catch(() => null);
        }
        if (targetInquiry) {
            const updated = await db_1.default.inquiry.update({
                where: { id: targetInquiry.id },
                data: {
                    status,
                    ...(reply ? { reply } : {}),
                },
            });
            return res.json({
                ...updated,
                id: updated.ticketId || updated.id,
                dbId: updated.id,
            });
        }
        return res.json({ id, status, message: "Status updated." });
    }
    catch (error) {
        console.error("Error updating inquiry status:", error);
        return res.status(500).json({ error: "Failed to update inquiry status." });
    }
});
/**
 * GET /api/contacts/export-csv
 * Exports all customer contact inquiries as a structured CSV file for Google Sheets / Google Docs.
 */
router.get("/export-csv", async (_req, res) => {
    try {
        const inquiries = await db_1.default.inquiry.findMany({
            orderBy: { createdAt: "desc" },
        });
        const headers = ["Ticket ID", "Submitted Date", "Customer Name", "Email Address", "Phone Number", "Service Type", "Status", "Message", "Admin Reply"];
        const rows = inquiries.map((inq) => [
            `"${inq.ticketId || inq.id}"`,
            `"${new Date(inq.createdAt).toLocaleString("en-US", { timeZone: "Asia/Kolkata" })}"`,
            `"${(inq.name || "").replace(/"/g, '""')}"`,
            `"${(inq.email || "").replace(/"/g, '""')}"`,
            `"${(inq.phone || "").replace(/"/g, '""')}"`,
            `"${(inq.type || "General").replace(/"/g, '""')}"`,
            `"${inq.status || (inq.reply ? "Resolved" : "Pending")}"`,
            `"${(inq.message || "").replace(/"/g, '""')}"`,
            `"${(inq.reply || "").replace(/"/g, '""')}"`,
        ]);
        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="RecodeX_Client_Inquiries_${new Date().toISOString().split("T")[0]}.csv"`);
        return res.send(csvContent);
    }
    catch (error) {
        console.error("Error exporting inquiries CSV:", error);
        return res.status(500).send("Failed to export inquiries CSV.");
    }
});
exports.default = router;
