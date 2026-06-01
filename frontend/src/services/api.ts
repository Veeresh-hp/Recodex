import { Project, MOCK_PROJECTS } from "@/data/mockData";
import { supabase } from "../lib/supabase";


const API_BASE_URL = 
  (typeof import.meta !== "undefined" && import.meta.env && (import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL)) || 
  (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "/api" : "http://localhost:5000/api");

/**
 * Fetches all project items. If the server is offline or fails,
 * it automatically falls back to local static mock data.
 * 
 * @param category - Optional category filter
 * @param search - Optional search query string
 */
export async function getProjects(category?: string, search?: string): Promise<Project[]> {
  try {
    const url = new URL(`${API_BASE_URL}/projects`);
    if (category) {
      url.searchParams.append("category", category);
    }
    if (search) {
      url.searchParams.append("search", search);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP server error: Status ${response.status}`);
    }

    const data = await response.json();
    
    // Map backend response fields to frontend format (imageUrl -> image)
    return data.map((item: any) => ({
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
    // 1. Try Supabase direct upsert (works on Vercel)
    const { data, error } = await supabase
      .from("users")
      .upsert({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role || "developer",
        profileImage: userData.profileImage || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.warn("[RECODEX API] Supabase user sync failed, trying backend fallback:", error);
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
      console.error("[RECODEX API] User identity sync completely failed:", backendError);
      return null;
    }
  }
}


/**
 * Retrieves the database profile details for the authenticated user session.
 * 
 * @param token - JWT access token string from Supabase Auth
 */
export async function getUserProfile(token: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Fetch profile failed: status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
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

/**
 * Fetches all ecosystem users from the backend database.
 * Falls back to static local mock data if the server is offline.
 */
export async function getUsers(): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP server error: Status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn("[RECODEX API] Local server unreachable. Reverting to static user directory mock nodes.", error);
    // Return mock static users
    return [
      { id: "usr-01", name: "Veeresh H P", email: "veereshhp2004@gmail.com", role: "admin", status: "Active", createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 10).toISOString() },
      { id: "usr-02", name: "John Doe", email: "john.doe@recodex.io", role: "developer", status: "Active", createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 5).toISOString() },
      { id: "usr-03", name: "Sarah Connor", email: "sarah@skynet.com", role: "client", status: "Pending", createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString() },
      { id: "usr-04", name: "Alice Vance", email: "vance@blackmesa.org", role: "developer", status: "Active", createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString() }
    ];
  }
}

/**
 * Updates a user's details inside the PostgreSQL database.
 */
export async function updateUser(userId: string, userData: any, token: string): Promise<any> {
  try {
    // 1. Try Supabase direct update (works on Vercel)
    const { data, error } = await supabase
      .from("users")
      .update({
        name: userData.name,
        role: userData.role,
        profileImage: userData.profileImage || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.warn("[RECODEX API] Supabase update user failed, trying backend:", error);
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
}

/**
 * Deletes a user profile from the database.
 */
export async function deleteUser(userId: string, token: string): Promise<any> {
  try {
    // 1. Try Supabase direct delete (works on Vercel)
    const { data, error } = await supabase
      .from("users")
      .delete()
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.warn("[RECODEX API] Supabase user delete failed, trying backend:", error);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete user: ${response.status}`);
      }
      return await response.json();
    } catch (backendError) {
      console.error("[RECODEX API] Delete user completely failed:", backendError);
      throw backendError;
    }
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
