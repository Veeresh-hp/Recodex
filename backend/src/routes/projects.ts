import { Router, Response } from "express";
import multer from "multer";
import prisma from "../config/db";
import { uploadToCloudinary } from "../config/cloudinary";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

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
      orderBy: { createdAt: "desc" },
    });

    return res.json(projects);
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    return res.status(500).json({ error: "Failed to retrieve project listings." });
  }
});

/**
 * GET /api/projects/:id
 * Fetches detail for a single project including its joined devs.
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
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }

    // Format the devs relation to return user details directly
    const formattedProject = {
      ...project,
      devs: project.devs.map((d) => d.user),
    };

    return res.json(formattedProject);
  } catch (error: any) {
    console.error(`Error fetching project ${id}:`, error);
    return res.status(500).json({ error: "Failed to retrieve project details." });
  }
});

/**
 * POST /api/projects
 * Creates a new project in the database. Protected by Auth.
 * Expects an image upload in multi-part form.
 */
router.post(
  "/",
  requireAuth,
  upload.single("image"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id, title, description, longDescription, status, category, tags, files } = req.body;

      if (!id || !title || !description || !category) {
        return res.status(400).json({ error: "Missing required project fields (id, title, description, category)." });
      }

      // Check if project id already exists
      const existingProject = await prisma.project.findUnique({ where: { id } });
      if (existingProject) {
        return res.status(409).json({ error: "A project with this cryptographic ID already exists." });
      }

      // Image upload handling
      let imageUrl = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600"; // Default image fallback
      if (req.file) {
        try {
          const uploadResult = await uploadToCloudinary(req.file.buffer, "recodex_projects");
          imageUrl = uploadResult.secure_url;
        } catch (uploadError) {
          console.error("Cloudinary upload failed, falling back to default image:", uploadError);
        }
      }

      // Parse tags (tags can arrive as a JSON array string or comma separated)
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
          devsCount: 0,
        },
      });

      // Optionally, automatically assign the creator to the project devs pool if they are a developer
      const dbUser = await prisma.user.findUnique({ where: { id: req.user?.id } });
      if (dbUser && dbUser.role === "developer") {
        await prisma.projectDev.create({
          data: {
            projectId: project.id,
            userId: dbUser.id,
          },
        });
        // Update devs count
        await prisma.project.update({
          where: { id: project.id },
          data: { devsCount: 1 },
        });
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

      const { title, description, longDescription, status, category, tags, files } = req.body;
      const updateData: any = {};

      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (longDescription) updateData.longDescription = longDescription;
      if (status) updateData.status = status;
      if (category) updateData.category = category;

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
