"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const db_1 = __importDefault(require("../config/db"));
const cloudinary_1 = require("../config/cloudinary");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Configure multer for memory storage uploads
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
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
        const filters = {};
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
        const projects = await db_1.default.project.findMany({
            where: filters,
            orderBy: { createdAt: "desc" },
        });
        return res.json(projects);
    }
    catch (error) {
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
        const project = await db_1.default.project.findUnique({
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
    }
    catch (error) {
        console.error(`Error fetching project ${id}:`, error);
        return res.status(500).json({ error: "Failed to retrieve project details." });
    }
});
/**
 * POST /api/projects
 * Creates a new project in the database. Protected by Auth.
 * Expects an image upload in multi-part form.
 */
router.post("/", auth_1.requireAuth, upload.single("image"), async (req, res) => {
    try {
        const { id, title, description, longDescription, status, category, tags, files } = req.body;
        if (!id || !title || !description || !category) {
            return res.status(400).json({ error: "Missing required project fields (id, title, description, category)." });
        }
        // Check if project id already exists
        const existingProject = await db_1.default.project.findUnique({ where: { id } });
        if (existingProject) {
            return res.status(409).json({ error: "A project with this cryptographic ID already exists." });
        }
        // Image upload handling
        let imageUrl = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600"; // Default image fallback
        if (req.file) {
            try {
                const uploadResult = await (0, cloudinary_1.uploadToCloudinary)(req.file.buffer, "camcod_projects");
                imageUrl = uploadResult.secure_url;
            }
            catch (uploadError) {
                console.error("Cloudinary upload failed, falling back to default image:", uploadError);
            }
        }
        // Parse tags (tags can arrive as a JSON array string or comma separated)
        let tagsArray = [];
        if (tags) {
            try {
                tagsArray = JSON.parse(tags);
            }
            catch {
                tagsArray = String(tags)
                    .split(",")
                    .map((t) => t.trim().toUpperCase())
                    .filter(Boolean);
            }
        }
        // Parse files JSON tree
        let filesJson = {};
        if (files) {
            try {
                filesJson = typeof files === "string" ? JSON.parse(files) : files;
            }
            catch {
                filesJson = { "README.md": `# ${title}\n\nProject initialized.` };
            }
        }
        const project = await db_1.default.project.create({
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
        const dbUser = await db_1.default.user.findUnique({ where: { id: req.user?.id } });
        if (dbUser && dbUser.role === "developer") {
            await db_1.default.projectDev.create({
                data: {
                    projectId: project.id,
                    userId: dbUser.id,
                },
            });
            // Update devs count
            await db_1.default.project.update({
                where: { id: project.id },
                data: { devsCount: 1 },
            });
        }
        return res.status(201).json(project);
    }
    catch (error) {
        console.error("Error creating project:", error);
        return res.status(500).json({ error: "Failed to create project listing." });
    }
});
/**
 * PUT /api/projects/:id
 * Updates an existing project. Protected by Auth.
 */
router.put("/:id", auth_1.requireAuth, upload.single("image"), async (req, res) => {
    const { id } = req.params;
    try {
        const existingProject = await db_1.default.project.findUnique({ where: { id } });
        if (!existingProject) {
            return res.status(404).json({ error: "Project not found." });
        }
        const { title, description, longDescription, status, category, tags, files } = req.body;
        const updateData = {};
        if (title)
            updateData.title = title;
        if (description)
            updateData.description = description;
        if (longDescription)
            updateData.longDescription = longDescription;
        if (status)
            updateData.status = status;
        if (category)
            updateData.category = category;
        if (req.file) {
            const uploadResult = await (0, cloudinary_1.uploadToCloudinary)(req.file.buffer, "camcod_projects");
            updateData.imageUrl = uploadResult.secure_url;
        }
        if (tags) {
            try {
                updateData.tags = JSON.parse(tags);
            }
            catch {
                updateData.tags = String(tags)
                    .split(",")
                    .map((t) => t.trim().toUpperCase())
                    .filter(Boolean);
            }
        }
        if (files) {
            try {
                updateData.files = typeof files === "string" ? JSON.parse(files) : files;
            }
            catch {
                // Keep old files if invalid
            }
        }
        const updatedProject = await db_1.default.project.update({
            where: { id },
            data: updateData,
        });
        return res.json(updatedProject);
    }
    catch (error) {
        console.error(`Error updating project ${id}:`, error);
        return res.status(500).json({ error: "Failed to update project listing." });
    }
});
/**
 * DELETE /api/projects/:id
 * Deletes a project. Protected by Auth.
 */
router.delete("/:id", auth_1.requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const existingProject = await db_1.default.project.findUnique({ where: { id } });
        if (!existingProject) {
            return res.status(404).json({ error: "Project not found." });
        }
        await db_1.default.project.delete({ where: { id } });
        return res.json({ message: "Project deleted successfully." });
    }
    catch (error) {
        console.error(`Error deleting project ${id}:`, error);
        return res.status(500).json({ error: "Failed to delete project listing." });
    }
});
exports.default = router;
