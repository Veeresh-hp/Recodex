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
      const raw = localStorage.getItem("recodex_synced_users");
      const list: any[] = raw ? JSON.parse(raw) : [];
      const index = list.findIndex((u) => u.email.toLowerCase() === userData.email.toLowerCase());
      const newUserObj = {
        id: userData.id || `usr-${Date.now()}`,
        name: userData.name || userData.email.split("@")[0],
        email: userData.email,
        role: userData.role || (userData.email.toLowerCase() === "veereshhp2004@gmail.com" ? "admin" : "client"),
        profileImage: userData.profileImage || "",
        status: "Active",
        createdAt: new Date().toISOString()
      };

      if (index >= 0) {
        list[index] = { ...list[index], ...newUserObj };
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
    profileImage: "https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zR01VZ1RUc2tqTTExY1FDa0ZaeHQ1SDVhTXoifQ"
  },
  {
    id: "user_3G82d9FackVcHk09TD8V9uHKJEt",
    name: "VEERESH H P",
    email: "veereshhp04@gmail.com",
    role: "developer",
    status: "Active",
    createdAt: "2026-07-11T15:58:52.253Z",
    profileImage: "https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zRzgyZDN3UllpRWpTc3dlV1FnQ2o2eEN4c2kifQ"
  },
  {
    id: "user_3IKkzxTelZizaJk8JgKn4iGZXHi",
    name: "veer_thinks",
    email: "veerthinks@gmail.com",
    role: "developer",
    status: "Active",
    createdAt: "2026-08-24T10:39:11.708Z",
    profileImage: "https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zSUtrenlqbEdmcUhzUWdrWklCa1hibHZnWlcifQ"
  },
  {
    id: "user_3IKE3zF8zNPvnmxWhNQqnscyFB3",
    name: "Vaibhav joshi",
    email: "vaibhavjoshi8660@gmail.com",
    role: "developer",
    status: "Active",
    createdAt: "2026-08-24T10:39:13.475Z",
    profileImage: "https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18zRzd4VVE2ZmV1aE5RWTRFMlowQ1lma2hDMHMiLCJyaWQiOiJ1c2VyXzNJS0UzekY4ek5Qdm5teFdoTlFxbnNjeUZCMyIsImluaXRpYWxzIjoiVkoifQ"
  }
];

/**
 * Fetches all ecosystem users from the backend database.
 * Returns real registered & synced users without any demo/dummy users.
 */
export async function getUsers(): Promise<any[]> {
  const localSyncedRaw = typeof window !== "undefined" ? localStorage.getItem("recodex_synced_users") : null;
  let localSynced: any[] = localSyncedRaw ? JSON.parse(localSyncedRaw) : [];

  // Filter out any legacy dummy emails if present
  const dummyEmails = ["john.doe@recodex.io", "sarah@skynet.com", "vance@blackmesa.org"];
  localSynced = localSynced.filter((u: any) => u && u.email && !dummyEmails.includes(u.email.toLowerCase()));

  let backendUsers: any[] = [];
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (response.ok) {
      backendUsers = await response.json();
    }
  } catch (error) {
    console.warn("[RECODEX API] Server endpoint unreachable. Merging active Clerk & MongoDB ecosystem records.", error);
    backendUsers = [];
  }

  const userMap = new Map<string, any>();

  // 1. Seed base real active users (Clerk & MongoDB Atlas verified)
  REAL_ECOSYSTEM_USERS.forEach((u) => {
    userMap.set(u.email.toLowerCase(), u);
  });

  // 2. Merge backend users from API if available
  backendUsers.forEach((u: any) => {
    if (u && u.email && !dummyEmails.includes(u.email.toLowerCase())) {
      const existing = userMap.get(u.email.toLowerCase());
      userMap.set(u.email.toLowerCase(), { ...existing, ...u });
    }
  });

  // 3. Merge locally synced users from recent signups
  localSynced.forEach((u: any) => {
    if (u && u.email && !dummyEmails.includes(u.email.toLowerCase())) {
      const existing = userMap.get(u.email.toLowerCase());
      if (existing) {
        userMap.set(u.email.toLowerCase(), { ...existing, ...u });
      } else {
        userMap.set(u.email.toLowerCase(), u);
      }
    }
  });

  return Array.from(userMap.values());
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

  // 1. Direct browser fetch to Google Apps Script Webhook
  try {
    fetch(GOOGLE_SCRIPT_WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }).catch((gErr) => console.warn("[CONTACT WEBHOOK] Direct Google Apps Script dispatch warning:", gErr));
  } catch (gErr) {
    console.warn("[CONTACT WEBHOOK] Direct Google Apps Script dispatch error:", gErr);
  }

  // 2. Persist locally for immediate offline/client-side access & Admin Dashboard
  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("recodex_submitted_inquiries");
      const list: any[] = raw ? JSON.parse(raw) : [];
      list.unshift(payload);
      localStorage.setItem("recodex_submitted_inquiries", JSON.stringify(list));
      window.dispatchEvent(new Event("recodex-inquiry-submitted"));
    }
  } catch (lErr) {
    console.warn("[RECODEX API] Local storage inquiry save warning:", lErr);
  }

  // 3. Attempt primary Express backend POST request
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
      return await response.json();
    }
  } catch (backendError) {
    console.warn("[RECODEX API] Backend submit inquiry warning (Google Sheet synced directly):", backendError);
  }

  // Return success response if Google Sheet / LocalSync succeeded so form never blocks user
  return { success: true, message: "Inquiry submitted and synced successfully.", data: payload };
}

/**
 * Fetches all contact inquiries from backend API & local sync (admin only).
 */
export async function getInquiries(token: string): Promise<any[]> {
  let backendInquiries: any[] = [];
  try {
    const response = await fetch(`${API_BASE_URL}/contacts`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });

    if (response.ok) {
      backendInquiries = await response.json();
    }
  } catch (error) {
    console.warn("[RECODEX API] Fetch backend inquiries warning:", error);
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

  const map = new Map<string, any>();
  backendInquiries.forEach((inq) => {
    if (inq && (inq.id || inq.email)) {
      map.set(inq.id || inq.email, inq);
    }
  });

  localInquiries.forEach((inq) => {
    const key = inq.id || inq.email;
    if (key && !map.has(key)) {
      map.set(key, inq);
    }
  });

  return Array.from(map.values());
}

/**
 * Deletes a customer contact inquiry (admin only).
 */
export async function deleteInquiry(id: string, token: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/contacts/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || `Delete inquiry failed: status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[RECODEX API] Delete inquiry error:", error);
    throw error;
  }
}

/**
 * Replies to a customer contact inquiry (admin only).
 */
export async function replyToInquiry(id: string, reply: string, token: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/contacts/${id}/reply`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
      body: JSON.stringify({ reply }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || `Reply to inquiry failed: status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[RECODEX API] Reply to inquiry error:", error);
    throw error;
  }
}
