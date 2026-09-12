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
 * Fetches all projects, optionally filtered by category, search, or admin mode.
 */
router.get("/", async (req, res) => {
  const { category, search, admin, includePrivate } = req.query;

  try {
    const filters: any = {};
    const isAdminQuery = admin === "true" || includePrivate === "true";

    // Public marketplace excludes private projects, admin views all
    if (!isAdminQuery) {
      filters.isPrivate = { not: true };
    }

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

    let projects = await prisma.project.findMany({
      where: filters,
      select: {
        id: true,
        title: true,
        description: true,
        longDescription: true,
        status: true,
        imageUrl: true,
        category: true,
        tags: true,
        devsCount: true,
        stars: true,
        forks: true,
        certificateEnabled: true,
        certificateName: true,
        completionMethod: true,
        scheduledCompletionAt: true,
        automaticIssuance: true,
        issuanceDelayDays: true,
        assignedEmail: true,
        assignedUserId: true,
        assignedUserName: true,
        repoUrl: true,
        liveUrl: true,
        progress: true,
        startDate: true,
        expectedDate: true,
        contractId: true,
        isPrivate: true,
        createdAt: true,
        updatedAt: true,
        assignments: {
          select: {
            id: true,
            status: true,
            certificateStatus: true,
            userId: true,
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fallback: If DB query returns 0 projects, load mockProjects.json so older 50 projects are never lost
    if (!projects || projects.length === 0) {
      try {
        const mockProjects = require("../config/mockProjects.json");
        if (Array.isArray(mockProjects) && mockProjects.length > 0) {
          projects = mockProjects.map((p: any) => ({
            ...p,
            imageUrl: p.image || p.imageUrl,
            isPrivate: false,
            createdAt: p.createdAt || new Date("2024-01-01T00:00:00.000Z"),
            updatedAt: p.updatedAt || new Date("2024-01-01T00:00:00.000Z"),
          }));
        }
      } catch (mockErr) {
        console.warn("Could not load fallback mock projects:", mockErr);
      }
    }

    return res.json(projects);
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    return res.status(500).json({ error: "Failed to retrieve project listings." });
  }
});

/**
 * GET /api/projects/my-projects
 * Authenticated endpoint: Fetches assigned projects for the logged-in user or all client projects if admin.
 * Strictly enforces that non-admin users only see projects assigned to their ID or email address.
 */
router.get("/my-projects", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email?.toLowerCase().trim();
    const isAdmin = req.user?.role === "admin";

    if (!userId && !userEmail) {
      return res.status(401).json({ error: "Authentication required to access client projects." });
    }

    let projects: any[] = [];

    if (isAdmin) {
      // Admins can see all client projects (those with contractId, assignedEmail, or assignments)
      projects = await prisma.project.findMany({
        where: {
          OR: [
            { assignedEmail: { not: null } },
            { assignedUserId: { not: null } },
            { contractId: { not: null } },
            { isPrivate: true },
            { assignments: { some: {} } },
          ],
        },
        include: {
          assignments: {
            include: { user: true },
          },
          devs: {
            include: { user: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      });
    } else {
      // Regular user / Client: ONLY projects assigned to their Clerk userId OR their email
      const orConditions: any[] = [];
      if (userId) {
        orConditions.push({ assignedUserId: userId });
        orConditions.push({ assignments: { some: { userId } } });
        orConditions.push({ devs: { some: { userId } } });
      }
      if (userEmail) {
        orConditions.push({ assignedEmail: { equals: userEmail, mode: "insensitive" } });
      }

      if (orConditions.length === 0) {
        return res.json([]);
      }

      projects = await prisma.project.findMany({
        where: {
          OR: orConditions,
        },
        include: {
          assignments: {
            include: { user: true },
          },
          devs: {
            include: { user: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      });
    }

    // Format projects to conform with ProjectDeliverable interface
    const formatted = projects.map((p) => {
      const pStart = p.startDate || new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const pExp = p.expectedDate || new Date(new Date(p.createdAt).getTime() + 30 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const daysRem = Math.max(0, Math.ceil((new Date(pExp).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

      let milestonesList: any[] = [];
      if (p.milestones) {
        try {
          milestonesList = typeof p.milestones === "string" ? JSON.parse(p.milestones) : p.milestones;
        } catch {
          milestonesList = [];
        }
      }
      if (!milestonesList || milestonesList.length === 0) {
        milestonesList = [
          { id: 1, name: "Architecture & Infrastructure Setup", description: "System scaffolding, dependency pinning, and secure sandbox provisioning.", completed: true },
          { id: 2, name: "Core Business Logic & API Endpoints", description: "Implementation of backend telemetry, controllers, and database models.", completed: (p.progress || 0) >= 50, current: (p.progress || 0) < 50 },
          { id: 3, name: "Integration Testing & SLA Verification", description: "Automated end-to-end testing, stress evaluation, and edge compliance.", completed: (p.progress || 0) >= 90, current: (p.progress || 0) >= 50 && (p.progress || 0) < 90 },
          { id: 4, name: "Production Deployment & Handover", description: "Final release packaging, domain routing, and cryptographic key transfer.", completed: (p.progress || 0) === 100, current: (p.progress || 0) >= 90 && (p.progress || 0) < 100 },
        ];
      }

      let deliverablesList: string[] = [];
      if (p.deliverables) {
        try {
          deliverablesList = typeof p.deliverables === "string" ? JSON.parse(p.deliverables) : p.deliverables;
        } catch {
          deliverablesList = [];
        }
      }
      if (!deliverablesList || deliverablesList.length === 0) {
        deliverablesList = [
          "Complete source code repository",
          "Production deployment configuration",
          "Automated test coverage documentation",
          "Cryptographic certificate of authenticity"
        ];
      }

      return {
        id: p.id,
        title: p.title,
        category: p.category,
        status: p.status || "Active",
        progress: p.progress !== null && p.progress !== undefined ? p.progress : (p.assignments?.[0]?.progress || 10),
        startDate: pStart,
        expectedDate: pExp,
        daysRemaining: daysRem,
        repositoryUrl: p.repoUrl || `https://github.com/recodex/${p.id}`,
        liveUrl: p.liveUrl || undefined,
        leadArchitect: p.assignedUserName || "Veeresh H P (Lead Architect)",
        assignedEmail: p.assignedEmail || p.assignments?.[0]?.user?.email || null,
        assignedUserId: p.assignedUserId || p.assignments?.[0]?.userId || null,
        techStack: (p.tags && p.tags.length > 0) ? p.tags : ["REACT", "NODE.JS", "TYPESCRIPT", "TAILWIND"],
        milestones: milestonesList,
        deliverablesList: deliverablesList,
        contractId: p.contractId || `RCX-CTR-${p.id.slice(0, 6).toUpperCase()}`,
      };
    });

    return res.json(formatted);
  } catch (error: any) {
    console.error("Error fetching my-projects:", error);
    return res.status(500).json({ error: "Failed to fetch client projects." });
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
        assignedEmail,
        assignedUserId,
        assignedUserName,
        repoUrl,
        liveUrl,
        progress,
        startDate,
        expectedDate,
        contractId,
        isPrivate,
        milestones,
        deliverables,
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

      let cleanAssignedEmail = assignedEmail ? String(assignedEmail).toLowerCase().trim() : null;
      let cleanAssignedUserId = assignedUserId ? String(assignedUserId).trim() : null;
      let cleanAssignedUserName = assignedUserName ? String(assignedUserName).trim() : null;

      // If assignedEmail is provided, check if user exists in User table
      if (cleanAssignedEmail && !cleanAssignedUserId) {
        try {
          const foundUser = await prisma.user.findUnique({ where: { email: cleanAssignedEmail } });
          if (foundUser) {
            cleanAssignedUserId = foundUser.id;
            if (!cleanAssignedUserName) cleanAssignedUserName = foundUser.name;
          }
        } catch (e) {}
      }

      // If assignedUserId is provided, lookup user email if not set
      if (cleanAssignedUserId && !cleanAssignedEmail) {
        try {
          const foundUser = await prisma.user.findUnique({ where: { id: cleanAssignedUserId } });
          if (foundUser) {
            cleanAssignedEmail = foundUser.email?.toLowerCase().trim() || null;
            if (!cleanAssignedUserName) cleanAssignedUserName = foundUser.name;
          }
        } catch (e) {}
      }

      const isPrivateVal = isPrivate === "true" || isPrivate === true || Boolean(cleanAssignedEmail) || Boolean(cleanAssignedUserId);
      const contractIdVal = contractId || `RCX-CTR-${id.slice(0, 6).toUpperCase()}`;

      let milestonesJson: any = null;
      if (milestones) {
        try {
          milestonesJson = typeof milestones === "string" ? JSON.parse(milestones) : milestones;
        } catch {
          milestonesJson = null;
        }
      }

      let deliverablesJson: any = null;
      if (deliverables) {
        try {
          deliverablesJson = typeof deliverables === "string" ? JSON.parse(deliverables) : deliverables;
        } catch {
          deliverablesJson = null;
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
          devsCount: cleanAssignedUserId ? 1 : 0,
          assignedEmail: cleanAssignedEmail,
          assignedUserId: cleanAssignedUserId,
          assignedUserName: cleanAssignedUserName,
          repoUrl: repoUrl || `https://github.com/recodex/${id}`,
          liveUrl: liveUrl || null,
          progress: progress !== undefined && progress !== null ? parseInt(progress, 10) : 10,
          startDate: startDate || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          expectedDate: expectedDate || new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          contractId: contractIdVal,
          isPrivate: isPrivateVal,
          milestones: milestonesJson,
          deliverables: deliverablesJson,
        },
      });

      // Handle direct assigned user linkage
      if (cleanAssignedUserId) {
        try {
          await ProjectAssignmentService.assignUsersToProject(project.id, [cleanAssignedUserId], req.user?.id || "ADMIN");
        } catch (err) {
          console.warn("Direct user assignment warning:", err);
        }
      }

      // Handle additional user assignments
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
 * PATCH /api/projects/:id
 * Quick update endpoint to modify status, timeline (expectedDate, daysRemaining), progress, assignments, and URLs.
 */
router.patch("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const {
    status,
    progress,
    expectedDate,
    startDate,
    assignedEmail,
    assignedUserId,
    assignedUserName,
    repoUrl,
    liveUrl,
    title,
    category,
    isPrivate,
  } = req.body;

  try {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Project not found." });
    }

    const data: any = {};
    if (status !== undefined) data.status = status;
    if (progress !== undefined) data.progress = Number(progress);
    if (expectedDate !== undefined) data.expectedDate = expectedDate;
    if (startDate !== undefined) data.startDate = startDate;
    if (assignedEmail !== undefined) data.assignedEmail = assignedEmail ? String(assignedEmail).toLowerCase().trim() : null;
    if (assignedUserId !== undefined) data.assignedUserId = assignedUserId;
    if (assignedUserName !== undefined) data.assignedUserName = assignedUserName;
    if (repoUrl !== undefined) data.repoUrl = repoUrl;
    if (liveUrl !== undefined) data.liveUrl = liveUrl;
    if (title !== undefined) data.title = title;
    if (category !== undefined) data.category = category;
    if (isPrivate !== undefined) data.isPrivate = Boolean(isPrivate);

    const updated = await prisma.project.update({
      where: { id },
      data,
    });

    // If progress or status was updated and project has assignments, sync them
    if (status !== undefined || progress !== undefined) {
      try {
        await prisma.projectAssignment.updateMany({
          where: { projectId: id },
          data: {
            ...(status === "Completed" ? { status: "COMPLETED" } : {}),
            ...(progress !== undefined ? { progress: Number(progress) } : {}),
          },
        });
      } catch (err) {
        console.warn("Could not sync assignment status:", err);
      }
    }

    return res.json(updated);
  } catch (error: any) {
    console.error(`Error patching project ${id}:`, error);
    return res.status(500).json({ error: "Failed to update project." });
  }
});

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
