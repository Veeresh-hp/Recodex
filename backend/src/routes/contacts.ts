import { Router, Request, Response } from "express";
import prisma from "../config/db";
import { broadcastQueryMessage, broadcastQueryStatus } from "../services/realtime";

const router = Router();

/**
 * POST /api/contacts
 * Submits a new customer contact inquiry. Open to all users (public / authenticated).
 */
router.post("/", async (req: Request, res: Response) => {
  const { name, email, phone, type, message, id, ticketId } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Missing required contact fields: name, email, and message are required." });
  }

  const emailClean = email.trim().toLowerCase();
  const assignedTicketId = ticketId || id || `inq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  try {
    const inquiry = await prisma.inquiry.create({
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

    // Also persist initial customer query message
    await prisma.queryMessage.create({
      data: {
        queryId: inquiry.id,
        ticketId: assignedTicketId,
        senderId: "customer",
        senderRole: "CUSTOMER",
        senderName: name,
        senderEmail: emailClean,
        message,
        createdAt: inquiry.createdAt,
      },
    }).catch(() => null);

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
      } catch (whErr) {
        console.warn("[CONTACT WEBHOOK] Google Doc/Sheet fetch error:", whErr);
      }
    }

    return res.status(201).json({
      ...inquiry,
      id: assignedTicketId,
      dbId: inquiry.id,
      ticketId: assignedTicketId,
    });
  } catch (error) {
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
router.get("/", async (req: Request, res: Response) => {
  const { email } = req.query;

  try {
    const where: any = {};
    if (email) {
      where.email = { equals: String(email).trim().toLowerCase(), mode: "insensitive" };
    }

    let inquiries = await prisma.inquiry.findMany({
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
            if (!item || !item.email || !item.message) continue;
            const tId = item.id || item.ticketId;
            const orConditions: any[] = [];
            if (tId) orConditions.push({ ticketId: tId });
            if (item.email && item.message) {
              orConditions.push({ email: item.email.toLowerCase().trim(), message: item.message.trim() });
            }
            if (orConditions.length === 0) continue;

            const existingInq = await prisma.inquiry.findFirst({
              where: { OR: orConditions }
            }).catch(() => null);

            if (!existingInq) {
              hasNew = true;
              await prisma.inquiry.create({
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
            inquiries = await prisma.inquiry.findMany({
              where,
              orderBy: { createdAt: "desc" },
            });
          }
        }
      }
    } catch (syncErr) {
      console.warn("[CONTACTS] Google sheet sync warning:", syncErr);
    }

    const formatted = inquiries.map((inq: any) => ({
      ...inq,
      id: inq.ticketId || inq.id,
      dbId: inq.id,
      ticketId: inq.ticketId || inq.id,
      status: inq.status || (inq.reply ? "Resolved" : "Pending"),
    }));

    return res.json(formatted);
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    return res.status(500).json({ error: "Failed to retrieve inquiries." });
  }
});

/**
 * GET /api/contacts/:id
 * Fetches a single contact inquiry by ticketId or ObjectId.
 */
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

  try {
    let inquiry = null;
    if (isObjectId) {
      inquiry = await prisma.inquiry.findUnique({ where: { id } }).catch(() => null);
    }
    if (!inquiry) {
      inquiry = await prisma.inquiry.findFirst({ where: { ticketId: id } }).catch(() => null);
    }

    // If not found in database, check Google Sheets fallback
    if (!inquiry) {
      const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || "https://script.google.com/macros/s/AKfycbxzCq2Zsk5b_dCD0eysi3X7MOa5CLgu80EZRFXllz50Djf3GJd0NAAyxsMGFfMoMtxm9w/exec";
      const sheetRes = await fetch(webhookUrl, { method: "GET" }).catch(() => null);
      if (sheetRes && sheetRes.ok) {
        const sheetData = await sheetRes.json();
        if (Array.isArray(sheetData)) {
          const match = sheetData.find((item: any) => item.id === id || item.ticketId === id);
          if (match) {
            inquiry = await prisma.inquiry.create({
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
  } catch (error) {
    console.error("Error fetching single inquiry:", error);
    return res.status(500).json({ error: "Failed to retrieve inquiry." });
  }
});

/**
 * DELETE /api/contacts/:id
 * Deletes a customer contact inquiry.
 */
router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

  try {
    if (isObjectId) {
      await prisma.inquiry.delete({ where: { id } }).catch(() => {});
    }
    await prisma.inquiry.deleteMany({
      where: {
        OR: [{ ticketId: id }, { id: isObjectId ? id : undefined }],
      },
    }).catch(() => {});

    console.log(`[CONTACT] Inquiry ${id} deleted`);
    return res.json({ success: true, message: "Inquiry deleted successfully." });
  } catch (error) {
    console.error("Error deleting inquiry:", error);
    return res.status(500).json({ error: "Failed to delete inquiry." });
  }
});

/**
 * PUT /api/contacts/:id/reply
 * Stores an admin reply message and marks inquiry as Resolved.
 */
router.put("/:id/reply", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reply, email, message, name, phone, type } = req.body;

  if (!reply) {
    return res.status(400).json({ error: "Reply message body is required." });
  }

  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    let targetInquiry = null;

    if (isObjectId) {
      targetInquiry = await prisma.inquiry.findUnique({ where: { id } }).catch(() => null);
    }
    if (!targetInquiry) {
      targetInquiry = await prisma.inquiry.findFirst({ where: { ticketId: id } }).catch(() => null);
    }
    if (!targetInquiry && email && message) {
      targetInquiry = await prisma.inquiry.findFirst({
        where: {
          email: String(email).trim().toLowerCase(),
          message: String(message).trim(),
        },
        orderBy: { createdAt: "desc" },
      }).catch(() => null);
    }

    let savedInquiry = null;

    if (targetInquiry) {
      savedInquiry = await prisma.inquiry.update({
        where: { id: targetInquiry.id },
        data: {
          reply,
          status: "Resolved",
          resolvedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } else {
      // If not existing in DB, create new inquiry with the reply recorded
      savedInquiry = await prisma.inquiry.create({
        data: {
          ticketId: id,
          name: name || "Client",
          email: (email || "client@recodex.in").trim().toLowerCase(),
          phone: phone || "",
          type: type || "General Inquiry",
          message: message || "Support inquiry query",
          reply,
          status: "Resolved",
          resolvedAt: new Date(),
        },
      });
    }

    const ticketKey = savedInquiry.ticketId || savedInquiry.id;

    // Create QueryMessage
    const msg = await prisma.queryMessage.create({
      data: {
        queryId: savedInquiry.id,
        ticketId: ticketKey,
        senderId: "admin",
        senderRole: "ADMIN",
        senderName: "RecodeX Admin",
        senderEmail: "support@recodex.in",
        message: reply.trim(),
      },
    }).catch(() => null);

    // Broadcast Realtime delivery
    const messagePayload = {
      id: msg?.id || `msg-${Date.now()}`,
      queryId: ticketKey,
      senderId: "admin",
      senderRole: "ADMIN",
      senderName: "RecodeX Admin",
      senderEmail: "support@recodex.in",
      message: reply.trim(),
      createdAt: msg?.createdAt || new Date(),
    };

    await broadcastQueryMessage(ticketKey, messagePayload);
    await broadcastQueryStatus(ticketKey, "Resolved", { resolvedAt: new Date() });

    // Also forward reply to Google Sheet Webhook in background
    try {
      const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || "https://script.google.com/macros/s/AKfycbxzCq2Zsk5b_dCD0eysi3X7MOa5CLgu80EZRFXllz50Djf3GJd0NAAyxsMGFfMoMtxm9w/exec";
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reply",
          id: ticketKey,
          ticketId: ticketKey,
          reply,
          status: "Resolved",
          email: savedInquiry.email,
        }),
      }).catch(() => {});
    } catch (e) {}

    return res.json({
      ...savedInquiry,
      id: ticketKey,
      dbId: savedInquiry.id,
      ticketId: ticketKey,
      messagePayload,
    });
  } catch (error) {
    console.error("Error replying to inquiry:", error);
    return res.status(500).json({ error: "Failed to save reply message." });
  }
});

/**
 * PUT /api/contacts/:id/status
 * Updates the inquiry resolution status ("Resolved" | "Pending").
 */
router.put("/:id/status", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status = "Resolved", email, message, reply } = req.body;

  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    let targetInquiry = null;

    if (isObjectId) {
      targetInquiry = await prisma.inquiry.findUnique({ where: { id } }).catch(() => null);
    }
    if (!targetInquiry) {
      targetInquiry = await prisma.inquiry.findFirst({ where: { ticketId: id } }).catch(() => null);
    }
    if (!targetInquiry && email && message) {
      targetInquiry = await prisma.inquiry.findFirst({
        where: {
          email: String(email).trim().toLowerCase(),
          message: String(message).trim(),
        },
        orderBy: { createdAt: "desc" },
      }).catch(() => null);
    }

    if (targetInquiry) {
      const updated = await prisma.inquiry.update({
        where: { id: targetInquiry.id },
        data: {
          status,
          ...(reply ? { reply } : {}),
          ...(status === "Resolved" ? { resolvedAt: new Date() } : { resolvedAt: null }),
          updatedAt: new Date(),
        },
      });

      const ticketKey = updated.ticketId || updated.id;
      await broadcastQueryStatus(ticketKey, status, { resolvedAt: updated.resolvedAt });

      return res.json({
        ...updated,
        id: ticketKey,
        dbId: updated.id,
      });
    }

    return res.json({ id, status, message: "Status updated." });
  } catch (error) {
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
    const inquiries = await prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
    });

    const headers = ["Ticket ID", "Submitted Date", "Customer Name", "Email Address", "Phone Number", "Service Type", "Status", "Message", "Admin Reply"];
    const rows = inquiries.map((inq: any) => [
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

    const csvContent = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="RecodeX_Client_Inquiries_${new Date().toISOString().split("T")[0]}.csv"`);
    return res.send(csvContent);
  } catch (error) {
    console.error("Error exporting inquiries CSV:", error);
    return res.status(500).send("Failed to export inquiries CSV.");
  }
});

export default router;
