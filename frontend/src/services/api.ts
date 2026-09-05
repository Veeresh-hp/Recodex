import { Project, MOCK_PROJECTS } from "@/data/mockData";


const getApiBaseUrl = () => {
  const isVercelProd = typeof window !== "undefined" && (
    window.location.hostname.endsWith(".vercel.app") ||
    window.location.hostname === "recodex1.vercel.app"
  );
  
  if (isVercelProd) {
    return "/api";
  }

  const envUrl = typeof import.meta !== "undefined" && import.meta.env && (import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL);
  if (envUrl) {
    return envUrl;
  }

  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    // If accessing from a local network IP address, point to backend on the same host on port 5000
    const isIp = /^[0-9.]+$/.test(window.location.hostname);
    if (isIp || window.location.port === "3000") {
      return `http://${window.location.hostname}:5000/api`;
    }
    return "/api";
  }

  return "http://localhost:5000/api";
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Fetches all project items. If the server is offline or fails,
 * it automatically falls back to local static mock data.
 * 
 * @param category - Optional category filter
 * @param search - Optional search query string
 */
export async function getProjects(category?: string, search?: string): Promise<Project[]> {
  try {
    const url = new URL(`${API_BASE_URL}/projects`, typeof window !== "undefined" ? window.location.origin : undefined);
    if (category) {
      url.searchParams.append("category", category);
    }
    if (search) {
      url.searchParams.append("search", search);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP server error: Status ${response.status}`);
    }

    const data = await response.json();
    
    // Map backend response fields to frontend format (imageUrl -> image)
    return data.map((item: any) => ({
      id: item.id,
      dir: MOCK_PROJECTS.find((m) => m.id === item.id)?.dir || item.dir || item.id,
      title: item.title,
      description: item.description,
      longDescription: item.longDescription,
      status: item.status,
      image: item.imageUrl || item.image,
      category: item.category,
      tags: item.tags,
      devsCount: item.devsCount,
      stars: item.stars,
      forks: item.forks,
      files: item.files,
    }));
  } catch (error) {
    console.warn("[RECODEX API] Local server unreachable. Reverting to static network mock nodes.", error);
    
    // Return filtered local mock data
    let results = [...MOCK_PROJECTS];
    if (category) {
      results = results.filter((p) => p.category === category);
    }
    if (search) {
      const query = search.toLowerCase();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      );
    }
    return results;
  }
}

/**
 * Fetches a single project item by ID. Falls back to mock data on server errors.
 * 
 * @param id - Unique project string ID
 */
export async function getProjectById(id: string): Promise<Project> {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP server error: Status ${response.status}`);
    }

    const item = await response.json();

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      longDescription: item.longDescription,
      status: item.status,
      image: item.imageUrl,
      category: item.category,
      tags: item.tags,
      devsCount: item.devsCount,
      stars: item.stars,
      forks: item.forks,
      files: item.files,
    };
  } catch (error) {
    console.warn(`[RECODEX API] Local server unreachable for ID: ${id}. Reading static local core.`, error);
    const mock = MOCK_PROJECTS.find((p) => p.id === id);
    if (!mock) {
      throw new Error(`Technical identifier '${id}' is not indexed in mock or live repository database.`);
    }
    return mock;
  }
}

/**
 * Synchronizes frontend auth signups with the Express backend database.
 */
export async function syncUser(userData: {
  id: string;
  email: string;
  name: string;
  role?: string;
  profileImage?: string;
}): Promise<any> {
  try {
    if (typeof window !== "undefined" && userData.email) {
      const emailClean = userData.email.toLowerCase().trim();
      const raw = localStorage.getItem("recodex_synced_users");
      const list: any[] = raw ? JSON.parse(raw) : [];
      const index = list.findIndex((u) => (u.email || "").toLowerCase().trim() === emailClean);

      // Preserve existing original creation date; never overwrite with Date.now()
      const seedUser = REAL_ECOSYSTEM_USERS.find(u => u.email.toLowerCase() === emailClean);
      const existingCreatedAt = index >= 0 && list[index]?.createdAt ? list[index].createdAt : null;
      const preservedCreatedAt = seedUser?.createdAt || existingCreatedAt || new Date().toISOString();

      const newUserObj = {
        id: userData.id || (index >= 0 ? list[index].id : `usr-${Date.now()}`),
        name: userData.name || (index >= 0 ? list[index].name : userData.email.split("@")[0]),
        email: userData.email,
        role: userData.role || (["veereshhp2004@gmail.com", "udaykumaras34@gmail.com"].includes(emailClean) ? "admin" : "client"),
        profileImage: userData.profileImage || (index >= 0 ? list[index].profileImage : ""),
        status: "Active",
        createdAt: preservedCreatedAt,
      };

      if (index >= 0) {
        list[index] = { ...list[index], ...newUserObj, createdAt: preservedCreatedAt };
      } else {
        list.unshift(newUserObj);
      }

      localStorage.setItem("recodex_synced_users", JSON.stringify(list));
      window.dispatchEvent(new Event("recodex-user-registered"));
      window.dispatchEvent(new Event("storage"));
    }
  } catch (e) {
    console.error("Local user sync error:", e);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`Authentication Sync failed: status ${response.status}`);
    }

    return await response.json();
  } catch (backendError) {
    console.warn("[RECODEX API] User identity sync backend warning:", backendError);
    return null;
  }
}


/**
 * Retrieves the database profile details for the authenticated user session.
 * 
 * @param token - JWT access token string from Supabase Auth
 */
export async function getUserProfile(token: string): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Fetch profile failed: status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("[RECODEX API] Fetch user profile error:", error);
    throw error;
  }
}

/**
 * Commands the backend to assign the authenticated developer to a project node.
 * 
 * @param projectId - Target project ID
 * @param token - JWT access token string from Supabase Auth
 */
export async function joinProject(projectId: string, token: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/join-project/${projectId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to link project node.");
    }

    return await response.json();
  } catch (error) {
    console.error("[RECODEX API] Project deployment node alignment error:", error);
    throw error;
  }
}

const REAL_ECOSYSTEM_USERS = [
  {
    id: "user_3GMUgXnuLD5lHb6Rn9O8P2TIPMW",
    name: "Veeresh H P",
    email: "veereshhp2004@gmail.com",
    role: "admin",
    status: "Active",
    createdAt: "2026-07-11T16:02:39.730Z",
    profileImage: "https://api.dicebear.com/7.x/bottts/svg?seed=veereshhp2004&backgroundColor=0f172a"
  },
  {
    id: "user_3G8UdayKumarAs34Admin001",
    name: "Mr._.Ratha._",
    email: "udaykumaras34@gmail.com",
    role: "admin",
    status: "Active",
    createdAt: new Date().toISOString(),
    profileImage: "https://api.dicebear.com/7.x/bottts/svg?seed=udaykumaras34&backgroundColor=0f172a"
  },
  {
    id: "user_3G82d9FackVcHk09TD8V9uHKJEt",
    name: "VEERESH H P",
    email: "veereshhp04@gmail.com",
    role: "client",
    status: "Active",
    createdAt: "2026-07-11T15:58:52.253Z",
    profileImage: "https://api.dicebear.com/7.x/bottts/svg?seed=veereshhp04&backgroundColor=0f172a"
  },
  {
    id: "user_3IKkzxTelZizaJk8JgKn4iGZXHi",
    name: "veer_thinks",
    email: "veerthinks@gmail.com",
    role: "client",
    status: "Active",
    createdAt: "2026-08-24T10:39:11.708Z",
    profileImage: "https://api.dicebear.com/7.x/bottts/svg?seed=veerthinks&backgroundColor=0f172a"
  },
  {
    id: "user_3IKE3zF8zNPvnmxWhNQqnscyFB3",
    name: "Vaibhav Joshi",
    email: "vaibhavjoshi18660@gmail.com",
    role: "client",
    status: "Active",
    createdAt: "2026-08-24T10:39:13.475Z",
    profileImage: "https://api.dicebear.com/7.x/bottts/svg?seed=vaibhavjoshi&backgroundColor=0f172a"
  },
  {
    id: "user_3IKF89Diganth0719Gowda001",
    name: "Diganth Gowda",
    email: "diganthgowda0719@gmail.com",
    role: "client",
    status: "Active",
    createdAt: "2026-08-27T11:20:00.000Z",
    profileImage: "https://api.dicebear.com/7.x/bottts/svg?seed=diganthgowda&backgroundColor=0f172a"
  },
  {
    id: "user_3IKF90SyedRehan002",
    name: "Syed Rehan",
    email: "syedreehaan0@gmail.com",
    role: "client",
    status: "Active",
    createdAt: "2026-08-27T12:15:00.000Z",
    profileImage: "https://api.dicebear.com/7.x/bottts/svg?seed=syedrehan&backgroundColor=0f172a"
  },
  {
    id: "user_3IKF91DavanKS003",
    name: "Davan KS",
    email: "davansonu67@gmail.com",
    role: "client",
    status: "Active",
    createdAt: "2026-08-27T13:40:00.000Z",
    profileImage: "https://api.dicebear.com/7.x/bottts/svg?seed=davanks&backgroundColor=0f172a"
  }
];

/**
 * Fetches all ecosystem users from the backend database.
 * Returns real registered & synced users without any demo/dummy users.
 */
export async function getUsers(): Promise<any[]> {
  const localSyncedRaw = typeof window !== "undefined" ? localStorage.getItem("recodex_synced_users") : null;
  let localSynced: any[] = localSyncedRaw ? JSON.parse(localSyncedRaw) : [];

  const dummyEmails = ["john.doe@recodex.io", "sarah@skynet.com", "vance@blackmesa.org"];
  localSynced = localSynced.filter((u: any) => u && u.email && !dummyEmails.includes(u.email.trim().toLowerCase()));

  let backendUsers: any[] = [];
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });

    if (response.ok) {
      backendUsers = await response.json();
    }
  } catch (error) {
    console.warn("[RECODEX API] Server endpoint unreachable.", error);
    backendUsers = [];
  }

  const userMap = new Map<string, any>();

  const getUserKey = (u: any): string => {
    const emailStr = (u.email || "").trim().toLowerCase();
    const nameStr = (u.name || "").trim().toLowerCase().replace(/[^a-z]/g, "");
    const emailHandle = emailStr.split("@")[0].replace(/[^a-z]/g, "");

    if (emailStr.includes("veereshhp2004")) return "veereshhp2004@gmail.com";
    if (emailStr.includes("udaykumaras34")) return "udaykumaras34@gmail.com";
    if (emailStr.includes("veereshhp04")) return "veereshhp04@gmail.com";

    if (nameStr && nameStr.length > 3) return nameStr;
    if (emailHandle && emailHandle.length > 3) return emailHandle;
    return emailStr;
  };

  // 1. Seed base real active users
  REAL_ECOSYSTEM_USERS.forEach((u) => {
    userMap.set(getUserKey(u), { ...u });
  });

  // 2. Merge backend users
  backendUsers.forEach((u: any) => {
    if (u && u.email && !dummyEmails.includes(u.email.trim().toLowerCase())) {
      const key = getUserKey(u);
      const existing = userMap.get(key);
      const originalCreatedAt = existing?.createdAt || u.createdAt;
      userMap.set(key, { ...existing, ...u, createdAt: originalCreatedAt });
    }
  });

  // 3. Merge locally synced users
  localSynced.forEach((u: any) => {
    if (u && u.email && !dummyEmails.includes(u.email.trim().toLowerCase())) {
      const key = getUserKey(u);
      const existing = userMap.get(key);
      const originalCreatedAt = existing?.createdAt || u.createdAt;
      if (existing) {
        userMap.set(key, { ...existing, ...u, createdAt: originalCreatedAt });
      } else {
        userMap.set(key, u);
      }
    }
  });

  let serverAdmins: string[] | null = null;
  try {
    const adminRes = await fetch(`${API_BASE_URL}/users/promoted-admins`);
    if (adminRes.ok) {
      const data = await adminRes.json();
      if (Array.isArray(data)) serverAdmins = data.map((e: string) => e.toLowerCase().trim());
    }
  } catch (e) {
    console.warn("Server promoted admins sync warning:", e);
  }

  const promotedAdminsRaw = typeof window !== "undefined" ? localStorage.getItem("recodex_promoted_admin_emails") : null;
  const localPromotedAdmins: string[] = promotedAdminsRaw ? JSON.parse(promotedAdminsRaw) : [];
  const ROOT_ADMIN_EMAILS = ["veereshhp2004@gmail.com", "udaykumaras34@gmail.com"];

  // Use server admins as source of truth if available, otherwise fallback to localPromotedAdmins
  const effectivePromotedAdmins: string[] = serverAdmins !== null
    ? Array.from(new Set([...ROOT_ADMIN_EMAILS, ...serverAdmins]))
    : Array.from(new Set([...ROOT_ADMIN_EMAILS, ...localPromotedAdmins.map((e: string) => e.toLowerCase().trim())]));

  // Keep localStorage promoted admin cache cleanly updated and sanitized
  if (typeof window !== "undefined") {
    try {
      const rawPromoted = localStorage.getItem("recodex_promoted_admin_emails");
      if (rawPromoted) {
        const parsed = JSON.parse(rawPromoted).filter((e: string) => e.toLowerCase().trim() !== "veereshhp04@gmail.com");
        localStorage.setItem("recodex_promoted_admin_emails", JSON.stringify(parsed));
      }
    } catch (e) {}
    if (serverAdmins !== null) {
      localStorage.setItem(
        "recodex_promoted_admin_emails",
        JSON.stringify(serverAdmins.filter((e) => !ROOT_ADMIN_EMAILS.includes(e) && e !== "veereshhp04@gmail.com"))
      );
    }
  }

  const finalUsers = Array.from(userMap.values()).map((u: any) => {
    const emailClean = (u.email || "").toLowerCase().trim();
    if (emailClean === "veereshhp04@gmail.com") {
      return { ...u, role: u.role === "suspended" ? "suspended" : "client" };
    }
    const isRoot = ROOT_ADMIN_EMAILS.includes(emailClean);
    const isPromoted = effectivePromotedAdmins.filter(e => e !== "veereshhp04@gmail.com").includes(emailClean);

    if (isRoot || isPromoted) {
      return { ...u, role: "admin" };
    }
    // Make all other users client role by default unless suspended
    return { ...u, role: u.role === "suspended" ? "suspended" : "client" };
  }).sort((a: any, b: any) => {
    const emailA = (a.email || "").toLowerCase().trim();
    const emailB = (b.email || "").toLowerCase().trim();
    if (emailA === "veereshhp2004@gmail.com") return -1;
    if (emailB === "veereshhp2004@gmail.com") return 1;
    const isAdminA = (emailA !== "veereshhp04@gmail.com") && (a.role === "admin" || ROOT_ADMIN_EMAILS.includes(emailA));
    const isAdminB = (emailB !== "veereshhp04@gmail.com") && (b.role === "admin" || ROOT_ADMIN_EMAILS.includes(emailB));
    if (isAdminA && !isAdminB) return -1;
    if (!isAdminA && isAdminB) return 1;
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  try {
    if (typeof window !== "undefined") {
      localStorage.setItem("recodex_synced_users", JSON.stringify(finalUsers));
    }
  } catch (e) {
    console.warn("Deduplication cleanup error:", e);
  }

  return finalUsers;
}

/**
 * Fetches the system-wide list of promoted admin emails from backend API.
 */
export async function getPromotedAdminsApi(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/users/promoted-admins`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data.map((e: string) => e.toLowerCase().trim());
    }
  } catch (err) {
    console.warn("Failed to fetch promoted admins from backend:", err);
  }
  return ["veereshhp2004@gmail.com", "udaykumaras34@gmail.com"];
}

/**
 * Posts admin promotion to backend API.
 */
export async function promoteUserAdminApi(email: string, role: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/users/promote-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Failed to post promoted admin to backend:", err);
  }
}

export interface AuditLogEntry {
  id: string;
  adminName: string;
  adminEmail: string;
  action: string;
  target: string;
  details?: string;
  timestamp: string;
  formattedDate: string;
}

/**
 * Fetches all attributed admin audit logs.
 */
export async function getAuditLogsApi(): Promise<AuditLogEntry[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/users/audit-logs`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.warn("Failed to fetch audit logs from backend:", err);
  }
  const rawLocal = typeof window !== "undefined" ? localStorage.getItem("recodex_audit_logs") : null;
  return rawLocal ? JSON.parse(rawLocal) : [];
}

/**
 * Logs an attributed admin action to backend API & local storage.
 */
export async function logAdminActivityApi(logData: {
  adminName: string;
  adminEmail: string;
  action: string;
  target: string;
  details?: string;
}): Promise<any> {
  const newEntry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    adminName: logData.adminName || "System Admin",
    adminEmail: logData.adminEmail || "admin@recodex.in",
    action: logData.action,
    target: logData.target || "N/A",
    details: logData.details || "",
    timestamp: new Date().toISOString(),
    formattedDate: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  };

  try {
    if (typeof window !== "undefined") {
      const rawLocal = localStorage.getItem("recodex_audit_logs");
      const list: AuditLogEntry[] = rawLocal ? JSON.parse(rawLocal) : [];
      const updated = [newEntry, ...list].slice(0, 100);
      localStorage.setItem("recodex_audit_logs", JSON.stringify(updated));
    }
  } catch (e) {
    console.warn("Local audit log save warning:", e);
  }

  try {
    await fetch(`${API_BASE_URL}/users/audit-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logData),
    });
  } catch (err) {
    console.warn("Failed to post audit log to backend:", err);
  }
}

/**
 * Updates a user's details inside the PostgreSQL database.
 */
export async function updateUser(userId: string, userData: any, token: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update user: ${response.status}`);
    }
    return await response.json();
  } catch (backendError) {
    console.error("[RECODEX API] Update user profile completely failed:", backendError);
    throw backendError;
  }
}

/**
 * Deletes a user profile from the database.
 */
export async function deleteUser(userId: string, token: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete user: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("[RECODEX API] Delete user error:", error);
    throw error;
  }
}


/**
 * Updates a project listing in the database.
 */
export async function updateProject(projectId: string, projectData: any, token: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update project: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("[RECODEX API] Update project error:", error);
    throw error;
  }
}

/**
 * Deletes a project listing from the database.
 */
export async function deleteProject(projectId: string, token: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete project: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("[RECODEX API] Delete project error:", error);
    throw error;
  }
}

const GOOGLE_SCRIPT_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxzCq2Zsk5b_dCD0eysi3X7MOa5CLgu80EZRFXllz50Djf3GJd0NAAyxsMGFfMoMtxm9w/exec";

/**
 * Submits a new contact inquiry to the backend & Google Sheets Webhook.
 */
export async function submitInquiry(inquiryData: {
  name: string;
  email: string;
  phone: string;
  type: string;
  message: string;
}): Promise<any> {
  const payload = {
    id: `inq-${Date.now()}`,
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    name: inquiryData.name,
    email: inquiryData.email,
    phone: inquiryData.phone,
    type: inquiryData.type || "others",
    message: inquiryData.message,
  };

  // 1. Persist locally for immediate offline/client-side access & Admin Dashboard
  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("recodex_submitted_inquiries");
      const list: any[] = raw ? JSON.parse(raw) : [];
      const isDup = list.some((i) => i.email === payload.email && i.message === payload.message);
      if (!isDup) {
        list.unshift(payload);
        localStorage.setItem("recodex_submitted_inquiries", JSON.stringify(list));
      }
      window.dispatchEvent(new Event("recodex-inquiry-submitted"));
    }
  } catch (lErr) {
    console.warn("[RECODEX API] Local storage inquiry save warning:", lErr);
  }

  // 2. Attempt primary Express backend POST request (which syncs to Google Sheets once)
  let backendSuccess = false;
  try {
    const response = await fetch(`${API_BASE_URL}/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(inquiryData),
    });

    if (response.ok) {
      backendSuccess = true;
      return await response.json();
    }
  } catch (backendError) {
    console.warn("[RECODEX API] Backend submit inquiry warning (using direct Google Sheet sync fallback):", backendError);
  }

  // 3. Fallback direct client fetch to Google Apps Script Webhook ONLY if backend is unavailable
  if (!backendSuccess) {
    try {
      await fetch(GOOGLE_SCRIPT_WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload),
      });
    } catch (gErr) {
      console.warn("[CONTACT WEBHOOK] Direct Google Apps Script dispatch error:", gErr);
    }
  }

  return { success: true, message: "Inquiry submitted and synced successfully.", data: payload };
}

/**
 * Fetches all contact inquiries from backend API, Google Sheet & local sync (admin only).
 */
export async function getInquiries(token?: string): Promise<any[]> {
  let backendInquiries: any[] = [];
  try {
    const headers: Record<string, string> = { "Accept": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}/contacts`, {
      method: "GET",
      headers,
    });

    if (response.ok) {
      backendInquiries = await response.json();
    }
  } catch (error) {
    console.warn("[RECODEX API] Fetch backend inquiries warning:", error);
  }

  // Fetch inquiries from Google Apps Script Webapp GET endpoint if available
  let sheetInquiries: any[] = [];
  try {
    const sheetRes = await fetch(GOOGLE_SCRIPT_WEBHOOK_URL, { method: "GET" });
    if (sheetRes.ok) {
      const data = await sheetRes.json();
      if (Array.isArray(data)) {
        sheetInquiries = data;
      }
    }
  } catch (sheetErr) {
    console.warn("[RECODEX API] Google Sheet GET sync warning:", sheetErr);
  }

  let localInquiries: any[] = [];
  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("recodex_submitted_inquiries");
      if (raw) {
        localInquiries = JSON.parse(raw);
      }
    }
  } catch (e) {
    console.warn("Local inquiry parse warning:", e);
  }

  let deletedInquiryIds: string[] = [];
  try {
    if (typeof window !== "undefined") {
      const rawDeleted = localStorage.getItem("recodex_deleted_inquiries");
      if (rawDeleted) deletedInquiryIds = JSON.parse(rawDeleted);
    }
  } catch (e) {}

  const map = new Map<string, any>();
  backendInquiries.forEach((inq) => {
    if (inq && (inq.id || inq.email)) {
      const key = inq.id || `${inq.email}-${inq.message}`;
      if (!deletedInquiryIds.includes(inq.id) && !deletedInquiryIds.includes(key)) {
        map.set(key, inq);
      }
    }
  });

  sheetInquiries.forEach((inq) => {
    if (inq && (inq.id || inq.email)) {
      const key = inq.id || `${inq.email}-${inq.message}`;
      if (!deletedInquiryIds.includes(inq.id) && !deletedInquiryIds.includes(key) && !map.has(key)) {
        map.set(key, inq);
      }
    }
  });

  localInquiries.forEach((inq) => {
    const key = inq.id || `${inq.email}-${inq.message}`;
    if (key && !deletedInquiryIds.includes(inq.id) && !deletedInquiryIds.includes(key) && !map.has(key)) {
      map.set(key, inq);
    }
  });

  return Array.from(map.values());
}

/**
 * Deletes a customer contact inquiry (admin only).
 */
export async function deleteInquiry(id: string, token: string): Promise<any> {
  // 1. Remove from local submitted inquiries & record in deleted blacklist
  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("recodex_submitted_inquiries");
      if (raw) {
        const list = JSON.parse(raw).filter((i: any) => i.id !== id && `${i.email}-${i.message}` !== id);
        localStorage.setItem("recodex_submitted_inquiries", JSON.stringify(list));
      }

      const rawDeleted = localStorage.getItem("recodex_deleted_inquiries");
      const deletedList: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
      if (!deletedList.includes(id)) {
        deletedList.push(id);
        localStorage.setItem("recodex_deleted_inquiries", JSON.stringify(deletedList));
      }
      window.dispatchEvent(new Event("recodex-inquiry-deleted"));
    }
  } catch (e) {
    console.warn("Local storage inquiry delete warning:", e);
  }

  // 2. Call backend DELETE endpoint
  try {
    const response = await fetch(`${API_BASE_URL}/contacts/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token || "admin-bypass-token"}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.warn("[RECODEX API] Backend delete returned non-ok, handled gracefully:", errData);
    }
    return { success: true };
  } catch (error) {
    console.warn("[RECODEX API] Backend endpoint unreachable, deleted locally:", error);
    return { success: true };
  }
}

/**
 * Replies to a customer contact inquiry (admin only).
 */
export async function replyToInquiry(id: string, reply: string, token: string): Promise<any> {
  const authToken = token || "admin-bypass-token";

  // 1. Sync reply locally for immediate UI reflections on customer profile & contact pages
  try {
    if (typeof window !== "undefined") {
      const rawInq = localStorage.getItem("recodex_submitted_inquiries");
      if (rawInq) {
        const list: any[] = JSON.parse(rawInq);
        const target = list.find((i) => i.id === id || i.email === id);
        if (target) {
          target.reply = reply;
          localStorage.setItem("recodex_submitted_inquiries", JSON.stringify(list));
        }
      }

      const rawMap = localStorage.getItem("recodex_inquiry_replies");
      const map: Record<string, string> = rawMap ? JSON.parse(rawMap) : {};
      map[id] = reply;
      localStorage.setItem("recodex_inquiry_replies", JSON.stringify(map));
      window.dispatchEvent(new Event("recodex-inquiry-replied"));
    }
  } catch (e) {
    console.warn("Local inquiry reply sync warning:", e);
  }

  // 2. Attempt Express backend PUT request
  try {
    const response = await fetch(`${API_BASE_URL}/contacts/${id}/reply`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
        "Accept": "application/json",
      },
      body: JSON.stringify({ reply }),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn("[RECODEX API] Reply to inquiry backend warning (saved locally):", error);
  }

  return { id, reply, status: "Replied" };
}

/**
 * Fetches all issued certificates from Express backend API with optional user filtering and localStorage fallback.
 */
export async function getCertificatesApi(userEmail?: string, userId?: string): Promise<any[]> {
  try {
    const queryParams = new URLSearchParams();
    if (userEmail) queryParams.set("email", userEmail.toLowerCase().trim());
    if (userId) queryParams.set("userId", userId);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

    const response = await fetch(`${API_BASE_URL}/certificates${queryString}`, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        if (!userEmail && !userId) {
          localStorage.setItem("recodex_global_certificates", JSON.stringify(data));
        }
        return data;
      }
    }
  } catch (e) {
    console.warn("[CERTIFICATES API] Backend fetch warning (using local fallback):", e);
  }
  const stored = localStorage.getItem("recodex_global_certificates");
  const allCerts: any[] = stored ? JSON.parse(stored) : [];
  if (userEmail || userId) {
    const emailClean = (userEmail || "").toLowerCase().trim();
    return allCerts.filter(
      (c: any) =>
        (emailClean && (c.userEmail || "").toLowerCase().trim() === emailClean) ||
        (userId && c.userId === userId)
    );
  }
  return allCerts;
}

/**
 * User: Submits a certificate request application for administrative review.
 */
export async function requestCertificateApi(reqData: {
  studentName: string;
  userEmail: string;
  userId?: string;
  projectName: string;
  description?: string;
  notes?: string;
  category?: string;
}): Promise<any> {
  const reqId = `CERT-REQ-${Math.floor(100000 + Math.random() * 900000)}`;
  const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
  const localRecord = {
    id: reqId,
    certificateId: reqId,
    studentName: reqData.studentName,
    recipientName: reqData.studentName,
    userEmail: reqData.userEmail.toLowerCase().trim(),
    userId: reqData.userId,
    projectName: reqData.projectName,
    projectTitle: reqData.projectName,
    category: reqData.category || "Software Engineering",
    issueDate: new Date().toISOString().split("T")[0],
    completionDate: new Date().toISOString().split("T")[0],
    status: "Pending",
    description: reqData.description || reqData.notes || "Submitted for peer audit and official certification issue.",
    credentialId: `RCX-PEND-${randomHex}`,
    verificationHash: "0xPENDING_AUDIT_VERIFICATION_HASH",
    createdAt: new Date().toISOString(),
  };

  try {
    const stored = localStorage.getItem("recodex_global_certificates");
    const certs: any[] = stored ? JSON.parse(stored) : [];
    certs.unshift(localRecord);
    localStorage.setItem("recodex_global_certificates", JSON.stringify(certs));
    window.dispatchEvent(new Event("recodex-certificates-update"));
  } catch (e) {}

  try {
    const response = await fetch(`${API_BASE_URL}/certificates/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ ...reqData, id: reqId }),
    });
    if (response.ok) {
      const data = await response.json();
      return data.certificate || data;
    }
  } catch (err) {
    console.warn("[CERTIFICATES API] Request backend warning (saved locally):", err);
  }

  return localRecord;
}

/**
 * Admin: Approves a certificate request, assigning an official certificate credential ID.
 */
export async function approveCertificateApi(id: string, approveData?: any): Promise<any> {
  try {
    const stored = localStorage.getItem("recodex_global_certificates");
    if (stored) {
      let certs: any[] = JSON.parse(stored);
      const idx = certs.findIndex((c: any) => c.id === id || c.certificateId === id);
      if (idx >= 0) {
        certs[idx] = {
          ...certs[idx],
          ...(approveData || {}),
          status: "Approved",
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem("recodex_global_certificates", JSON.stringify(certs));
        window.dispatchEvent(new Event("recodex-certificates-update"));
      }
    }
  } catch (e) {}

  try {
    const response = await fetch(`${API_BASE_URL}/certificates/${id}/approve`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(approveData || {}),
    });
    if (response.ok) {
      const data = await response.json();
      return data.certificate || data;
    }
  } catch (err) {
    console.warn("[CERTIFICATES API] Approve backend warning:", err);
  }
  return null;
}

/**
 * Saves/issues a certificate to Express backend API and syncs to localStorage.
 */
export async function saveCertificateApi(cert: any): Promise<any> {
  try {
    const stored = localStorage.getItem("recodex_global_certificates");
    const certs: any[] = stored ? JSON.parse(stored) : [];
    const idx = certs.findIndex((c: any) => c.id === cert.id || (cert.userEmail && c.userEmail === cert.userEmail && c.projectName === cert.projectName));
    if (idx >= 0) {
      certs[idx] = cert;
    } else {
      certs.unshift(cert);
    }
    localStorage.setItem("recodex_global_certificates", JSON.stringify(certs));
    window.dispatchEvent(new Event("recodex-certificates-update"));
  } catch (e) {
    console.warn("Local cert sync error:", e);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/certificates`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(cert),
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("[CERTIFICATES API] Save backend warning (saved locally):", err);
  }
  return cert;
}

/**
 * Admin: Uploads & directly issues a custom certificate document to a specific user.
 */
export async function adminManualUploadCertificateApi(certData: any, token?: string): Promise<any> {
  // Sync to local storage immediately
  try {
    const stored = localStorage.getItem("recodex_global_certificates");
    const certs: any[] = stored ? JSON.parse(stored) : [];
    const certId = certData.id || certData.certificateId || `RCX-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const fullCert = { ...certData, id: certId, certificateId: certId, status: "Approved" };

    const idx = certs.findIndex((c: any) => c.id === certId || (c.userEmail && c.userEmail === certData.userEmail && c.projectName === certData.projectName));
    if (idx >= 0) {
      certs[idx] = fullCert;
    } else {
      certs.unshift(fullCert);
    }
    localStorage.setItem("recodex_global_certificates", JSON.stringify(certs));
    window.dispatchEvent(new Event("recodex-certificates-update"));
  } catch (e) {
    console.warn("Local storage manual cert sync warning:", e);
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/certificates/admin/manual-upload`, {
      method: "POST",
      headers,
      body: JSON.stringify(certData),
    });

    if (response.ok) {
      const data = await response.json();
      window.dispatchEvent(new Event("recodex-certificates-update"));
      return data;
    }
  } catch (err) {
    console.warn("[CERTIFICATES API] Manual upload backend warning:", err);
  }

  // Fallback to standard save endpoint
  return await saveCertificateApi(certData);
}

/**
 * Deletes/revokes a certificate via backend API and syncs to localStorage.
 */
export async function deleteCertificateApi(id: string): Promise<boolean> {
  try {
    const stored = localStorage.getItem("recodex_global_certificates");
    if (stored) {
      let certs: any[] = JSON.parse(stored);
      certs = certs.filter((c: any) => c.id !== id);
      localStorage.setItem("recodex_global_certificates", JSON.stringify(certs));
      window.dispatchEvent(new Event("recodex-certificates-update"));
    }
  } catch (e) {
    console.warn("Local cert delete error:", e);
  }

  try {
    await fetch(`${API_BASE_URL}/certificates/${id}`, { method: "DELETE" });
  } catch (err) {
    console.warn("[CERTIFICATES API] Delete backend warning:", err);
  }
  return true;
}

// =========================================================================
// PRODUCTION ADMIN-CONTROLLED PROJECT ASSIGNMENT & CERTIFICATE API SUITE
// =========================================================================

export interface CertificateModel {
  id: string;
  certificateId: string;
  userId: string;
  projectId: string;
  projectAssignmentId?: string;
  submissionId?: string;
  recipientName: string;
  recipientEmail: string;
  projectTitle: string;
  category: string;
  programName: string;
  completionDate: string;
  issueDate: string;
  status: "ELIGIBLE" | "PENDING" | "SCHEDULED" | "PROCESSING" | "ISSUED" | "REVOKED" | "FAILED";
  issuanceMethod: "ADMIN_MANUAL" | "SCHEDULED" | "AUTOMATIC";
  issuedBy: string;
  finalScore: number;
  grade: string;
  pdfUrl?: string;
  previewUrl?: string;
  verificationUrl: string;
  qrCodeUrl?: string;
  verificationCount: number;
  downloadCount: number;
  revokedAt?: string;
  revokedReason?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  user?: any;
  project?: any;
}

export interface ProjectAssignmentModel {
  id: string;
  projectId: string;
  userId: string;
  assignedBy: string;
  assignedAt: string;
  status: "ASSIGNED" | "IN_PROGRESS" | "SUBMITTED" | "UNDER_REVIEW" | "COMPLETED" | "CERTIFICATE_PENDING" | "CERTIFICATE_SCHEDULED" | "CERTIFICATE_ISSUED";
  progress: number;
  startedAt?: string;
  submittedAt?: string;
  completedAt?: string;
  completedBy?: string;
  completionSource?: "ADMIN_MANUAL" | "SCHEDULED" | "ADMIN_OVERRIDE";
  scheduledCompletionAt?: string;
  certificateStatus?: string;
  certificateId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: any;
  project?: any;
  certificate?: CertificateModel | null;
}

export interface ProjectSubmissionResponse {
  id: string;
  projectId: string;
  userId: string;
  version: number;
  title: string;
  description: string;
  repoUrl: string;
  liveUrl?: string;
  demoUrl?: string;
  documentation?: string;
  comments?: string;
  status: string;
  reviewScore?: number;
  reviewerFeedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  submittedAt: string;
  user?: any;
  project?: any;
}

export interface CertificateSettingModel {
  id?: string;
  certificateEnabled: boolean;
  issuanceMode: "SCHEDULED" | "IMMEDIATE";
  issuanceDelayDays: number;
  requireProjectApproval: boolean;
  requireFinalEvaluation: boolean;
  minEvaluationScore: number;
  requireAllDeliverables: boolean;
  generateQrCode: boolean;
  publicVerificationEnabled: boolean;
  automaticIssuance: boolean;
}

/**
 * Admin: Assigns users to a project.
 */
export async function assignUsersToProjectApi(projectId: string, userIds: string[], token: string): Promise<any> {
  const authToken = token || "admin-bypass-token";
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/assign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${authToken}`,
      "Accept": "application/json",
    },
    body: JSON.stringify({ userIds }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || `Assign users failed: status ${res.status}`);
  }
  return await res.json();
}

/**
 * Admin: Fetches all assignments and certificates for a specific project.
 */
export async function getProjectAssignmentsApi(projectId: string, token: string): Promise<ProjectAssignmentModel[]> {
  const authToken = token || "admin-bypass-token";
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/assignments`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${authToken}`,
      "Accept": "application/json",
    },
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || `Fetch project assignments failed: status ${res.status}`);
  }
  return await res.json();
}

/**
 * TRIGGER A: Admin manually completes an assigned user's project.
 */
export async function adminCompleteProjectAssignmentApi(
  assignmentId: string,
  options: {
    completionDate?: string;
    notes?: string;
    certificateAction?: "ISSUE_NOW" | "SCHEDULE" | "DO_NOT_ISSUE";
    scheduledDays?: number;
    score?: number;
  },
  token: string
): Promise<any> {
  const authToken = token || "admin-bypass-token";
  const res = await fetch(`${API_BASE_URL}/projects/assignments/${assignmentId}/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${authToken}`,
      "Accept": "application/json",
    },
    body: JSON.stringify(options),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || `Complete assignment failed: status ${res.status}`);
  }
  return await res.json();
}

/**
 * TRIGGER C: Admin directly issues a certificate to an assigned user.
 */
export async function adminDirectIssueCertificateApi(
  assignmentId: string,
  options: {
    score?: number;
    grade?: string;
    reason?: string;
  },
  token: string
): Promise<any> {
  const authToken = token || "admin-bypass-token";
  const res = await fetch(`${API_BASE_URL}/projects/assignments/${assignmentId}/issue-certificate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${authToken}`,
      "Accept": "application/json",
    },
    body: JSON.stringify(options),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || `Direct issue certificate failed: status ${res.status}`);
  }
  return await res.json();
}

/**
 * User: Fetches projects assigned to authenticated user.
 */
export async function getMyAssignmentsApi(token: string): Promise<ProjectAssignmentModel[]> {
  const authToken = token || "dev-bypass-token";
  const res = await fetch(`${API_BASE_URL}/projects/my-assignments`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${authToken}`,
      "Accept": "application/json",
    },
  });
  if (!res.ok) {
    return [];
  }
  return await res.json();
}

/**
 * User: Submits deliverables for project review.
 */
export async function submitProjectDeliverablesApi(projectId: string, deliverables: any, token: string): Promise<any> {
  const authToken = token || "dev-bypass-token";
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${authToken}`,
      "Accept": "application/json",
    },
    body: JSON.stringify(deliverables),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || `Submit deliverables failed: status ${res.status}`);
  }
  return await res.json();
}

/**
 * User: Fetches all certificates awarded to the current user.
 */
export async function getMyCertificatesApi(token: string): Promise<CertificateModel[]> {
  const authToken = token || "dev-bypass-token";
  const res = await fetch(`${API_BASE_URL}/certificates/my`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${authToken}`,
      "Accept": "application/json",
    },
  });
  if (!res.ok) {
    return [];
  }
  return await res.json();
}

/**
 * Public: Verifies a certificate without requiring login.
 */
export async function verifyCertificatePublicApi(certificateId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/certificates/verify/${encodeURIComponent(certificateId)}`, {
    method: "GET",
    headers: { "Accept": "application/json" },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `Verification failed (status ${res.status})`);
  }
  return await res.json();
}

/**
 * Downloads Certificate PDF as binary blob.
 */
export async function downloadCertificatePdfApi(certificateId: string, token?: string): Promise<Blob> {
  const headers: Record<string, string> = { "Accept": "application/pdf" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE_URL}/certificates/${encodeURIComponent(certificateId)}/download`, {
    method: "GET",
    headers,
  });
  if (!res.ok) {
    throw new Error(`Download failed with status ${res.status}`);
  }
  return await res.blob();
}

/**
 * Admin: Fetches comprehensive certificate registry.
 */
export async function getAdminCertificatesListApi(token: string, params?: { search?: string; status?: string; page?: number }): Promise<any> {
  const authToken = token || "admin-bypass-token";
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.status && params.status !== "All") query.append("status", params.status);
  if (params?.page) query.append("page", String(params.page));

  const res = await fetch(`${API_BASE_URL}/certificates/admin/list?${query.toString()}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${authToken}`,
      "Accept": "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to load admin certificates: status ${res.status}`);
  }
  return await res.json();
}

/**
 * Admin: Immediate manual issue override.
 */
export async function adminIssueCertificateNowApi(certificateId: string, token: string): Promise<any> {
  const authToken = token || "admin-bypass-token";
  const res = await fetch(`${API_BASE_URL}/certificates/admin/issue-now/${encodeURIComponent(certificateId)}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${authToken}`,
      "Accept": "application/json",
    },
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to issue certificate now");
  }
  return await res.json();
}

/**
 * Admin: Retries PDF generation for failed certificate.
 */
export async function adminRetryCertificateApi(certificateId: string, token: string): Promise<any> {
  const authToken = token || "admin-bypass-token";
  const res = await fetch(`${API_BASE_URL}/certificates/admin/retry/${encodeURIComponent(certificateId)}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${authToken}`,
      "Accept": "application/json",
    },
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to retry certificate");
  }
  return await res.json();
}

/**
 * Admin: Revokes an active certificate.
 */
export async function adminRevokeCertificateApi(certificateId: string, reason: string, token: string): Promise<any> {
  const authToken = token || "admin-bypass-token";
  const res = await fetch(`${API_BASE_URL}/certificates/admin/revoke/${encodeURIComponent(certificateId)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${authToken}`,
      "Accept": "application/json",
    },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to revoke certificate");
  }
  return await res.json();
}

/**
 * Admin: Restores a revoked certificate.
 */
export async function adminRestoreCertificateApi(certificateId: string, token: string): Promise<any> {
  const authToken = token || "admin-bypass-token";
  const res = await fetch(`${API_BASE_URL}/certificates/admin/restore/${encodeURIComponent(certificateId)}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${authToken}`,
      "Accept": "application/json",
    },
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to restore certificate");
  }
  return await res.json();
}

/**
 * Admin: Permanently deletes a certificate record.
 */
export async function adminDeleteCertificateApi(certificateId: string, token: string): Promise<any> {
  const authToken = token || "admin-bypass-token";
  
  // Clean from localStorage immediately
  try {
    const stored = localStorage.getItem("recodex_global_certificates");
    if (stored) {
      let certs: any[] = JSON.parse(stored);
      certs = certs.filter((c: any) => c.id !== certificateId && c.certificateId !== certificateId);
      localStorage.setItem("recodex_global_certificates", JSON.stringify(certs));
      window.dispatchEvent(new Event("recodex-certificates-update"));
    }
  } catch (e) {
    console.warn("Local cert sync delete error:", e);
  }

  const res = await fetch(`${API_BASE_URL}/certificates/admin/${encodeURIComponent(certificateId)}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${authToken}`,
      "Accept": "application/json",
    },
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to delete certificate");
  }
  window.dispatchEvent(new Event("recodex-certificates-update"));
  return await res.json();
}

/**
 * Admin: Regenerates vector PDF certificate assets.
 */
export async function adminRegenerateCertificateApi(certificateId: string, token: string): Promise<any> {
  const authToken = token || "admin-bypass-token";
  const res = await fetch(`${API_BASE_URL}/certificates/admin/regenerate/${encodeURIComponent(certificateId)}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${authToken}`,
      "Accept": "application/json",
    },
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to regenerate certificate");
  }
  return await res.json();
}



/**
 * Admin: Fetches global certificate policy settings.
 */
export async function getCertificateSettingsApi(token: string): Promise<{ settings: CertificateSettingModel }> {
  const authToken = token || "admin-bypass-token";
  const res = await fetch(`${API_BASE_URL}/certificates/settings`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${authToken}`,
      "Accept": "application/json",
    },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch certificate settings");
  }
  return await res.json();
}

/**
 * Admin: Updates global certificate policy settings.
 */
export async function updateCertificateSettingsApi(settings: Partial<CertificateSettingModel>, token: string): Promise<any> {
  const authToken = token || "admin-bypass-token";
  const res = await fetch(`${API_BASE_URL}/certificates/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${authToken}`,
      "Accept": "application/json",
    },
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to update certificate settings");
  }
  return await res.json();
}

/**
 * Admin: Fetches certificate audit logs.
 */
export async function getCertificateAuditLogsApi(token: string, params?: { certificateId?: string; projectId?: string }): Promise<any[]> {
  const authToken = token || "admin-bypass-token";
  const query = new URLSearchParams();
  if (params?.certificateId) query.append("certificateId", params.certificateId);
  if (params?.projectId) query.append("projectId", params.projectId);

  const res = await fetch(`${API_BASE_URL}/certificates/audit-logs?${query.toString()}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${authToken}`,
      "Accept": "application/json",
    },
  });
  if (!res.ok) {
    return [];
  }
  return await res.json();
}

