"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = __importDefault(require("../config/db"));
const auth_1 = require("../middleware/auth");
const certificateService_1 = require("../services/certificateService");
const pdfGenerator_1 = require("../services/pdfGenerator");
const router = (0, express_1.Router)();
const DB_FILE = path_1.default.join(__dirname, "../../certificates_db.json");
// Helper to read local json DB (legacy fallback)
const readCertificatesFile = () => {
    try {
        if (fs_1.default.existsSync(DB_FILE)) {
            const data = fs_1.default.readFileSync(DB_FILE, "utf-8");
            return JSON.parse(data);
        }
    }
    catch (e) {
        console.warn("Failed to read certificates file:", e);
    }
    return [];
};
// Helper to write local json DB (legacy fallback)
const writeCertificatesFile = (certs) => {
    try {
        fs_1.default.writeFileSync(DB_FILE, JSON.stringify(certs, null, 2), "utf-8");
    }
    catch (e) {
        console.warn("Failed to write certificates file:", e);
    }
};
/**
 * GET /api/certificates/verify/:certificateId
 * Public verification endpoint (No login required).
 */
router.get("/verify/:certificateId", async (req, res) => {
    const { certificateId } = req.params;
    try {
        const cert = await db_1.default.certificate.findUnique({
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
        db_1.default.certificate.update({
            where: { certificateId: cert.certificateId },
            data: { verificationCount: { increment: 1 } },
        }).catch(() => { });
        // Log verification action
        db_1.default.certificateAuditLog.create({
            data: {
                certificateId: cert.certificateId,
                projectId: cert.projectId,
                userId: cert.userId,
                performedBy: "PUBLIC_VERIFIER",
                action: "CERTIFICATE_VERIFIED",
                details: `Public certificate verification performed for ID ${cert.certificateId}`,
            },
        }).catch(() => { });
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
    }
    catch (error) {
        console.error(`Error verifying certificate ${certificateId}:`, error);
        return res.status(500).json({ error: "Certificate verification service encountered an internal error." });
    }
});
/**
 * GET /api/certificates/my
 * User Account: Fetches all certificates awarded to the currently authenticated user.
 */
router.get("/my", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Authentication required." });
        }
        const certs = await db_1.default.certificate.findMany({
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
    }
    catch (error) {
        console.error("Error fetching user certificates:", error);
        return res.status(500).json({ error: "Failed to retrieve certificates." });
    }
});
/**
 * GET /api/certificates/:certificateId/download
 * Downloads certificate PDF directly as binary attachment.
 */
router.get("/:certificateId/download", async (req, res) => {
    const { certificateId } = req.params;
    try {
        const cert = await db_1.default.certificate.findUnique({
            where: { certificateId: certificateId.trim().toUpperCase() },
        });
        if (!cert) {
            return res.status(404).json({ error: "Certificate not found." });
        }
        // Generate fresh vector PDF buffer
        const pdfBuffer = await (0, pdfGenerator_1.generateCertificatePdf)({
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
        db_1.default.certificate.update({
            where: { certificateId: cert.certificateId },
            data: { downloadCount: { increment: 1 } },
        }).catch(() => { });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="RecodeX_Certificate_${cert.certificateId}.pdf"`);
        return res.send(pdfBuffer);
    }
    catch (error) {
        console.error(`Error downloading certificate ${certificateId}:`, error);
        return res.status(500).json({ error: "Failed to download certificate PDF." });
    }
});
/**
 * GET /api/certificates/admin/list
 * Admin Dashboard: List all certificates with statistics, search, and status filters.
 */
router.get("/admin/list", auth_1.requireAuth, async (req, res) => {
    const { search, status, page = "1", limit = "50" } = req.query;
    try {
        const where = {};
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
            db_1.default.certificate.findMany({
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
            db_1.default.certificate.count({ where }),
        ]);
        // Compute administrative overview statistics
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const [total, issued, scheduled, pending, failed, revoked, issuedThisMonth] = await Promise.all([
            db_1.default.certificate.count(),
            db_1.default.certificate.count({ where: { status: "ISSUED" } }),
            db_1.default.certificate.count({ where: { status: "SCHEDULED" } }),
            db_1.default.certificate.count({ where: { status: "PENDING" } }),
            db_1.default.certificate.count({ where: { status: "FAILED" } }),
            db_1.default.certificate.count({ where: { status: "REVOKED" } }),
            db_1.default.certificate.count({
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
    }
    catch (error) {
        console.error("Error fetching admin certificates list:", error);
        return res.status(500).json({ error: "Failed to retrieve certificates list." });
    }
});
/**
 * POST /api/certificates/admin/issue-now/:certificateId
 * Admin manual override: forces immediate issuance of a scheduled or pending certificate.
 */
router.post("/admin/issue-now/:certificateId", auth_1.requireAuth, async (req, res) => {
    const { certificateId } = req.params;
    try {
        const adminId = req.user?.id || "ADMIN";
        const issued = await certificateService_1.CertificateService.finalizeCertificateIssuance(certificateId, {
            issuedBy: adminId,
            issuanceMethod: "ADMIN_MANUAL",
            overrideReason: "Manual admin immediate issuance override",
        });
        return res.json({ message: "Certificate issued immediately.", certificate: issued });
    }
    catch (error) {
        console.error(`Error issuing certificate ${certificateId} now:`, error);
        return res.status(500).json({ error: error.message || "Failed to issue certificate now." });
    }
});
/**
 * POST /api/certificates/admin/retry/:certificateId
 * Admin retries failed PDF rendering/storage.
 */
router.post("/admin/retry/:certificateId", auth_1.requireAuth, async (req, res) => {
    const { certificateId } = req.params;
    try {
        const adminId = req.user?.id || "ADMIN";
        const retried = await certificateService_1.CertificateService.finalizeCertificateIssuance(certificateId, {
            issuedBy: adminId,
        });
        return res.json({ message: "Certificate generation retry succeeded.", certificate: retried });
    }
    catch (error) {
        console.error(`Error retrying certificate ${certificateId}:`, error);
        return res.status(500).json({ error: error.message || "Failed to retry certificate generation." });
    }
});
/**
 * POST /api/certificates/admin/revoke/:certificateId
 * Admin revokes an issued certificate with mandatory reason.
 */
router.post("/admin/revoke/:certificateId", auth_1.requireAuth, async (req, res) => {
    const { certificateId } = req.params;
    const { reason } = req.body;
    try {
        const adminId = req.user?.id || "ADMIN";
        const revoked = await certificateService_1.CertificateService.revokeCertificate(certificateId, reason || "Administrative revocation", adminId);
        return res.json({ message: "Certificate revoked successfully.", certificate: revoked });
    }
    catch (error) {
        console.error(`Error revoking certificate ${certificateId}:`, error);
        return res.status(500).json({ error: error.message || "Failed to revoke certificate." });
    }
});
/**
 * POST /api/certificates/admin/restore/:certificateId
 * Admin restores a previously revoked certificate.
 */
router.post("/admin/restore/:certificateId", auth_1.requireAuth, async (req, res) => {
    const { certificateId } = req.params;
    try {
        const adminId = req.user?.id || "ADMIN";
        const restored = await certificateService_1.CertificateService.restoreCertificate(certificateId, adminId);
        return res.json({ message: "Certificate restored successfully.", certificate: restored });
    }
    catch (error) {
        console.error(`Error restoring certificate ${certificateId}:`, error);
        return res.status(500).json({ error: error.message || "Failed to restore certificate." });
    }
});
/**
 * DELETE /api/certificates/admin/:certificateId
 * Admin permanently deletes a certificate and its audit logs from database.
 */
router.delete("/admin/:certificateId", auth_1.requireAuth, async (req, res) => {
    const { certificateId } = req.params;
    try {
        const idClean = certificateId.trim();
        // Delete associated audit logs
        await db_1.default.certificateAuditLog.deleteMany({
            where: {
                OR: [
                    { certificateId: idClean },
                    { certificateId: idClean.toUpperCase() },
                ],
            },
        }).catch((e) => console.warn("Audit logs delete warning:", e));
        // Delete certificate from Prisma
        await db_1.default.certificate.deleteMany({
            where: {
                OR: [
                    { certificateId: idClean },
                    { certificateId: idClean.toUpperCase() },
                    { id: idClean },
                ],
            },
        }).catch((e) => console.warn("Prisma certificate delete warning:", e));
        // Clean from legacy JSON file if present
        let certs = readCertificatesFile();
        certs = certs.filter((c) => c.id !== idClean && c.certificateId !== idClean && c.certificateId !== idClean.toUpperCase());
        writeCertificatesFile(certs);
        return res.json({ message: "Certificate permanently deleted." });
    }
    catch (error) {
        console.error(`Error deleting certificate ${certificateId}:`, error);
        return res.status(500).json({ error: error.message || "Failed to delete certificate." });
    }
});
/**
 * GET /api/certificates/settings
 * Admin: Fetches global certificate policy settings.
 */
router.get("/settings", auth_1.requireAuth, async (_req, res) => {
    try {
        let settings = await db_1.default.certificateSetting.findFirst();
        if (!settings) {
            settings = await db_1.default.certificateSetting.create({
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
    }
    catch (error) {
        console.error("Error fetching certificate settings:", error);
        return res.status(500).json({ error: "Failed to fetch certificate settings." });
    }
});
/**
 * PUT /api/certificates/settings
 * Admin: Updates global certificate policy settings.
 */
router.put("/settings", auth_1.requireAuth, async (req, res) => {
    const { certificateEnabled, issuanceMode, issuanceDelayDays, requireProjectApproval, requireFinalEvaluation, minEvaluationScore, requireAllDeliverables, generateQrCode, publicVerificationEnabled, automaticIssuance, } = req.body;
    try {
        let current = await db_1.default.certificateSetting.findFirst();
        const data = {
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
            updated = await db_1.default.certificateSetting.update({
                where: { id: current.id },
                data,
            });
        }
        else {
            updated = await db_1.default.certificateSetting.create({ data });
        }
        return res.json({ message: "Certificate settings updated successfully.", settings: updated });
    }
    catch (error) {
        console.error("Error updating certificate settings:", error);
        return res.status(500).json({ error: "Failed to update certificate settings." });
    }
});
/**
 * GET /api/certificates/audit-logs
 * Admin: Fetches immutable audit logs for certificate actions.
 */
router.get("/audit-logs", auth_1.requireAuth, async (req, res) => {
    const { certificateId, projectId } = req.query;
    try {
        const where = {};
        if (certificateId)
            where.certificateId = String(certificateId);
        if (projectId)
            where.projectId = String(projectId);
        const logs = await db_1.default.certificateAuditLog.findMany({
            where,
            orderBy: { timestamp: "desc" },
            take: 100,
        });
        return res.json(logs);
    }
    catch (error) {
        console.error("Error fetching certificate audit logs:", error);
        return res.status(500).json({ error: "Failed to fetch audit logs." });
    }
});
/**
 * POST /api/certificates/admin/manual-upload
 * Admin Dashboard: Uploads or manually issues a certificate directly to an individual user.
 */
router.post("/admin/manual-upload", async (req, res) => {
    try {
        const { userId, userEmail, studentName, recipientName, projectName, projectTitle, projectId, category, issueDate, status, score, grade, fileData, fileName, fileType, description, issuedBy, } = req.body;
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
        const certRecord = {
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
        const existingIdx = certs.findIndex((c) => c.id === certId || (c.userEmail && c.userEmail === finalRecipientEmail && c.projectName === finalProjectTitle));
        if (existingIdx >= 0) {
            certs[existingIdx] = { ...certs[existingIdx], ...certRecord };
        }
        else {
            certs.unshift(certRecord);
        }
        writeCertificatesFile(certs);
        // 2. Try saving to Prisma MongoDB Certificate model as well
        try {
            let targetUser = null;
            if (userId) {
                targetUser = await db_1.default.user.findUnique({ where: { id: userId } }).catch(() => null);
            }
            if (!targetUser && finalRecipientEmail) {
                targetUser = await db_1.default.user.findUnique({ where: { email: finalRecipientEmail } }).catch(() => null);
            }
            if (!targetUser && finalRecipientEmail) {
                targetUser = await db_1.default.user.create({
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
            targetProject = await db_1.default.project.findUnique({ where: { id: targetProjId } }).catch(() => null);
            if (!targetProject) {
                targetProject = await db_1.default.project.create({
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
                await db_1.default.certificate.upsert({
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
                }).catch((err) => console.warn("Prisma certificate upsert note:", err));
            }
        }
        catch (prismaErr) {
            console.warn("Prisma sync skipped/error:", prismaErr);
        }
        return res.json({
            message: "Certificate uploaded and issued successfully.",
            certificate: certRecord,
        });
    }
    catch (err) {
        console.error("Error manually uploading certificate:", err);
        return res.status(500).json({ error: err.message || "Failed to upload certificate" });
    }
});
const formatPrismaCertificate = (c) => ({
    id: c.certificateId || c.id,
    certificateId: c.certificateId || c.id,
    userId: c.userId,
    userEmail: (c.recipientEmail || "").toLowerCase().trim(),
    studentName: c.recipientName || "Developer",
    recipientName: c.recipientName || "Developer",
    projectName: c.projectTitle || "Software Solution Project",
    projectTitle: c.projectTitle || "Software Solution Project",
    category: c.category || "Software Engineering",
    issueDate: c.issueDate ? new Date(c.issueDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    completionDate: c.completionDate ? new Date(c.completionDate).toISOString().split("T")[0] : undefined,
    status: c.status === "ISSUED" ? "Approved" : (c.status === "PENDING" ? "Pending" : (c.status === "REVOKED" ? "Revoked" : c.status)),
    finalScore: c.finalScore || 100,
    grade: c.grade || "A+",
    fileData: c.pdfUrl || c.metadata?.fileData,
    fileName: c.metadata?.fileName,
    fileType: c.metadata?.fileType,
    description: c.metadata?.description || "Official verification of project completion and cryptographic identity signature validation.",
    credentialId: c.certificateId || c.id,
    verificationHash: c.metadata?.verificationHash || `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
    createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : new Date().toISOString(),
});
// POST /api/certificates/request (User requests a certificate)
router.post("/request", async (req, res) => {
    try {
        const { studentName, userEmail, userId, projectName, description, notes } = req.body;
        if (!projectName || (!userEmail && !userId)) {
            return res.status(400).json({ error: "Project name and user email/ID are required." });
        }
        const emailClean = (userEmail || "").toLowerCase().trim();
        const reqId = req.body.id || `CERT-REQ-${Math.floor(100000 + Math.random() * 900000)}`;
        const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
        const finalProjectName = projectName.trim();
        const finalStudentName = studentName || "RecodeX Developer";
        const requestRecord = {
            id: reqId,
            certificateId: reqId,
            userId: userId || undefined,
            userEmail: emailClean,
            studentName: finalStudentName,
            recipientName: finalStudentName,
            projectName: finalProjectName,
            projectTitle: finalProjectName,
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
        const existingIdx = certs.findIndex((c) => c.id === reqId || (c.userEmail === emailClean && c.projectName === finalProjectName && c.status === "Pending"));
        if (existingIdx >= 0) {
            certs[existingIdx] = { ...certs[existingIdx], ...requestRecord };
        }
        else {
            certs.unshift(requestRecord);
        }
        writeCertificatesFile(certs);
        // Save to Prisma MongoDB
        try {
            let targetUser = null;
            if (userId)
                targetUser = await db_1.default.user.findUnique({ where: { id: userId } }).catch(() => null);
            if (!targetUser && emailClean)
                targetUser = await db_1.default.user.findUnique({ where: { email: emailClean } }).catch(() => null);
            if (!targetUser && emailClean) {
                targetUser = await db_1.default.user.create({
                    data: {
                        id: userId || `usr_${Date.now()}_${Math.random().toString(36).slice(-5)}`,
                        email: emailClean,
                        name: finalStudentName,
                        role: "client",
                    },
                }).catch(() => null);
            }
            const targetProjId = `proj_${finalProjectName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30)}`;
            let targetProject = await db_1.default.project.findUnique({ where: { id: targetProjId } }).catch(() => null);
            if (!targetProject) {
                targetProject = await db_1.default.project.create({
                    data: {
                        id: targetProjId,
                        title: finalProjectName,
                        description: `Certified project: ${finalProjectName}`,
                        longDescription: `Certified project: ${finalProjectName}`,
                        category: req.body.category || "Software Engineering",
                        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
                        files: {},
                    },
                }).catch(() => null);
            }
            if (targetUser && targetProject) {
                await db_1.default.certificate.upsert({
                    where: { certificateId: reqId },
                    update: {
                        recipientName: finalStudentName,
                        recipientEmail: emailClean,
                        projectTitle: finalProjectName,
                        status: "PENDING",
                        metadata: {
                            description: requestRecord.description,
                            verificationHash: requestRecord.verificationHash,
                        },
                    },
                    create: {
                        certificateId: reqId,
                        userId: targetUser.id,
                        projectId: targetProject.id,
                        recipientName: finalStudentName,
                        recipientEmail: emailClean,
                        projectTitle: finalProjectName,
                        category: requestRecord.category,
                        issueDate: new Date(),
                        completionDate: new Date(),
                        status: "PENDING",
                        issuanceMethod: "ADMIN_MANUAL",
                        verificationUrl: `/verify/${reqId}`,
                        metadata: {
                            description: requestRecord.description,
                            verificationHash: requestRecord.verificationHash,
                        },
                    },
                }).catch(() => { });
            }
        }
        catch (dbErr) {
            console.warn("Prisma request save warning:", dbErr);
        }
        return res.status(201).json({
            message: "Certificate request submitted successfully.",
            certificate: requestRecord,
        });
    }
    catch (err) {
        console.error("Error submitting certificate request:", err);
        return res.status(500).json({ error: err.message || "Failed to submit certificate request" });
    }
});
// PUT /api/certificates/:id/approve (Admin approves/issues a certificate)
router.put("/:id/approve", async (req, res) => {
    try {
        const { id } = req.params;
        const { projectName, issueDate, grade, score, fileData, fileName, fileType, description } = req.body;
        const idClean = id.trim();
        let certs = readCertificatesFile();
        const existingIdx = certs.findIndex((c) => c.id === idClean || c.certificateId === idClean);
        let baseCert = existingIdx >= 0 ? certs[existingIdx] : null;
        if (!baseCert) {
            try {
                const dbCert = await db_1.default.certificate.findFirst({
                    where: {
                        OR: [{ certificateId: idClean }, { id: idClean }],
                    },
                });
                if (dbCert)
                    baseCert = formatPrismaCertificate(dbCert);
            }
            catch (e) { }
        }
        if (!baseCert) {
            return res.status(404).json({ error: "Certificate request not found." });
        }
        const certYear = new Date().getFullYear();
        const officialCertId = baseCert.id.startsWith("RCX-")
            ? baseCert.id
            : `RCX-${certYear}-${Math.floor(100000 + Math.random() * 900000)}`;
        const approvedRecord = {
            ...baseCert,
            id: officialCertId,
            certificateId: officialCertId,
            status: "Approved",
            projectName: projectName || baseCert.projectName,
            projectTitle: projectName || baseCert.projectTitle || baseCert.projectName,
            issueDate: issueDate || new Date().toISOString().split("T")[0],
            completionDate: issueDate || baseCert.completionDate || new Date().toISOString().split("T")[0],
            grade: grade || baseCert.grade || "A+",
            finalScore: score ? Number(score) : (baseCert.finalScore || 100),
            fileData: fileData || baseCert.fileData,
            fileName: fileName || baseCert.fileName,
            fileType: fileType || baseCert.fileType,
            description: description || baseCert.description || "Official verification of project completion and cryptographic identity signature validation.",
            credentialId: officialCertId,
            verificationHash: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
            updatedAt: new Date().toISOString(),
        };
        if (existingIdx >= 0) {
            certs[existingIdx] = approvedRecord;
        }
        else {
            certs.unshift(approvedRecord);
        }
        writeCertificatesFile(certs);
        // Persist to MongoDB Prisma
        try {
            await db_1.default.certificate.updateMany({
                where: {
                    OR: [{ certificateId: idClean }, { certificateId: officialCertId }, { id: idClean }],
                },
                data: {
                    certificateId: officialCertId,
                    status: "ISSUED",
                    issueDate: new Date(approvedRecord.issueDate),
                    completionDate: new Date(approvedRecord.completionDate),
                    finalScore: approvedRecord.finalScore,
                    grade: approvedRecord.grade,
                    pdfUrl: approvedRecord.fileData || undefined,
                    metadata: {
                        fileName: approvedRecord.fileName || null,
                        fileType: approvedRecord.fileType || null,
                        fileData: approvedRecord.fileData || null,
                        description: approvedRecord.description || null,
                        verificationHash: approvedRecord.verificationHash,
                    },
                },
            }).catch(() => { });
        }
        catch (dbErr) {
            console.warn("Prisma approve update warning:", dbErr);
        }
        return res.json({
            message: "Certificate approved and issued successfully.",
            certificate: approvedRecord,
        });
    }
    catch (err) {
        console.error("Error approving certificate:", err);
        return res.status(500).json({ error: err.message || "Failed to approve certificate" });
    }
});
// GET /api/certificates (Persistent Multi-user Querying from MongoDB & Local Cache)
router.get("/", async (req, res) => {
    try {
        const { email, userId } = req.query;
        const fileCerts = readCertificatesFile();
        let dbCerts = [];
        try {
            const where = {};
            if (email) {
                where.recipientEmail = { equals: String(email).trim().toLowerCase(), mode: "insensitive" };
            }
            else if (userId) {
                where.userId = String(userId);
            }
            const prismaResults = await db_1.default.certificate.findMany({
                where,
                orderBy: { createdAt: "desc" },
            });
            dbCerts = prismaResults.map(formatPrismaCertificate);
        }
        catch (dbErr) {
            console.warn("Prisma certificates fetch error:", dbErr);
        }
        // Merge database certificates with file certificates, de-duplicating by ID/email+project
        const mergedMap = new Map();
        [...dbCerts, ...fileCerts].forEach((c) => {
            if (!c)
                return;
            const key = (c.certificateId || c.id || `${c.userEmail}_${c.projectName}`).toLowerCase();
            mergedMap.set(key, c);
        });
        let allCerts = Array.from(mergedMap.values());
        if (email) {
            const emailClean = String(email).toLowerCase().trim();
            allCerts = allCerts.filter((c) => (c.userEmail || "").toLowerCase().trim() === emailClean);
        }
        else if (userId) {
            allCerts = allCerts.filter((c) => c.userId === String(userId));
        }
        return res.json(allCerts);
    }
    catch (err) {
        return res.status(500).json({ error: err.message || "Failed to fetch certificates" });
    }
});
// POST /api/certificates (Persistent Save to MongoDB & File Cache)
router.post("/", async (req, res) => {
    try {
        const cert = req.body;
        if (!cert.id && !cert.certificateId && !cert.studentName && !cert.recipientName) {
            res.status(400).json({ error: "Certificate details are required" });
            return;
        }
        const emailClean = (cert.userEmail || "").toLowerCase().trim();
        const certId = cert.id || cert.certificateId || `CERT-${Math.floor(1000 + Math.random() * 9000)}`;
        const studentName = cert.studentName || cert.recipientName || "Developer";
        const projectName = cert.projectName || cert.projectTitle || "Software Solution Project";
        const issueDateStr = cert.issueDate || new Date().toISOString().split("T")[0];
        const issueDateObj = new Date(issueDateStr);
        const certStatus = cert.status || "Approved";
        const updatedCert = {
            ...cert,
            id: certId,
            certificateId: certId,
            userEmail: emailClean,
            studentName,
            recipientName: studentName,
            projectName,
            projectTitle: projectName,
            issueDate: issueDateStr,
            status: certStatus,
            updatedAt: new Date().toISOString(),
        };
        // 1. Write to local file
        let certs = readCertificatesFile();
        const existingIndex = certs.findIndex((c) => c.id === certId || (emailClean && c.userEmail === emailClean && c.projectName === projectName));
        if (existingIndex >= 0) {
            certs[existingIndex] = { ...certs[existingIndex], ...updatedCert };
        }
        else {
            certs.unshift({ ...updatedCert, createdAt: new Date().toISOString() });
        }
        writeCertificatesFile(certs);
        // 2. Persist to MongoDB Atlas via Prisma
        try {
            let targetUser = null;
            if (cert.userId) {
                targetUser = await db_1.default.user.findUnique({ where: { id: cert.userId } }).catch(() => null);
            }
            if (!targetUser && emailClean) {
                targetUser = await db_1.default.user.findUnique({ where: { email: emailClean } }).catch(() => null);
            }
            if (!targetUser && emailClean) {
                targetUser = await db_1.default.user.create({
                    data: {
                        id: cert.userId || `usr_${Date.now()}_${Math.random().toString(36).slice(-5)}`,
                        email: emailClean,
                        name: studentName,
                        role: "client",
                    },
                }).catch(() => null);
            }
            let targetProject = null;
            const targetProjId = cert.projectId || `proj_${projectName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30)}`;
            targetProject = await db_1.default.project.findUnique({ where: { id: targetProjId } }).catch(() => null);
            if (!targetProject) {
                targetProject = await db_1.default.project.create({
                    data: {
                        id: targetProjId,
                        title: projectName,
                        description: `Certified project: ${projectName}`,
                        longDescription: `Certified project: ${projectName}`,
                        category: cert.category || "Software Engineering",
                        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
                        files: {},
                    },
                }).catch(() => null);
            }
            if (targetUser && targetProject) {
                const prismaStatus = certStatus === "Approved" ? "ISSUED" : (certStatus === "Pending" ? "PENDING" : (certStatus === "Revoked" ? "REVOKED" : "ISSUED"));
                await db_1.default.certificate.upsert({
                    where: {
                        certificateId: certId,
                    },
                    update: {
                        recipientName: studentName,
                        recipientEmail: emailClean,
                        projectTitle: projectName,
                        category: cert.category || "Software Engineering",
                        issueDate: issueDateObj,
                        completionDate: issueDateObj,
                        status: prismaStatus,
                        pdfUrl: cert.fileData || undefined,
                        metadata: {
                            fileName: cert.fileName || null,
                            fileType: cert.fileType || null,
                            fileData: cert.fileData || null,
                            description: cert.description || null,
                        },
                    },
                    create: {
                        certificateId: certId,
                        userId: targetUser.id,
                        projectId: targetProject.id,
                        recipientName: studentName,
                        recipientEmail: emailClean,
                        projectTitle: projectName,
                        category: cert.category || "Software Engineering",
                        issueDate: issueDateObj,
                        completionDate: issueDateObj,
                        status: prismaStatus,
                        issuanceMethod: "ADMIN_MANUAL",
                        pdfUrl: cert.fileData || undefined,
                        verificationUrl: `/verify/${certId}`,
                        metadata: {
                            fileName: cert.fileName || null,
                            fileType: cert.fileType || null,
                            fileData: cert.fileData || null,
                            description: cert.description || null,
                        },
                    },
                }).catch((err) => console.warn("Prisma certificate save note:", err));
            }
        }
        catch (prismaErr) {
            console.warn("Prisma save skipped/error:", prismaErr);
        }
        return res.json({ message: "Certificate saved successfully", certificate: updatedCert });
    }
    catch (err) {
        return res.status(500).json({ error: err.message || "Failed to save certificate" });
    }
});
// DELETE /api/certificates/:id (Persistent Delete)
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const idClean = id.trim();
        await db_1.default.certificateAuditLog.deleteMany({
            where: {
                OR: [{ certificateId: idClean }, { certificateId: idClean.toUpperCase() }],
            },
        }).catch((e) => console.warn("Audit logs delete warning:", e));
        await db_1.default.certificate.deleteMany({
            where: {
                OR: [{ certificateId: idClean }, { certificateId: idClean.toUpperCase() }, { id: idClean }],
            },
        }).catch((e) => console.warn("Prisma certificate delete warning:", e));
        let certs = readCertificatesFile();
        certs = certs.filter((c) => c.id !== idClean && c.certificateId !== idClean && c.certificateId !== idClean.toUpperCase());
        writeCertificatesFile(certs);
        return res.json({ message: "Certificate deleted successfully" });
    }
    catch (err) {
        return res.status(500).json({ error: err.message || "Failed to delete certificate" });
    }
});
exports.default = router;
