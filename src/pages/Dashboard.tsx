import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  CreditCard, Code, Rocket, Activity, Moon, Sun,
  ShieldCheck, Layers, 
  LogOut, User, ExternalLink, Play,
  Settings as SettingsIcon, Users, BarChart3, 
  Trash2, Plus, Edit3, Lock, Globe,
  AlertTriangle, Search, FileText, CheckCircle, Award, XCircle, RefreshCw, Send, Check
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { getProjects, getUsers, updateUser, deleteUser, updateProject, deleteProject } from "../services/api";
import { Project } from "../data/mockData";
import { useTheme } from "../context/ThemeContext";

interface Deployment {
  id: string;
  repo: string;
  status: "LIVE" | "BUILDING" | "FAILED";
  env: "PRODUCTION" | "STAGING" | "BETA";
  timestamp: string;
  timeAgoInSeconds: number;
}

interface Report {
  id: string;
  type: string;
  target: string;
  reporter: string;
  description: string;
  status: "Open" | "Under Review" | "Resolved";
  date: string;
}

interface Certificate {
  id: string;
  studentName: string;
  projectName: string;
  issueDate: string;
  status: "Approved" | "Pending" | "Revoked";
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  date: string;
}

export default function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const [activeSidebarTab, setActiveSidebarTab] = useState("Dashboard");
  const [activeTimeline, setActiveTimeline] = useState<"7D" | "30D">("30D");

  // Admin access validation
  useEffect(() => {
    const checkAdminAccess = async () => {
      const isBypassAdmin = 
        localStorage.getItem("camcod_session_token") === "admin-bypass-token" ||
        localStorage.getItem("camcod_admin_user") === "true";

      if (isBypassAdmin) {
        return;
      }

      let isAuthenticatedUser = false;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          isAuthenticatedUser = true;
          if (user.email === "veereshhp2004@gmail.com" || user.email === "veereshhp04@gmail.com") {
            localStorage.setItem("camcod_admin_user", "true");
            setAdminEmail(user.email || "");
            const displayName = user.user_metadata?.full_name || user.user_metadata?.name;
            if (displayName) setAdminName(displayName);
            return;
          } else {
            // Verify if user exists in the public.users table
            const { data: dbUser } = await supabase
              .from("users")
              .select("id")
              .eq("id", user.id)
              .maybeSingle();

            if (!dbUser) {
              // Unregistered user! Purge session immediately and redirect to login
              await supabase.auth.signOut();
              localStorage.removeItem("camcod_session_token");
              localStorage.removeItem("camcod_admin_user");
              localStorage.removeItem("recodex_auth_intent");
              window.location.href = "/login?error=user_not_found";
              return;
            }
          }
        }
      } catch (err) {
        console.error("Auth dashboard validation failed:", err);
      }

      if (isAuthenticatedUser) {
        window.location.href = "/projects";
      } else {
        window.location.href = "/login";
      }
    };

    checkAdminAccess();
  }, []);

  // Real user count from DB (not fake)
  const [revenue] = useState(0);
  const [activeDevs, setActiveDevs] = useState(0);

  // Recycle bin states
  const [softDeletedUserIds, setSoftDeletedUserIds] = useState<string[]>(() => {
    const stored = localStorage.getItem("recodex_soft_deleted_users");
    return stored ? JSON.parse(stored) : [];
  });

  const [softDeletedProjectIds, setSoftDeletedProjectIds] = useState<string[]>(() => {
    const stored = localStorage.getItem("recodex_soft_deleted_projects");
    return stored ? JSON.parse(stored) : [];
  });

  const [recycleBin, setRecycleBin] = useState<any[]>(() => {
    const stored = localStorage.getItem("recodex_recycle_bin");
    return stored ? JSON.parse(stored) : [];
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("recodex_soft_deleted_users", JSON.stringify(softDeletedUserIds));
  }, [softDeletedUserIds]);

  useEffect(() => {
    localStorage.setItem("recodex_soft_deleted_projects", JSON.stringify(softDeletedProjectIds));
  }, [softDeletedProjectIds]);

  useEffect(() => {
    localStorage.setItem("recodex_recycle_bin", JSON.stringify(recycleBin));
  }, [recycleBin]);

  // Live Database integrations
  const [dbProjects, setDbProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [dbUsers, setDbUsers] = useState<any[]>([]);

  const [deploymentsCount, setDeploymentsCount] = useState(340);
  const [sysHealth, setSysHealth] = useState(99.98);

  // Deployments log list
  const [deployments, setDeployments] = useState<Deployment[]>([
    { id: "#cam-8d2a1", repo: "auth-microservice-v2", status: "LIVE", env: "PRODUCTION", timestamp: "2m ago", timeAgoInSeconds: 120 },
    { id: "#cam-f39b4", repo: "marketplace-ui-main", status: "LIVE", env: "PRODUCTION", timestamp: "14m ago", timeAgoInSeconds: 840 },
    { id: "#cam-x9210", repo: "payment-gateway-relay", status: "BUILDING", env: "STAGING", timestamp: "45m ago", timeAgoInSeconds: 2700 },
    { id: "#cam-k0012", repo: "user-profile-edge", status: "FAILED", env: "BETA", timestamp: "1h ago", timeAgoInSeconds: 3600 },
  ]);

  // Search & Filtration states
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("All");
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("All");

  // Custom Ecosystem Mock datasets
  const [categories, setCategories] = useState<string[]>(() => {
    const stored = localStorage.getItem("recodex_global_categories");
    return stored ? JSON.parse(stored) : [
      "Web Systems", "AI & Intelligence", "Blockchain & Web3", "Low-Level Shells"
    ];
  });
  const [newCategoryName, setNewCategoryName] = useState("");

  const [reports, setReports] = useState<Report[]>(() => {
    const stored = localStorage.getItem("recodex_global_reports");
    return stored ? JSON.parse(stored) : [
      { id: "rep-01", type: "Fake Client", target: "John Skynet", reporter: "@zero_ptr", description: "Spam project postings with unreachable deposit endpoints.", status: "Open", date: "2h ago" },
      { id: "rep-02", type: "Fake Student", target: "Bob Malicious", reporter: "@rust_lord", description: "Copied code block answers verified as pre-compiled malware downloads.", status: "Under Review", date: "1d ago" },
      { id: "rep-03", type: "Payment Issue", target: "Order #cam-8d2a1", reporter: "@j_doe_stack", description: "Commission clearance delay on decentralized vault settlement.", status: "Resolved", date: "4d ago" }
    ];
  });
  const [reportsFilter, setReportsFilter] = useState("All");

  const [certificates, setCertificates] = useState<Certificate[]>(() => {
    const stored = localStorage.getItem("recodex_global_certificates");
    return stored ? JSON.parse(stored) : [
      { id: "CERT-9402", studentName: "John Doe", projectName: "Quantum-Flux Core Integration", issueDate: "2026-05-24", status: "Approved" },
      { id: "CERT-1842", studentName: "Alice Vance", projectName: "Nebula Arch Node Auto-Scaler", issueDate: "2026-05-27", status: "Pending" },
      { id: "CERT-0691", studentName: "Sarah Connor", projectName: "Neural Sift AI Vulnerability Scanner", issueDate: "2026-05-20", status: "Approved" }
    ];
  });
  const [selectedCertDownload, setSelectedCertDownload] = useState<Certificate | null>(null);

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const stored = localStorage.getItem("recodex_global_announcements");
    return stored ? JSON.parse(stored) : [
      { id: "ann-01", title: "RecodeX v1.0.0 Mainnet Beta", message: "Global deployment orchestration active across all categories. Synchronize your developer keys now.", type: "New Feature", date: "3h ago" },
      { id: "ann-02", title: "Server Maintenance Schedule", message: "Decentralized database nodes will undergo updates on May 30 at 04:00 UTC. Uptime SLA will be maintained at 99.9%.", type: "Maintenance Notice", date: "1d ago" }
    ];
  });

  useEffect(() => {
    localStorage.setItem("recodex_global_categories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("recodex_global_reports", JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem("recodex_global_certificates", JSON.stringify(certificates));
  }, [certificates]);

  useEffect(() => {
    localStorage.setItem("recodex_global_announcements", JSON.stringify(announcements));
  }, [announcements]);
  const [newAnnTitle, setNewAnnTitle] = useState("");
  const [newAnnMessage, setNewAnnMessage] = useState("");
  const [newAnnType, setNewAnnType] = useState("New Feature");

  // Admin Profile settings states
  const [adminName, setAdminName] = useState("Veeresh H P");
  const [adminEmail, setAdminEmail] = useState("veereshhp2004@gmail.com");
  const [adminPassword, setAdminPassword] = useState("");
  const [toggled2FA, setToggled2FA] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState<any | null>(null);

  // Settings mock records
  const [settings] = useState({
    siteName: "RecodeX Developer Marketplace",
    securityMode: "AES-256 Enabled",
    maintenanceMode: false,
    allowedOrigin: "http://localhost:3000"
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveOffsetRef = useRef(0);

  const getAuthToken = async () => {
    const localBypass = localStorage.getItem("camcod_session_token");
    if (localBypass === "admin-bypass-token") {
      return "admin-bypass-token";
    }
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || "";
  };

  // Fetch real users directly from Supabase (works on Vercel — no localhost needed)
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const mapped = (data || []).map((u) => {
        if (u.email === "veereshhp2004@gmail.com" || u.email === "veereshhp04@gmail.com") {
          return { ...u, role: "admin" };
        }
        return u;
      });
      setDbUsers(mapped);
      setActiveDevs(mapped.length);
    } catch (err) {
      console.warn("[Dashboard] Supabase user fetch failed, trying backend:", err);
      // Fallback to backend API
      getUsers().then((data) => {
        const real = data.filter((u: any) => !u.id.startsWith("usr-"));
        const targetData = real.length > 0 ? real : data;
        const mapped = targetData.map((u: any) => {
          if (u.email === "veereshhp2004@gmail.com" || u.email === "veereshhp04@gmail.com") {
            return { ...u, role: "admin" };
          }
          return u;
        });
        setDbUsers(mapped);
        setActiveDevs(mapped.length);
      }).catch(console.error);
    }
  };

  // Fetch real projects directly from Supabase
  const fetchProjects = async () => {
    setProjectsLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setDbProjects(data || []);
    } catch (err) {
      console.warn("[Dashboard] Supabase project fetch failed, trying backend:", err);
      getProjects().then((data) => {
        setDbProjects(data);
      }).catch(console.error);
    } finally {
      setProjectsLoading(false);
    }
  };

  // Initial fetch + real-time subscription for new user signups
  useEffect(() => {
    fetchProjects();
    fetchUsers();

    // Real-time: re-fetch users whenever a new user is inserted in the DB
    const userChannel = supabase
      .channel("dashboard-users-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "users" },
        (payload) => {
          console.log("[Dashboard] New user joined:", payload.new);
          const newUser = payload.new;
          if (newUser.email === "veereshhp2004@gmail.com" || newUser.email === "veereshhp04@gmail.com") {
            newUser.role = "admin";
          }
          setDbUsers((prev) => [newUser, ...prev]);
          setActiveDevs((prev) => prev + 1);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "users" },
        (payload) => {
          setDbUsers((prev) => prev.filter((u) => u.id !== payload.old.id));
          setActiveDevs((prev) => Math.max(0, prev - 1));
        }
      )
      .subscribe();

    // Real-time: re-fetch projects on insert/delete
    const projectChannel = supabase
      .channel("dashboard-projects-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "projects" },
        (payload) => {
          setDbProjects((prev) => [payload.new, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "projects" },
        (payload) => {
          setDbProjects((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userChannel);
      supabase.removeChannel(projectChannel);
    };
  }, []);

  // Re-fetch when sidebar tab changes
  useEffect(() => {
    if (activeSidebarTab === "Users") fetchUsers();
    if (activeSidebarTab === "Projects") fetchProjects();
  }, [activeSidebarTab]);


  // Real-time telemetry load shifts
  useEffect(() => {
    const statsInterval = setInterval(() => {
      // activeDevs is now real — driven by Supabase real-time, not faked
      
      setSysHealth((prev) => {
        const change = (Math.random() - 0.5) * 0.01;
        const newVal = prev + change;
        return parseFloat(Math.min(100.00, Math.max(99.90, newVal)).toFixed(2));
      });

      setDeployments((prev) => 
        prev.map((dep) => {
          const newSeconds = dep.timeAgoInSeconds + 2;
          let label = "";
          if (newSeconds < 60) {
            label = `${newSeconds}s ago`;
          } else if (newSeconds < 3600) {
            label = `${Math.floor(newSeconds / 60)}m ago`;
          } else {
            label = `${Math.floor(newSeconds / 3600)}h ago`;
          }
          return {
            ...dep,
            timeAgoInSeconds: newSeconds,
            timestamp: label,
          };
        })
      );
    }, 2000);

    return () => clearInterval(statsInterval);
  }, []);

  // Sine Wave visualization loop
  useEffect(() => {
    if (activeSidebarTab !== "Dashboard") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const renderWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isDark = document.documentElement.classList.contains("dark");
      
      ctx.beginPath();
      ctx.strokeStyle = isDark ? "rgba(0, 209, 255, 0.85)" : "rgba(0, 103, 124, 0.85)";
      ctx.lineWidth = 3;
      ctx.shadowBlur = isDark ? 15 : 0;
      ctx.shadowColor = isDark ? "rgba(0, 209, 255, 0.5)" : "transparent";

      const waveHeight = 35;
      const waveLength = 120;

      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height / 2 + Math.sin((x + waveOffsetRef.current) / waveLength) * waveHeight;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Shaded gradient path
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height / 2 + Math.sin((x + waveOffsetRef.current) / waveLength) * waveHeight;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      if (isDark) {
        gradient.addColorStop(0, "rgba(0, 209, 255, 0.12)");
        gradient.addColorStop(1, "rgba(0, 209, 255, 0.0)");
      } else {
        gradient.addColorStop(0, "rgba(0, 103, 124, 0.12)");
        gradient.addColorStop(1, "rgba(0, 103, 124, 0.0)");
      }
      ctx.fillStyle = gradient;
      ctx.fill();

      waveOffsetRef.current += 1.5;
      animationFrameId = requestAnimationFrame(renderWave);
    };

    renderWave();
    return () => cancelAnimationFrame(animationFrameId);
  }, [activeSidebarTab, theme]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase sign out error:", err);
    }
    localStorage.removeItem("camcod_session_token");
    localStorage.removeItem("camcod_admin_user");
    window.location.href = "/";
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({ revenue, activeDevs, deploymentsCount, sysHealth, timestamp: new Date().toISOString() })
    );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `camcod_system_overview_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Announce compiler helpers
  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle || !newAnnMessage) return;
    const newAnn: Announcement = {
      id: `ann-0${announcements.length + 1}`,
      title: newAnnTitle,
      message: newAnnMessage,
      type: newAnnType,
      date: "Just now"
    };
    setAnnouncements([newAnn, ...announcements]);
    setNewAnnTitle("");
    setNewAnnMessage("");
  };

  const handleRemoveAnnouncement = (id: string) => {
    setAnnouncements(announcements.filter((ann) => ann.id !== id));
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName || categories.includes(newCategoryName)) return;
    setCategories([...categories, newCategoryName]);
    setNewCategoryName("");
  };

  const handleRemoveCategory = (catName: string) => {
    const recycled = {
      id: `cat-${catName}-${Date.now()}`,
      name: catName,
      type: "Category",
      originalData: catName,
      deletedAt: new Date().toLocaleTimeString()
    };
    setCategories(categories.filter((c) => c !== catName));
    setRecycleBin((prev) => [recycled, ...prev]);
  };

  const handleModifyReportStatus = (id: string, nextStatus: "Open" | "Under Review" | "Resolved") => {
    setReports(reports.map((rep) => rep.id === id ? { ...rep, status: nextStatus } : rep));
  };

  const handleModifyCertStatus = (id: string, nextStatus: "Approved" | "Pending" | "Revoked") => {
    setCertificates(certificates.map((cert) => cert.id === id ? { ...cert, status: nextStatus } : cert));
  };

  const handleModifyUserStatus = async (userId: string, targetStatus: string) => {
    try {
      const token = await getAuthToken();
      const userToModify = dbUsers.find((u) => u.id === userId);
      if (!userToModify) return;

      let suspensionDuration = "";
      if (targetStatus === "Suspended") {
        const duration = window.prompt(
          `For how long should ${userToModify.name} be suspended?\n(e.g., 24 Hours, 7 Days, 30 Days, Permanent)`
        );
        if (duration === null) return; // User clicked "Cancel"
        suspensionDuration = duration.trim() || "Permanent";
      }

      const newRole = targetStatus === "Suspended" ? "suspended" : "developer";
      await updateUser(userId, { name: userToModify.name, role: newRole }, token);

      if (targetStatus === "Suspended") {
        localStorage.setItem(`suspension_duration_${userId}`, suspensionDuration);
      } else {
        localStorage.removeItem(`suspension_duration_${userId}`);
      }

      // Update local state instantly and refetch
      setDbUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      fetchUsers();
    } catch (error) {
      console.error("Failed to modify user status:", error);
    }
  };
  
  const handleToggleUserAdmin = async (userId: string, makeAdmin: boolean) => {
    const userToModify = dbUsers.find((u) => u.id === userId);
    if (userToModify && !makeAdmin && (userToModify.email === "veereshhp2004@gmail.com" || userToModify.email === "veereshhp04@gmail.com")) {
      alert("Demoting root administrator accounts is prohibited to maintain security clearance.");
      return;
    }
    
    const targetRole = makeAdmin ? "admin" : "developer";
    try {
      // 1. Try Supabase direct update (works on Vercel)
      const { error: sbError } = await supabase.from("users").update({ role: targetRole }).eq("id", userId);
      if (sbError) throw sbError;

      // Update local state instantly and refetch
      setDbUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: targetRole } : u));
      fetchUsers();
    } catch (error) {
      console.warn("Supabase admin role update failed, trying backend:", error);
      try {
        const token = await getAuthToken();
        const userToModify = dbUsers.find((u) => u.id === userId);
        if (!userToModify) return;
        await updateUser(userId, { name: userToModify.name, role: targetRole }, token);
        setDbUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: targetRole } : u));
        fetchUsers();
      } catch (err) {
        console.error("Failed to modify user admin status:", err);
      }
    }
  };


  const handleRemoveUser = (userId: string) => {
    const userToRecycle = dbUsers.find((u) => u.id === userId);
    if (!userToRecycle) return;

    const recycled = {
      id: `usr-${userId}-${Date.now()}`,
      name: userToRecycle.name,
      type: "User",
      originalData: userToRecycle,
      deletedAt: new Date().toLocaleTimeString()
    };
    setSoftDeletedUserIds((prev) => [...prev, userId]);
    setRecycleBin((prev) => [recycled, ...prev]);
  };

  const handleModifyProjectStatus = async (projId: string, nextStatus: string) => {
    try {
      const token = await getAuthToken();
      const projectToModify = dbProjects.find((p) => p.id === projId);
      if (!projectToModify) return;

      await updateProject(projId, { status: nextStatus }, token);

      // Update local state instantly and refetch
      setDbProjects((prev) => prev.map((p) => p.id === projId ? { ...p, status: nextStatus } : p));
      fetchProjects();
    } catch (error) {
      console.error("Failed to modify project status:", error);
    }
  };

  const handleRemoveProject = (projId: string) => {
    const projToRecycle = dbProjects.find((p) => p.id === projId);
    if (!projToRecycle) return;

    const recycled = {
      id: `proj-${projId}-${Date.now()}`,
      name: projToRecycle.title,
      type: "Project",
      originalData: projToRecycle,
      deletedAt: new Date().toLocaleTimeString()
    };
    setSoftDeletedProjectIds((prev) => [...prev, projId]);
    setRecycleBin((prev) => [recycled, ...prev]);
  };

  const handleRestoreItem = (item: any) => {
    if (item.type === "Category") {
      setCategories([...categories, item.originalData]);
    } else if (item.type === "User") {
      setSoftDeletedUserIds((prev) => prev.filter((id) => id !== item.originalData.id));
    } else if (item.type === "Project") {
      setSoftDeletedProjectIds((prev) => prev.filter((id) => id !== item.originalData.id));
    }
    setRecycleBin((prev) => prev.filter((x) => x.id !== item.id));
  };

  const handleDeletePermanently = async (item: any) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete this ${item.type}? This action is irreversible.`)) {
      return;
    }
    try {
      const token = await getAuthToken();
      if (item.type === "User") {
        await deleteUser(item.originalData.id, token);
        setSoftDeletedUserIds((prev) => prev.filter((id) => id !== item.originalData.id));
        fetchUsers();
      } else if (item.type === "Project") {
        await deleteProject(item.originalData.id, token);
        setSoftDeletedProjectIds((prev) => prev.filter((id) => id !== item.originalData.id));
        fetchProjects();
      }
      setRecycleBin((prev) => prev.filter((x) => x.id !== item.id));
    } catch (error) {
      console.error("Failed to delete permanently:", error);
    }
  };

  // Rendering screen layout content dynamically
  const renderMainContent = () => {
    switch (activeSidebarTab) {
      case "Dashboard":
        return (
          <>
            {/* MVP 8-Column Grid Overview Telemetry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Total Users */}
              <div className="bg-white dark:bg-[#0b0e14] border border-black/10 dark:border-zinc-900 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-md transition-colors duration-300">
                <div className="flex items-center justify-between text-[8px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  <span>Total Users</span>
                  <Users size={12} className="text-[#00d1ff] opacity-60" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-extrabold font-mono text-foreground dark:text-white block">{dbUsers.filter(u => !softDeletedUserIds.includes(u.id)).length}</span>
                  <span className="text-[8px] font-mono text-zinc-400 dark:text-zinc-500 mt-1 block">Active directory sync</span>
                </div>
              </div>

              {/* Total Students */}
              <div className="bg-white dark:bg-[#0b0e14] border border-black/10 dark:border-zinc-900 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-md transition-colors duration-300">
                <div className="flex items-center justify-between text-[8px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  <span>Students / Freelancers</span>
                  <Code size={12} className="text-[#00d1ff] opacity-60" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-extrabold font-mono text-foreground dark:text-white block">{dbUsers.filter(u => u.role === "developer" && !softDeletedUserIds.includes(u.id)).length}</span>
                  <span className="text-[8px] font-mono text-green-500 font-bold block mt-1">+14 new this week</span>
                </div>
              </div>

              {/* Total Clients */}
              <div className="bg-white dark:bg-[#0b0e14] border border-black/10 dark:border-zinc-900 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-md transition-colors duration-300">
                <div className="flex items-center justify-between text-[8px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  <span>Clients</span>
                  <User size={12} className="text-[#00d1ff] opacity-60" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-extrabold font-mono text-foreground dark:text-white block">{dbUsers.filter(u => u.role === "client" && !softDeletedUserIds.includes(u.id)).length}</span>
                  <span className="text-[8px] font-mono text-zinc-400 dark:text-zinc-500 mt-1 block">Registered agencies</span>
                </div>
              </div>

              {/* Total Projects */}
              <div className="bg-white dark:bg-[#0b0e14] border border-black/10 dark:border-zinc-900 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-md transition-colors duration-300">
                <div className="flex items-center justify-between text-[8px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  <span>Total Projects</span>
                  <Rocket size={12} className="text-[#00d1ff] opacity-60" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-extrabold font-mono text-foreground dark:text-white block">{dbProjects.filter(p => !softDeletedProjectIds.includes(p.id)).length}</span>
                  <span className="text-[8px] font-mono text-zinc-400 dark:text-zinc-500 mt-1 block">Ecosystem assignments</span>
                </div>
              </div>

              {/* Active Projects */}
              <div className="bg-white dark:bg-[#0b0e14] border border-black/10 dark:border-zinc-900 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-md transition-colors duration-300">
                <div className="flex items-center justify-between text-[8px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  <span>Active Projects</span>
                  <Play size={12} className="text-[#00d1ff] opacity-60" fill="currentColor" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-extrabold font-mono text-foreground dark:text-white block">{dbProjects.filter(p => (p.status === "In Progress" || p.status === "Active" || p.status === "Approved") && !softDeletedProjectIds.includes(p.id)).length}</span>
                  <span className="text-[8px] font-mono text-[#00d1ff] font-bold block mt-1">In production nodes</span>
                </div>
              </div>

              {/* Completed Projects */}
              <div className="bg-white dark:bg-[#0b0e14] border border-black/10 dark:border-zinc-900 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-md transition-colors duration-300">
                <div className="flex items-center justify-between text-[8px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  <span>Completed Projects</span>
                  <CheckCircle size={12} className="text-[#00d1ff] opacity-60" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-extrabold font-mono text-foreground dark:text-white block">{dbProjects.filter(p => p.status === "Completed" && !softDeletedProjectIds.includes(p.id)).length}</span>
                  <span className="text-[8px] font-mono text-green-500 font-bold block mt-1">Archived releases</span>
                </div>
              </div>

              {/* Pending Approvals */}
              <div className="bg-white dark:bg-[#0b0e14] border border-black/10 dark:border-zinc-900 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-md transition-colors duration-300">
                <div className="flex items-center justify-between text-[8px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  <span>Pending Approvals</span>
                  <AlertTriangle size={12} className="text-amber-500 opacity-80" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-extrabold font-mono text-foreground dark:text-white block">{dbProjects.filter(p => (p.status === "Pending" || !p.status) && !softDeletedProjectIds.includes(p.id)).length}</span>
                  <span className="text-[8px] font-mono text-amber-500 font-bold block mt-1">Awaiting verification</span>
                </div>
              </div>

              {/* Total Revenue */}
              <div className="bg-white dark:bg-[#0b0e14] border border-black/10 dark:border-zinc-900 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-md transition-colors duration-300">
                <div className="flex items-center justify-between text-[8px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  <span>Total Revenue</span>
                  <CreditCard size={12} className="text-[#00d1ff] opacity-60" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-extrabold font-mono text-foreground dark:text-white block">₹{revenue.toLocaleString()}</span>
                  <span className="text-[8px] font-mono text-[#00d1ff] font-bold block mt-1">+14.2% ARR sync</span>
                </div>
              </div>

            </div>

            {/* Glowing spline curve & Top Contributors */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="lg:col-span-2 bg-white dark:bg-[#0b0e14] border border-black/10 dark:border-zinc-900 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-[360px] transition-colors duration-300">
                <div className="flex items-center justify-between z-10">
                  <h3 className="text-sm font-bold tracking-wider text-foreground dark:text-zinc-200">
                    Ecosystem Activity Graph
                  </h3>
                  <div className="flex items-center gap-1.5 p-1 rounded bg-black/5 dark:bg-zinc-950/60 border border-black/10 dark:border-zinc-900">
                    <button onClick={() => setActiveTimeline("7D")} className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${activeTimeline === "7D" ? "bg-primary text-white dark:bg-[#0b101c]" : "text-zinc-500 hover:text-foreground"}`}>7D</button>
                    <button onClick={() => setActiveTimeline("30D")} className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${activeTimeline === "30D" ? "bg-primary text-white dark:bg-[#0b101c]" : "text-zinc-500 hover:text-foreground"}`}>30D</button>
                  </div>
                </div>

                <div className="relative w-full h-[240px] mt-4 z-0">
                  <canvas ref={canvasRef} className="w-full h-full" width={480} height={200} />
                </div>
              </div>

              {/* Recent Announcements Panel */}
              <div className="bg-white dark:bg-[#0b0e14] border border-black/10 dark:border-zinc-900 rounded-2xl p-6 flex flex-col justify-between h-[360px] transition-colors duration-300">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold tracking-wider text-foreground dark:text-zinc-200">Announcements</h3>
                  <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1">
                    {announcements.map((ann) => (
                      <div key={ann.id} className="p-3 border border-black/5 dark:border-zinc-900 bg-black/5 dark:bg-zinc-950/40 rounded-lg space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[7px] font-mono px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-[#00d1ff] font-bold uppercase">{ann.type}</span>
                          <span className="text-[8px] font-mono text-zinc-500">{ann.date}</span>
                        </div>
                        <h4 className="text-[10px] font-extrabold text-foreground dark:text-white leading-tight">{ann.title}</h4>
                        <p className="text-[9px] text-zinc-500 leading-normal line-clamp-2">{ann.message}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={() => setActiveSidebarTab("Notifications")} className="w-full mt-4 py-2 border border-black/10 dark:border-zinc-900 hover:border-black/20 dark:hover:border-zinc-800 rounded-lg text-[8px] font-mono font-bold tracking-widest uppercase text-zinc-500 hover:text-foreground dark:hover:text-white transition-all cursor-pointer">
                  PUBLISH_ANNOUNCEMENT
                </button>
              </div>
            </div>

            {/* Recent Deployments Table */}
            <div className="border border-black/10 dark:border-zinc-900 bg-white/60 dark:bg-[#0b0e14]/60 backdrop-blur-md rounded-2xl p-6 mt-6 space-y-5 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold tracking-wider text-foreground dark:text-zinc-200">Recent Deployments</h3>
                <span className="text-[8px] font-mono tracking-widest text-zinc-500 dark:text-zinc-600 uppercase font-bold">LAST_UPDATE: 2M_AGO</span>
              </div>

              <div className="overflow-x-auto text-[10px] font-mono">
                <table className="w-full text-zinc-500 text-left border-collapse">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-zinc-900 pb-3 text-[8px] tracking-widest uppercase font-bold text-zinc-400 dark:text-zinc-500">
                      <th className="py-2.5">DEPLOYMENT_ID</th>
                      <th className="py-2.5">REPOSITORY</th>
                      <th className="py-2.5">STATUS</th>
                      <th className="py-2.5">ENV</th>
                      <th className="py-2.5">TIMESTAMP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-zinc-900/40">
                    {deployments.map((d, i) => (
                      <tr key={i} className="hover:bg-black/5 dark:hover:bg-zinc-900/10 transition-colors h-12">
                        <td className="py-3 font-semibold text-primary dark:text-[#00d1ff] cursor-pointer hover:underline">{d.id}</td>
                        <td className="py-3 text-zinc-700 dark:text-zinc-300 font-sans font-medium">{d.repo}</td>
                        <td className="py-3 font-bold">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${d.status === "LIVE" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : d.status === "BUILDING" ? "bg-amber-400 animate-pulse" : "bg-rose-500"}`}></span>
                            <span className={d.status === "LIVE" ? "text-zinc-700 dark:text-zinc-200" : d.status === "BUILDING" ? "text-zinc-500" : "text-rose-500"}>{d.status}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="bg-black/5 dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 px-2 py-0.5 rounded text-[8px] font-bold text-zinc-500 dark:text-zinc-400">{d.env}</span>
                        </td>
                        <td className="py-3 text-zinc-500 dark:text-zinc-400 font-sans text-xs">{d.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );

      case "Users":
        // Filter users
        const filteredUsers = dbUsers.filter((user) => {
          if (softDeletedUserIds.includes(user.id)) return false;
          const matchesQuery = user.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                               user.email.toLowerCase().includes(userSearch.toLowerCase());
          const matchesRole = userRoleFilter === "All" ? true : user.role === userRoleFilter;
          return matchesQuery && matchesRole;
        });

        return (
          <div className="bg-white dark:bg-[#0b0e14] border border-black/10 dark:border-zinc-900 rounded-2xl p-8 space-y-6 shadow-lg transition-colors duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-foreground dark:text-white font-sans font-extrabold uppercase">User Directory</h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Live records of active engineers, developers, and clients synced in your PostgreSQL tables.</p>
              </div>

              {/* Filters & Search box */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-48">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-500">
                    <Search size={12} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search query..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 bg-black/5 dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-primary transition-all font-mono"
                  />
                </div>
                
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-black/5 dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-500 font-mono outline-none"
                >
                  <option value="All">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="developer">Student/Freelancer</option>
                  <option value="client">Client</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
 
            <div className="overflow-x-auto text-xs font-mono w-full">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-black/10 dark:border-zinc-900 text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest h-10 select-none">
                    <th className="pb-3">User Name</th>
                    <th className="pb-3">Email or Phone Number</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-zinc-900">
                  {filteredUsers.map((user) => {
                    const isUserSuspended = user.role === "suspended";
                    const isUserAdmin = user.role === "admin" || user.email === "veereshhp2004@gmail.com" || user.email === "veereshhp04@gmail.com";
                    return (
                      <tr key={user.id} className="h-14 hover:bg-black/5 dark:hover:bg-[#07090e]/25 transition-colors">
                        <td onClick={() => setSelectedUserDetails({ ...user, role: isUserAdmin ? "admin" : user.role })} className="text-foreground dark:text-white font-extrabold cursor-pointer hover:text-primary transition-colors">{user.name}</td>
                        <td className="text-zinc-500 dark:text-zinc-400 font-mono">{user.email}</td>
                        <td>
                           <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase border ${
                            isUserAdmin ? "bg-purple-500/10 border-purple-500/25 text-purple-600 dark:text-purple-400" :
                            user.role === "developer" ? "bg-cyan-500/10 border-cyan-500/25 text-[#00d1ff]" :
                            user.role === "suspended" ? "bg-red-500/10 border-red-500/25 text-red-500" :
                            "bg-black/5 border-black/10 dark:bg-zinc-800 dark:border-zinc-900 text-zinc-500 dark:text-zinc-400"
                          }`}>
                            {isUserAdmin ? "ADMIN" : user.role === "developer" ? "STUDENT" : user.role === "suspended" ? `SUSPENDED (${localStorage.getItem(`suspension_duration_${user.id}`) || "Permanent"})` : user.role}
                          </span>
                        </td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase border ${
                            isUserSuspended ? "bg-red-500/10 border-red-500/25 text-red-500" : "bg-green-500/10 border-green-500/25 text-green-500"
                          }`}>
                            {isUserSuspended ? "Suspended" : "Active"}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleUserAdmin(user.id, !isUserAdmin)}
                              className={`px-2 py-1 rounded text-[8px] font-mono uppercase tracking-wider font-bold transition-all border ${
                                isUserAdmin ? "bg-purple-500/10 border-purple-500/25 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20" : "bg-cyan-500/10 border-cyan-500/25 text-cyan-500 hover:bg-cyan-500/20"
                              }`}
                            >
                              {isUserAdmin ? "Remove Admin" : "Make Admin"}
                            </button>
                            <button
                              onClick={() => handleModifyUserStatus(user.id, isUserSuspended ? "Active" : "Suspended")}
                              className={`px-2 py-1 rounded text-[8px] font-mono uppercase tracking-wider font-bold transition-all border ${
                                isUserSuspended ? "bg-green-500/10 border-green-500/25 text-green-500 hover:bg-green-500/20" : "bg-yellow-500/10 border-yellow-500/25 text-yellow-500 hover:bg-yellow-500/20"
                              }`}
                            >
                              {isUserSuspended ? "Activate" : "Suspend"}
                            </button>
                            <button
                              onClick={() => handleRemoveUser(user.id)}
                              className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 rounded text-[8px] font-mono uppercase tracking-wider font-bold"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
 
            {/* Profile details popup modal */}
            {selectedUserDetails && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                <div className="bg-white dark:bg-[#07090e] border border-black/10 dark:border-zinc-800 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
                  <button onClick={() => setSelectedUserDetails(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-foreground dark:hover:text-white cursor-pointer"><XCircle size={18} /></button>
                  <div className="space-y-4">
                    <h3 className="text-sm font-mono tracking-widest text-zinc-500 uppercase">Ecosystem Profile Details</h3>
                    <div className="space-y-2 select-text">
                      <div className="flex justify-between border-b border-black/5 dark:border-zinc-900 pb-2"><span className="text-zinc-500">Name</span><span className="font-extrabold text-foreground dark:text-white">{selectedUserDetails.name}</span></div>
                      <div className="flex justify-between border-b border-black/5 dark:border-zinc-900 pb-2"><span className="text-zinc-500">Credential</span><span className="font-mono text-foreground dark:text-white">{selectedUserDetails.email}</span></div>
                      <div className="flex justify-between border-b border-black/5 dark:border-zinc-900 pb-2"><span className="text-zinc-500">Role</span><span className="font-mono uppercase text-[#00d1ff]">{selectedUserDetails.role}</span></div>
                      <div className="flex justify-between border-b border-black/5 dark:border-zinc-900 pb-2"><span className="text-zinc-500">Secure User ID</span><span className="font-mono text-[9px] text-zinc-500">{selectedUserDetails.id}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Profile Status</span><span className={`font-bold ${selectedUserDetails.role === "suspended" ? "text-red-500" : "text-green-500"}`}>{selectedUserDetails.role === "suspended" ? "Suspended" : "Active"}</span></div>
                      {selectedUserDetails.role === "suspended" && (
                        <div className="flex justify-between border-t border-black/5 dark:border-zinc-900 pt-2"><span className="text-zinc-500">Suspension Duration</span><span className="font-bold text-red-500 font-mono">{localStorage.getItem(`suspension_duration_${selectedUserDetails.id}`) || "Permanent"}</span></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
 
          </div>
        );

      case "Projects":
        // Filter projects
        const filteredProjects = dbProjects.filter((p) => {
          if (softDeletedProjectIds.includes(p.id)) return false;
          const matchesQuery = p.title.toLowerCase().includes(projectSearch.toLowerCase()) || 
                               (p.category && p.category.toLowerCase().includes(projectSearch.toLowerCase()));
          const matchesStatus = projectStatusFilter === "All" ? true : p.status === projectStatusFilter;
          return matchesQuery && matchesStatus;
        });

        return (
          <div className="bg-white dark:bg-[#0b0e14] border border-black/10 dark:border-zinc-900 rounded-2xl p-8 space-y-6 shadow-lg transition-colors duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-foreground dark:text-white font-sans font-extrabold uppercase">Project Management</h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Review, approve, assign, and mark ecosystem projects completed.</p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-48">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-500">
                    <Search size={12} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search title..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 bg-black/5 dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-primary transition-all font-mono"
                  />
                </div>

                <select
                  value={projectStatusFilter}
                  onChange={(e) => setProjectStatusFilter(e.target.value)}
                  className="bg-black/5 dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-500 font-mono outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto text-xs font-mono w-full select-text">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-black/10 dark:border-zinc-900 text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest h-10 select-none">
                    <th className="pb-3">Project Title</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Stars / Forks</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-zinc-900">
                  {filteredProjects.map((p) => {
                    const isPending = p.status === "Pending" || !p.status;
                    return (
                      <tr key={p.id} className="h-14 hover:bg-black/5 dark:hover:bg-[#07090e]/25 transition-colors">
                        <td className="text-foreground dark:text-white font-extrabold max-w-[200px] truncate">{p.title}</td>
                        <td className="text-zinc-500 dark:text-zinc-400">{p.category}</td>
                        <td className="text-zinc-500 dark:text-zinc-400">{p.stars} ⭐ / {p.forks} 🍴</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase border ${
                            p.status === "Completed" ? "bg-green-500/10 border-green-500/25 text-green-500" :
                            p.status === "Cancelled" ? "bg-red-500/10 border-red-500/25 text-red-500" :
                            p.status === "Approved" ? "bg-blue-500/10 border-blue-500/25 text-blue-500" :
                            p.status === "In Progress" ? "bg-cyan-500/10 border-cyan-500/25 text-[#00d1ff]" :
                            "bg-yellow-500/10 border-yellow-500/25 text-yellow-500 animate-pulse"
                          }`}>
                            {p.status || "Pending"}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          <div className="flex justify-end gap-1.5">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleModifyProjectStatus(p.id, "Approved")}
                                  className="px-2 py-1 bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500/20 rounded text-[8px] font-mono font-bold uppercase tracking-wider"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleModifyProjectStatus(p.id, "Cancelled")}
                                  className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 rounded text-[8px] font-mono font-bold uppercase tracking-wider"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {p.status === "Approved" && (
                              <button
                                onClick={() => handleModifyProjectStatus(p.id, "In Progress")}
                                className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 hover:bg-cyan-500/20 rounded text-[8px] font-mono font-bold uppercase tracking-wider"
                              >
                                Start Work
                              </button>
                            )}
                            {p.status === "In Progress" && (
                              <button
                                onClick={() => handleModifyProjectStatus(p.id, "Completed")}
                                className="px-2 py-1 bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500/20 rounded text-[8px] font-mono font-bold uppercase tracking-wider"
                              >
                                Complete
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveProject(p.id)}
                              className="px-1.5 py-1 text-zinc-400 hover:text-red-500 border border-black/10 dark:border-zinc-800 rounded bg-white/5 dark:bg-zinc-950"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "Categories":
        return (
          <div className="bg-white dark:bg-[#0b0e14] border border-black/10 dark:border-zinc-900 rounded-2xl p-8 space-y-6 shadow-lg transition-colors duration-300">
            <div>
              <h3 className="text-lg font-bold text-foreground dark:text-white font-sans font-extrabold uppercase">Category Management</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Manage categories, directories, and tags for developer projects.</p>
            </div>

            {/* Add Category Form inline */}
            <form onSubmit={handleAddCategory} className="flex gap-3 max-w-md select-none">
              <input
                type="text"
                required
                placeholder="New Category name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-3 py-2 bg-black/5 dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-primary transition-all font-mono"
              />
              <button type="submit" className="px-4 bg-primary dark:bg-[#00d1ff] text-on-primary dark:text-black font-extrabold rounded-lg text-xs flex items-center gap-1.5 uppercase hover:brightness-110 active:scale-95 transition-all">
                <Plus size={14} /> Add
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 select-text">
              {categories.map((cat, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-black/5 dark:bg-zinc-900/40 border border-black/5 dark:border-zinc-900 rounded-xl hover:border-black/25 dark:hover:border-zinc-800 transition-all font-mono text-xs">
                  <div className="space-y-0.5">
                    <span className="font-extrabold block text-foreground dark:text-white">{cat}</span>
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest block leading-none">Category node</span>
                  </div>
                  <button onClick={() => handleRemoveCategory(cat)} className="p-1.5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-400 hover:text-red-300 rounded cursor-pointer transition-colors">
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case "Reports":
        const filteredReports = reports.filter((rep) => reportsFilter === "All" ? true : rep.status === reportsFilter);
        return (
          <div className="bg-white dark:bg-[#0b0e14] border border-black/10 dark:border-zinc-900 rounded-2xl p-8 space-y-6 shadow-lg transition-colors duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 select-none">
              <div>
                <h3 className="text-lg font-bold text-foreground dark:text-white font-sans font-extrabold uppercase">Reports & Complaint Hub</h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Track fake accounts, project spams, and payment disputes raised by the ecosystem developers.</p>
              </div>

              <select
                value={reportsFilter}
                onChange={(e) => setReportsFilter(e.target.value)}
                className="bg-black/5 dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-500 font-mono outline-none"
              >
                <option value="All">All Reports</option>
                <option value="Open">Open</option>
                <option value="Under Review">Under Review</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-2 select-text">
              {filteredReports.map((rep) => (
                <div key={rep.id} className="p-5 bg-black/5 dark:bg-zinc-900/30 border border-black/5 dark:border-zinc-900 rounded-xl space-y-4">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[7px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/25 text-red-500 font-bold uppercase">{rep.type}</span>
                      <span className="text-xs font-mono font-extrabold text-foreground dark:text-white">{rep.target}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[8px] font-mono text-zinc-500">Filed by {rep.reporter} • {rep.date}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase border ${
                        rep.status === "Resolved" ? "bg-green-500/10 border-green-500/25 text-green-500" :
                        rep.status === "Under Review" ? "bg-yellow-500/10 border-yellow-500/25 text-yellow-500 animate-pulse" :
                        "bg-red-500/10 border-red-500/25 text-red-500"
                      }`}>
                        {rep.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed font-sans">{rep.description}</p>
                  
                  {rep.status !== "Resolved" && (
                    <div className="flex justify-end gap-2 select-none">
                      {rep.status === "Open" && (
                        <button
                          onClick={() => handleModifyReportStatus(rep.id, "Under Review")}
                          className="px-2.5 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20 rounded text-[8px] font-mono font-bold uppercase tracking-wider transition-all"
                        >
                          Investigate
                        </button>
                      )}
                      <button
                        onClick={() => handleModifyReportStatus(rep.id, "Resolved")}
                        className="px-2.5 py-1.5 bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500/20 rounded text-[8px] font-mono font-bold uppercase tracking-wider transition-all"
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "Certificates":
        return (
          <div className="bg-white dark:bg-[#0b0e14] border border-black/10 dark:border-zinc-900 rounded-2xl p-8 space-y-6 shadow-lg transition-colors duration-300">
            <div>
              <h3 className="text-lg font-bold text-foreground dark:text-white font-sans font-extrabold uppercase">Certificate Management</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Approve, issued, revoke, and generate developer project completion credentials.</p>
            </div>

            <div className="overflow-x-auto text-xs font-mono w-full select-text">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-black/10 dark:border-zinc-900 text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest h-10 select-none">
                    <th className="pb-3">Certificate ID</th>
                    <th className="pb-3">Student Name</th>
                    <th className="pb-3">Project Title</th>
                    <th className="pb-3">Issue Date</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-zinc-900">
                  {certificates.map((cert) => (
                    <tr key={cert.id} className="h-14 hover:bg-black/5 dark:hover:bg-[#07090e]/25 transition-colors">
                      <td className="text-primary dark:text-[#00d1ff] font-extrabold">{cert.id}</td>
                      <td className="text-foreground dark:text-white font-semibold font-sans">{cert.studentName}</td>
                      <td className="text-zinc-500 dark:text-zinc-400 font-sans max-w-[150px] truncate">{cert.projectName}</td>
                      <td className="text-zinc-500 dark:text-zinc-400 font-mono">{cert.issueDate}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase border ${
                          cert.status === "Approved" ? "bg-green-500/10 border-green-500/25 text-green-500" :
                          cert.status === "Revoked" ? "bg-red-500/10 border-red-500/25 text-red-500" :
                          "bg-yellow-500/10 border-yellow-500/25 text-yellow-500 animate-pulse"
                        }`}>
                          {cert.status}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex justify-end gap-1.5 select-none">
                          {cert.status === "Pending" && (
                            <button
                              onClick={() => handleModifyCertStatus(cert.id, "Approved")}
                              className="px-2 py-1 bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500/20 rounded text-[8px] font-mono font-bold uppercase tracking-wider"
                            >
                              Approve
                            </button>
                          )}
                          {cert.status === "Approved" && (
                            <button
                              onClick={() => setSelectedCertDownload(cert)}
                              className="px-2 py-1 bg-primary/10 border border-primary/20 text-primary dark:text-[#00d1ff] hover:bg-primary/20 rounded text-[8px] font-mono font-bold uppercase tracking-wider"
                            >
                              Download
                            </button>
                          )}
                          {cert.status !== "Revoked" && (
                            <button
                              onClick={() => handleModifyCertStatus(cert.id, "Revoked")}
                              className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 rounded text-[8px] font-mono font-bold uppercase tracking-wider"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cert download popup modal */}
            {selectedCertDownload && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 select-none">
                <div className="bg-white dark:bg-[#07090e] border border-black/10 dark:border-zinc-800 p-8 rounded-2xl w-full max-w-lg shadow-2xl relative text-center space-y-6">
                  <button onClick={() => setSelectedCertDownload(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-foreground dark:hover:text-white cursor-pointer"><XCircle size={18} /></button>
                  <Award size={48} className="text-[#00d1ff] mx-auto animate-bounce" />
                  <div className="space-y-2">
                    <h3 className="text-sm font-mono tracking-widest text-zinc-500 uppercase leading-none">Security Certificate Generated</h3>
                    <h2 className="text-xl font-extrabold text-foreground dark:text-white font-sans">{selectedCertDownload.studentName}</h2>
                    <p className="text-xs text-zinc-500 leading-normal max-w-sm mx-auto">This confirms the successful validation and cryptographic signoff on project **{selectedCertDownload.projectName}**.</p>
                  </div>
                  <div className="p-4 border border-dashed border-black/10 dark:border-zinc-800 rounded-xl space-y-1 font-mono text-[9px] text-zinc-500 uppercase">
                    <div>CERTIFICATE ID: {selectedCertDownload.id}</div>
                    <div>COMPILATION STATUS: verified_secure</div>
                    <div>ISSUE DATE: {selectedCertDownload.issueDate}</div>
                  </div>
                  <button onClick={() => setSelectedCertDownload(null)} className="px-6 py-2 bg-primary dark:bg-[#00d1ff] text-on-primary dark:text-black font-extrabold rounded-lg text-xs uppercase hover:brightness-110 active:scale-95 transition-all w-full">Close Portal View</button>
                </div>
              </div>
            )}

          </div>
        );

      case "Notifications":
        return (
          <div className="bg-white dark:bg-[#0b0e14] border border-black/10 dark:border-zinc-900 rounded-2xl p-8 space-y-6 shadow-lg transition-colors duration-300">
            <div>
              <h3 className="text-lg font-bold text-foreground dark:text-white font-sans font-extrabold uppercase">Ecosystem Announcements</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Post notifications and announcements directly to all logged-in developer channels.</p>
            </div>

            {/* Compose form */}
            <form onSubmit={handlePostAnnouncement} className="space-y-4 max-w-xl select-none">
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block">Announcement Title</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Hackathon Registration Open"
                  value={newAnnTitle}
                  onChange={(e) => setNewAnnTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-black/5 dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-primary transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block">Announcement Category</label>
                  <select
                    value={newAnnType}
                    onChange={(e) => setNewAnnType(e.target.value)}
                    className="w-full px-3 py-2 bg-black/5 dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 rounded-lg text-xs text-zinc-500 font-mono outline-none"
                  >
                    <option value="New Feature">New Feature</option>
                    <option value="Maintenance Notice">Maintenance Notice</option>
                    <option value="Hackathon Announcement">Hackathon Announcement</option>
                    <option value="Internship Opportunity">Internship Opportunity</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block">Message body</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detail your announcement text..."
                  value={newAnnMessage}
                  onChange={(e) => setNewAnnMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-black/5 dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-primary transition-all font-sans"
                />
              </div>

              <button type="submit" className="px-5 py-2.5 bg-primary dark:bg-[#00d1ff] text-on-primary dark:text-black font-extrabold rounded-lg text-xs flex items-center gap-1.5 uppercase hover:brightness-110 active:scale-95 transition-all">
                <Send size={12} /> Post announcement
              </button>
            </form>

            {/* List announcements */}
            <div className="pt-6 border-t border-black/5 dark:border-zinc-900/60 space-y-4 select-text">
              <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-500">Live published announcements</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-5 border border-black/5 dark:border-zinc-900 bg-black/5 dark:bg-zinc-900/30 rounded-xl flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center gap-2 select-none">
                        <span className="text-[7px] font-mono px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-[#00d1ff] font-bold uppercase">{ann.type}</span>
                        <span className="text-[8px] font-mono text-zinc-500">{ann.date}</span>
                      </div>
                      <h4 className="text-xs font-extrabold text-foreground dark:text-white leading-tight">{ann.title}</h4>
                      <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">{ann.message}</p>
                    </div>

                    <button onClick={() => handleRemoveAnnouncement(ann.id)} className="w-full py-1.5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-400 hover:text-red-300 rounded text-[8px] font-mono font-bold uppercase tracking-wider select-none transition-colors">
                      Delete Announcement
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        );

      case "Settings":
        return (
          <div className="bg-white dark:bg-[#0b0e14] border border-black/10 dark:border-zinc-900 rounded-2xl p-8 space-y-6 shadow-lg transition-colors duration-300">
            <div>
              <h3 className="text-lg font-bold text-foreground dark:text-white font-sans font-extrabold uppercase">Admin Profile Settings</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Update administrative details, manage credentials, and toggle login session security keys.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 select-none">
              
              {/* Profile particulars form */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-500 border-b border-black/5 dark:border-zinc-900/60 pb-2">Profile details</h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">Full Name</label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full px-3 py-2 bg-black/5 dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-primary transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">Credentials Email</label>
                    <input
                      type="email"
                      disabled
                      value={adminEmail}
                      className="w-full px-3 py-2 bg-black/5 dark:bg-zinc-900/50 border border-black/10 dark:border-zinc-800 rounded-lg text-xs focus:outline-none font-mono opacity-50 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Password credentials form */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-500 border-b border-black/5 dark:border-zinc-900/60 pb-2">Secure credentials update</h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">Reset Master Access Password</label>
                    <input
                      type="password"
                      placeholder="••••••••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-black/5 dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-primary transition-all font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-zinc-900/60">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-foreground dark:text-white block leading-none">Two-Factor Auth (2FA)</span>
                      <span className="text-[8px] text-zinc-500 uppercase tracking-widest block">Require token on entry</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setToggled2FA(!toggled2FA)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${toggled2FA ? "bg-primary dark:bg-[#00d1ff]" : "bg-black/10 dark:bg-zinc-800"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${toggled2FA ? "translate-x-4" : "translate-x-0"}`}></div>
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Login Sessions logs */}
            <div className="pt-6 border-t border-black/5 dark:border-zinc-900/60 space-y-4 select-text">
              <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-500">Security Login History Logs</h4>
              <div className="overflow-x-auto text-[9px] font-mono text-zinc-500">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-zinc-900 text-zinc-650 h-8 font-bold">
                      <th className="pb-2">Session Timestamp</th>
                      <th className="pb-2">Origin IP Address</th>
                      <th className="pb-2">Secure Cipher Key</th>
                      <th className="pb-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-zinc-900/40">
                    <tr className="h-10 hover:bg-black/5 dark:hover:bg-zinc-900/10 transition-colors">
                      <td className="py-2.5">2026-05-29 14:51:47</td>
                      <td>127.0.0.1 (Localhost)</td>
                      <td className="text-zinc-600">ECDSA-SHA256-AES-GCM</td>
                      <td className="text-green-500 font-bold text-right">ACTIVE_SESSION</td>
                    </tr>
                    <tr className="h-10 hover:bg-black/5 dark:hover:bg-zinc-900/10 transition-colors">
                      <td className="py-2.5">2026-05-28 09:30:14</td>
                      <td>192.168.1.104 (Core node)</td>
                      <td className="text-zinc-600">ECDSA-SHA256-AES-GCM</td>
                      <td className="text-zinc-500 text-right">CLOSED</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        );

      case "Recycle Bin":
        return (
          <div className="bg-white dark:bg-[#0b0e14] border border-black/10 dark:border-zinc-900 rounded-2xl p-8 space-y-6 shadow-lg transition-colors duration-300">
            <div>
              <h3 className="text-lg font-bold text-foreground dark:text-white font-sans font-extrabold uppercase flex items-center gap-2">
                <Trash2 size={20} className="text-[#00d1ff]" />
                Recycle Bin Console
              </h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Safely recover or permanently purge deleted categories, users, and project nodes.</p>
            </div>

            {recycleBin.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-black/10 dark:border-zinc-900 rounded-2xl space-y-2">
                <Trash2 size={36} className="text-zinc-300 dark:text-zinc-800 mx-auto" />
                <div className="text-xs font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Recycle Bin is Empty</div>
                <div className="text-[10px] text-zinc-450 dark:text-zinc-650">Soft-deleted directories will accumulate here for master recovery.</div>
              </div>
            ) : (
              <div className="overflow-x-auto text-xs font-mono w-full">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-zinc-900 text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest h-10 select-none">
                      <th className="pb-3">Deleted Item Name / Title</th>
                      <th className="pb-3">Node Type</th>
                      <th className="pb-3">Deleted Time</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-zinc-900">
                    {recycleBin.map((item) => (
                      <tr key={item.id} className="h-14 hover:bg-black/5 dark:hover:bg-[#07090e]/25 transition-colors">
                        <td className="text-foreground dark:text-white font-extrabold font-sans">{item.name}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase border ${
                            item.type === "Category" ? "bg-amber-500/10 border-amber-500/25 text-amber-500" :
                            item.type === "User" ? "bg-purple-500/10 border-purple-500/25 text-purple-500" :
                            "bg-cyan-500/10 border-cyan-500/25 text-[#00d1ff]"
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="text-zinc-500 dark:text-zinc-400">{item.deletedAt}</td>
                        <td className="py-2 text-right">
                          <div className="flex justify-end gap-1.5 select-none">
                            <button
                              onClick={() => handleRestoreItem(item)}
                              className="px-2.5 py-1 bg-green-500/10 border border-green-500/25 text-green-500 hover:bg-green-500/20 rounded text-[8px] font-mono font-bold uppercase tracking-wider transition-all"
                            >
                              Restore Node
                            </button>
                            <button
                              onClick={() => handleDeletePermanently(item)}
                              className="px-2.5 py-1 bg-red-500/10 border border-red-500/25 text-red-500 hover:bg-red-500/20 rounded text-[8px] font-mono font-bold uppercase tracking-wider transition-all"
                            >
                              Purge Permanently
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const navItems = [
    { label: "Dashboard", icon: BarChart3 },
    { label: "Users", icon: Users },
    { label: "Projects", icon: Rocket },
    { label: "Categories", icon: Layers },
    { label: "Reports", icon: AlertTriangle },
    { label: "Certificates", icon: Award },
    { label: "Notifications", icon: Globe },
    { label: "Settings", icon: SettingsIcon },
    { label: "Recycle Bin", icon: Trash2 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between font-sans select-none">
      
      {/* 1. Brand Header */}
      <header className="border-b border-black/5 dark:border-zinc-900 bg-white/90 dark:bg-[#06080c]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between select-text transition-colors duration-300 print:hidden">
        <div className="flex items-center gap-12">
          {/* Logo split color */}
          <Link to="/" className="text-xl font-black tracking-tight font-sans flex items-center gap-0.5">
            <span className="text-foreground dark:text-white">Recode</span>
            <span className="text-primary dark:text-[#00d1ff]">X</span>
          </Link>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7">
            <Link to="/" className="text-xs font-semibold text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 tracking-wider uppercase transition-colors">Home</Link>
            <Link to="/projects" className="text-xs font-semibold text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 tracking-wider uppercase transition-colors">Projects</Link>
            <Link to="/services" className="text-xs font-semibold text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 tracking-wider uppercase transition-colors">Services</Link>
            <Link to="/categories" className="text-xs font-semibold text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 tracking-wider uppercase transition-colors">Categories</Link>
            <Link to="/announcements" className="text-xs font-semibold text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 tracking-wider uppercase transition-colors">Announcements</Link>
            <Link to="/contact" className="text-xs font-semibold text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 tracking-wider uppercase transition-colors">Contact</Link>
            <Link to="/dashboard" className="text-xs font-bold text-foreground dark:text-white tracking-wider uppercase relative py-1">
              Admin
              <span className="absolute bottom-[-17px] left-0 w-full h-[2.5px] bg-primary dark:bg-[#00d1ff]"></span>
            </Link>
          </nav>
        </div>

        {/* Right side: Moon Toggle & ROOT_ADMIN Pill */}
        <div className="flex items-center gap-5 select-none">
          <button
            onClick={toggleTheme}
            className="p-1.5 text-zinc-500 hover:text-foreground dark:hover:text-white cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 rounded-full flex items-center justify-center"
          >
            {theme === "dark" ? <Sun size={16} className="text-primary" /> : <Moon size={16} />}
          </button>
          
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-black/10 dark:border-zinc-800/80 bg-black/5 dark:bg-zinc-900/40 text-xs font-bold tracking-wider font-mono">
            <div className="w-5 h-5 rounded-full bg-black/5 dark:bg-zinc-800 flex items-center justify-center text-zinc-550 dark:text-zinc-400">
              <User size={12} />
            </div>
            <span className="text-zinc-700 dark:text-zinc-300 text-[10px]">ROOT_ADMIN</span>
          </div>

          <button
            onClick={handleSignOut}
            className="p-2 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 rounded-lg flex items-center justify-center cursor-pointer transition-all active:scale-95"
            title="Secure Signout"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* 2. Admin Workspace Grid */}
      <div className="flex-grow flex flex-col md:flex-row relative z-10 w-full max-w-[1440px] mx-auto px-6 md:px-8 py-8 gap-8">
        
        {/* Sidebar Panel */}
        <aside className="w-full md:w-60 flex flex-col justify-between gap-12 select-none">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeSidebarTab === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => setActiveSidebarTab(item.label)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold tracking-wider font-mono uppercase transition-all border cursor-pointer ${
                    isActive
                      ? "bg-primary text-white dark:bg-[#0b101c] border-primary dark:border-[#00d1ff]/25"
                      : "bg-transparent border-transparent text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-zinc-900/20"
                  }`}
                >
                  <item.icon size={14} className={isActive ? "text-white dark:text-[#00d1ff]" : "text-zinc-500"} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Node Status Capsule */}
          <div className="border border-black/10 dark:border-zinc-900 bg-black/5 dark:bg-zinc-950/20 rounded-xl p-4 flex items-center justify-between shadow-inner">
            <div className="space-y-1">
              <span className="text-[8px] font-mono tracking-widest text-zinc-500 dark:text-zinc-600 uppercase font-bold block">Node Status</span>
              <span className="text-[10px] font-mono font-bold text-primary dark:text-[#00d1ff] block">v1.0.0-mvp</span>
              <span className="text-[9px] font-mono text-zinc-600 dark:text-zinc-500 block">up 99.98% uptime</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-primary dark:bg-[#00d1ff] animate-pulse shadow-[0_0_10px_rgba(0,209,255,0.7)]"></span>
          </div>
        </aside>

        {/* Main Dashboard Space */}
        <main className="flex-grow space-y-8 select-text">
          
          {/* Main Console Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-white font-sans flex items-center gap-2">
                <span>Ecosystem Control Console</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary dark:text-[#00d1ff] font-bold uppercase select-none">{activeSidebarTab}</span>
              </h1>
              <p className="text-zinc-500 text-xs mt-1">
                Real-time marketplace performance, credentials audit, and category moderation metrics.
              </p>
            </div>
            {activeSidebarTab === "Dashboard" && (
              <div className="flex items-center gap-3 select-none">
                <button onClick={handleExportJSON} className="px-4 py-2 bg-black/5 dark:bg-zinc-950/40 border border-black/10 dark:border-zinc-800 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-450 hover:text-foreground dark:hover:text-white hover:border-black/20 dark:hover:border-zinc-700 transition-all cursor-pointer">
                  EXPORT_TELEMETRY
                </button>
                <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary dark:bg-[#00d1ff] text-on-primary dark:text-black rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider hover:brightness-110 hover:shadow-[0_0_20px_rgba(0,209,255,0.4)] transition-all cursor-pointer flex items-center gap-1.5">
                  <RefreshCw size={10} className="animate-spin" /> REFRESH_SYSTEM
                </button>
              </div>
            )}
          </div>

          {/* Dynamic tabs console spacer */}
          <div className="mt-6">
            {renderMainContent()}
          </div>

        </main>
      </div>

      {/* 3. Footer */}
      <footer className="border-t border-black/5 dark:border-zinc-900 bg-white/40 dark:bg-black/40 py-8 px-6 md:px-12 xl:px-24 select-text print:hidden">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 font-sans">
          <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 text-xs">
            <Link to="/" className="text-sm font-black tracking-tight uppercase">
              <span className="text-foreground dark:text-white">Recode</span>
              <span className="text-primary dark:text-[#00d1ff]">X</span>
            </Link>
            <span className="text-zinc-500 dark:text-zinc-650 text-[10px]">
              © 2026 RecodeX Developer Marketplace. Built for high-performance engineers.
            </span>
          </div>

          <div className="flex items-center gap-6 text-[10px] text-zinc-500 font-medium">
            <span className="hover:text-primary cursor-default transition-colors">Privacy Policy</span>
            <span className="hover:text-primary cursor-default transition-colors">Terms of Service</span>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              Github
            </a>
            <span className="hover:text-primary cursor-default transition-colors">Documentation</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
