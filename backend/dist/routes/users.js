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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 3 * 1024 * 1024, // 3MB limit for profile images
    },
});
const PROMOTED_ADMINS_FILE = path_1.default.join(__dirname, "../../promoted_admins_db.json");
const ROOT_ADMIN_EMAILS = ["veereshhp2004@gmail.com", "udaykumaras34@gmail.com"];
const getSavedPromotedAdmins = () => {
    const rootAdmins = ROOT_ADMIN_EMAILS;
    try {
        if (fs_1.default.existsSync(PROMOTED_ADMINS_FILE)) {
            const data = fs_1.default.readFileSync(PROMOTED_ADMINS_FILE, "utf-8");
            const list = JSON.parse(data);
            return Array.from(new Set([...rootAdmins, ...list.map((e) => e.toLowerCase().trim())]));
        }
    }
    catch (err) {
        console.warn("Failed to read promoted admins file:", err);
    }
    return rootAdmins;
};
const savePromotedAdmin = (email, isMakeAdmin) => {
    const emailClean = email.toLowerCase().trim();
    let list = getSavedPromotedAdmins();
    if (isMakeAdmin) {
        if (!list.includes(emailClean))
            list.push(emailClean);
    }
    else {
        // If removing admin, remove from list (except root platform owners)
        if (!ROOT_ADMIN_EMAILS.includes(emailClean)) {
            list = list.filter((e) => e.toLowerCase().trim() !== emailClean);
        }
    }
    try {
        const dir = path_1.default.dirname(PROMOTED_ADMINS_FILE);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        fs_1.default.writeFileSync(PROMOTED_ADMINS_FILE, JSON.stringify(list, null, 2), "utf-8");
    }
    catch (err) {
        console.warn("Failed to save promoted admins file:", err);
    }
    return list;
};
const AUDIT_LOGS_FILE = path_1.default.join(__dirname, "../../audit_logs_db.json");
const getSavedAuditLogs = () => {
    try {
        if (fs_1.default.existsSync(AUDIT_LOGS_FILE)) {
            const data = fs_1.default.readFileSync(AUDIT_LOGS_FILE, "utf-8");
            return JSON.parse(data);
        }
    }
    catch (err) {
        console.warn("Failed to read audit logs file:", err);
    }
    return [];
};
const saveAuditLog = (entry) => {
    const logs = getSavedAuditLogs();
    const newEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        adminName: entry.adminName || "System Admin",
        adminEmail: entry.adminEmail || "admin@recodex.in",
        action: entry.action || "System Action",
        target: entry.target || "N/A",
        details: entry.details || "",
        timestamp: new Date().toISOString(),
        formattedDate: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    };
    const updated = [newEntry, ...logs].slice(0, 100);
    try {
        fs_1.default.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(updated, null, 2), "utf-8");
    }
    catch (err) {
        console.warn("Failed to write audit logs file:", err);
    }
    return updated;
};
/**
 * GET /api/users/audit-logs
 * Returns list of attributed admin activities.
 */
router.get("/audit-logs", (_req, res) => {
    return res.json(getSavedAuditLogs());
});
/**
 * POST /api/users/audit-logs
 * Logs an admin action with name and email attribution.
 */
router.post("/audit-logs", (req, res) => {
    const { adminName, adminEmail, action, target, details } = req.body;
    if (!action) {
        return res.status(400).json({ error: "Missing required audit action parameter." });
    }
    const updatedLogs = saveAuditLog({ adminName, adminEmail, action, target, details });
    return res.json({ success: true, logs: updatedLogs });
});
/**
 * GET /api/users/promoted-admins
 * Returns array of all system & promoted admin emails.
 */
router.get("/promoted-admins", (_req, res) => {
    const admins = getSavedPromotedAdmins();
    return res.json(admins);
});
/**
 * POST /api/users/promote-admin
 * Updates admin status for a user email.
 */
router.post("/promote-admin", async (req, res) => {
    const { email, role } = req.body;
    if (!email) {
        return res.status(400).json({ error: "Missing email parameter." });
    }
    const emailClean = email.toLowerCase().trim();
    const isMakeAdmin = role === "admin";
    const updatedList = savePromotedAdmin(emailClean, isMakeAdmin);
    const targetRole = isMakeAdmin ? "admin" : (role || "developer");
    try {
        await db_1.default.user.updateMany({
            where: {
                email: {
                    equals: emailClean,
                    mode: "insensitive",
                },
            },
            data: {
                role: targetRole,
            },
        });
    }
    catch (dbErr) {
        console.warn("Failed to update user role in DB on promote-admin:", dbErr);
    }
    return res.json({ success: true, promotedAdmins: updatedList });
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
 * Automatically syncs with Clerk users if CLERK_SECRET_KEY is configured.
 */
const FALLBACK_USERS = [
    { id: "user_3GMUgXnuLD5lHb6Rn9O8P2TIPMW", name: "Veeresh H P", email: "veereshhp2004@gmail.com", role: "admin", status: "Active", createdAt: "2026-07-11T16:02:39.730Z" },
    { id: "user_3G8UdayKumarAs34Admin001", name: "Mr._.Ratha._", email: "udaykumaras34@gmail.com", role: "admin", status: "Active", createdAt: new Date().toISOString() },
    { id: "user_3G82d9FackVcHk09TD8V9uHKJEt", name: "VEERESH H P", email: "veereshhp04@gmail.com", role: "client", status: "Active", createdAt: "2026-07-11T15:58:52.253Z" },
    { id: "user_3IKkzxTelZizaJk8JgKn4iGZXHi", name: "veer_thinks", email: "veerthinks@gmail.com", role: "client", status: "Active", createdAt: "2026-08-24T10:39:11.708Z" },
    { id: "user_3IKE3zF8zNPvnmxWhNQqnscyFB3", name: "Vaibhav Joshi", email: "vaibhavjoshi18660@gmail.com", role: "client", status: "Active", createdAt: "2026-08-24T10:39:13.475Z" },
    { id: "user_3IKF89Diganth0719Gowda001", name: "Diganth Gowda", email: "diganthgowda0719@gmail.com", role: "client", status: "Active", createdAt: "2026-08-27T11:20:00.000Z" },
    { id: "user_3IKF90SyedRehan002", name: "Syed Rehan", email: "syedreehaan0@gmail.com", role: "client", status: "Active", createdAt: "2026-08-27T12:15:00.000Z" },
    { id: "user_3IKF91DavanKS003", name: "Davan KS", email: "davansonu67@gmail.com", role: "client", status: "Active", createdAt: "2026-08-27T13:40:00.000Z" }
];
router.get("/", async (_req, res) => {
    try {
        const clerkSecret = process.env.CLERK_SECRET_KEY;
        if (clerkSecret) {
            try {
                const response = await fetch("https://api.clerk.com/v1/users", {
                    headers: {
                        Authorization: `Bearer ${clerkSecret}`,
                    },
                });
                if (response.ok) {
                    const clerkUsers = await response.json();
                    for (const u of clerkUsers) {
                        const email = u.email_addresses?.[0]?.email_address;
                        if (!email)
                            continue;
                        const firstName = u.first_name || "";
                        const lastName = u.last_name || "";
                        const fullName = [firstName, lastName].filter(Boolean).join(" ") || u.username || email.split("@")[0];
                        const isRootAdmin = ROOT_ADMIN_EMAILS.includes(email.toLowerCase().trim());
                        const img = u.image_url || u.profile_image_url || null;
                        const existingUser = await db_1.default.user.findUnique({ where: { id: u.id } });
                        const targetRole = isRootAdmin ? "admin" : (existingUser?.role === "suspended" ? "suspended" : "client");
                        await db_1.default.user.upsert({
                            where: { id: u.id },
                            update: {
                                email,
                                name: fullName,
                                role: targetRole,
                                ...(img ? { profileImage: img } : {}),
                            },
                            create: {
                                id: u.id,
                                email,
                                name: fullName,
                                role: isRootAdmin ? "admin" : "client",
                                profileImage: img,
                            },
                        });
                    }
                }
            }
            catch (clerkErr) {
                console.warn("[RECODEX API] Clerk automatic user sync warning:", clerkErr);
            }
        }
        const dbUsers = await db_1.default.user.findMany({
            orderBy: { createdAt: "desc" },
        });
        const getUserKey = (u) => {
            const emailStr = (u.email || "").trim().toLowerCase();
            const nameStr = (u.name || "").trim().toLowerCase().replace(/[^a-z]/g, "");
            const emailHandle = emailStr.split("@")[0].replace(/[^a-z]/g, "");
            if (emailStr.includes("veereshhp2004"))
                return "veereshhp2004@gmail.com";
            if (emailStr.includes("udaykumaras34"))
                return "udaykumaras34@gmail.com";
            if (emailStr.includes("veereshhp04"))
                return "veereshhp04@gmail.com";
            if (nameStr && nameStr.length > 3)
                return nameStr;
            if (emailHandle && emailHandle.length > 3)
                return emailHandle;
            return emailStr;
        };
        const promotedAdmins = getSavedPromotedAdmins();
        const userMap = new Map();
        FALLBACK_USERS.forEach((u) => userMap.set(getUserKey(u), { ...u }));
        dbUsers.forEach((u) => {
            const key = getUserKey(u);
            userMap.set(key, { ...userMap.get(key), ...u });
        });
        const finalUsers = Array.from(userMap.values()).map((u) => {
            const emailClean = (u.email || "").toLowerCase().trim();
            const isRoot = ROOT_ADMIN_EMAILS.includes(emailClean);
            const isPromoted = promotedAdmins.includes(emailClean);
            if (isRoot || isPromoted) {
                return { ...u, role: "admin" };
            }
            return { ...u, role: u.role === "suspended" ? "suspended" : "client" };
        }).sort((a, b) => {
            const emailA = (a.email || "").toLowerCase().trim();
            const emailB = (b.email || "").toLowerCase().trim();
            if (emailA === "veereshhp2004@gmail.com")
                return -1;
            if (emailB === "veereshhp2004@gmail.com")
                return 1;
            const isAdminA = a.role === "admin" || ROOT_ADMIN_EMAILS.includes(emailA);
            const isAdminB = b.role === "admin" || ROOT_ADMIN_EMAILS.includes(emailB);
            if (isAdminA && !isAdminB)
                return -1;
            if (!isAdminA && isAdminB)
                return 1;
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
        });
        return res.json(finalUsers);
    }
    catch (error) {
        console.error("Error retrieving all ecosystem users:", error);
        const promotedAdmins = getSavedPromotedAdmins();
        const getUserKey = (u) => {
            const emailStr = (u.email || "").trim().toLowerCase();
            const nameStr = (u.name || "").trim().toLowerCase().replace(/[^a-z]/g, "");
            const emailHandle = emailStr.split("@")[0].replace(/[^a-z]/g, "");
            if (emailStr.includes("veereshhp2004"))
                return "veereshhp2004@gmail.com";
            if (emailStr.includes("udaykumaras34"))
                return "udaykumaras34@gmail.com";
            if (emailStr.includes("veereshhp04"))
                return "veereshhp04@gmail.com";
            if (nameStr && nameStr.length > 3)
                return nameStr;
            if (emailHandle && emailHandle.length > 3)
                return emailHandle;
            return emailStr;
        };
        const userMap = new Map();
        FALLBACK_USERS.forEach((u) => userMap.set(getUserKey(u), { ...u }));
        const finalUsers = Array.from(userMap.values()).map((u) => {
            const emailClean = (u.email || "").toLowerCase().trim();
            const isRoot = ROOT_ADMIN_EMAILS.includes(emailClean);
            const isPromoted = promotedAdmins.includes(emailClean);
            if (isRoot || isPromoted) {
                return { ...u, role: "admin" };
            }
            return { ...u, role: u.role === "suspended" ? "suspended" : "client" };
        }).sort((a, b) => {
            const emailA = (a.email || "").toLowerCase().trim();
            const emailB = (b.email || "").toLowerCase().trim();
            if (emailA === "veereshhp2004@gmail.com")
                return -1;
            if (emailB === "veereshhp2004@gmail.com")
                return 1;
            const isAdminA = a.role === "admin" || ROOT_ADMIN_EMAILS.includes(emailA);
            const isAdminB = b.role === "admin" || ROOT_ADMIN_EMAILS.includes(emailB);
            if (isAdminA && !isAdminB)
                return -1;
            if (!isAdminA && isAdminB)
                return 1;
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
        });
        return res.json(finalUsers);
    }
});
/**
 * POST /api/users/sync
 * Synchronizes user data from frontend signups.
 * If the user record exists, it updates it, otherwise creates a new one.
 */
router.post("/sync", async (req, res) => {
    const { id, email, name, role, profileImage } = req.body;
    if (!id || !email || !name) {
        return res.status(400).json({ error: "Missing required identity synchronization parameters (id, email, name)." });
    }
    try {
        const isRootAdmin = ROOT_ADMIN_EMAILS.includes(email.toLowerCase().trim());
        const promotedAdmins = getSavedPromotedAdmins();
        const isPromoted = promotedAdmins.includes(email.toLowerCase().trim());
        const existingUser = await db_1.default.user.findUnique({ where: { id } });
        let userRole = "client";
        if (isRootAdmin || isPromoted) {
            userRole = "admin";
        }
        else if (existingUser?.role) {
            userRole = existingUser.role === "admin" ? "developer" : existingUser.role;
        }
        else if (role) {
            userRole = role === "admin" ? "developer" : role;
        }
        const user = await db_1.default.user.upsert({
            where: { id },
            update: {
                name,
                email,
                role: userRole,
                ...(profileImage ? { profileImage } : {}),
            },
            create: {
                id,
                email,
                name,
                role: userRole,
                profileImage: profileImage || null,
            },
        });
        console.log(`Synced user: ${user.name} (${user.id}) with role: ${user.role}`);
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
                const uploadResult = await (0, cloudinary_1.uploadToCloudinary)(req.file.buffer, "recodex_avatars");
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
    const { name, role, email } = req.body;
    if (email && role) {
        savePromotedAdmin(email, role === "admin");
    }
    try {
        const updatedUser = await db_1.default.user.update({
            where: { id },
            data: {
                ...(name ? { name } : {}),
                ...(role ? { role } : {}),
            },
        });
        if (updatedUser.email && role) {
            savePromotedAdmin(updatedUser.email, role === "admin");
        }
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
        if (error.code === "P2025") {
            return res.json({ message: "User profile already deleted or does not exist." });
        }
        console.error(`Error deleting user ${id} inside database:`, error);
        return res.status(500).json({ error: "Failed to delete user profile from database." });
    }
});
exports.default = router;
