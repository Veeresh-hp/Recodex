import { Router, Response } from "express";
import multer from "multer";
import prisma from "../config/db";
import { uploadToCloudinary } from "../config/cloudinary";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB limit for profile images
  },
});

/**
 * GET /api/users/profile
 * Returns the currently authenticated user's database profile and projects.
 */
router.get("/profile", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;

  try {
    const user = await prisma.user.findUnique({
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
      projects: user.projects.map((p: any) => p.project),
    };

    return res.json(formattedUser);
  } catch (error: any) {
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
  { id: "user_3GMUgXnuLD5lHb6Rn9O8P2TIPMW", name: "Veeresh H P", email: "veereshhp2004@gmail.com", role: "admin", status: "Active" },
  { id: "user_3G82d9FackVcHk09TD8V9uHKJEt", name: "VEERESH H P", email: "veereshhp04@gmail.com", role: "developer", status: "Active" },
  { id: "user_3IKkzxTelZizaJk8JgKn4iGZXHi", name: "veer_thinks", email: "veerthinks@gmail.com", role: "developer", status: "Active" },
  { id: "user_3IKE3zF8zNPvnmxWhNQqnscyFB3", name: "Vaibhav joshi", email: "vaibhavjoshi18660@gmail.com", role: "developer", status: "Active" },
  { id: "user_3IKF89Diganth0719Gowda001", name: "Diganth Gowda", email: "diganthgowda0719@gmail.com", role: "developer", status: "Active" },
  { id: "user_3IKF90SyedRehan002", name: "Syed Rehan", email: "syedreehaan0@gmail.com", role: "developer", status: "Active" },
  { id: "user_3IKF91DavanKS003", name: "Davan KS", email: "davansonu67@gmail.com", role: "developer", status: "Active" }
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
          const clerkUsers: any[] = await response.json();
          for (const u of clerkUsers) {
            const email = u.email_addresses?.[0]?.email_address;
            if (!email) continue;
            const firstName = u.first_name || "";
            const lastName = u.last_name || "";
            const fullName = [firstName, lastName].filter(Boolean).join(" ") || u.username || email.split("@")[0];
            const isRootAdmin = email.toLowerCase() === "veereshhp2004@gmail.com";
            const img = u.image_url || u.profile_image_url || null;

            const existingUser = await prisma.user.findUnique({ where: { id: u.id } });
            const targetRole = isRootAdmin ? "admin" : (existingUser?.role || "client");

            await prisma.user.upsert({
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
      } catch (clerkErr) {
        console.warn("[RECODEX API] Clerk automatic user sync warning:", clerkErr);
      }
    }

    const dbUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    const getUserKey = (u: any): string => {
      const emailStr = (u.email || "").trim().toLowerCase();
      const nameStr = (u.name || "").trim().toLowerCase().replace(/[^a-z]/g, "");
      const emailHandle = emailStr.split("@")[0].replace(/[^a-z]/g, "");

      if (emailStr.includes("veereshhp2004")) return "veereshhp2004@gmail.com";
      if (emailStr.includes("veereshhp04")) return "veereshhp04@gmail.com";

      if (nameStr && nameStr.length > 3) return nameStr;
      if (emailHandle && emailHandle.length > 3) return emailHandle;
      return emailStr;
    };

    const userMap = new Map<string, any>();
    FALLBACK_USERS.forEach((u: any) => userMap.set(getUserKey(u), u));
    dbUsers.forEach((u: any) => {
      const key = getUserKey(u);
      userMap.set(key, { ...userMap.get(key), ...u });
    });

    return res.json(Array.from(userMap.values()));
  } catch (error: any) {
    console.error("Error retrieving all ecosystem users:", error);
    const getUserKey = (u: any): string => {
      const emailStr = (u.email || "").trim().toLowerCase();
      const nameStr = (u.name || "").trim().toLowerCase().replace(/[^a-z]/g, "");
      const emailHandle = emailStr.split("@")[0].replace(/[^a-z]/g, "");
      if (emailStr.includes("veereshhp2004")) return "veereshhp2004@gmail.com";
      if (emailStr.includes("veereshhp04")) return "veereshhp04@gmail.com";
      if (nameStr && nameStr.length > 3) return nameStr;
      if (emailHandle && emailHandle.length > 3) return emailHandle;
      return emailStr;
    };
    const userMap = new Map<string, any>();
    FALLBACK_USERS.forEach((u: any) => userMap.set(getUserKey(u), u));
    return res.json(Array.from(userMap.values()));
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
    const isRootAdmin = email.toLowerCase() === "veereshhp2004@gmail.com";
    const existingUser = await prisma.user.findUnique({ where: { id } });
    const userRole = isRootAdmin ? "admin" : (existingUser?.role || role || "client");

    const user = await prisma.user.upsert({
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
        role: isRootAdmin ? "admin" : "client",
        profileImage: profileImage || null,
      },
    });

    console.log(`Synced user: ${user.name} (${user.id}) with role: ${user.role}`);
    return res.status(200).json(user);
  } catch (error: any) {
    console.error("Error syncing user data:", error);
    return res.status(500).json({ error: "Database synchronization failed." });
  }
});

/**
 * PUT /api/users/profile
 * Updates the authenticated user's profile information.
 * Accepts optional profileImage upload.
 */
router.put(
  "/profile",
  requireAuth,
  upload.single("profileImage"),
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    try {
      const { name, role } = req.body;
      const updateData: any = {};

      if (name) updateData.name = name;
      if (role) updateData.role = role;

      // Handle avatar file upload
      if (req.file) {
        try {
          const uploadResult = await uploadToCloudinary(req.file.buffer, "recodex_avatars");
          updateData.profileImage = uploadResult.secure_url;
        } catch (uploadError) {
          console.error("Avatar upload failed:", uploadError);
          return res.status(500).json({ error: "Failed to upload avatar image to cloud storage." });
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      return res.json(updatedUser);
    } catch (error: any) {
      console.error(`Error updating profile for user ${userId}:`, error);
      return res.status(500).json({ error: "Failed to update profile settings." });
    }
  }
);

/**
 * POST /api/users/join-project/:projectId
 * Connects a developer user to a project.
 */
router.post(
  "/join-project/:projectId",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { projectId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized access." });
    }

    try {
      // Confirm project exists
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) {
        return res.status(404).json({ error: "Target project does not exist." });
      }

      // Check if developer is already assigned
      const existingAssignment = await prisma.projectDev.findUnique({
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
      await prisma.projectDev.create({
        data: {
          projectId,
          userId,
        },
      });

      // Increment devs count
      const updatedProject = await prisma.project.update({
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
    } catch (error: any) {
      console.error(`Error joining project ${projectId}:`, error);
      return res.status(500).json({ error: "Failed to join project node." });
    }
  }
);

/**
 * PUT /api/users/:id
 * Allows admin to update any user's profile or status in the database.
 */
router.put("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, role } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        role,
      },
    });
    return res.json(updatedUser);
  } catch (error: any) {
    console.error(`Error updating user ${id} inside database:`, error);
    return res.status(500).json({ error: "Failed to update user profile in database." });
  }
});

/**
 * DELETE /api/users/:id
 * Allows admin to delete a user profile from the database.
 */
router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({ where: { id } });
    return res.json({ message: "User profile deleted successfully from database." });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.json({ message: "User profile already deleted or does not exist." });
    }
    console.error(`Error deleting user ${id} inside database:`, error);
    return res.status(500).json({ error: "Failed to delete user profile from database." });
  }
});

export default router;
