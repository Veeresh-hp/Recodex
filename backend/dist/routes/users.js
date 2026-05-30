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
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 3 * 1024 * 1024, // 3MB limit for profile images
    },
});
/**
 * GET /api/users/profile
 * Returns the currently authenticated user's database profile and projects.
 */
router.get("/profile", auth_1.requireAuth, async (req, res) => {
    const userId = req.user?.id;
    try {
        const user = await db_1.default.user.findUnique({
            where: { id: userId },
            include: {
                projects: {
                    include: {
                        project: true,
                    },
                },
            },
        });
        if (!user) {
            return res.status(404).json({ error: "User profile not found in database." });
        }
        // Format output: pull projects relation list out of the join table
        const formattedUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            profileImage: user.profileImage,
            createdAt: user.createdAt,
            projects: user.projects.map((p) => p.project),
        };
        return res.json(formattedUser);
    }
    catch (error) {
        console.error("Error retrieving user profile:", error);
        return res.status(500).json({ error: "Failed to retrieve user profile." });
    }
});
/**
 * GET /api/users
 * Returns a list of all synchronized ecosystem users.
 */
router.get("/", async (_req, res) => {
    try {
        const users = await db_1.default.user.findMany({
            orderBy: { createdAt: "desc" },
        });
        return res.json(users);
    }
    catch (error) {
        console.error("Error retrieving all ecosystem users:", error);
        return res.status(500).json({ error: "Failed to retrieve ecosystem users." });
    }
});
/**
 * POST /api/users/sync
 * Synchronizes user data from frontend signups.
 * If the user record exists, it updates it, otherwise creates a new one.
 * Bypasses JWT validation if needed (e.g. called right after auth registration),
 * but validating JWT is recommended if req.body.id matches req.user.id.
 * To keep registration simple and fast, we allow an option to sync during signup.
 */
router.post("/sync", async (req, res) => {
    const { id, email, name, role, profileImage } = req.body;
    if (!id || !email || !name) {
        return res.status(400).json({ error: "Missing required identity synchronization parameters (id, email, name)." });
    }
    try {
        const user = await db_1.default.user.upsert({
            where: { id },
            update: {
                name,
                email,
                role: role || "developer",
            },
            create: {
                id,
                email,
                name,
                role: role || "developer",
                profileImage: profileImage || null,
            },
        });
        console.log(`Synced user: ${user.name} (${user.id})`);
        return res.status(200).json(user);
    }
    catch (error) {
        console.error("Error syncing user data:", error);
        return res.status(500).json({ error: "Database synchronization failed." });
    }
});
/**
 * PUT /api/users/profile
 * Updates the authenticated user's profile information.
 * Accepts optional profileImage upload.
 */
router.put("/profile", auth_1.requireAuth, upload.single("profileImage"), async (req, res) => {
    const userId = req.user?.id;
    try {
        const { name, role } = req.body;
        const updateData = {};
        if (name)
            updateData.name = name;
        if (role)
            updateData.role = role;
        // Handle avatar file upload
        if (req.file) {
            try {
                const uploadResult = await (0, cloudinary_1.uploadToCloudinary)(req.file.buffer, "camcod_avatars");
                updateData.profileImage = uploadResult.secure_url;
            }
            catch (uploadError) {
                console.error("Avatar upload failed:", uploadError);
                return res.status(500).json({ error: "Failed to upload avatar image to cloud storage." });
            }
        }
        const updatedUser = await db_1.default.user.update({
            where: { id: userId },
            data: updateData,
        });
        return res.json(updatedUser);
    }
    catch (error) {
        console.error(`Error updating profile for user ${userId}:`, error);
        return res.status(500).json({ error: "Failed to update profile settings." });
    }
});
/**
 * POST /api/users/join-project/:projectId
 * Connects a developer user to a project.
 */
router.post("/join-project/:projectId", auth_1.requireAuth, async (req, res) => {
    const userId = req.user?.id;
    const { projectId } = req.params;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized access." });
    }
    try {
        // Confirm project exists
        const project = await db_1.default.project.findUnique({ where: { id: projectId } });
        if (!project) {
            return res.status(404).json({ error: "Target project does not exist." });
        }
        // Check if developer is already assigned
        const existingAssignment = await db_1.default.projectDev.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId,
                },
            },
        });
        if (existingAssignment) {
            return res.status(400).json({ error: "You are already joined to this project node." });
        }
        // Assign developer
        await db_1.default.projectDev.create({
            data: {
                projectId,
                userId,
            },
        });
        // Increment devs count
        const updatedProject = await db_1.default.project.update({
            where: { id: projectId },
            data: {
                devsCount: {
                    increment: 1,
                },
            },
        });
        return res.json({
            message: "Successfully synchronized with project core.",
            devsCount: updatedProject.devsCount,
        });
    }
    catch (error) {
        console.error(`Error joining project ${projectId}:`, error);
        return res.status(500).json({ error: "Failed to join project node." });
    }
});
/**
 * PUT /api/users/:id
 * Allows admin to update any user's profile or status in the database.
 */
router.put("/:id", auth_1.requireAuth, async (req, res) => {
    const { id } = req.params;
    const { name, role } = req.body;
    try {
        const updatedUser = await db_1.default.user.update({
            where: { id },
            data: {
                name,
                role,
            },
        });
        return res.json(updatedUser);
    }
    catch (error) {
        console.error(`Error updating user ${id} inside database:`, error);
        return res.status(500).json({ error: "Failed to update user profile in database." });
    }
});
/**
 * DELETE /api/users/:id
 * Allows admin to delete a user profile from the database.
 */
router.delete("/:id", auth_1.requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.default.user.delete({ where: { id } });
        return res.json({ message: "User profile deleted successfully from database." });
    }
    catch (error) {
        console.error(`Error deleting user ${id} inside database:`, error);
        return res.status(500).json({ error: "Failed to delete user profile from database." });
    }
});
exports.default = router;
