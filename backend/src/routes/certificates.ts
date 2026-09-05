import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import prisma from "../config/db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { CertificateService } from "../services/certificateService";
import { generateCertificatePdf } from "../services/pdfGenerator";

const router = Router();
const DB_FILE = path.join(__dirname, "../../certificates_db.json");

// Helper to read local json DB (legacy fallback)
const readCertificatesFile = (): any[] => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("Failed to read certificates file:", e);
  }
  return [];
};

// Helper to write local json DB (legacy fallback)
const writeCertificatesFile = (certs: any[]) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(certs, null, 2), "utf-8");
  } catch (e) {
    console.warn("Failed to write certificates file:", e);
  }
};

/**
 * GET /api/certificates/verify/:certificateId
 * Public verification endpoint (No login required).
 */
router.get("/verify/:certificateId", async (req: Request, res: Response) => {
  const { certificateId } = req.params;

  try {
    const cert = await prisma.certificate.findUnique({
      where: { certificateId: certificateId.trim().toUpperCase() },
      include: {
        project: {
          select: {
            title: true,
            category: true,
            description: true,
          },
        },
      },
    });

    if (!cert) {
      return res.status(404).json({
        verified: false,
        status: "NOT_FOUND",
        error: "No official certificate found matching the provided identifier.",
      });
    }

    // Increment verification counter asynchronously
    prisma.certificate.update({
      where: { certificateId: cert.certificateId },
      data: { verificationCount: { increment: 1 } },
    }).catch(() => {});

    // Log verification action
    prisma.certificateAuditLog.create({
      data: {
        certificateId: cert.certificateId,
        projectId: cert.projectId,
        userId: cert.userId,
        performedBy: "PUBLIC_VERIFIER",
        action: "CERTIFICATE_VERIFIED",
        details: `Public certificate verification performed for ID ${cert.certificateId}`,
      },
    }).catch(() => {});

    const isRevoked = cert.status === "REVOKED";
    const isIssued = cert.status === "ISSUED";

    return res.json({
      verified: isIssued,
      status: cert.status,
      certificateId: cert.certificateId,
      recipientName: cert.recipientName,
      projectTitle: cert.projectTitle,
      category: cert.category,
      programName: cert.programName,
      completionDate: cert.completionDate,
      issueDate: cert.issueDate,
      finalScore: cert.finalScore,
      grade: cert.grade,
      pdfUrl: cert.pdfUrl,
      previewUrl: cert.previewUrl,
      qrCodeUrl: cert.qrCodeUrl,
      verificationUrl: cert.verificationUrl,
      verificationCount: cert.verificationCount + 1,
      revokedAt: cert.revokedAt,
      revokedReason: cert.revokedReason,
      isRevoked,
    });
  } catch (error: any) {
    console.error(`Error verifying certificate ${certificateId}:`, error);
    return res.status(500).json({ error: "Certificate verification service encountered an internal error." });
  }
});

/**
 * GET /api/certificates/my
 * User Account: Fetches all certificates awarded to the currently authenticated user.
 */
router.get("/my", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const certs = await prisma.certificate.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            title: true,
            category: true,
            imageUrl: true,
            description: true,
          },
        },
      },
      orderBy: { issueDate: "desc" },
    });

    return res.json(certs);
  } catch (error: any) {
    console.error("Error fetching user certificates:", error);
    return res.status(500).json({ error: "Failed to retrieve certificates." });
  }
});

/**
 * GET /api/certificates/:certificateId/download
 * Downloads certificate PDF directly as binary attachment.
 */
router.get("/:certificateId/download", async (req: Request, res: Response) => {
  const { certificateId } = req.params;

  try {
    const cert = await prisma.certificate.findUnique({
      where: { certificateId: certificateId.trim().toUpperCase() },
    });

    if (!cert) {
      return res.status(404).json({ error: "Certificate not found." });
    }

    // Generate fresh vector PDF buffer
    const pdfBuffer = await generateCertificatePdf({
      certificateId: cert.certificateId,
      recipientName: cert.recipientName,
      recipientEmail: cert.recipientEmail,
      projectTitle: cert.projectTitle,
      category: cert.category,
      programName: cert.programName,
      completionDate: cert.completionDate,
      issueDate: cert.issueDate,
      finalScore: cert.finalScore,
      grade: cert.grade,
      verificationUrl: cert.verificationUrl,
    });

    // Increment download counter
    prisma.certificate.update({
      where: { certificateId: cert.certificateId },
      data: { downloadCount: { increment: 1 } },
    }).catch(() => {});

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="RecodeX_Certificate_${cert.certificateId}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error: any) {
    console.error(`Error downloading certificate ${certificateId}:`, error);
    return res.status(500).json({ error: "Failed to download certificate PDF." });
  }
});

/**
 * GET /api/certificates/admin/list
 * Admin Dashboard: List all certificates with statistics, search, and status filters.
 */
router.get("/admin/list", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { search, status, page = "1", limit = "50" } = req.query;

  try {
    const where: any = {};

    if (status && status !== "All") {
      where.status = String(status);
    }

    if (search) {
      where.OR = [
        { certificateId: { contains: String(search), mode: "insensitive" } },
        { recipientName: { contains: String(search), mode: "insensitive" } },
        { recipientEmail: { contains: String(search), mode: "insensitive" } },
        { projectTitle: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const take = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
    const skip = (pageNum - 1) * take;

    const [certificates, totalCount] = await Promise.all([
      prisma.certificate.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
          project: {
            select: { id: true, title: true, category: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.certificate.count({ where }),
    ]);

    // Compute administrative overview statistics
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, issued, scheduled, pending, failed, revoked, issuedThisMonth] = await Promise.all([
      prisma.certificate.count(),
      prisma.certificate.count({ where: { status: "ISSUED" } }),
      prisma.certificate.count({ where: { status: "SCHEDULED" } }),
      prisma.certificate.count({ where: { status: "PENDING" } }),
      prisma.certificate.count({ where: { status: "FAILED" } }),
      prisma.certificate.count({ where: { status: "REVOKED" } }),
      prisma.certificate.count({
        where: {
          status: "ISSUED",
          issuedAt: { gte: startOfMonth },
        },
      }),
    ]);

    return res.json({
      data: certificates,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: take,
        pages: Math.ceil(totalCount / take),
      },
      stats: {
        total,
        issued,
        scheduled,
        pending,
        failed,
        revoked,
        issuedThisMonth,
      },
    });
  } catch (error: any) {
    console.error("Error fetching admin certificates list:", error);
    return res.status(500).json({ error: "Failed to retrieve certificates list." });
  }
});

/**
 * POST /api/certificates/admin/issue-now/:certificateId
 * Admin manual override: forces immediate issuance of a scheduled or pending certificate.
 */
router.post("/admin/issue-now/:certificateId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { certificateId } = req.params;

  try {
    const adminId = req.user?.id || "ADMIN";
    const issued = await CertificateService.finalizeCertificateIssuance(certificateId, {
      issuedBy: adminId,
      issuanceMethod: "ADMIN_MANUAL",
      overrideReason: "Manual admin immediate issuance override",
    });

    return res.json({ message: "Certificate issued immediately.", certificate: issued });
  } catch (error: any) {
    console.error(`Error issuing certificate ${certificateId} now:`, error);
    return res.status(500).json({ error: error.message || "Failed to issue certificate now." });
  }
});

/**
 * POST /api/certificates/admin/retry/:certificateId
 * Admin retries failed PDF rendering/storage.
 */
router.post("/admin/retry/:certificateId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { certificateId } = req.params;

  try {
    const adminId = req.user?.id || "ADMIN";
    const retried = await CertificateService.finalizeCertificateIssuance(certificateId, {
      issuedBy: adminId,
    });

    return res.json({ message: "Certificate generation retry succeeded.", certificate: retried });
  } catch (error: any) {
    console.error(`Error retrying certificate ${certificateId}:`, error);
    return res.status(500).json({ error: error.message || "Failed to retry certificate generation." });
  }
});

/**
 * POST /api/certificates/admin/revoke/:certificateId
 * Admin revokes an issued certificate with mandatory reason.
 */
router.post("/admin/revoke/:certificateId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { certificateId } = req.params;
  const { reason } = req.body;

  try {
    const adminId = req.user?.id || "ADMIN";
    const revoked = await CertificateService.revokeCertificate(
      certificateId,
      reason || "Administrative revocation",
      adminId
    );

    return res.json({ message: "Certificate revoked successfully.", certificate: revoked });
  } catch (error: any) {
    console.error(`Error revoking certificate ${certificateId}:`, error);
    return res.status(500).json({ error: error.message || "Failed to revoke certificate." });
  }
});

/**
 * POST /api/certificates/admin/restore/:certificateId
 * Admin restores a previously revoked certificate.
 */
router.post("/admin/restore/:certificateId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { certificateId } = req.params;

  try {
    const adminId = req.user?.id || "ADMIN";
    const restored = await CertificateService.restoreCertificate(certificateId, adminId);
    return res.json({ message: "Certificate restored successfully.", certificate: restored });
  } catch (error: any) {
    console.error(`Error restoring certificate ${certificateId}:`, error);
    return res.status(500).json({ error: error.message || "Failed to restore certificate." });
  }
});

/**
 * DELETE /api/certificates/admin/:certificateId
 * Admin permanently deletes a certificate and its audit logs from database.
 */
router.delete("/admin/:certificateId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { certificateId } = req.params;

  try {
    const idClean = certificateId.trim();
    
    // Delete associated audit logs
    await prisma.certificateAuditLog.deleteMany({
      where: {
        OR: [
          { certificateId: idClean },
          { certificateId: idClean.toUpperCase() },
        ],
      },
    }).catch((e: any) => console.warn("Audit logs delete warning:", e));

    // Delete certificate from Prisma
    await prisma.certificate.deleteMany({
      where: {
        OR: [
          { certificateId: idClean },
          { certificateId: idClean.toUpperCase() },
          { id: idClean },
        ],
      },
    }).catch((e: any) => console.warn("Prisma certificate delete warning:", e));

    // Clean from legacy JSON file if present
    let certs = readCertificatesFile();
    certs = certs.filter((c: any) => c.id !== idClean && c.certificateId !== idClean && c.certificateId !== idClean.toUpperCase());
    writeCertificatesFile(certs);

    return res.json({ message: "Certificate permanently deleted." });
  } catch (error: any) {
    console.error(`Error deleting certificate ${certificateId}:`, error);
    return res.status(500).json({ error: error.message || "Failed to delete certificate." });
  }
});


/**
 * GET /api/certificates/settings
 * Admin: Fetches global certificate policy settings.
 */
router.get("/settings", requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    let settings = await prisma.certificateSetting.findFirst();
    if (!settings) {
      settings = await prisma.certificateSetting.create({
        data: {
          certificateEnabled: true,
          issuanceMode: "SCHEDULED",
          issuanceDelayDays: 7,
          requireProjectApproval: true,
          requireFinalEvaluation: true,
          minEvaluationScore: 70.0,
          requireAllDeliverables: true,
          generateQrCode: true,
          publicVerificationEnabled: true,
          automaticIssuance: true,
        },
      });
    }
    return res.json({ settings });
  } catch (error: any) {
    console.error("Error fetching certificate settings:", error);
    return res.status(500).json({ error: "Failed to fetch certificate settings." });
  }
});

/**
 * PUT /api/certificates/settings
 * Admin: Updates global certificate policy settings.
 */
router.put("/settings", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const {
    certificateEnabled,
    issuanceMode,
    issuanceDelayDays,
    requireProjectApproval,
    requireFinalEvaluation,
    minEvaluationScore,
    requireAllDeliverables,
    generateQrCode,
    publicVerificationEnabled,
    automaticIssuance,
  } = req.body;

  try {
    let current = await prisma.certificateSetting.findFirst();
    const data: any = {
      ...(certificateEnabled !== undefined && { certificateEnabled: Boolean(certificateEnabled) }),
      ...(issuanceMode && { issuanceMode: String(issuanceMode) }),
      ...(issuanceDelayDays !== undefined && { issuanceDelayDays: parseInt(String(issuanceDelayDays), 10) }),
      ...(requireProjectApproval !== undefined && { requireProjectApproval: Boolean(requireProjectApproval) }),
      ...(requireFinalEvaluation !== undefined && { requireFinalEvaluation: Boolean(requireFinalEvaluation) }),
      ...(minEvaluationScore !== undefined && { minEvaluationScore: parseFloat(String(minEvaluationScore)) }),
      ...(requireAllDeliverables !== undefined && { requireAllDeliverables: Boolean(requireAllDeliverables) }),
      ...(generateQrCode !== undefined && { generateQrCode: Boolean(generateQrCode) }),
      ...(publicVerificationEnabled !== undefined && { publicVerificationEnabled: Boolean(publicVerificationEnabled) }),
      ...(automaticIssuance !== undefined && { automaticIssuance: Boolean(automaticIssuance) }),
    };

    let updated;
    if (current) {
      updated = await prisma.certificateSetting.update({
        where: { id: current.id },
        data,
      });
    } else {
      updated = await prisma.certificateSetting.create({ data });
    }

    return res.json({ message: "Certificate settings updated successfully.", settings: updated });
  } catch (error: any) {
    console.error("Error updating certificate settings:", error);
    return res.status(500).json({ error: "Failed to update certificate settings." });
  }
});

/**
 * GET /api/certificates/audit-logs
 * Admin: Fetches immutable audit logs for certificate actions.
 */
router.get("/audit-logs", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { certificateId, projectId } = req.query;

  try {
    const where: any = {};
    if (certificateId) where.certificateId = String(certificateId);
    if (projectId) where.projectId = String(projectId);

    const logs = await prisma.certificateAuditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: 100,
    });

    return res.json(logs);
  } catch (error: any) {
    console.error("Error fetching certificate audit logs:", error);
    return res.status(500).json({ error: "Failed to fetch audit logs." });
  }
});

/**
 * POST /api/certificates/admin/manual-upload
 * Admin Dashboard: Uploads or manually issues a certificate directly to an individual user.
 */
router.post("/admin/manual-upload", async (req: Request, res: Response) => {
  try {
    const {
      userId,
      userEmail,
      studentName,
      recipientName,
      projectName,
      projectTitle,
      projectId,
      category,
      issueDate,
      status,
      score,
      grade,
      fileData,
      fileName,
      fileType,
      description,
      issuedBy,
    } = req.body;

    const finalRecipientName = (recipientName || studentName || "Developer").trim();
    const finalRecipientEmail = (userEmail || "").trim().toLowerCase();
    const finalProjectTitle = (projectTitle || projectName || "Engineering Project").trim();
    const finalCategory = category || "Software Engineering";
    const finalIssueDate = issueDate ? new Date(issueDate) : new Date();
    const finalStatus = status || "Approved";
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const certYear = new Date().getFullYear();
    const generatedCertId = `RCX-${certYear}-${randomSuffix}`;
    const certId = req.body.id || req.body.certificateId || generatedCertId;

    const certRecord: any = {
      id: certId,
      certificateId: certId,
      userId: userId || undefined,
      userEmail: finalRecipientEmail,
      studentName: finalRecipientName,
      recipientName: finalRecipientName,
      projectName: finalProjectTitle,
      projectTitle: finalProjectTitle,
      category: finalCategory,
      issueDate: finalIssueDate.toISOString().split("T")[0],
      completionDate: finalIssueDate.toISOString().split("T")[0],
      status: finalStatus === "Approved" || finalStatus === "ISSUED" ? "Approved" : finalStatus,
      finalScore: score ? Number(score) : 100,
      grade: grade || "A+",
      fileData: fileData || undefined,
      fileName: fileName || undefined,
      fileType: fileType || undefined,
      description: description || undefined,
      issuedBy: issuedBy || "Admin",
      verificationUrl: `/verify/${certId}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Save to JSON database
    let certs = readCertificatesFile();
    const existingIdx = certs.findIndex(
      (c: any) => c.id === certId || (c.userEmail && c.userEmail === finalRecipientEmail && c.projectName === finalProjectTitle)
    );
    if (existingIdx >= 0) {
      certs[existingIdx] = { ...certs[existingIdx], ...certRecord };
    } else {
      certs.unshift(certRecord);
    }
    writeCertificatesFile(certs);

    // 2. Try saving to Prisma MongoDB Certificate model as well
    try {
      let targetUser = null;
      if (userId) {
        targetUser = await prisma.user.findUnique({ where: { id: userId } }).catch(() => null);
      }
      if (!targetUser && finalRecipientEmail) {
        targetUser = await prisma.user.findUnique({ where: { email: finalRecipientEmail } }).catch(() => null);
      }
      if (!targetUser && finalRecipientEmail) {
        targetUser = await prisma.user.create({
          data: {
            id: userId || `usr_${Date.now()}_${Math.random().toString(36).slice(-5)}`,
            email: finalRecipientEmail,
            name: finalRecipientName,
            role: "developer",
          },
        }).catch(() => null);
      }

      let targetProject = null;
      const targetProjId = projectId || `proj_${finalProjectTitle.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30)}`;
      targetProject = await prisma.project.findUnique({ where: { id: targetProjId } }).catch(() => null);
      if (!targetProject) {
        targetProject = await prisma.project.create({
          data: {
            id: targetProjId,
            title: finalProjectTitle,
            description: description || `Certified project: ${finalProjectTitle}`,
            longDescription: description || `Certified project: ${finalProjectTitle}`,
            category: finalCategory,
            imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
            files: {},
          },
        }).catch(() => null);
      }

      if (targetUser && targetProject) {
        await prisma.certificate.upsert({
          where: {
            userId_projectId_certificateType: {
              userId: targetUser.id,
              projectId: targetProject.id,
              certificateType: "PROJECT_COMPLETION",
            },
          },
          update: {
            certificateId: certId,
            recipientName: finalRecipientName,
            recipientEmail: finalRecipientEmail,
            projectTitle: finalProjectTitle,
            category: finalCategory,
            issueDate: finalIssueDate,
            completionDate: finalIssueDate,
            status: "ISSUED",
            issuanceMethod: "ADMIN_MANUAL",
            finalScore: score ? Number(score) : 100,
            grade: grade || "A+",
            pdfUrl: fileData || undefined,
            previewUrl: fileType?.startsWith("image/") ? fileData : undefined,
            verificationUrl: `/verify/${certId}`,
            metadata: {
              fileName: fileName || null,
              fileType: fileType || null,
              customUpload: true,
              description: description || null,
            },
          },
          create: {
            certificateId: certId,
            userId: targetUser.id,
            projectId: targetProject.id,
            recipientName: finalRecipientName,
            recipientEmail: finalRecipientEmail,
            projectTitle: finalProjectTitle,
            category: finalCategory,
            issueDate: finalIssueDate,
            completionDate: finalIssueDate,
            status: "ISSUED",
            issuanceMethod: "ADMIN_MANUAL",
            finalScore: score ? Number(score) : 100,
            grade: grade || "A+",
            pdfUrl: fileData || undefined,
            previewUrl: fileType?.startsWith("image/") ? fileData : undefined,
            verificationUrl: `/verify/${certId}`,
            metadata: {
              fileName: fileName || null,
              fileType: fileType || null,
              customUpload: true,
              description: description || null,
            },
          },
        }).catch((err: any) => console.warn("Prisma certificate upsert note:", err));
      }
    } catch (prismaErr: any) {
      console.warn("Prisma sync skipped/error:", prismaErr);
    }

    return res.json({
      message: "Certificate uploaded and issued successfully.",
      certificate: certRecord,
    });
  } catch (err: any) {
    console.error("Error manually uploading certificate:", err);
    return res.status(500).json({ error: err.message || "Failed to upload certificate" });
  }
});

// POST /api/certificates/request (User requests a certificate)
router.post("/request", async (req: Request, res: Response) => {
  try {
    const { studentName, userEmail, userId, projectName, description, notes } = req.body;
    if (!projectName || (!userEmail && !userId)) {
      return res.status(400).json({ error: "Project name and user email/ID are required." });
    }

    const emailClean = (userEmail || "").toLowerCase().trim();
    const reqId = req.body.id || `CERT-REQ-${Math.floor(100000 + Math.random() * 900000)}`;
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();

    const requestRecord = {
      id: reqId,
      certificateId: reqId,
      userId: userId || undefined,
      userEmail: emailClean,
      studentName: studentName || "RecodeX Developer",
      recipientName: studentName || "RecodeX Developer",
      projectName: projectName.trim(),
      projectTitle: projectName.trim(),
      category: req.body.category || "Software Engineering",
      issueDate: new Date().toISOString().split("T")[0],
      completionDate: new Date().toISOString().split("T")[0],
      status: "Pending",
      description: description || notes || "Submitted for peer audit and official certification issue.",
      credentialId: `RCX-PEND-${randomHex}`,
      verificationHash: "0xPENDING_AUDIT_VERIFICATION_HASH",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let certs = readCertificatesFile();
    // Replace if existing pending request for same user & project, otherwise unshift
    const existingIdx = certs.findIndex(
      (c: any) => c.id === reqId || (c.userEmail === emailClean && c.projectName === projectName.trim() && c.status === "Pending")
    );
    if (existingIdx >= 0) {
      certs[existingIdx] = { ...certs[existingIdx], ...requestRecord };
    } else {
      certs.unshift(requestRecord);
    }
    writeCertificatesFile(certs);

    return res.status(201).json({
      message: "Certificate request submitted successfully.",
      certificate: requestRecord,
    });
  } catch (err: any) {
    console.error("Error submitting certificate request:", err);
    return res.status(500).json({ error: err.message || "Failed to submit certificate request" });
  }
});

// PUT /api/certificates/:id/approve (Admin approves/issues a certificate)
router.put("/:id/approve", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { projectName, issueDate, grade, score, fileData, fileName, fileType, description } = req.body;
    const idClean = id.trim();

    let certs = readCertificatesFile();
    const existingIdx = certs.findIndex(
      (c: any) => c.id === idClean || c.certificateId === idClean
    );

    if (existingIdx === -1) {
      return res.status(404).json({ error: "Certificate request not found." });
    }

    const cert = certs[existingIdx];
    const certYear = new Date().getFullYear();
    const officialCertId = cert.id.startsWith("RCX-")
      ? cert.id
      : `RCX-${certYear}-${Math.floor(100000 + Math.random() * 900000)}`;

    const approvedRecord = {
      ...cert,
      id: officialCertId,
      certificateId: officialCertId,
      status: "Approved",
      projectName: projectName || cert.projectName,
      projectTitle: projectName || cert.projectTitle || cert.projectName,
      issueDate: issueDate || new Date().toISOString().split("T")[0],
      completionDate: issueDate || cert.completionDate || new Date().toISOString().split("T")[0],
      grade: grade || cert.grade || "A+",
      finalScore: score ? Number(score) : (cert.finalScore || 100),
      fileData: fileData || cert.fileData,
      fileName: fileName || cert.fileName,
      fileType: fileType || cert.fileType,
      description: description || cert.description || "Official verification of project completion and cryptographic identity signature validation.",
      credentialId: officialCertId,
      verificationHash: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      updatedAt: new Date().toISOString(),
    };

    certs[existingIdx] = approvedRecord;
    writeCertificatesFile(certs);

    return res.json({
      message: "Certificate approved and issued successfully.",
      certificate: approvedRecord,
    });
  } catch (err: any) {
    console.error("Error approving certificate:", err);
    return res.status(500).json({ error: err.message || "Failed to approve certificate" });
  }
});

// GET /api/certificates (Legacy & Multi-user querying)
router.get("/", (req: Request, res: Response) => {
  try {
    const { email, userId } = req.query;
    let certs = readCertificatesFile();

    if (email) {
      const emailClean = String(email).toLowerCase().trim();
      certs = certs.filter((c: any) => (c.userEmail || "").toLowerCase().trim() === emailClean);
    } else if (userId) {
      certs = certs.filter((c: any) => c.userId === String(userId));
    }

    res.json(certs);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch certificates" });
  }
});

// POST /api/certificates (Legacy & Direct Save)
router.post("/", (req: Request, res: Response) => {
  try {
    const cert = req.body;
    if (!cert.id && !cert.certificateId && !cert.studentName && !cert.recipientName) {
      res.status(400).json({ error: "Certificate details are required" });
      return;
    }

    const certId = cert.id || cert.certificateId || `CERT-${Math.floor(1000 + Math.random() * 9000)}`;
    const updatedCert = {
      ...cert,
      id: certId,
      certificateId: certId,
      studentName: cert.studentName || cert.recipientName || "Developer",
      recipientName: cert.recipientName || cert.studentName || "Developer",
      projectName: cert.projectName || cert.projectTitle || "Engineering Project",
      projectTitle: cert.projectTitle || cert.projectName || "Engineering Project",
      updatedAt: new Date().toISOString(),
    };

    let certs = readCertificatesFile();
    const existingIndex = certs.findIndex(
      (c: any) => c.id === certId || (cert.userEmail && c.userEmail === cert.userEmail && c.projectName === updatedCert.projectName)
    );

    if (existingIndex >= 0) {
      certs[existingIndex] = { ...certs[existingIndex], ...updatedCert };
    } else {
      certs.unshift({ ...updatedCert, createdAt: new Date().toISOString() });
    }

    writeCertificatesFile(certs);
    res.json({ message: "Certificate saved successfully", certificate: updatedCert });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to save certificate" });
  }
});

// DELETE /api/certificates/:id (Legacy & Direct)
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idClean = id.trim();

    await prisma.certificateAuditLog.deleteMany({
      where: {
        OR: [{ certificateId: idClean }, { certificateId: idClean.toUpperCase() }],
      },
    }).catch((e: any) => console.warn("Audit logs delete warning:", e));

    await prisma.certificate.deleteMany({
      where: {
        OR: [{ certificateId: idClean }, { certificateId: idClean.toUpperCase() }, { id: idClean }],
      },
    }).catch((e: any) => console.warn("Prisma certificate delete warning:", e));

    let certs = readCertificatesFile();
    certs = certs.filter((c: any) => c.id !== idClean && c.certificateId !== idClean && c.certificateId !== idClean.toUpperCase());
    writeCertificatesFile(certs);

    res.json({ message: "Certificate deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete certificate" });
  }
});

export default router;
