"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runScheduledJobsCycle = runScheduledJobsCycle;
exports.startCertificateScheduler = startCertificateScheduler;
const client_1 = require("@prisma/client");
const certificateService_1 = require("./certificateService");
const prisma = new client_1.PrismaClient();
let schedulerInterval = null;
/**
 * Evaluates and processes:
 * 1. TRIGGER B: Scheduled completion date arrivals for project assignments.
 * 2. Scheduled certificate releases that have reached their target issue date.
 */
async function runScheduledJobsCycle() {
    const now = new Date();
    // --- 1. PROCESS SCHEDULED PROJECT COMPLETIONS ---
    try {
        const dueAssignments = await prisma.projectAssignment.findMany({
            where: {
                status: { not: "COMPLETED" },
                OR: [
                    { scheduledCompletionAt: { lte: now } },
                    {
                        project: {
                            scheduledCompletionAt: { lte: now },
                        },
                    },
                ],
            },
            include: {
                project: true,
                user: true,
            },
        });
        for (const assignment of dueAssignments) {
            try {
                if (!assignment.project || !assignment.user)
                    continue;
                const scheduledTime = assignment.scheduledCompletionAt || assignment.project.scheduledCompletionAt || now;
                // Update assignment status to COMPLETED
                await prisma.projectAssignment.update({
                    where: { id: assignment.id },
                    data: {
                        status: "COMPLETED",
                        progress: 100,
                        completedAt: scheduledTime,
                        completedBy: "SYSTEM",
                        completionSource: "SCHEDULED",
                    },
                });
                // Create official project completion record
                await prisma.projectCompletion.upsert({
                    where: {
                        userId_projectId: {
                            userId: assignment.userId,
                            projectId: assignment.projectId,
                        },
                    },
                    update: {
                        completionDate: scheduledTime,
                        completedBy: "SYSTEM",
                        completionSource: "SCHEDULED",
                    },
                    create: {
                        userId: assignment.userId,
                        projectId: assignment.projectId,
                        completionDate: scheduledTime,
                        completedBy: "SYSTEM",
                        completionSource: "SCHEDULED",
                    },
                });
                // If certificate enabled on project, process issuance or scheduling
                if (assignment.project.certificateEnabled && assignment.project.automaticIssuance) {
                    const delayDays = assignment.project.issuanceDelayDays || 0;
                    const issueDate = new Date(scheduledTime.getTime() + delayDays * 86400000);
                    const isImmediate = delayDays === 0 || issueDate <= now;
                    await certificateService_1.CertificateService.issueCertificate({
                        userId: assignment.userId,
                        projectId: assignment.projectId,
                        projectAssignmentId: assignment.id,
                        recipientName: assignment.user.name,
                        recipientEmail: assignment.user.email,
                        projectTitle: assignment.project.title,
                        category: assignment.project.category,
                        completionDate: scheduledTime,
                        issueDate,
                        issuanceMethod: "SCHEDULED",
                        issuedBy: "SYSTEM",
                        status: isImmediate ? "ISSUED" : "SCHEDULED",
                    });
                }
                // Audit Log
                await prisma.certificateAuditLog.create({
                    data: {
                        projectId: assignment.projectId,
                        projectAssignmentId: assignment.id,
                        userId: assignment.userId,
                        performedBy: "SYSTEM",
                        action: "PROJECT_COMPLETED_BY_SCHEDULE",
                        details: `Scheduled completion date reached. Project "${assignment.project.title}" completed for ${assignment.user.name}.`,
                    },
                });
            }
            catch (itemErr) {
                console.error(`Error processing scheduled completion for assignment ${assignment.id}:`, itemErr);
            }
        }
    }
    catch (err) {
        console.error("Error checking due scheduled assignments:", err);
    }
    // --- 2. PROCESS SCHEDULED CERTIFICATES DUE FOR RELEASE ---
    try {
        const dueCertificates = await prisma.certificate.findMany({
            where: {
                status: { in: ["SCHEDULED", "PENDING"] },
                issueDate: { lte: now },
            },
        });
        for (const cert of dueCertificates) {
            try {
                await certificateService_1.CertificateService.finalizeCertificateIssuance(cert.id, {
                    issuedBy: "SYSTEM",
                    issuanceMethod: "SCHEDULED",
                });
            }
            catch (certErr) {
                console.error(`Failed to finalize scheduled certificate ${cert.certificateId}:`, certErr);
            }
        }
    }
    catch (err) {
        console.error("Error processing scheduled certificates release:", err);
    }
}
/**
 * Boots the recurring background scheduler.
 */
function startCertificateScheduler(intervalMs = 60000) {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
    }
    console.log(`[Scheduler] RecodeX Project Completion & Certificate Scheduler initialized (polling every ${intervalMs / 1000}s).`);
    // Run first cycle immediately
    runScheduledJobsCycle().catch((e) => console.error("[Scheduler] Initial cycle failed:", e));
    schedulerInterval = setInterval(() => {
        runScheduledJobsCycle().catch((e) => console.error("[Scheduler] Cycle error:", e));
    }, intervalMs);
}
