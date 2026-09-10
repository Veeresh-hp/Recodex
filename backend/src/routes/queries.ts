import { Router, Response } from "express";
import prisma from "../config/db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { broadcastQueryMessage, broadcastQueryStatus } from "../services/realtime";
import fs from "fs";
import path from "path";

const router = Router();

const ROOT_ADMIN_EMAILS = ["veereshhp2004@gmail.com", "udaykumaras34@gmail.com"];
const PROMOTED_ADMINS_FILE = path.join(__dirname, "../../promoted_admins_db.json");

const isUserAdmin = (email?: string, role?: string): boolean => {
  if (role === "admin") return true;
  if (!email) return false;
  const emailClean = email.toLowerCase().trim();
  if (ROOT_ADMIN_EMAILS.includes(emailClean)) return true;

  try {
    if (fs.existsSync(PROMOTED_ADMINS_FILE)) {
      const data = fs.readFileSync(PROMOTED_ADMINS_FILE, "utf-8");
      const list: string[] = JSON.parse(data);
      if (list.map((e) => e.toLowerCase().trim()).includes(emailClean)) {
        return true;
      }
    }
  } catch (e) {}

  return false;
};

/**
 * Helper to find an inquiry by either MongoDB ObjectId or assigned ticketId.
 */
async function findInquiryByIdOrTicket(idOrTicketId: string) {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrTicketId);
  let inquiry = null;
  if (isObjectId) {
    inquiry = await prisma.inquiry.findUnique({
      where: { id: idOrTicketId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    }).catch(() => null);
  }
  if (!inquiry) {
    inquiry = await prisma.inquiry.findFirst({
      where: { ticketId: idOrTicketId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    }).catch(() => null);
  }
  return inquiry;
}

/**
 * GET /api/queries
 * Retrieves customer queries.
 * - Admin: sees all queries across the ecosystem.
 * - Customer: strictly isolated to their own queries by userId / email.
 */
router.get("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  const userEmail = (user?.email || "").toLowerCase().trim();
  const isAdmin = isUserAdmin(userEmail, user?.role);
  const { status, search } = req.query;

  try {
    const where: any = {};

    // Strict customer isolation
    if (!isAdmin) {
      if (user?.id && userEmail) {
        where.OR = [
          { customerId: user.id },
          { email: { equals: userEmail, mode: "insensitive" } },
        ];
      } else if (user?.id) {
        where.customerId = user.id;
      } else if (userEmail) {
        where.email = { equals: userEmail, mode: "insensitive" };
      } else {
        return res.status(403).json({ error: "Unauthorized access to inquiries." });
      }
    }

    if (status && typeof status === "string" && status !== "ALL") {
      where.status = { equals: status, mode: "insensitive" };
    }

    if (search && typeof search === "string" && search.trim()) {
      const q = search.trim();
      const searchConditions = [
        { subject: { contains: q, mode: "insensitive" } },
        { message: { contains: q, mode: "insensitive" } },
        { ticketId: { contains: q, mode: "insensitive" } },
      ];
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions }
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    let queries = await prisma.inquiry.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // latest message preview
        },
      },
    });

    // Format queries with uniform schema
    const formatted = queries.map((q: any) => ({
      id: q.ticketId || q.id,
      dbId: q.id,
      ticketId: q.ticketId || q.id,
      customerId: q.customerId,
      name: q.name,
      email: q.email,
      phone: q.phone,
      type: q.type,
      subject: q.subject || q.type || "Support Inquiry",
      priority: q.priority || "Normal",
      message: q.message,
      reply: q.reply,
      status: q.status || (q.reply ? "RESOLVED" : "OPEN"),
      createdAt: q.createdAt,
      updatedAt: q.updatedAt || q.createdAt,
      resolvedAt: q.resolvedAt,
      latestMessage: q.messages?.[0] || null,
    }));

    return res.json(formatted);
  } catch (error) {
    console.error("[QUERIES] Error retrieving queries:", error);
    return res.status(500).json({ error: "Failed to retrieve support queries." });
  }
});

/**
 * GET /api/queries/:queryId
 * Fetches a single query details and its complete chronological conversation message thread.
 * Security: Customers cannot view queries belonging to other users.
 */
router.get("/:queryId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { queryId } = req.params;
  const user = req.user;
  const userEmail = (user?.email || "").toLowerCase().trim();
  const isAdmin = isUserAdmin(userEmail, user?.role);

  try {
    const inquiry = await findInquiryByIdOrTicket(queryId);

    if (!inquiry) {
      return res.status(404).json({ error: "Query ticket not found." });
    }

    // Customer security verification
    const inqEmail = (inquiry.email || "").toLowerCase().trim();
    if (!isAdmin) {
      const isOwner =
        (inquiry.customerId && user?.id && inquiry.customerId === user.id) ||
        (inqEmail && userEmail && inqEmail === userEmail);

      if (!isOwner) {
        console.warn(`[SECURITY] Forbidden query access attempt: User ${userEmail} tried to access inquiry ${queryId} owned by ${inqEmail}`);
        return res.status(403).json({ error: "Forbidden: You do not have permission to view this query." });
      }
    }

    // Backfill: If query has no messages table rows yet (legacy record), synthesize from message and reply
    let messages = inquiry.messages || [];
    if (messages.length === 0 && inquiry.message) {
      // Seed initial customer message
      const firstMsg = await prisma.queryMessage.create({
        data: {
          queryId: inquiry.id,
          ticketId: inquiry.ticketId || inquiry.id,
          senderId: inquiry.customerId || "customer",
          senderRole: "CUSTOMER",
          senderName: inquiry.name || "Customer",
          senderEmail: inquiry.email,
          message: inquiry.message,
          createdAt: inquiry.createdAt,
        },
      }).catch(() => null);

      if (firstMsg) messages.push(firstMsg);

      // Seed official admin reply if existed
      if (inquiry.reply) {
        const replyMsg = await prisma.queryMessage.create({
          data: {
            queryId: inquiry.id,
            ticketId: inquiry.ticketId || inquiry.id,
            senderId: "admin",
            senderRole: "ADMIN",
            senderName: "RecodeX Admin",
            senderEmail: "support@recodex.in",
            message: inquiry.reply,
            createdAt: inquiry.updatedAt || new Date(inquiry.createdAt.getTime() + 1000),
          },
        }).catch(() => null);
        if (replyMsg) messages.push(replyMsg);
      }
    }

    return res.json({
      query: {
        id: inquiry.ticketId || inquiry.id,
        dbId: inquiry.id,
        ticketId: inquiry.ticketId || inquiry.id,
        customerId: inquiry.customerId,
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone,
        type: inquiry.type,
        subject: inquiry.subject || inquiry.type || "Support Inquiry",
        priority: inquiry.priority || "Normal",
        status: inquiry.status || (inquiry.reply ? "RESOLVED" : "OPEN"),
        createdAt: inquiry.createdAt,
        updatedAt: inquiry.updatedAt,
        resolvedAt: inquiry.resolvedAt,
      },
      messages: messages.map((m: any) => ({
        id: m.id,
        queryId: inquiry.ticketId || inquiry.id,
        senderId: m.senderId,
        senderRole: m.senderRole,
        senderName: m.senderName,
        senderEmail: m.senderEmail,
        message: m.message,
        readAt: m.readAt,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error(`[QUERIES] Error fetching query ${queryId}:`, error);
    return res.status(500).json({ error: "Failed to retrieve conversation details." });
  }
});

/**
 * POST /api/queries
 * Customer creates a new support query ticket.
 */
router.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  const { subject, category, message, priority = "Normal", name, email, phone } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Detailed message description is required." });
  }

  const userEmail = (user?.email || email || "").toLowerCase().trim();
  const userName = name || (userEmail ? userEmail.split("@")[0] : "Customer");
  const assignedTicketId = `TKT-${Date.now().toString().slice(-6)}`;

  try {
    // 1. Create Inquiry record
    const inquiry = await prisma.inquiry.create({
      data: {
        ticketId: assignedTicketId,
        customerId: user?.id || null,
        name: userName,
        email: userEmail,
        phone: phone || "",
        type: category || "Technical Support",
        subject: subject || "Support Inquiry",
        priority: priority || "Normal",
        message: message.trim(),
        status: "OPEN",
      },
    });

    // 2. Create initial conversation message
    const initialMessage = await prisma.queryMessage.create({
      data: {
        queryId: inquiry.id,
        ticketId: assignedTicketId,
        senderId: user?.id || "customer",
        senderRole: "CUSTOMER",
        senderName: userName,
        senderEmail: userEmail,
        message: message.trim(),
        createdAt: inquiry.createdAt,
      },
    });

    console.log(`[QUERIES] New query created: [${assignedTicketId}] by ${userName} (${userEmail})`);

    // 3. Trigger Realtime Events
    await broadcastQueryMessage(assignedTicketId, {
      id: initialMessage.id,
      queryId: assignedTicketId,
      senderId: initialMessage.senderId,
      senderRole: initialMessage.senderRole,
      senderName: initialMessage.senderName,
      senderEmail: initialMessage.senderEmail,
      message: initialMessage.message,
      createdAt: initialMessage.createdAt,
    });

    return res.status(201).json({
      success: true,
      id: assignedTicketId,
      ticketId: assignedTicketId,
      dbId: inquiry.id,
      query: {
        id: assignedTicketId,
        dbId: inquiry.id,
        ticketId: assignedTicketId,
        subject: inquiry.subject,
        category: inquiry.type,
        status: "OPEN",
        createdAt: inquiry.createdAt,
      },
      message: initialMessage,
    });
  } catch (error) {
    console.error("[QUERIES] Error creating new query:", error);
    return res.status(500).json({ error: "Failed to create support query. Please try again." });
  }
});

/**
 * POST /api/queries/:queryId/messages
 * Submits a new message in the conversation thread.
 * Can be called by:
 * - ADMIN: replies to the customer, optionally resolving the query.
 * - CUSTOMER: replies to the admin in their own open ticket.
 */
router.post("/:queryId/messages", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { queryId } = req.params;
  const { message, resolve = false } = req.body;
  const user = req.user;
  const userEmail = (user?.email || "").toLowerCase().trim();
  const isAdmin = isUserAdmin(userEmail, user?.role);

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message body cannot be empty." });
  }

  try {
    const inquiry = await findInquiryByIdOrTicket(queryId);
    if (!inquiry) {
      return res.status(404).json({ error: "Support ticket not found." });
    }

    const inqEmail = (inquiry.email || "").toLowerCase().trim();
    let senderRole = "CUSTOMER";
    let senderName = inquiry.name || "Customer";
    let senderId = user?.id || "customer";

    if (isAdmin) {
      senderRole = "ADMIN";
      senderName = "RecodeX Admin";
      senderId = user?.id || "admin";
    } else {
      // Verify customer owns this ticket
      const isOwner =
        (inquiry.customerId && user?.id && inquiry.customerId === user.id) ||
        (inqEmail && userEmail && inqEmail === userEmail);

      if (!isOwner) {
        return res.status(403).json({ error: "Forbidden: You cannot post messages to another user's inquiry." });
      }
      senderName = inquiry.name || userEmail.split("@")[0];
    }

    // Determine target status
    let nextStatus = inquiry.status;
    let resolvedAt = inquiry.resolvedAt;

    if (isAdmin && resolve) {
      nextStatus = "RESOLVED";
      resolvedAt = new Date();
    } else if (!isAdmin && (inquiry.status === "RESOLVED" || inquiry.status === "CLOSED")) {
      // Customer sending a message to a resolved ticket automatically reopens it
      nextStatus = "OPEN";
      resolvedAt = null;
    }

    const ticketKey = inquiry.ticketId || inquiry.id;

    // Persist message to database
    const createdMessage = await prisma.queryMessage.create({
      data: {
        queryId: inquiry.id,
        ticketId: ticketKey,
        senderId,
        senderRole,
        senderName,
        senderEmail: userEmail || (isAdmin ? "admin@recodex.in" : inqEmail),
        message: message.trim(),
      },
    });

    // Update parent inquiry record
    const updatedInquiry = await prisma.inquiry.update({
      where: { id: inquiry.id },
      data: {
        status: nextStatus,
        resolvedAt,
        reply: senderRole === "ADMIN" ? message.trim() : inquiry.reply,
        updatedAt: new Date(),
      },
    });

    console.log(
      `[QUERY_MESSAGE] queryId=${ticketKey} role=${senderRole} sender=${senderName} resolved=${resolve} status=${nextStatus}`
    );

    // Emit Realtime Delivery Event
    const messagePayload = {
      id: createdMessage.id,
      queryId: ticketKey,
      senderId: createdMessage.senderId,
      senderRole: createdMessage.senderRole,
      senderName: createdMessage.senderName,
      senderEmail: createdMessage.senderEmail,
      message: createdMessage.message,
      createdAt: createdMessage.createdAt,
    };

    await broadcastQueryMessage(ticketKey, messagePayload);

    if (nextStatus !== inquiry.status) {
      await broadcastQueryStatus(ticketKey, nextStatus, { resolvedAt });
    }

    return res.status(201).json({
      success: true,
      message: messagePayload,
      queryStatus: nextStatus,
      resolvedAt: updatedInquiry.resolvedAt,
    });
  } catch (error) {
    console.error(`[QUERIES] Error sending message to query ${queryId}:`, error);
    return res.status(500).json({ error: "Failed to send message. Please try again." });
  }
});

/**
 * PATCH /api/queries/:queryId/status
 * Updates the query status (e.g. "RESOLVED", "OPEN", "CLOSED").
 * Supports Reopening by admin or the customer who owns the ticket.
 */
router.patch("/:queryId/status", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { queryId } = req.params;
  const { status } = req.body;
  const user = req.user;
  const userEmail = (user?.email || "").toLowerCase().trim();
  const isAdmin = isUserAdmin(userEmail, user?.role);

  if (!status || !["OPEN", "PENDING", "RESOLVED", "CLOSED"].includes(status.toUpperCase())) {
    return res.status(400).json({ error: "Valid status required: OPEN, PENDING, RESOLVED, or CLOSED." });
  }

  const normalizedStatus = status.toUpperCase();

  try {
    const inquiry = await findInquiryByIdOrTicket(queryId);
    if (!inquiry) {
      return res.status(404).json({ error: "Query ticket not found." });
    }

    const inqEmail = (inquiry.email || "").toLowerCase().trim();

    // Verify permission: Admins can change to any status; Customers can reopen their own tickets
    if (!isAdmin) {
      const isOwner =
        (inquiry.customerId && user?.id && inquiry.customerId === user.id) ||
        (inqEmail && userEmail && inqEmail === userEmail);

      if (!isOwner) {
        return res.status(403).json({ error: "Forbidden: You cannot modify this ticket's status." });
      }

      if (normalizedStatus !== "OPEN" && normalizedStatus !== "PENDING") {
        return res.status(403).json({ error: "Customers can only reopen tickets." });
      }
    }

    const ticketKey = inquiry.ticketId || inquiry.id;
    const resolvedAt = normalizedStatus === "RESOLVED" ? new Date() : null;

    const updated = await prisma.inquiry.update({
      where: { id: inquiry.id },
      data: {
        status: normalizedStatus,
        resolvedAt,
        updatedAt: new Date(),
      },
    });

    console.log(`[QUERY_STATUS] queryId=${ticketKey} oldStatus=${inquiry.status} newStatus=${normalizedStatus}`);

    // Broadcast Realtime status event
    await broadcastQueryStatus(ticketKey, normalizedStatus, { resolvedAt });

    return res.json({
      success: true,
      queryId: ticketKey,
      status: normalizedStatus,
      resolvedAt: updated.resolvedAt,
    });
  } catch (error) {
    console.error(`[QUERIES] Error updating status for query ${queryId}:`, error);
    return res.status(500).json({ error: "Failed to update query status." });
  }
});

export default router;
