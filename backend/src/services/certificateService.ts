import { PrismaClient } from "@prisma/client";
import { generateCertificateId } from "../utils/certificateId";
import { generateCertificateQrCodeDataUrl } from "./qrGenerator";
import { generateCertificatePdf } from "./pdfGenerator";
import { uploadToCloudinary } from "../config/cloudinary";

const prisma = new PrismaClient();
const BASE_VERIFY_URL = process.env.PUBLIC_VERIFY_URL || "https://recodex.in/verify";

export interface IssueCertificateParams {
  userId: string;
  projectId: string;
  projectAssignmentId?: string;
  submissionId?: string;
  recipientName?: string;
  recipientEmail?: string;
  projectTitle?: string;
  category?: string;
  programName?: string;
  completionDate?: Date;
  issueDate?: Date;
  finalScore?: number;
  grade?: string;
  issuanceMethod?: "ADMIN_MANUAL" | "SCHEDULED" | "AUTOMATIC";
  issuedBy?: string; // adminId or "SYSTEM"
  overrideReason?: string;
  status?: "ISSUED" | "SCHEDULED" | "PENDING";
}

export class CertificateService {
  /**
   * Centralized, idempotent certificate issuance engine.
   * ALL certificate creation paths (Admin manual, Scheduled, Automatic) funnel through this method.
   */
  static async issueCertificate(params: IssueCertificateParams) {
    const {
      userId,
      projectId,
      projectAssignmentId,
      submissionId,
      issuanceMethod = "AUTOMATIC",
      issuedBy = "SYSTEM",
      overrideReason,
      status = "ISSUED",
    } = params;

    // 1. Fetch user & project details for historical snapshot
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error(`User not found with ID: ${userId}`);
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new Error(`Project not found with ID: ${projectId}`);
    }

    const recipientName = params.recipientName || user.name || "Distinguished Developer";
    const recipientEmail = params.recipientEmail || user.email || "";
    const projectTitle = params.projectTitle || project.title;
    const category = params.category || project.category || "Software Systems";
    const programName = params.programName || "RecodeX Developer Marketplace";
    const completionDate = params.completionDate || new Date();
    const issueDate = params.issueDate || (status === "ISSUED" ? new Date() : new Date(Date.now() + 7 * 86400000));
    const finalScore = params.finalScore !== undefined ? params.finalScore : 100.0;
    const grade = params.grade || (finalScore >= 90 ? "A+" : finalScore >= 80 ? "A" : "B");

    // 2. Idempotency check: check if certificate already exists for this user and project
    const existingCert = await prisma.certificate.findUnique({
      where: {
        userId_projectId_certificateType: {
          userId,
          projectId,
          certificateType: "PROJECT_COMPLETION",
        },
      },
    });

    if (existingCert) {
      // If already issued, return existing certificate (idempotent)
      if (existingCert.status === "ISSUED" && status === "ISSUED") {
        return existingCert;
      }

      // If scheduled or pending, and admin or scheduler is now finalizing issuance:
      if (status === "ISSUED") {
        return await this.finalizeCertificateIssuance(existingCert.id, {
          issuedBy,
          issuanceMethod,
          overrideReason,
        });
      }

      return existingCert;
    }

    // 3. Generate unique cryptographic Certificate ID
    let certificateId = generateCertificateId(new Date(issueDate).getFullYear());
    // Ensure collision avoidance in database
    let collisionCheck = await prisma.certificate.findUnique({ where: { certificateId } });
    while (collisionCheck) {
      certificateId = generateCertificateId(new Date(issueDate).getFullYear());
      collisionCheck = await prisma.certificate.findUnique({ where: { certificateId } });
    }

    const verificationUrl = `${BASE_VERIFY_URL}/${certificateId}`;

    // 4. If status is SCHEDULED or PENDING, create the pending/scheduled record without heavy PDF rendering yet
    if (status === "SCHEDULED" || status === "PENDING") {
      const qrCodeUrl = await generateCertificateQrCodeDataUrl(certificateId);

      const scheduledCert = await prisma.certificate.create({
        data: {
          certificateId,
          userId,
          projectId,
          projectAssignmentId,
          submissionId,
          recipientName,
          recipientEmail,
          projectTitle,
          category,
          programName,
          completionDate,
          issueDate,
          status,
          issuanceMethod,
          issuedBy,
          finalScore,
          grade,
          verificationUrl,
          qrCodeUrl,
          metadata: {
            scheduledBy: issuedBy,
            overrideReason: overrideReason || null,
          },
        },
      });

      // Update assignment certificate status if assignment exists
      if (projectAssignmentId) {
        await prisma.projectAssignment.update({
          where: { id: projectAssignmentId },
          data: {
            certificateStatus: "SCHEDULED",
            certificateId: scheduledCert.certificateId,
          },
        }).catch(() => {});
      }

      // Audit Log
      await prisma.certificateAuditLog.create({
        data: {
          certificateId: scheduledCert.certificateId,
          projectId,
          projectAssignmentId,
          userId,
          performedBy: issuedBy,
          action: "CERTIFICATE_SCHEDULED",
          details: `Certificate ${scheduledCert.certificateId} scheduled for release on ${new Date(issueDate).toLocaleDateString()}`,
        },
      });

      return scheduledCert;
    }

    // 5. Generate high-res QR code and vector landscape PDF
    const qrCodeUrl = await generateCertificateQrCodeDataUrl(certificateId);

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generateCertificatePdf({
        certificateId,
        recipientName,
        recipientEmail,
        projectTitle,
        category,
        programName,
        completionDate,
        issueDate,
        finalScore,
        grade,
        verificationUrl,
      });
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      // Create record in FAILED state for retry
      return await prisma.certificate.create({
        data: {
          certificateId,
          userId,
          projectId,
          projectAssignmentId,
          submissionId,
          recipientName,
          recipientEmail,
          projectTitle,
          category,
          programName,
          completionDate,
          issueDate,
          status: "FAILED",
          issuanceMethod,
          issuedBy,
          failureReason: err.message || "PDF generation error",
          attemptCount: 1,
          verificationUrl,
        },
      });
    }

    // 6. Upload PDF to Cloudinary or use Base64 fallback
    let pdfUrl = "";
    try {
      const uploadRes = await uploadToCloudinary(
        pdfBuffer,
        "recodex_certificates"
      );
      pdfUrl = uploadRes.secure_url;
    } catch (uploadErr) {
      console.warn("Cloudinary upload failed, falling back to base64 Data URL:", uploadErr);
      pdfUrl = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
    }

    // 7. Save official Certificate record
    const certificate = await prisma.certificate.create({
      data: {
        certificateId,
        userId,
        projectId,
        projectAssignmentId,
        submissionId,
        recipientName,
        recipientEmail,
        projectTitle,
        category,
        programName,
        completionDate,
        issueDate,
        status: "ISSUED",
        issuanceMethod,
        issuedBy,
        finalScore,
        grade,
        pdfUrl,
        previewUrl: pdfUrl,
        verificationUrl,
        qrCodeUrl,
        issuedAt: new Date(),
        metadata: {
          generatedAt: new Date().toISOString(),
          overrideReason: overrideReason || null,
        },
      },
    });

    // 8. Update ProjectAssignment & ProjectCompletion records
    if (projectAssignmentId) {
      await prisma.projectAssignment.update({
        where: { id: projectAssignmentId },
        data: {
          certificateStatus: "ISSUED",
          certificateId: certificate.certificateId,
          status: "COMPLETED",
        },
      }).catch(() => {});
    }

    await prisma.projectCompletion.upsert({
      where: {
        userId_projectId: { userId, projectId },
      },
      update: {
        certificateIssued: true,
        certificateId: certificate.certificateId,
      },
      create: {
        userId,
        projectId,
        completionDate,
        completedBy: issuedBy,
        completionSource: issuanceMethod === "ADMIN_MANUAL" ? "ADMIN_MANUAL" : "SCHEDULED",
        certificateIssued: true,
        certificateId: certificate.certificateId,
      },
    }).catch(() => {});

    // 9. Create immutable Audit Log entry
    await prisma.certificateAuditLog.create({
      data: {
        certificateId: certificate.certificateId,
        projectId,
        projectAssignmentId,
        userId,
        performedBy: issuedBy,
        action: issuanceMethod === "ADMIN_MANUAL" ? "CERTIFICATE_MANUALLY_ISSUED" : "CERTIFICATE_ISSUED",
        details: `Official certificate ${certificate.certificateId} issued to ${recipientName} (${recipientEmail}) by ${issuedBy}`,
        metadata: {
          issuanceMethod,
          score: finalScore,
          grade,
          overrideReason,
        },
      },
    });

    return certificate;
  }

  /**
   * Finalizes a scheduled/pending certificate into an active ISSUED certificate with PDF generation.
   */
  static async finalizeCertificateIssuance(certIdOrCertificateId: string, options?: { issuedBy?: string; issuanceMethod?: string; overrideReason?: string }) {
    const cert = await prisma.certificate.findFirst({
      where: {
        OR: [{ id: certIdOrCertificateId }, { certificateId: certIdOrCertificateId }],
      },
    });

    if (!cert) {
      throw new Error("Certificate record not found");
    }

    // Generate vector PDF
    const pdfBuffer = await generateCertificatePdf({
      certificateId: cert.certificateId,
      recipientName: cert.recipientName,
      recipientEmail: cert.recipientEmail,
      projectTitle: cert.projectTitle,
      category: cert.category,
      programName: cert.programName,
      completionDate: cert.completionDate,
      issueDate: new Date(),
      finalScore: cert.finalScore,
      grade: cert.grade,
      verificationUrl: cert.verificationUrl,
    });

    // Upload to Cloudinary or base64
    let pdfUrl = "";
    try {
      const uploadRes = await uploadToCloudinary(
        pdfBuffer,
        "recodex_certificates"
      );
      pdfUrl = uploadRes.secure_url;
    } catch (err) {
      pdfUrl = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
    }

    const updated = await prisma.certificate.update({
      where: { id: cert.id },
      data: {
        status: "ISSUED",
        issueDate: new Date(),
        issuedAt: new Date(),
        pdfUrl,
        previewUrl: pdfUrl,
        issuanceMethod: options?.issuanceMethod || cert.issuanceMethod,
        issuedBy: options?.issuedBy || cert.issuedBy,
      },
    });

    // Update assignment if linked
    if (cert.projectAssignmentId) {
      await prisma.projectAssignment.update({
        where: { id: cert.projectAssignmentId },
        data: {
          certificateStatus: "ISSUED",
          certificateId: cert.certificateId,
          status: "COMPLETED",
        },
      }).catch(() => {});
    }

    // Audit log
    await prisma.certificateAuditLog.create({
      data: {
        certificateId: cert.certificateId,
        projectId: cert.projectId,
        projectAssignmentId: cert.projectAssignmentId,
        userId: cert.userId,
        performedBy: options?.issuedBy || "SYSTEM",
        action: options?.issuanceMethod === "ADMIN_MANUAL" ? "CERTIFICATE_MANUALLY_ISSUED" : "CERTIFICATE_ISSUED",
        details: `Certificate ${cert.certificateId} finalized and issued.`,
      },
    });

    return updated;
  }

  /**
   * Admin Revokes a certificate.
   */
  static async revokeCertificate(certificateId: string, reason: string, adminId: string) {
    const cert = await prisma.certificate.findUnique({
      where: { certificateId },
    });

    if (!cert) {
      throw new Error("Certificate not found");
    }

    const updated = await prisma.certificate.update({
      where: { certificateId },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
        revokedBy: adminId,
        revokedReason: reason || "Administrative action",
      },
    });

    if (cert.projectAssignmentId) {
      await prisma.projectAssignment.update({
        where: { id: cert.projectAssignmentId },
        data: { certificateStatus: "REVOKED" },
      }).catch(() => {});
    }

    await prisma.certificateAuditLog.create({
      data: {
        certificateId,
        projectId: cert.projectId,
        projectAssignmentId: cert.projectAssignmentId,
        userId: cert.userId,
        performedBy: adminId,
        action: "CERTIFICATE_REVOKED",
        details: `Certificate ${certificateId} revoked by ${adminId}. Reason: ${reason}`,
      },
    });

    return updated;
  }

  /**
   * Admin Restores a revoked certificate.
   */
  static async restoreCertificate(certificateId: string, adminId: string) {
    const cert = await prisma.certificate.findUnique({
      where: { certificateId },
    });

    if (!cert) {
      throw new Error("Certificate not found");
    }

    const updated = await prisma.certificate.update({
      where: { certificateId },
      data: {
        status: "ISSUED",
        revokedAt: null,
        revokedBy: null,
        revokedReason: null,
      },
    });

    if (cert.projectAssignmentId) {
      await prisma.projectAssignment.update({
        where: { id: cert.projectAssignmentId },
        data: { certificateStatus: "ISSUED" },
      }).catch(() => {});
    }

    await prisma.certificateAuditLog.create({
      data: {
        certificateId,
        projectId: cert.projectId,
        projectAssignmentId: cert.projectAssignmentId,
        userId: cert.userId,
        performedBy: adminId,
        action: "CERTIFICATE_RESTORED",
        details: `Certificate ${certificateId} restored to active status by ${adminId}`,
      },
    });

    return updated;
  }

  /**
   * Admin Regenerates PDF assets for an existing certificate.
   */
  static async regenerateCertificate(certificateId: string, adminId: string) {
    const cert = await prisma.certificate.findUnique({
      where: { certificateId },
    });

    if (!cert) {
      throw new Error("Certificate not found");
    }

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

    let pdfUrl = "";
    try {
      const uploadRes = await uploadToCloudinary(
        pdfBuffer,
        "recodex_certificates"
      );
      pdfUrl = uploadRes.secure_url;
    } catch (err) {
      pdfUrl = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
    }

    const updated = await prisma.certificate.update({
      where: { certificateId },
      data: {
        pdfUrl,
        previewUrl: pdfUrl,
      },
    });

    await prisma.certificateAuditLog.create({
      data: {
        certificateId,
        projectId: cert.projectId,
        projectAssignmentId: cert.projectAssignmentId,
        userId: cert.userId,
        performedBy: adminId,
        action: "CERTIFICATE_REGENERATED",
        details: `Certificate ${certificateId} assets regenerated by ${adminId}`,
      },
    });

    return updated;
  }
}

export class ProjectAssignmentService {
  /**
   * Assigns one or more users to a project.
   */
  static async assignUsersToProject(projectId: string, userIds: string[], adminId: string = "ADMIN") {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new Error("Project not found");
    }

    const createdAssignments = [];
    for (const userId of userIds) {
      // Check if user exists
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) continue;

      const assignment = await prisma.projectAssignment.upsert({
        where: {
          projectId_userId: { projectId, userId },
        },
        update: {
          assignedBy: adminId,
          assignedAt: new Date(),
        },
        create: {
          projectId,
          userId,
          assignedBy: adminId,
          assignedAt: new Date(),
          status: "ASSIGNED",
          progress: 0,
          scheduledCompletionAt: project.scheduledCompletionAt,
          certificateStatus: project.certificateEnabled ? "ELIGIBLE" : "NOT_ELIGIBLE",
        },
      });

      // Also create ProjectDev record for compatibility
      await prisma.projectDev.upsert({
        where: {
          projectId_userId: { projectId, userId },
        },
        update: {},
        create: { projectId, userId },
      }).catch(() => {});

      createdAssignments.push(assignment);
    }

    // Update project devs count
    const totalDevs = await prisma.projectAssignment.count({ where: { projectId } });
    await prisma.project.update({
      where: { id: projectId },
      data: { devsCount: totalDevs },
    });

    return createdAssignments;
  }

  /**
   * TRIGGER A: Admin Manually Marks an Assigned User's Project as COMPLETED.
   */
  static async markAssignmentCompleted(
    assignmentId: string,
    options: {
      completionDate?: Date;
      completionTime?: string;
      notes?: string;
      certificateAction?: "ISSUE_NOW" | "SCHEDULE" | "DO_NOT_ISSUE";
      scheduledDays?: number;
      score?: number;
    },
    adminId: string
  ) {
    const assignment = await prisma.projectAssignment.findUnique({
      where: { id: assignmentId },
      include: { project: true, user: true },
    });

    if (!assignment) {
      throw new Error("Project assignment not found");
    }

    const completionDate = options.completionDate || new Date();
    const certAction = options.certificateAction || (assignment.project.automaticIssuance ? "ISSUE_NOW" : "SCHEDULE");
    const score = options.score !== undefined ? options.score : 100.0;

    // 1. Update assignment state to COMPLETED
    const updatedAssignment = await prisma.projectAssignment.update({
      where: { id: assignmentId },
      data: {
        status: "COMPLETED",
        progress: 100,
        completedAt: completionDate,
        completedBy: adminId,
        completionSource: "ADMIN_MANUAL",
        notes: options.notes || null,
      },
    });

    // 2. Create official project completion record
    await prisma.projectCompletion.upsert({
      where: {
        userId_projectId: {
          userId: assignment.userId,
          projectId: assignment.projectId,
        },
      },
      update: {
        completionDate,
        completedBy: adminId,
        completionSource: "ADMIN_MANUAL",
      },
      create: {
        userId: assignment.userId,
        projectId: assignment.projectId,
        completionDate,
        completedBy: adminId,
        completionSource: "ADMIN_MANUAL",
      },
    });

    // 3. Process Certificate according to Admin Decision
    let certResult = null;
    if (assignment.project.certificateEnabled) {
      if (certAction === "ISSUE_NOW") {
        certResult = await CertificateService.issueCertificate({
          userId: assignment.userId,
          projectId: assignment.projectId,
          projectAssignmentId: assignment.id,
          recipientName: assignment.user.name,
          recipientEmail: assignment.user.email,
          projectTitle: assignment.project.title,
          category: assignment.project.category,
          completionDate,
          issueDate: new Date(),
          finalScore: score,
          issuanceMethod: "ADMIN_MANUAL",
          issuedBy: adminId,
          status: "ISSUED",
        });
      } else if (certAction === "SCHEDULE") {
        const delayDays = options.scheduledDays || assignment.project.issuanceDelayDays || 7;
        const scheduledIssueDate = new Date(completionDate.getTime() + delayDays * 86400000);

        certResult = await CertificateService.issueCertificate({
          userId: assignment.userId,
          projectId: assignment.projectId,
          projectAssignmentId: assignment.id,
          recipientName: assignment.user.name,
          recipientEmail: assignment.user.email,
          projectTitle: assignment.project.title,
          category: assignment.project.category,
          completionDate,
          issueDate: scheduledIssueDate,
          finalScore: score,
          issuanceMethod: "SCHEDULED",
          issuedBy: adminId,
          status: "SCHEDULED",
        });
      }
    }

    // 4. Audit Log
    await prisma.certificateAuditLog.create({
      data: {
        projectId: assignment.projectId,
        projectAssignmentId: assignment.id,
        userId: assignment.userId,
        performedBy: adminId,
        action: "PROJECT_COMPLETED_BY_ADMIN",
        details: `Project "${assignment.project.title}" marked as COMPLETED for user ${assignment.user.name} (${assignment.user.email}) by admin ${adminId}. Certificate Action: ${certAction}`,
      },
    });

    return {
      assignment: updatedAssignment,
      certificate: certResult,
    };
  }

  /**
   * TRIGGER C: Admin Manually Issues / Shares a Certificate directly to an individual assigned user.
   */
  static async adminIssueCertificateToUser(
    assignmentId: string,
    options: {
      score?: number;
      grade?: string;
      reason?: string;
    },
    adminId: string
  ) {
    const assignment = await prisma.projectAssignment.findUnique({
      where: { id: assignmentId },
      include: { project: true, user: true },
    });

    if (!assignment) {
      throw new Error("Project assignment not found");
    }

    // Ensure project is also marked completed if not already
    if (assignment.status !== "COMPLETED") {
      await prisma.projectAssignment.update({
        where: { id: assignmentId },
        data: {
          status: "COMPLETED",
          progress: 100,
          completedAt: assignment.completedAt || new Date(),
          completedBy: adminId,
          completionSource: "ADMIN_OVERRIDE",
        },
      });
    }

    const cert = await CertificateService.issueCertificate({
      userId: assignment.userId,
      projectId: assignment.projectId,
      projectAssignmentId: assignment.id,
      recipientName: assignment.user.name,
      recipientEmail: assignment.user.email,
      projectTitle: assignment.project.title,
      category: assignment.project.category,
      completionDate: assignment.completedAt || new Date(),
      issueDate: new Date(),
      finalScore: options.score !== undefined ? options.score : 100.0,
      grade: options.grade || "A+",
      issuanceMethod: "ADMIN_MANUAL",
      issuedBy: adminId,
      overrideReason: options.reason || "Direct admin issuance override",
      status: "ISSUED",
    });

    return cert;
  }
}
