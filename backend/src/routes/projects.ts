import { Router, Response } from "express";
import multer from "multer";
import prisma from "../config/db";
import { uploadToCloudinary } from "../config/cloudinary";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { ProjectAssignmentService } from "../services/certificateService";

const router = Router();

// Configure multer for memory storage uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit to 5MB files
  },
});

/**
 * GET /api/projects
 * Fetches all projects, optionally filtered by category.
 */
router.get("/", async (req, res) => {
  const { category, search } = req.query;

  try {
    const filters: any = {};

    if (category) {
      filters.category = String(category);
    }

    if (search) {
      filters.OR = [
        { title: { contains: String(search), mode: "insensitive" } },
        { description: { contains: String(search), mode: "insensitive" } },
        { tags: { has: String(search).toUpperCase() } }
      ];
    }

    const projects = await prisma.project.findMany({
      where: filters,
      include: {
        assignments: {
          select: {
            id: true,
            status: true,
            certificateStatus: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(projects);
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    return res.status(500).json({ error: "Failed to retrieve project listings." });
  }
});

/**
 * GET /api/projects/my-assignments
 * Fetches projects assigned to the currently authenticated user.
 */
router.get("/my-assignments", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const assignments = await prisma.projectAssignment.findMany({
      where: { userId },
      include: {
        project: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return res.json(assignments);
  } catch (error: any) {
    console.error("Error fetching user assignments:", error);
    return res.status(500).json({ error: "Failed to fetch user project assignments." });
  }
});

/**
 * GET /api/projects/:id
 * Fetches detail for a single project including its joined devs and assignments.
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        devs: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                profileImage: true,
              },
            },
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }

    const formattedProject = {
      ...project,
      devs: project.devs.map((d: any) => d.user),
    };

    return res.json(formattedProject);
  } catch (error: any) {
    console.error(`Error fetching project ${id}:`, error);
    return res.status(500).json({ error: "Failed to retrieve project details." });
  }
});

/**
 * GET /api/projects/:id/assignments
 * Admin endpoint: Fetches all user assignments for a specific project.
 */
router.get("/:id/assignments", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const assignments = await prisma.projectAssignment.findMany({
      where: { projectId: id },
      include: {
        user: true,
        project: true,
      },
      orderBy: { assignedAt: "desc" },
    });

    // Also fetch certificate records for each assignment/user
    const assignmentsWithCerts = await Promise.all(
      assignments.map(async (asgn: any) => {
        const cert = await prisma.certificate.findUnique({
          where: {
            userId_projectId_certificateType: {
              userId: asgn.userId,
              projectId: asgn.projectId,
              certificateType: "PROJECT_COMPLETION",
            },
          },
        });
        return {
          ...asgn,
          certificate: cert || null,
        };
      })
    );

    return res.json(assignmentsWithCerts);
  } catch (error: any) {
    console.error(`Error fetching assignments for project ${id}:`, error);
    return res.status(500).json({ error: "Failed to fetch project assignments." });
  }
});

/**
 * POST /api/projects/:id/assign
 * Admin endpoint: Assigns one or more users to a project.
 */
router.post("/:id/assign", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: "userIds array is required." });
  }

  try {
    const adminId = req.user?.id || "ADMIN";
    const assignments = await ProjectAssignmentService.assignUsersToProject(id, userIds, adminId);
    return res.json({ message: "Users successfully assigned to project.", count: assignments.length, assignments });
  } catch (error: any) {
    console.error(`Error assigning users to project ${id}:`, error);
    return res.status(500).json({ error: error.message || "Failed to assign users to project." });
  }
});

/**
 * POST /api/projects/assignments/:assignmentId/complete
 * TRIGGER A: Admin manually marks an assigned user's project as COMPLETED.
 */
router.post("/assignments/:assignmentId/complete", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { assignmentId } = req.params;
  const { completionDate, notes, certificateAction, scheduledDays, score } = req.body;

  try {
    const adminId = req.user?.id || "ADMIN";
    const result = await ProjectAssignmentService.markAssignmentCompleted(
      assignmentId,
      {
        completionDate: completionDate ? new Date(completionDate) : new Date(),
        notes,
        certificateAction: certificateAction || "ISSUE_NOW",
        scheduledDays: scheduledDays ? parseInt(scheduledDays, 10) : undefined,
        score: score ? parseFloat(score) : 100.0,
      },
      adminId
    );

    return res.json({
      message: "Project marked as COMPLETED successfully.",
      assignment: result.assignment,
      certificate: result.certificate,
    });
  } catch (error: any) {
    console.error(`Error completing assignment ${assignmentId}:`, error);
    return res.status(500).json({ error: error.message || "Failed to mark project completed." });
  }
});

/**
 * POST /api/projects/assignments/:assignmentId/issue-certificate
 * TRIGGER C: Admin manually issues/shares a certificate directly to an assigned user.
 */
router.post("/assignments/:assignmentId/issue-certificate", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { assignmentId } = req.params;
  const { score, grade, reason } = req.body;

  try {
    const adminId = req.user?.id || "ADMIN";
    const cert = await ProjectAssignmentService.adminIssueCertificateToUser(
      assignmentId,
      {
        score: score ? parseFloat(score) : 100.0,
        grade,
        reason,
      },
      adminId
    );

    return res.json({
      message: "Certificate issued directly to user successfully.",
      certificate: cert,
    });
  } catch (error: any) {
    console.error(`Error issuing certificate for assignment ${assignmentId}:`, error);
    return res.status(500).json({ error: error.message || "Failed to issue certificate." });
  }
});

/**
 * POST /api/projects/:id/submit
 * User submits deliverables for review.
 */
router.post("/:id/submit", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { repoUrl, liveUrl, demoUrl, documentation, comments, deliverables } = req.body;

  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }

    // Upsert project submission
    const submission = await prisma.projectSubmission.create({
      data: {
        projectId: id,
        userId,
        title: project.title,
        description: project.description,
        repoUrl: repoUrl || "",
        liveUrl: liveUrl || null,
        demoUrl: demoUrl || null,
        documentation: documentation || null,
        comments: comments || null,
        deliverables: deliverables || null,
        status: "SUBMITTED",
      },
    });

    // Update ProjectAssignment status to SUBMITTED
    await prisma.projectAssignment.upsert({
      where: {
        projectId_userId: { projectId: id, userId },
      },
      update: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        progress: 100,
      },
      create: {
        projectId: id,
        userId,
        status: "SUBMITTED",
        submittedAt: new Date(),
        progress: 100,
        scheduledCompletionAt: project.scheduledCompletionAt,
      },
    });

    return res.status(201).json({
      message: "Project deliverables submitted successfully for review.",
      submission,
    });
  } catch (error: any) {
    console.error(`Error submitting deliverables for project ${id}:`, error);
    return res.status(500).json({ error: "Failed to submit project deliverables." });
  }
});

/**
 * POST /api/projects
 * Creates a new project in the database with certificate configuration & optional user assignments.
 */
router.post(
  "/",
  requireAuth,
  upload.single("image"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        id,
        title,
        description,
        longDescription,
        status,
        category,
        tags,
        files,
        certificateEnabled,
        certificateName,
        completionMethod,
        scheduledCompletionAt,
        automaticIssuance,
        issuanceDelayDays,
        assignedUserIds,
      } = req.body;

      if (!id || !title || !description || !category) {
        return res.status(400).json({ error: "Missing required project fields (id, title, description, category)." });
      }

      // Check if project id already exists
      const existingProject = await prisma.project.findUnique({ where: { id } });
      if (existingProject) {
        return res.status(409).json({ error: "A project with this cryptographic ID already exists." });
      }

      // Image upload handling
      let imageUrl = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600";
      if (req.file) {
        try {
          const uploadResult = await uploadToCloudinary(req.file.buffer, "recodex_projects");
          imageUrl = uploadResult.secure_url;
        } catch (uploadError) {
          console.error("Cloudinary upload failed, falling back to default image:", uploadError);
        }
      }

      // Parse tags
      let tagsArray: string[] = [];
      if (tags) {
        try {
          tagsArray = JSON.parse(tags);
        } catch {
          tagsArray = String(tags)
            .split(",")
            .map((t) => t.trim().toUpperCase())
            .filter(Boolean);
        }
      }

      // Parse files JSON tree
      let filesJson: any = {};
      if (files) {
        try {
          filesJson = typeof files === "string" ? JSON.parse(files) : files;
        } catch {
          filesJson = { "README.md": `# ${title}\n\nProject initialized.` };
        }
      }

      const project = await prisma.project.create({
        data: {
          id,
          title,
          description,
          longDescription: longDescription || description,
          status: status || "Active",
          imageUrl,
          category,
          tags: tagsArray,
          files: filesJson,
          certificateEnabled: certificateEnabled === "false" || certificateEnabled === false ? false : true,
          certificateName: certificateName || "Project Completion Certificate",
          completionMethod: completionMethod || "ALL",
          scheduledCompletionAt: scheduledCompletionAt ? new Date(scheduledCompletionAt) : null,
          automaticIssuance: automaticIssuance === "false" || automaticIssuance === false ? false : true,
          issuanceDelayDays: issuanceDelayDays ? parseInt(issuanceDelayDays, 10) : 0,
          devsCount: 0,
        },
      });

      // Handle initial user assignments
      if (assignedUserIds) {
        let userIdsToAssign: string[] = [];
        try {
          userIdsToAssign = typeof assignedUserIds === "string" ? JSON.parse(assignedUserIds) : assignedUserIds;
        } catch {
          userIdsToAssign = [assignedUserIds];
        }
        if (Array.isArray(userIdsToAssign) && userIdsToAssign.length > 0) {
          await ProjectAssignmentService.assignUsersToProject(project.id, userIdsToAssign, req.user?.id || "ADMIN");
        }
      }

      return res.status(201).json(project);
    } catch (error: any) {
      console.error("Error creating project:", error);
      return res.status(500).json({ error: "Failed to create project listing." });
    }
  }
);

/**
 * PUT /api/projects/:id
 * Updates an existing project. Protected by Auth.
 */
router.put(
  "/:id",
  requireAuth,
  upload.single("image"),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    try {
      const existingProject = await prisma.project.findUnique({ where: { id } });
      if (!existingProject) {
        return res.status(404).json({ error: "Project not found." });
      }

      const {
        title,
        description,
        longDescription,
        status,
        category,
        tags,
        files,
        certificateEnabled,
        certificateName,
        completionMethod,
        scheduledCompletionAt,
        automaticIssuance,
        issuanceDelayDays,
      } = req.body;

      const updateData: any = {};

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (longDescription !== undefined) updateData.longDescription = longDescription;
      if (status !== undefined) updateData.status = status;
      if (category !== undefined) updateData.category = category;
      if (certificateEnabled !== undefined) {
        updateData.certificateEnabled = certificateEnabled === "true" || certificateEnabled === true;
      }
      if (certificateName !== undefined) updateData.certificateName = certificateName;
      if (completionMethod !== undefined) updateData.completionMethod = completionMethod;
      if (scheduledCompletionAt !== undefined) {
        updateData.scheduledCompletionAt = scheduledCompletionAt ? new Date(scheduledCompletionAt) : null;
      }
      if (automaticIssuance !== undefined) {
        updateData.automaticIssuance = automaticIssuance === "true" || automaticIssuance === true;
      }
      if (issuanceDelayDays !== undefined) {
        updateData.issuanceDelayDays = parseInt(issuanceDelayDays, 10) || 0;
      }

      if (req.file) {
        const uploadResult = await uploadToCloudinary(req.file.buffer, "recodex_projects");
        updateData.imageUrl = uploadResult.secure_url;
      }

      if (tags) {
        try {
          updateData.tags = JSON.parse(tags);
        } catch {
          updateData.tags = String(tags)
            .split(",")
            .map((t) => t.trim().toUpperCase())
            .filter(Boolean);
        }
      }

      if (files) {
        try {
          updateData.files = typeof files === "string" ? JSON.parse(files) : files;
        } catch {
          // Keep old files if invalid
        }
      }

      const updatedProject = await prisma.project.update({
        where: { id },
        data: updateData,
      });

      return res.json(updatedProject);
    } catch (error: any) {
      console.error(`Error updating project ${id}:`, error);
      return res.status(500).json({ error: "Failed to update project listing." });
    }
  }
);

/**
 * DELETE /api/projects/:id
 * Deletes a project. Protected by Auth.
 */
router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.project.delete({ where: { id } });
    return res.json({ message: "Project deleted successfully." });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.json({ message: "Project already deleted or does not exist." });
    }
    console.error(`Error deleting project ${id}:`, error);
    return res.status(500).json({ error: "Failed to delete project listing." });
  }
});

export default router;
