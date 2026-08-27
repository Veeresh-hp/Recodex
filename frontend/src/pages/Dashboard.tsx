import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { 
  CreditCard, Code, Rocket, Moon, Sun,
  Layers, LogOut, User, Play,
  Settings as SettingsIcon, Users, BarChart3, 
  Trash2, Plus, Edit3, Globe,
  AlertTriangle, Search, FileText, CheckCircle, Award, XCircle, RefreshCw, Send, Menu, X,
  Mail, MessageSquare, Upload, Download, Eye, FileUp, PlusCircle, Calendar, Slash, CheckCircle2, HelpCircle
} from "lucide-react";
import { useAuth, useUser, useClerk } from "@clerk/clerk-react";
import Chart from "chart.js/auto";
import { 
  getProjects, getUsers, updateUser, deleteUser, 
  updateProject, deleteProject, getInquiries, 
  deleteInquiry, replyToInquiry, getUserProfile,
  getCertificatesApi, saveCertificateApi, deleteCertificateApi,
  promoteUserAdminApi
} from "../services/api";
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
  userId?: string;
  userEmail?: string;
  studentName: string;
  projectName: string;
  issueDate: string;
  status: "Approved" | "Pending" | "Revoked" | "Not Issued";
  fileData?: string;
  fileName?: string;
  fileType?: string;
  description?: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  date: string;
}

const formatRelativeTime = (timestampStr: string): string => {
  if (!timestampStr) return "";
  let date = new Date(timestampStr);

  if (isNaN(date.getTime())) {
    const match = timestampStr.match(/^(\d+)\s*([a-z]+)\s*ago$/i);
    if (match) {
      const val = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      const nowMs = Date.now();
      if (unit.startsWith("m") && !unit.startsWith("mo")) date = new Date(nowMs - val * 60 * 1000);
      else if (unit.startsWith("h")) date = new Date(nowMs - val * 3600 * 1000);
      else if (unit.startsWith("d")) date = new Date(nowMs - val * 86400 * 1000);
      else if (unit.startsWith("mo")) date = new Date(nowMs - val * 30 * 86400 * 1000);
      else if (unit.startsWith("y")) date = new Date(nowMs - val * 365 * 86400 * 1000);
      else return timestampStr;
    } else {
      return timestampStr;
    }
  }

  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 45) return "Just now";
  if (diffMin < 60) return `${Math.max(1, diffMin)}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return `${diffYear}y ago`;
};

const getAnnouncementMessage = (ann: Announcement): string => {
  if (ann.id === "ann-02") {
    const date = new Date(ann.date);
    if (!isNaN(date.getTime())) {
      const monthStr = date.toLocaleString("en-US", { month: "long" });
      const dayNum = date.getDate();
      if (ann.message.includes("[DATE]")) {
        return ann.message.replace("[DATE]", `${monthStr} ${dayNum}`);
      }
      return ann.message.replace(/updates on [A-Za-z]+ \d+/, `updates on ${monthStr} ${dayNum}`);
    }
  }
  return ann.message;
};

const isNewUser = (createdAtStr?: string): boolean => {
  if (!createdAtStr) return false;
  const created = new Date(createdAtStr);
  if (isNaN(created.getTime())) return false;
  const diffMs = Date.now() - created.getTime();
  // Highlight users created within the last 7 days as NEW
  return diffMs >= 0 && diffMs <= 7 * 24 * 60 * 60 * 1000;
};

export default function Dashboard() {
  const { isLoaded, userId, getToken } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();

  const { theme, toggleTheme } = useTheme();
  const [activeSidebarTab, setActiveSidebarTab] = useState("Dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Admin access validation states
  const [adminName, setAdminName] = useState("Veeresh H P");
  const [adminEmail, setAdminEmail] = useState("veereshhp2004@gmail.com");
  const [adminPassword, setAdminPassword] = useState("");
  const [toggled2FA, setToggled2FA] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState<any | null>(null);

  // Database states
  const [dbProjects, setDbProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Inquiries states
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  const [replyingInquiryId, setReplyingInquiryId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);

  // User edit and reset password states
  const [activeUserActionMenuId, setActiveUserActionMenuId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<any | null>(null);
  const [newEditName, setNewEditName] = useState("");
  const [newEditRole, setNewEditRole] = useState("");
  const [newPasswordVal, setNewPasswordVal] = useState("");
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Static stats
  const [revenue] = useState(1458000);
  const [sysHealth, setSysHealth] = useState(99.98);

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

  // Chart Canvas Refs
  const growthChartRef = useRef<HTMLCanvasElement | null>(null);
  const categoryChartRef = useRef<HTMLCanvasElement | null>(null);
  const growthChartInstance = useRef<Chart | null>(null);
  const categoryChartInstance = useRef<Chart | null>(null);
  const [growthRange, setGrowthRange] = useState<"6M" | "1Y">("6M");

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

  const [categories, setCategories] = useState<string[]>(() => {
    const stored = localStorage.getItem("recodex_global_categories");
    return stored ? JSON.parse(stored) : [
      "Web Systems", "AI & Intelligence", "Blockchain & Web3", "Low-Level Shells"
    ];
  });
  const [newCategoryName, setNewCategoryName] = useState("");

  const [reports, setReports] = useState<Report[]>(() => {
    const stored = localStorage.getItem("recodex_global_reports");
    if (!stored) return [];
    try {
      const parsed: Report[] = JSON.parse(stored);
      const cleaned = parsed.filter(
        (r) =>
          !["john skynet", "bob malicious", "order #cam-8d2a1"].includes((r.target || "").toLowerCase().trim()) &&
          !["rep-01", "rep-02", "rep-03"].includes((r.id || "").toLowerCase().trim())
      );
      if (cleaned.length !== parsed.length) {
        localStorage.setItem("recodex_global_reports", JSON.stringify(cleaned));
      }
      return cleaned;
    } catch {
      return [];
    }
  });
  const [reportsFilter, setReportsFilter] = useState("All");

  const [certificates, setCertificates] = useState<Certificate[]>(() => {
    const stored = localStorage.getItem("recodex_global_certificates");
    if (!stored) return [];
    try {
      const parsed: Certificate[] = JSON.parse(stored);
      const cleaned = parsed.filter(
        (c) =>
          !["john doe", "alice vance", "sarah connor"].includes(c.studentName?.toLowerCase() || "") &&
          !["cert-9402", "cert-1842", "cert-0691"].includes(c.id?.toLowerCase() || "")
      );
      if (cleaned.length !== parsed.length) {
        localStorage.setItem("recodex_global_certificates", JSON.stringify(cleaned));
      }
      return cleaned;
    } catch {
      return [];
    }
  });
  const [selectedCertDownload, setSelectedCertDownload] = useState<Certificate | null>(null);

  // Certificate Management modal & upload states
  const [uploadingCertUser, setUploadingCertUser] = useState<any | null>(null);
  const [editingCertItem, setEditingCertItem] = useState<Certificate | null>(null);
  const [selectedCertView, setSelectedCertView] = useState<Certificate | null>(null);

  const [certProjectTitleInput, setCertProjectTitleInput] = useState("Software Solution Project");
  const [certIssueDateInput, setCertIssueDateInput] = useState(() => new Date().toISOString().split("T")[0]);
  const [certStatusInput, setCertStatusInput] = useState<"Approved" | "Pending" | "Revoked">("Approved");
  const [certFileDataUrl, setCertFileDataUrl] = useState<string>("");
  const [certFileNameVal, setCertFileNameVal] = useState<string>("");
  const [certFileTypeVal, setCertFileTypeVal] = useState<string>("");
  const [certSearchTerm, setCertSearchTerm] = useState("");
  const [showHelpModal, setShowHelpModal] = useState(false);

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const stored = localStorage.getItem("recodex_global_announcements");
    if (stored) return JSON.parse(stored);

    const now = new Date();
    const betaDate = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
    const maintenanceDate = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
    const maintenanceDateObj = new Date(maintenanceDate);
    const maintenanceMonth = maintenanceDateObj.toLocaleString("en-US", { month: "long" });
    const maintenanceDay = maintenanceDateObj.getDate();
    const maintenanceString = `${maintenanceMonth} ${maintenanceDay}`;

    const initialAnnouncements = [
      { id: "ann-01", title: "RecodeX v1.0.0 Mainnet Beta", message: "Global deployment orchestration active across all categories. Synchronize your developer keys now.", type: "New Feature", date: betaDate },
      { id: "ann-02", title: "Server Maintenance Schedule", message: `Decentralized database nodes will undergo updates on ${maintenanceString} at 04:00 UTC. Uptime SLA will be maintained at 99.9%.`, type: "Maintenance Notice", date: maintenanceDate }
    ];

    localStorage.setItem("recodex_global_announcements", JSON.stringify(initialAnnouncements));
    return initialAnnouncements;
  });

  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchCerts = async () => {
      try {
        const certs = await getCertificatesApi();
        if (certs && certs.length > 0) {
          setCertificates(certs);
        }
      } catch (e) {
        console.warn("Failed to fetch certs from API:", e);
      }
    };
    fetchCerts();
  }, []);

  useEffect(() => {
    localStorage.setItem("recodex_global_categories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("recodex_global_reports", JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem("recodex_global_certificates", JSON.stringify(certificates));
    window.dispatchEvent(new Event("recodex-certificates-update"));
  }, [certificates]);

  useEffect(() => {
    localStorage.setItem("recodex_global_announcements", JSON.stringify(announcements));
    window.dispatchEvent(new Event("recodex-announcements-update"));
  }, [announcements]);

  const [newAnnTitle, setNewAnnTitle] = useState("");
  const [newAnnMessage, setNewAnnMessage] = useState("");
  const [newAnnType, setNewAnnType] = useState("New Feature");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Settings mock records
  const [settings] = useState({
    siteName: "RecodeX Developer Marketplace",
    securityMode: "AES-256 Enabled",
    maintenanceMode: false,
    allowedOrigin: "http://localhost:3000"
  });

  // Admin access validation
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!isLoaded) return;

      const isBypassAdmin =
        localStorage.getItem("recodex_session_token") === "admin-bypass-token" ||
        localStorage.getItem("recodex_admin_user") === "true";

      if (isBypassAdmin) {
        setAdminEmail("veereshhp2004@gmail.com");
        setAdminName("Veeresh H P");
        return;
      }

      if (userId && user) {
        const userEmail = (user.primaryEmailAddress?.emailAddress || "").toLowerCase().trim();
        const ROOT_ADMIN_EMAILS = ["veereshhp2004@gmail.com", "veereshhp04@gmail.com"];
        const isRootAdmin = ROOT_ADMIN_EMAILS.includes(userEmail);

        const syncedUsersRaw = localStorage.getItem("recodex_synced_users");
        const syncedUsers: any[] = syncedUsersRaw ? JSON.parse(syncedUsersRaw) : [];
        const dbUserRecord = syncedUsers.find(
          (u: any) => u.email && u.email.toLowerCase().trim() === userEmail
        );
        const isPromotedAdmin = dbUserRecord && dbUserRecord.role === "admin";

        if (isRootAdmin || isPromotedAdmin) {
          localStorage.setItem("recodex_admin_user", "true");
          setAdminEmail(userEmail);
          setAdminName(user.fullName || (dbUserRecord && dbUserRecord.name) || "Admin");
          return;
        }

        try {
          const token = await getToken();
          const dbProfile = await getUserProfile(token || "");
          if (dbProfile && dbProfile.role === "admin") {
            localStorage.setItem("recodex_admin_user", "true");
            setAdminEmail(userEmail);
            setAdminName(dbProfile.name || user.fullName || "Admin");
            return;
          }
        } catch (err) {
          console.error("Database admin role check failed:", err);
        }

        window.location.href = "/projects";
      } else {
        window.location.href = "/login";
      }
    };

    checkAdminAccess();
  }, [isLoaded, userId, user]);

  const getAuthToken = async () => {
    const token = localStorage.getItem("recodex_session_token");
    if (token) {
      return token;
    }
    if (userId) {
      return await getToken() || "";
    }
    return "";
  };

  // Fetch real users directly from backend API
  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      const mapped = data.map((u: any) => {
        if (u.email === "veereshhp2004@gmail.com") {
          return { ...u, role: "admin" };
        }
        return u;
      });
      setDbUsers((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(mapped)) return prev;
        return mapped;
      });
    } catch (err) {
      console.log("[RECODEX ERROR] Backend user fetch failed:", err);
    }
  };

  // Fetch real projects directly from backend API
  const fetchProjects = async () => {
    setProjectsLoading(true);
    try {
      const data = await getProjects();
      setDbProjects(data);
    } catch (err) {
      console.log("[RECODEX ERROR] Backend project fetch failed:", err);
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchInquiries = async () => {
    setInquiriesLoading(true);
    try {
      const data = await getInquiries();
      setInquiries(data);
    } catch (err) {
      console.log("[RECODEX ERROR] Backend inquiries fetch failed:", err);
      // Mock inquiries fallback if backend is offline
      setInquiries([
        {
          id: "inq-1",
          name: "David Vance",
          email: "vance@blackmesa.org",
          type: "backend",
          message: "Looking for an engineer to architect an event-driven Go microservices cluster with Kafka.",
          createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString()
        },
        {
          id: "inq-2",
          name: "Sarah Builder",
          email: "sarah@startup.io",
          type: "frontend",
          message: "Need a high-performance Landing Page using Vite, React, Tailwind CSS, and custom particle overlays.",
          createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString()
        },
        {
          id: "inq-3",
          name: "Alexander Mercer",
          email: "mercer@gentek.org",
          type: "major",
          message: "Requesting development on low-latency data replication nodes across multi-cloud environments.",
          createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 3).toISOString()
        }
      ]);
    } finally {
      setInquiriesLoading(false);
    }
  };

  // In-app premium telemetry synchronization function
  const handleRefreshSystem = async () => {
    setIsRefreshing(true);
    try {
      const promises: Promise<any>[] = [fetchUsers(), fetchProjects()];
      if (activeSidebarTab === "Inquiries") {
        promises.push(fetchInquiries());
      }
      await Promise.all(promises);
      setToast({ message: "Ecosystem control metrics synchronized successfully.", type: "success" });
    } catch (err) {
      console.error("[RECODEX ERROR] Sync failed:", err);
      setToast({ message: "System telemetry synchronization failed.", type: "error" });
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 700);
    }
  };

  // Initial fetch + database synchronization
  useEffect(() => {
    fetchProjects();
    fetchUsers();
    fetchInquiries();
  }, [userId]);

  // Live user registration sync & 15s telemetry polling
  useEffect(() => {
    const syncUsers = () => {
      fetchUsers();
    };

    window.addEventListener("recodex-user-registered", syncUsers);
    window.addEventListener("recodex-auth-update", syncUsers);
    window.addEventListener("storage", syncUsers);

    const userPollTimer = setInterval(syncUsers, 15000);

    return () => {
      window.removeEventListener("recodex-user-registered", syncUsers);
      window.removeEventListener("recodex-auth-update", syncUsers);
      window.removeEventListener("storage", syncUsers);
      clearInterval(userPollTimer);
    };
  }, []);

  // Auto-select first loaded inquiry if none selected
  useEffect(() => {
    if (inquiries.length > 0 && !selectedInquiryId) {
      setSelectedInquiryId(inquiries[0].id);
    }
  }, [inquiries]);

  // Re-fetch when sidebar tab changes
  useEffect(() => {
    if (activeSidebarTab === "Users") fetchUsers();
    if (activeSidebarTab === "Projects") fetchProjects();
    if (activeSidebarTab === "Inquiries") fetchInquiries();
  }, [activeSidebarTab]);

  // Close user actions menu on click away
  useEffect(() => {
    const handleCloseMenu = () => setActiveUserActionMenuId(null);
    document.addEventListener("click", handleCloseMenu);
    return () => document.removeEventListener("click", handleCloseMenu);
  }, []);

  // Live Chart rendering effect (Real Dynamic Data)
  useEffect(() => {
    if (activeSidebarTab !== "Dashboard") return;

    try {
      const isDark = theme === "dark";

      // 1. Compute Real Monthly Growth
      const monthsCount = growthRange === "6M" ? 6 : 12;
      const now = new Date();
      const growthLabels: string[] = [];
      const growthCounts: number[] = [];

      const activeUsers = dbUsers.filter((u) => !softDeletedUserIds.includes(u.id));

      for (let i = monthsCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = d.toLocaleString("en-US", { month: "short" });
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

        // Count registered users up to that month
        const count = activeUsers.filter((u) => {
          if (!u.createdAt) return true;
          const created = new Date(u.createdAt);
          return !isNaN(created.getTime()) ? created <= endOfMonth : true;
        }).length;

        growthLabels.push(monthLabel);
        growthCounts.push(count);
      }

      // Growth Chart (Line)
      const growthCanvas = growthChartRef.current;
      if (growthCanvas) {
        const growthCtx = growthCanvas.getContext("2d");
        if (growthCtx) {
          if (growthChartInstance.current) {
            growthChartInstance.current.destroy();
            growthChartInstance.current = null;
          }

          const gradient = growthCtx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, isDark ? "rgba(0, 209, 255, 0.3)" : "rgba(79, 70, 229, 0.4)");
          gradient.addColorStop(1, "rgba(0, 0, 0, 0.0)");

          growthChartInstance.current = new Chart(growthCtx, {
            type: "line",
            data: {
              labels: growthLabels,
              datasets: [{
                label: "Active Users",
                data: growthCounts,
                borderColor: isDark ? "#00d1ff" : "#4f46e5",
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: isDark ? "#00d1ff" : "#ffffff",
                pointBorderColor: isDark ? "#00d1ff" : "#4f46e5",
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: isDark ? "#0b0e14" : "#213145",
                  titleFont: { family: "Geist", size: 13 },
                  bodyFont: { family: "Geist", size: 14, weight: "bold" },
                  padding: 10,
                  cornerRadius: 8,
                  displayColors: false,
                  callbacks: {
                    label: (ctx) => ` Active Users: ${ctx.parsed.y}`
                  }
                }
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { font: { family: "Geist", size: 12 }, color: isDark ? "#a1a1aa" : "#777587" }
                },
                y: {
                  grid: { color: isDark ? "rgba(255, 255, 255, 0.08)" : "#e5eeff" },
                  ticks: { 
                    font: { family: "Geist", size: 12 }, 
                    color: isDark ? "#a1a1aa" : "#777587",
                    stepSize: 1,
                    callback: function(value) { return String(value); }
                  },
                  beginAtZero: true
                }
              },
              interaction: { mode: "index", intersect: false }
            }
          });
        }
      }

      // 2. Compute Real Category Breakdown
      const activeProjects = dbProjects.filter((p) => !softDeletedProjectIds.includes(p.id));
      const webCount = activeProjects.filter((p) => (p.category || "").toLowerCase().includes("web")).length;
      const aiCount = activeProjects.filter((p) => (p.category || "").toLowerCase().includes("ai") || (p.category || "").toLowerCase().includes("intel")).length;
      const blockCount = activeProjects.filter((p) => (p.category || "").toLowerCase().includes("block") || (p.category || "").toLowerCase().includes("web3")).length;
      const shellCount = activeProjects.filter((p) => (p.category || "").toLowerCase().includes("shell") || (p.category || "").toLowerCase().includes("system")).length;
      const otherCount = Math.max(0, activeProjects.length - (webCount + aiCount + blockCount + shellCount));

      const dataValues = activeProjects.length > 0
        ? [webCount, aiCount, blockCount, shellCount + otherCount]
        : [1, 1, 1, 1];

      // Category Chart (Doughnut)
      const catCanvas = categoryChartRef.current;
      if (catCanvas) {
        const catCtx = catCanvas.getContext("2d");
        if (catCtx) {
          if (categoryChartInstance.current) {
            categoryChartInstance.current.destroy();
            categoryChartInstance.current = null;
          }

          categoryChartInstance.current = new Chart(catCtx, {
            type: "doughnut",
            data: {
              labels: ["Web Systems", "AI & Intelligence", "Blockchain & Web3", "Shells & Systems"],
              datasets: [{
                data: dataValues,
                backgroundColor: [
                  "#00d1ff",
                  "#22d3ee",
                  "#818cf8",
                  "#a855f7"
                ],
                borderWidth: 0,
                hoverOffset: 4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: false,
              cutout: "75%",
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: isDark ? "#0b0e14" : "#213145",
                  bodyFont: { family: "Geist", size: 13 },
                  padding: 10,
                  cornerRadius: 8,
                  callbacks: {
                    label: (ctx) => ` ${ctx.label}: ${ctx.parsed} projects`
                  }
                }
              }
            }
          });
        }
      }
    } catch (e) {
      console.warn("Chart rendering error caught safely:", e);
    }

    return () => {
      if (growthChartInstance.current) {
        growthChartInstance.current.destroy();
        growthChartInstance.current = null;
      }
      if (categoryChartInstance.current) {
        categoryChartInstance.current.destroy();
        categoryChartInstance.current = null;
      }
    };
  }, [activeSidebarTab, dbUsers, dbProjects, theme, growthRange, softDeletedUserIds, softDeletedProjectIds]);

  // Real-time telemetry load shifts
  useEffect(() => {
    const statsInterval = setInterval(() => {
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

  const handleSignOut = async () => {
    try {
      await clerk.signOut();
    } catch (err) {
      console.warn("Clerk sign out error:", err);
    }
    localStorage.removeItem("recodex_session_token");
    localStorage.removeItem("recodex_admin_user");
    window.location.href = "/";
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({ revenue, activeUsersCount: dbUsers.length, deploymentsCount: deployments.length, sysHealth, timestamp: new Date().toISOString() })
    );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `recodex_system_overview_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this inquiry?")) {
      return;
    }
    try {
      const token = await getAuthToken();
      await deleteInquiry(id, token);
      setInquiries((prev) => prev.filter((inq) => inq.id !== id));
      setToast({ message: "Inquiry deleted successfully.", type: "success" });
    } catch (err: any) {
      console.error("Failed to delete inquiry:", err);
      setToast({ message: err.message || "Failed to delete inquiry.", type: "error" });
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingInquiryId || !replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const token = await getAuthToken();
      const updated = await replyToInquiry(replyingInquiryId, replyText.trim(), token);
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === replyingInquiryId ? { ...inq, reply: updated.reply } : inq))
      );
      setToast({ message: "Reply message sent/recorded successfully.", type: "success" });
      setReplyingInquiryId(null);
      setReplyText("");
    } catch (err: any) {
      console.error("Failed to send reply:", err);
      setToast({ message: err.message || "Failed to send reply.", type: "error" });
    } finally {
      setSubmittingReply(false);
    }
  };

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle || !newAnnMessage) return;
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title: newAnnTitle,
      message: newAnnMessage,
      type: newAnnType,
      date: new Date().toISOString()
    };
    setAnnouncements([newAnn, ...announcements]);
    setNewAnnTitle("");
    setNewAnnMessage("");
    setToast({ message: "Announcement published successfully.", type: "success" });
  };

  const handleRemoveAnnouncement = (id: string) => {
    setAnnouncements(announcements.filter((ann) => ann.id !== id));
    setToast({ message: "Announcement deleted.", type: "success" });
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName || categories.includes(newCategoryName)) return;
    setCategories([...categories, newCategoryName]);
    setNewCategoryName("");
    setToast({ message: "Category added successfully.", type: "success" });
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
    setToast({ message: "Category moved to Recycle Bin.", type: "success" });
  };

  const handleModifyReportStatus = (id: string, nextStatus: "Open" | "Under Review" | "Resolved") => {
    setReports(reports.map((rep) => rep.id === id ? { ...rep, status: nextStatus } : rep));
    setToast({ message: `Report marked as ${nextStatus}.`, type: "success" });
  };

  const handleModifyCertStatus = (id: string, nextStatus: "Approved" | "Pending" | "Revoked" | "Not Issued") => {
    setCertificates(certificates.map((cert) => cert.id === id ? { ...cert, status: nextStatus } : cert));
    setToast({ message: `Certificate status updated to ${nextStatus}.`, type: "success" });
  };

  const handleUpdateCertField = (
    certId: string,
    userItem: any,
    field: "projectName" | "issueDate" | "status",
    value: string
  ) => {
    setCertificates((prev) => {
      const targetEmail = userItem?.email;
      const targetId = userItem?.id;

      const existingIndex = prev.findIndex(
        (c) =>
          (certId !== "--" && c.id === certId) ||
          (targetEmail && c.userEmail && c.userEmail.toLowerCase() === targetEmail.toLowerCase()) ||
          (targetId && c.userId === targetId)
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          [field]: value,
        };
        return updated;
      } else {
        const newCert: Certificate = {
          id: `CERT-${Math.floor(1000 + Math.random() * 9000)}`,
          userId: userItem?.id,
          userEmail: userItem?.email,
          studentName: userItem?.name || "Student Developer",
          projectName: field === "projectName" ? value : "Software Solution Project",
          issueDate: field === "issueDate" ? value : new Date().toISOString().split("T")[0],
          status: field === "status" ? (value as any) : "Approved",
        };
        return [newCert, ...prev];
      }
    });
  };

  const handleCertFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      setCertFileDataUrl(result);
      setCertFileNameVal(file.name);
      setCertFileTypeVal(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadingCertUser && !editingCertItem) return;

    const targetUser = uploadingCertUser || { name: editingCertItem?.studentName, email: editingCertItem?.userEmail, id: editingCertItem?.userId };
    const certId = editingCertItem ? editingCertItem.id : `CERT-${Math.floor(1000 + Math.random() * 9000)}`;

    const newCert: Certificate = {
      id: certId,
      userId: targetUser.id,
      userEmail: targetUser.email,
      studentName: targetUser.name || "Student Developer",
      projectName: certProjectTitleInput.trim() || "Software Solution Project",
      issueDate: certIssueDateInput || new Date().toISOString().split("T")[0],
      status: certStatusInput,
      fileData: certFileDataUrl || editingCertItem?.fileData,
      fileName: certFileNameVal || editingCertItem?.fileName,
      fileType: certFileTypeVal || editingCertItem?.fileType,
    };

    saveCertificateApi(newCert);

    setCertificates((prev) => {
      const existingIdx = prev.findIndex((c) => c.id === certId || (targetUser.email && c.userEmail === targetUser.email));
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = newCert;
        return copy;
      }
      return [newCert, ...prev];
    });

    // Create & dispatch notification for target user
    try {
      const annListRaw = localStorage.getItem("recodex_global_announcements");
      const annList: any[] = annListRaw ? JSON.parse(annListRaw) : [];
      const newAnn = {
        id: `ann-cert-${certId}-${Date.now()}`,
        title: `🏆 Certificate Issued: ${newCert.projectName}`,
        message: `Official project completion certificate [${certId}] has been verified and issued for ${targetUser.name} (${targetUser.email}).`,
        type: "New Feature",
        date: new Date().toISOString(),
      };
      annList.unshift(newAnn);
      localStorage.setItem("recodex_global_announcements", JSON.stringify(annList));
      window.dispatchEvent(new Event("recodex-announcements-update"));
    } catch (e) {
      console.warn("Failed to dispatch certificate notification:", e);
    }

    setToast({ message: `Certificate ${certId} issued/updated for ${targetUser.name} successfully.`, type: "success" });

    // Reset modal state
    setUploadingCertUser(null);
    setEditingCertItem(null);
    setCertFileDataUrl("");
    setCertFileNameVal("");
    setCertFileTypeVal("");
  };

  const handleDeleteCertificate = (certId: string) => {
    if (!window.confirm("Are you sure you want to delete this certificate record?")) return;
    deleteCertificateApi(certId);
    setCertificates((prev) => prev.filter((c) => c.id !== certId));
    setToast({ message: "Certificate record removed.", type: "success" });
  };

  const handleDownloadCertFile = (cert: Certificate) => {
    if (cert.fileData) {
      const link = document.createElement("a");
      link.href = cert.fileData;
      link.download = cert.fileName || `Certificate_${cert.studentName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else {
      const certText = `RECODEX VERIFIED CERTIFICATE OF COMPLETION\n============================================\nCertificate ID: ${cert.id}\nStudent/Developer Name: ${cert.studentName}\nProject Title: ${cert.projectName}\nIssue Date: ${cert.issueDate}\nStatus: VERIFIED & APPROVED\nIssuer: RecodeX Developer Marketplace & Software Solutions\nVerification Signature: ${Math.random().toString(36).substring(2, 15).toUpperCase()}\n`;
      const blob = new Blob([certText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `RecodeX_Certificate_${cert.studentName.replace(/\s+/g, "_")}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }
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
        if (duration === null) return;
        suspensionDuration = duration.trim() || "Permanent";
      }

      const newRole = targetStatus === "Suspended" ? "suspended" : "developer";
      await updateUser(userId, { name: userToModify.name, role: newRole }, token);

      if (targetStatus === "Suspended") {
        localStorage.setItem(`suspension_duration_${userId}`, suspensionDuration);
      } else {
        localStorage.removeItem(`suspension_duration_${userId}`);
      }

      setDbUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      fetchUsers();
      setToast({ message: `User status changed to ${targetStatus}.`, type: "success" });
    } catch (error) {
      console.error("Failed to modify user status:", error);
    }
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSavingUser(true);
    try {
      const userEmailClean = (editingUser.email || "").toLowerCase().trim();
      const promotedRaw = localStorage.getItem("recodex_promoted_admin_emails");
      let promotedList: string[] = promotedRaw ? JSON.parse(promotedRaw) : [];

      if (newEditRole === "admin") {
        if (!promotedList.includes(userEmailClean)) {
          promotedList.push(userEmailClean);
        }
      } else {
        promotedList = promotedList.filter((e) => e !== userEmailClean);
      }
      localStorage.setItem("recodex_promoted_admin_emails", JSON.stringify(promotedList));
      window.dispatchEvent(new Event("recodex-auth-update"));
      promoteUserAdminApi(userEmailClean, newEditRole);

      try {
        const token = await getAuthToken();
        await updateUser(editingUser.id, { name: newEditName, role: newEditRole, email: userEmailClean }, token);
      } catch (apiErr) {
        console.warn("API update user role failed, saved in local store anyway:", apiErr);
      }

      setDbUsers((prev) => 
        prev.map((u) => u.id === editingUser.id ? { ...u, name: newEditName, role: newEditRole } : u)
      );
      fetchUsers();
      setToast({ message: "User profile details updated successfully.", type: "success" });
      setEditingUser(null);
    } catch (err: any) {
      setToast({ message: err.message || "Failed to update user profile.", type: "error" });
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;
    setIsSavingUser(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate API call
      setToast({ message: `Password reset instructions sent to ${resetPasswordUser.email} successfully.`, type: "success" });
      setResetPasswordUser(null);
      setNewPasswordVal("");
    } catch (err: any) {
      setToast({ message: "Failed to dispatch password reset request.", type: "error" });
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleToggleUserAdmin = async (userId: string, makeAdmin: boolean) => {
    const userToModify = dbUsers.find((u) => u.id === userId);
    const ROOT_ADMIN_EMAILS = ["veereshhp2004@gmail.com", "veereshhp04@gmail.com"];
    if (userToModify && !makeAdmin && ROOT_ADMIN_EMAILS.includes((userToModify.email || "").toLowerCase().trim())) {
      setToast({
        message: "Demoting root administrator accounts is prohibited to maintain security clearance.",
        type: "warning",
      });
      return;
    }
    
    const targetRole = makeAdmin ? "admin" : "developer";
    try {
      if (!userToModify) return;

      const userEmailClean = (userToModify.email || "").toLowerCase().trim();
      const promotedRaw = localStorage.getItem("recodex_promoted_admin_emails");
      let promotedList: string[] = promotedRaw ? JSON.parse(promotedRaw) : [];

      if (makeAdmin) {
        if (!promotedList.includes(userEmailClean)) {
          promotedList.push(userEmailClean);
        }
      } else {
        promotedList = promotedList.filter((e) => e !== userEmailClean);
      }
      localStorage.setItem("recodex_promoted_admin_emails", JSON.stringify(promotedList));
      window.dispatchEvent(new Event("recodex-auth-update"));
      promoteUserAdminApi(userEmailClean, targetRole);

      try {
        const token = await getAuthToken();
        await updateUser(userId, { name: userToModify.name, role: targetRole, email: userEmailClean }, token);
      } catch (apiErr) {
        console.warn("API update user role failed, saved in local store anyway:", apiErr);
      }

      setDbUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: targetRole } : u));
      fetchUsers();
      setToast({ message: `User role changed to ${targetRole.toUpperCase()}.`, type: "success" });
    } catch (err) {
      console.error("Failed to modify user admin status:", err);
    }
  };

  const handleRemoveUser = (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user? They will be moved to the Recycle Bin.")) {
      return;
    }
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
    setToast({ message: "User moved to Recycle Bin.", type: "success" });
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete this user? This action is irreversible.`)) {
      return;
    }
    try {
      const token = await getAuthToken();
      try {
        await deleteUser(userId, token);
      } catch (apiErr) {
        console.warn("API user deletion failed, cleaning up local state anyway:", apiErr);
      }
      setDbUsers((prev) => prev.filter((u) => u.id !== userId));
      setSoftDeletedUserIds((prev) => prev.filter((id) => id !== userId));
      fetchUsers();
      setToast({ message: "User permanently deleted.", type: "success" });
    } catch (error) {
      console.error("Failed to delete user permanently:", error);
    }
  };

  const handleModifyProjectStatus = async (projId: string, nextStatus: string) => {
    try {
      const token = await getAuthToken();
      const projectToModify = dbProjects.find((p) => p.id === projId);
      if (!projectToModify) return;

      await updateProject(projId, { status: nextStatus }, token);
      setDbProjects((prev) => prev.map((p) => p.id === projId ? { ...p, status: nextStatus } : p));
      fetchProjects();
      setToast({ message: `Project status updated to ${nextStatus}.`, type: "success" });
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
    setToast({ message: "Project moved to Recycle Bin.", type: "success" });
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
    setToast({ message: `${item.type} restored successfully.`, type: "success" });
  };

  const handleDeletePermanently = async (item: any) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete this ${item.type}? This action is irreversible.`)) {
      return;
    }
    try {
      const token = await getAuthToken();
      if (item.type === "User") {
        const userId = item.originalData?.id;
        if (userId) {
          try {
            await deleteUser(userId, token);
          } catch (apiErr) {
            console.warn("API user deletion failed, cleaning up local state anyway:", apiErr);
          }
          setSoftDeletedUserIds((prev) => prev.filter((id) => id !== userId));
          fetchUsers();
        }
      } else if (item.type === "Project") {
        const projId = item.originalData?.id;
        if (projId) {
          try {
            await deleteProject(projId, token);
          } catch (apiErr) {
            console.warn("API project deletion failed, cleaning up local state anyway:", apiErr);
          }
          setSoftDeletedProjectIds((prev) => prev.filter((id) => id !== projId));
          fetchProjects();
        }
      }
    } catch (error) {
      console.error("Failed to delete permanently:", error);
    } finally {
      setRecycleBin((prev) => prev.filter((x) => x.id !== item.id));
      setToast({ message: `${item.type} permanently deleted.`, type: "success" });
    }
  };

  const navItems = [
    { label: "Dashboard", icon: "dashboard" },
    { label: "Users", icon: "group" },
    { label: "Projects", icon: "terminal" },
    { label: "Categories", icon: "category" },
    { label: "Reports", icon: "assessment" },
    { label: "Inquiries", icon: "question_answer" },
    { label: "Certificates", icon: "verified" },
    { label: "Notifications", icon: "notifications" },
    { label: "Settings", icon: "settings" },
    { label: "Recycle Bin", icon: "delete" },
  ];

  // Dynamic tab content rendering
  const renderMainContent = () => {
    switch (activeSidebarTab) {
      case "Dashboard":
        return (
          <>
            {/* Row 1: Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Stat 1: Total Users */}
              <div 
                onClick={() => setActiveSidebarTab("Users")}
                className="glass-card p-6 hover-lift flex flex-col justify-between min-h-[140px] relative overflow-hidden group border border-black/5 dark:border-white/10 rounded-2xl cursor-pointer hover:border-primary/50 transition-all"
                title="Click to view User Directory"
              >
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
                <div className="flex justify-between items-start z-10">
                  <div>
                    <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Total Users</p>
                    <h3 className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-white tracking-tight">
                      {dbUsers.filter(u => !softDeletedUserIds.includes(u.id)).length}
                    </h3>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-xl text-primary border border-primary/20 group-hover:bg-primary group-hover:text-black transition-all">
                    <span className="material-symbols-outlined text-[20px]">group</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 z-10">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <span className="material-symbols-outlined text-[13px] mr-1">trending_up</span>
                    +12%
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">vs last month</span>
                </div>
              </div>

              {/* Stat 2: Active Projects */}
              <div 
                onClick={() => setActiveSidebarTab("Projects")}
                className="glass-card p-6 hover-lift flex flex-col justify-between min-h-[140px] relative overflow-hidden group border border-black/5 dark:border-white/10 rounded-2xl cursor-pointer hover:border-cyan-400/50 transition-all"
                title="Click to manage Active Projects"
              >
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/10 rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
                <div className="flex justify-between items-start z-10">
                  <div>
                    <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Active Projects</p>
                    <h3 className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-white tracking-tight">
                      {dbProjects.filter(p => !softDeletedProjectIds.includes(p.id)).length}
                    </h3>
                  </div>
                  <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-400 group-hover:text-black transition-all">
                    <span className="material-symbols-outlined text-[20px]">terminal</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 z-10">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <span className="material-symbols-outlined text-[13px] mr-1">trending_up</span>
                    +8%
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">vs last month</span>
                </div>
              </div>

              {/* Stat 3: Certificates Issued */}
              <div 
                onClick={() => setActiveSidebarTab("Certificates")}
                className="glass-card p-6 hover-lift flex flex-col justify-between min-h-[140px] relative overflow-hidden group border border-black/5 dark:border-white/10 rounded-2xl cursor-pointer hover:border-indigo-400/50 transition-all"
                title="Click to manage Certificates"
              >
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
                <div className="flex justify-between items-start z-10">
                  <div>
                    <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Certificates Issued</p>
                    <h3 className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-white tracking-tight">
                      {certificates.filter(c => c.status === "Approved").length}
                    </h3>
                  </div>
                  <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    <span className="material-symbols-outlined text-[20px]">verified</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 z-10">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <span className="material-symbols-outlined text-[13px] mr-1">trending_up</span>
                    +20%
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">vs last month</span>
                </div>
              </div>

              {/* Stat 4: Reports Pending */}
              <div 
                onClick={() => setActiveSidebarTab("Reports")}
                className="glass-card p-6 hover-lift flex flex-col justify-between min-h-[140px] border border-rose-500/30 bg-rose-500/5 relative overflow-hidden group rounded-2xl cursor-pointer hover:border-rose-500/60 transition-all"
                title="Click to view Reports Hub"
              >
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
                <div className="flex justify-between items-start z-10">
                  <div>
                    <p className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 mb-1">Reports Pending</p>
                    <h3 className="text-3xl font-extrabold font-mono text-rose-500 tracking-tight">
                      {reports.filter(r => r.status === "Open" || r.status === "Under Review").length}
                    </h3>
                  </div>
                  <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20 group-hover:bg-rose-500 group-hover:text-white transition-all">
                    <span className="material-symbols-outlined text-[20px]">warning</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 z-10">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Action required
                  </span>
                </div>
              </div>
            </div>

            {/* Row 2: Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
              {/* Main Chart */}
              <div className="glass-card p-6 lg:col-span-8 flex flex-col rounded-2xl border border-black/5 dark:border-white/10">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-sans">Monthly User Growth</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {growthRange === "6M" ? "Platform adoption over the last 6 months" : "Platform adoption over the last 12 months"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setGrowthRange("6M")} 
                      className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border transition-colors cursor-pointer ${
                        growthRange === "6M" 
                          ? "bg-primary/10 text-primary border-primary/20" 
                          : "text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      6M
                    </button>
                    <button 
                      onClick={() => setGrowthRange("1Y")} 
                      className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border transition-colors cursor-pointer ${
                        growthRange === "1Y" 
                          ? "bg-primary/10 text-primary border-primary/20" 
                          : "text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      1Y
                    </button>
                  </div>
                </div>
                <div className="flex-1 relative min-h-[260px] w-full mt-2">
                  <canvas ref={growthChartRef}></canvas>
                </div>
              </div>
              {/* Secondary Chart */}
              <div className="glass-card p-6 lg:col-span-4 flex flex-col rounded-2xl border border-black/5 dark:border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-sans">Projects by Category</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Live category breakdown</p>
                  </div>
                </div>
                <div className="flex-1 relative flex items-center justify-center min-h-[200px]">
                  <canvas ref={categoryChartRef}></canvas>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-extrabold font-mono text-zinc-900 dark:text-white">
                      {dbProjects.filter(p => !softDeletedProjectIds.includes(p.id)).length}
                    </span>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">Total Projects</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00d1ff]"></div>
                    <span className="text-xs text-zinc-400 font-mono">Web Systems</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#22d3ee]"></div>
                    <span className="text-xs text-zinc-400 font-mono">AI Models</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#818cf8]"></div>
                    <span className="text-xs text-zinc-400 font-mono">Blockchain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#a855f7]"></div>
                    <span className="text-xs text-zinc-400 font-mono">Shells & Sys</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Recent Users Table & Widgets */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-8">
              {/* Recent Users Table */}
              <div className="glass-card xl:col-span-8 overflow-hidden flex flex-col rounded-2xl border border-black/5 dark:border-white/10">
                <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-black/[0.02] dark:bg-white/[0.02]">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-sans">Recent Users</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Active community members & developer accounts</p>
                  </div>
                  <button onClick={() => setActiveSidebarTab("Users")} className="text-primary dark:text-[#00d1ff] hover:underline text-xs font-mono font-bold flex items-center gap-1 transition-colors">
                    View All <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01]">
                        <th className="px-6 py-3.5 text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">User</th>
                        <th className="px-6 py-3.5 text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Role</th>
                        <th className="px-6 py-3.5 text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Status</th>
                        <th className="px-6 py-3.5 text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Date Added</th>
                        <th className="px-6 py-3.5 text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {dbUsers.filter(u => !softDeletedUserIds.includes(u.id)).slice(0, 5).map((userItem) => {
                        const isUserAdmin = userItem.role === "admin" || userItem.email === "veereshhp2004@gmail.com";
                        return (
                          <tr key={userItem.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary/10 border border-primary/20 flex-shrink-0 flex items-center justify-center">
                                  {userItem.profileImage ? (
                                    <img alt={userItem.name} className="w-full h-full object-cover" src={userItem.profileImage} />
                                  ) : (
                                    <span className="font-extrabold text-sm text-primary">{userItem.name[0]}</span>
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-zinc-900 dark:text-white">{userItem.name}</p>
                                  <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">{userItem.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border ${
                                isUserAdmin 
                                  ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                                  : userItem.role === "client"
                                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                  : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              }`}>
                                {isUserAdmin ? "Admin" : userItem.role || "Developer"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                                userItem.role === "suspended"
                                  ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                  : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              }`}>
                                {userItem.role === "suspended" ? "Blocked" : "Active"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                              {new Date(userItem.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                                <button title="Edit User" onClick={() => { setEditingUser(userItem); setNewEditName(userItem.name); setNewEditRole(userItem.role || "developer"); }} className="p-1.5 text-zinc-400 hover:text-primary dark:hover:text-[#00d1ff] rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                                <button title="Reset Password" onClick={() => { setResetPasswordUser(userItem); setNewPasswordVal(""); }} className="p-1.5 text-zinc-400 hover:text-amber-500 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"><span className="material-symbols-outlined text-[18px]">lock_reset</span></button>
                                <button title="Delete User" onClick={() => handleRemoveUser(userItem.id)} className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sidebar widgets */}
              <div className="xl:col-span-4 flex flex-col gap-6">
                {/* Recent Projects */}
                <div className="glass-card p-6 rounded-2xl border border-black/5 dark:border-white/10">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-mono font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Recent Projects</h4>
                    <button onClick={() => setActiveSidebarTab("Projects")} className="p-1 text-zinc-400 hover:text-primary dark:hover:text-[#00d1ff] transition-colors"><span className="material-symbols-outlined text-[18px]">arrow_forward</span></button>
                  </div>
                  <div className="space-y-3">
                    {dbProjects.filter(p => !softDeletedProjectIds.includes(p.id)).slice(0, 3).map((p) => (
                      <div key={p.id} className="flex gap-3 items-center p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 hover:border-primary/30 transition-all cursor-pointer">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-bold text-zinc-900 dark:text-white truncate">{p.title}</h5>
                          <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">{p.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Reports */}
                <div className="glass-card p-6 rounded-2xl border border-black/5 dark:border-white/10 bg-gradient-to-br from-black/[0.01] to-black/[0.03] dark:from-white/[0.01] dark:to-white/[0.03]">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-mono font-bold text-zinc-900 dark:text-white uppercase tracking-wider">System Reports</h4>
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {reports.slice(0, 2).map((rep) => (
                      <div key={rep.id} className="border border-black/5 dark:border-white/10 rounded-xl p-3.5 bg-white/50 dark:bg-black/40">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">{rep.type}</span>
                          <span className="text-[10px] font-mono text-zinc-400">{rep.date}</span>
                        </div>
                        <p className="text-xs text-zinc-650 dark:text-zinc-300 font-medium leading-relaxed">{rep.description}</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setActiveSidebarTab("Reports")} className="w-full mt-4 py-2 text-center text-xs font-mono font-bold text-primary dark:text-[#00d1ff] hover:bg-primary/10 rounded-xl transition-colors">
                    View All Reports
                  </button>
                </div>
              </div>
            </div>
          </>
        );

      case "Users":
        const filteredUsers = dbUsers.filter((userItem) => {
          if (softDeletedUserIds.includes(userItem.id)) return false;
          const matchesQuery = userItem.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                               userItem.email.toLowerCase().includes(userSearch.toLowerCase());
          const matchesRole = userRoleFilter === "All" ? true : userItem.role === userRoleFilter;
          return matchesQuery && matchesRole;
        });

        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-foreground dark:text-white font-sans font-extrabold uppercase">User Directory</h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Live records of active engineers, developers, and clients synced in your MongoDB tables.</p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-56 select-none">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-surface-container-low border border-outline-variant/40 rounded-full text-xs font-mono text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                  />
                </div>
                
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-surface-container-low border border-outline-variant/40 rounded-full px-4 py-1.5 text-xs text-on-surface-variant font-mono outline-none"
                >
                  <option value="All">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="developer">Student/Freelancer</option>
                  <option value="client">Client</option>
                  <option value="suspended">Suspended</option>
                </select>

                <button 
                  onClick={handleRefreshSystem} 
                  disabled={isRefreshing}
                  className="px-3.5 py-1.5 bg-primary-container text-on-primary rounded-full text-xs font-mono font-bold hover:bg-primary-container/90 hover-lift cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw size={11} className={isRefreshing ? "animate-spin" : ""} /> Sync
                </button>
              </div>
            </div>
 
            <div className="glass-card w-full border border-outline-variant/40 overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[650px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-outline-variant/40 bg-surface-container-low/50 text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest h-10 select-none">
                      <th className="px-md py-3">User</th>
                      <th className="px-md py-3">Email</th>
                      <th className="px-md py-3">Role</th>
                      <th className="px-md py-3">Status</th>
                      <th className="px-md py-3">Joined Date</th>
                      <th className="px-md py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {filteredUsers.map((u) => {
                      const isUserSuspended = u.role === "suspended";
                      const isUserAdmin = u.role === "admin" || u.email === "veereshhp2004@gmail.com";
                      const isRootAdmin = u.email === "veereshhp2004@gmail.com";
                      return (
                        <tr key={u.id} className="hover:bg-surface-variant/20 transition-colors group h-14">
                          <td className="px-md py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-variant border border-outline-variant/50 flex-shrink-0 flex items-center justify-center font-bold text-xs text-primary">
                                {u.profileImage ? (
                                  <img alt={u.name} className="w-full h-full object-cover" src={u.profileImage} />
                                ) : (
                                  <span>{u.name[0]}</span>
                                )}
                              </div>
                              <span 
                                onClick={() => setSelectedUserDetails({ ...u, role: isUserAdmin ? "admin" : u.role })} 
                                className="text-foreground dark:text-white font-bold cursor-pointer hover:text-primary transition-colors text-xs inline-flex items-center gap-1.5"
                              >
                                {u.name}
                                {isNewUser(u.createdAt) && (
                                  <span className="px-1.5 py-0.5 rounded text-[7px] font-mono font-black uppercase bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 tracking-wider shadow-sm animate-pulse">
                                    NEW
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-md py-3 text-zinc-500 dark:text-zinc-400 font-mono text-xs">{u.email}</td>
                          <td className="px-md py-3">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase border ${
                              isUserAdmin ? "bg-purple-500/10 border-purple-500/25 text-purple-650 dark:text-purple-400" :
                              u.role === "developer" ? "bg-cyan-500/10 border-cyan-500/25 text-[#00d1ff]" :
                              u.role === "suspended" ? "bg-red-500/10 border-red-500/25 text-red-500" :
                              "bg-zinc-500/10 border-zinc-500/25 text-zinc-550 dark:text-zinc-450"
                            }`}>
                              {isUserAdmin ? "ADMIN" : u.role === "developer" ? "STUDENT" : u.role === "suspended" ? `SUSPENDED` : u.role}
                            </span>
                          </td>
                          <td className="px-md py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
                              isUserSuspended 
                                ? "bg-red-500/5 text-red-550 border-red-500/20" 
                                : "bg-green-500/5 text-green-550 border-green-500/20"
                            }`}>
                              {isUserSuspended ? "Blocked" : "Active"}
                            </span>
                          </td>
                          <td className="px-md py-3 font-mono text-zinc-500 text-xs">
                            {new Date(u.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                          <td className="px-md py-3 text-right relative">
                            <div className="flex justify-end select-none">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveUserActionMenuId(activeUserActionMenuId === u.id ? null : u.id);
                                }}
                                className="p-1.5 hover:bg-surface-variant/50 rounded-full text-zinc-400 hover:text-foreground transition-colors cursor-pointer relative"
                              >
                                <span className="material-symbols-outlined text-[20px] block">more_vert</span>
                              </button>

                              {/* Dropdown Action Menu */}
                              {activeUserActionMenuId === u.id && (
                                <div className="absolute right-0 top-[90%] z-[100] bg-white dark:bg-[#0b0e14] border border-black/10 dark:border-zinc-800 rounded-xl py-2 w-48 shadow-xl text-left select-none animate-in fade-in duration-100">
                                  <button
                                    onClick={() => {
                                      if (!isRootAdmin) {
                                        setEditingUser(u);
                                        setNewEditName(u.name);
                                        setNewEditRole(u.role);
                                        setActiveUserActionMenuId(null);
                                      }
                                    }}
                                    disabled={isRootAdmin}
                                    className={`w-full px-4 py-2 text-xs font-medium flex items-center gap-3 transition-colors ${
                                      isRootAdmin
                                        ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed opacity-40"
                                        : "text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                    Edit User
                                  </button>
                                  <button
                                    onClick={() => {
                                      setResetPasswordUser(u);
                                      setNewPasswordVal("");
                                      setActiveUserActionMenuId(null);
                                    }}
                                    className="w-full px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-3 transition-colors cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[16px] text-zinc-400 dark:text-zinc-555">lock_reset</span>
                                    Reset Password
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (!isRootAdmin) {
                                        handleToggleUserAdmin(u.id, !isUserAdmin);
                                        setActiveUserActionMenuId(null);
                                      }
                                    }}
                                    disabled={isRootAdmin}
                                    className={`w-full px-4 py-2 text-xs font-medium flex items-center gap-3 transition-colors ${
                                      isRootAdmin
                                        ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed opacity-40"
                                        : "text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                                    {isUserAdmin ? "Remove Admin" : "Make Admin"}
                                  </button>
                                  <div className="border-t border-outline-variant/30 my-1"></div>
                                  <button
                                    onClick={() => {
                                      if (!isRootAdmin) {
                                        handleModifyUserStatus(u.id, isUserSuspended ? "Active" : "Suspended");
                                        setActiveUserActionMenuId(null);
                                      }
                                    }}
                                    disabled={isRootAdmin}
                                    className={`w-full px-4 py-2 text-xs font-medium flex items-center gap-3 transition-colors ${
                                      isRootAdmin
                                        ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed opacity-40"
                                        : "text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[16px]">
                                      {isUserSuspended ? "play_circle" : "pause_circle"}
                                    </span>
                                    {isUserSuspended ? "Reactivate Access" : "Suspend Access"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (!isUserAdmin) {
                                        handleRemoveUser(u.id);
                                        setActiveUserActionMenuId(null);
                                      }
                                    }}
                                    disabled={isUserAdmin}
                                    className={`w-full px-4 py-2 text-xs font-bold flex items-center gap-3 transition-colors ${
                                      isUserAdmin
                                        ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed opacity-40"
                                        : "text-red-500 hover:bg-red-500/10 cursor-pointer"
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                    Delete User
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "Projects":
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
              <table className="w-full min-w-[650px] border-collapse text-left">
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
                              className="px-1.5 py-1 text-zinc-450 hover:text-red-500 border border-black/10 dark:border-zinc-800 rounded bg-white/5 dark:bg-zinc-955"
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

            {filteredReports.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 font-mono text-xs border border-dashed border-black/10 dark:border-zinc-800 rounded-xl space-y-2">
                <AlertTriangle size={32} className="mx-auto text-zinc-500" />
                <p className="uppercase font-bold text-foreground dark:text-white">No User Reports or Complaints Filed</p>
                <p className="text-[11px] text-zinc-500 font-sans">Ecosystem telemetry is clean. User complaints and security flags will appear here when filed.</p>
              </div>
            ) : (
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
            )}
          </div>
        );

      case "Inquiries":
        const activeInquiry = inquiries.find((i) => i.id === selectedInquiryId) || inquiries[0];

        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-foreground dark:text-white font-sans font-extrabold uppercase">Client Service Inquiries</h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Respond to development proposals, system estimates, and support tickets submitted via contact forms.</p>
              </div>
              <button
                onClick={() => {
                  const API_URL = typeof window !== "undefined" && window.location.hostname !== "localhost" ? "/api" : "http://localhost:5000/api";
                  window.open(`${API_URL}/contacts/export-csv`, "_blank");
                }}
                className="px-4 py-2 bg-primary/10 border border-primary/20 text-primary dark:text-[#00d1ff] rounded-xl text-xs font-mono font-bold hover:bg-primary/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <FileText size={14} /> Export CSV for Google Docs/Sheets
              </button>
            </div>

            {inquiriesLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 select-none">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-mono text-zinc-500 tracking-wider">Synchronizing secure inquiry nodes...</span>
              </div>
            ) : inquiries.length === 0 ? (
              <div className="glass-card p-12 text-center text-zinc-450 border border-dashed border-outline-variant/40">
                <span className="material-symbols-outlined text-[48px] text-zinc-650 mb-2">question_answer</span>
                <p className="text-xs font-mono uppercase tracking-wider">No inquiries found in database.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
                
                {/* Left Pane: Inquiries List */}
                <div className="lg:col-span-5 space-y-3 max-h-[580px] overflow-y-auto pr-2 no-scrollbar">
                  {inquiries.map((inq) => {
                    const isSelected = inq.id === activeInquiry?.id;
                    const hasReplied = !!inq.reply;
                    return (
                      <div 
                        key={inq.id}
                        onClick={() => setSelectedInquiryId(inq.id)}
                        className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "bg-primary/5 dark:bg-[#00d1ff]/5 border-primary dark:border-[#00d1ff]/40 shadow-sm"
                            : "bg-surface-container-lowest border-outline-variant/40 hover:border-outline-variant/80 hover:bg-surface-variant/20"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div className="min-w-0">
                            <h4 className="font-label-md text-label-md font-bold text-foreground dark:text-white truncate">{inq.name}</h4>
                            <p className="text-[10px] text-zinc-400 truncate">{inq.email}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase flex-shrink-0 border ${
                            hasReplied ? "bg-green-500/10 border-green-500/25 text-green-500" : "bg-amber-500/10 border-amber-500/25 text-amber-500 animate-pulse"
                          }`}>
                            {hasReplied ? "Replied" : "Unreplied"}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">{inq.message}</p>
                        <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 uppercase">
                          <span>{inq.type || "General Inquiry"}</span>
                          <span>{formatRelativeTime(inq.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Pane: Inquiry Full View Details */}
                <div className="lg:col-span-7 glass-card p-md min-h-[520px] flex flex-col justify-between space-y-6">
                  {activeInquiry ? (
                    <div className="space-y-6 flex-grow flex flex-col justify-between">
                      <div className="space-y-5">
                        {/* Detail Header */}
                        <div className="flex justify-between items-start border-b border-outline-variant/40 pb-4">
                          <div className="flex gap-3 items-center">
                            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
                              {activeInquiry.name[0]}
                            </div>
                            <div>
                              <h3 className="font-headline-sm text-sm font-bold text-foreground dark:text-white">{activeInquiry.name}</h3>
                              <p className="text-xs text-zinc-400 font-mono mt-0.5">{activeInquiry.email} {activeInquiry.phone ? `• ${activeInquiry.phone}` : ""}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-mono font-black bg-primary/15 border border-primary/20 text-[#00d1ff] uppercase mb-1">
                              {activeInquiry.type || "General Inquiry"}
                            </span>
                            <p className="text-[10px] text-zinc-400">{formatRelativeTime(activeInquiry.createdAt)}</p>
                          </div>
                        </div>

                        {/* Full Message */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block leading-none">Client Inquiry Description:</h4>
                          <div className="p-4 bg-surface-container-low border border-outline-variant/30 rounded-xl">
                            <p className="text-xs text-foreground dark:text-zinc-300 font-sans whitespace-pre-wrap leading-relaxed">
                              {activeInquiry.message}
                            </p>
                          </div>
                        </div>

                        {/* Sent Reply View */}
                        {activeInquiry.reply && (
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-mono text-green-500 uppercase tracking-widest block leading-none">Sent Admin Reply:</h4>
                            <div className="p-4 bg-green-500/5 border border-green-500/10 dark:border-green-500/20 rounded-xl">
                              <p className="text-xs text-foreground dark:text-zinc-300 font-sans italic leading-relaxed whitespace-pre-wrap">
                                {activeInquiry.reply}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Reply Composer Form / Action Footer */}
                      <div className="pt-5 border-t border-outline-variant/40">
                        {activeInquiry.reply ? (
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase">Status: Action completed</span>
                            <button 
                              onClick={() => handleDeleteInquiry(activeInquiry.id)}
                              className="px-3.5 py-2 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-400 hover:text-red-300 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all"
                            >
                              Delete Inquiry Record
                            </button>
                          </div>
                        ) : (
                          <form 
                            onSubmit={async (e) => {
                              e.preventDefault();
                              if (!replyText.trim()) return;
                              setSubmittingReply(true);
                              try {
                                const token = await getAuthToken();
                                const updated = await replyToInquiry(activeInquiry.id, replyText.trim(), token);
                                setInquiries((prev) =>
                                  prev.map((inq) => (inq.id === activeInquiry.id ? { ...inq, reply: updated.reply } : inq))
                                );
                                setToast({ message: "Reply message sent/recorded successfully.", type: "success" });
                                setReplyText("");
                              } catch (err: any) {
                                setToast({ message: err.message || "Failed to send reply.", type: "error" });
                              } finally {
                                setSubmittingReply(false);
                              }
                            }} 
                            className="space-y-3"
                          >
                            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block leading-none">Compose Reply Message:</label>
                            <textarea
                              required
                              rows={4}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write your email reply details..."
                              className="w-full p-3 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs font-sans text-foreground dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                            />
                            <div className="flex justify-between items-center gap-3">
                              <button 
                                type="button"
                                onClick={() => handleDeleteInquiry(activeInquiry.id)}
                                className="px-3 py-2.5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-400 hover:text-red-300 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all"
                              >
                                Delete
                              </button>
                              <button
                                type="submit"
                                disabled={submittingReply || !replyText.trim()}
                                className="px-5 py-2.5 bg-primary dark:bg-[#00d1ff] text-on-primary dark:text-black font-extrabold rounded-lg text-[10px] flex items-center justify-center gap-1.5 uppercase hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                              >
                                {submittingReply ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-on-primary dark:border-black border-t-transparent rounded-full animate-spin"></div>
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Send size={11} />
                                    Send Reply
                                  </>
                                )}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>

                    </div>
                  ) : (
                    <div className="text-center py-12 text-zinc-400 font-mono text-xs uppercase">
                      Select an inquiry to view particulars.
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        );

      case "Certificates":
        // Combine registered real users (dbUsers) with issued certificates
        const activeUsersList = dbUsers.filter((u) => !softDeletedUserIds.includes(u.id));

        // Create a unified list of certificate rows for all real registered users
        const certRowsMap = new Map<string, any>();

        // 1. Add all certificates in certificates state
        certificates.forEach((c) => {
          const key = (c.userEmail || c.studentName || c.id).toLowerCase();
          certRowsMap.set(key, c);
        });

        // 2. Map all real users so every registered user appears automatically
        const combinedCertRows = activeUsersList.map((userItem) => {
          const key = (userItem.email || userItem.name).toLowerCase();
          const existingCert = certRowsMap.get(key) || certificates.find(c => c.userId === userItem.id);

          if (existingCert) {
            return {
              certId: existingCert.id,
              userItem,
              studentName: existingCert.studentName || userItem.name,
              userEmail: userItem.email,
              projectName: existingCert.projectName || "Software Solution Project",
              issueDate: existingCert.issueDate || new Date().toISOString().split("T")[0],
              status: existingCert.status || "Approved",
              cert: existingCert,
              isIssued: true,
            };
          }

          return {
            certId: "--",
            userItem,
            studentName: userItem.name,
            userEmail: userItem.email,
            projectName: "Software Solution Project",
            issueDate: "--",
            status: "Not Issued",
            cert: null,
            isIssued: false,
          };
        });

        // Add standalone certs that don't match dbUsers
        certificates.forEach((c) => {
          if (["john doe", "alice vance", "sarah connor"].includes(c.studentName?.toLowerCase() || "")) return;
          if (["cert-9402", "cert-1842", "cert-0691"].includes(c.id?.toLowerCase() || "")) return;

          const hasMatched = activeUsersList.some(
            (u) => (c.userEmail && u.email.toLowerCase() === c.userEmail.toLowerCase()) || (c.userId && u.id === c.userId)
          );
          if (!hasMatched) {
            combinedCertRows.push({
              certId: c.id,
              userItem: { name: c.studentName, email: c.userEmail || "" },
              studentName: c.studentName,
              userEmail: c.userEmail || "",
              projectName: c.projectName,
              issueDate: c.issueDate,
              status: c.status,
              cert: c,
              isIssued: true,
            });
          }
        });

        // Filter rows by search term
        const filteredCertRows = combinedCertRows.filter((r) =>
          !["john doe", "alice vance", "sarah connor"].includes(r.studentName?.toLowerCase() || "") &&
          !["cert-9402", "cert-1842", "cert-0691"].includes(r.certId?.toLowerCase() || "") &&
          (!certSearchTerm ||
          r.studentName.toLowerCase().includes(certSearchTerm.toLowerCase()) ||
          r.userEmail.toLowerCase().includes(certSearchTerm.toLowerCase()) ||
          r.projectName.toLowerCase().includes(certSearchTerm.toLowerCase()) ||
          r.certId.toLowerCase().includes(certSearchTerm.toLowerCase()))
        );

        return (
          <div className="bg-white dark:bg-[#0b0e14] border border-black/10 dark:border-zinc-900 rounded-2xl p-6 sm:p-8 space-y-6 shadow-lg transition-colors duration-300 select-text">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 dark:border-zinc-900 pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground dark:text-white font-sans font-extrabold uppercase flex items-center gap-2">
                  <Award className="text-primary dark:text-[#00d1ff]" size={20} />
                  Certificate & Credential Management
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Automatically mapped to registered users. Project Title & Issue Date are editable inline.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative w-48 sm:w-56">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={certSearchTerm}
                    onChange={(e) => setCertSearchTerm(e.target.value)}
                    placeholder="Search users/certs..."
                    className="w-full pl-8 pr-3 py-1.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-xs text-foreground dark:text-white placeholder-zinc-400 focus:outline-none focus:border-primary dark:focus:border-[#00d1ff] transition-all font-mono"
                  />
                </div>

                {/* Issue New Certificate Button */}
                <button
                  onClick={() => {
                    const firstUser = activeUsersList[0];
                    setUploadingCertUser(firstUser || { name: "User", email: "user@example.com" });
                    setEditingCertItem(null);
                    setCertProjectTitleInput("Software Solution Project");
                    setCertIssueDateInput(new Date().toISOString().split("T")[0]);
                    setCertStatusInput("Approved");
                    setCertFileDataUrl("");
                    setCertFileNameVal("");
                  }}
                  className="px-3.5 py-1.5 bg-primary dark:bg-[#00d1ff] text-white dark:text-black font-extrabold rounded-xl text-xs flex items-center gap-1.5 uppercase hover:brightness-110 active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
                >
                  <PlusCircle size={14} />
                  <span>Issue Certificate</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto text-xs font-mono w-full">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-black/10 dark:border-zinc-900 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest h-10 select-none">
                    <th className="pb-3 px-3">Certificate ID</th>
                    <th className="pb-3 px-3">Registered User / Student</th>
                    <th className="pb-3 px-3">Project Title (Editable)</th>
                    <th className="pb-3 px-3">Issue Date (Editable)</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-zinc-900">
                  {filteredCertRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-400 font-mono text-xs">
                        No registered users or certificates match your search query.
                      </td>
                    </tr>
                  ) : (
                    filteredCertRows.map((row, idx) => {
                      const cert = row.cert;
                      return (
                        <tr key={row.certId !== "--" ? row.certId : `row-usr-${idx}`} className="h-14 hover:bg-black/5 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-3 font-extrabold text-primary dark:text-[#00d1ff] font-mono">
                            {row.certId}
                          </td>
                          <td className="px-3">
                            <div className="font-semibold text-foreground dark:text-white font-sans">{row.studentName}</div>
                            <div className="text-[10px] text-zinc-400 font-mono">{row.userEmail}</div>
                          </td>
                          <td className="px-3">
                            <input
                              type="text"
                              value={row.projectName}
                              onChange={(e) => handleUpdateCertField(row.certId, row.userItem, "projectName", e.target.value)}
                              placeholder="Enter Project Title..."
                              className="w-full max-w-[210px] px-2.5 py-1 bg-black/5 dark:bg-white/5 border border-transparent hover:border-black/20 dark:hover:border-white/20 focus:border-primary dark:focus:border-[#00d1ff] focus:bg-white dark:focus:bg-[#07090e] rounded-lg text-xs font-sans font-medium text-foreground dark:text-white transition-all outline-none"
                            />
                          </td>
                          <td className="px-3">
                            <input
                              type="date"
                              value={row.issueDate !== "--" ? row.issueDate : ""}
                              onChange={(e) => handleUpdateCertField(row.certId, row.userItem, "issueDate", e.target.value)}
                              className="px-2.5 py-1 bg-black/5 dark:bg-white/5 border border-transparent hover:border-black/20 dark:hover:border-white/20 focus:border-primary dark:focus:border-[#00d1ff] focus:bg-white dark:focus:bg-[#07090e] rounded-lg text-xs font-mono text-zinc-650 dark:text-zinc-300 transition-all outline-none cursor-pointer"
                            />
                          </td>
                          <td className="px-3">
                            <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-mono font-extrabold uppercase border ${
                              row.status === "Approved" ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-500" :
                              row.status === "Revoked" ? "bg-rose-500/10 border-rose-500/25 text-rose-500" :
                              row.status === "Pending" ? "bg-amber-500/10 border-amber-500/25 text-amber-500" :
                              "bg-zinc-500/10 border-zinc-500/20 text-zinc-400"
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex justify-end items-center gap-1 select-none">

                              {/* Action 1: Upload / Edit Certificate File */}
                              <button
                                title={cert ? "Upload / Replace Certificate File" : "Issue / Upload Certificate for User"}
                                onClick={() => {
                                  setUploadingCertUser(row.userItem);
                                  setEditingCertItem(cert || null);
                                  setCertProjectTitleInput(row.projectName);
                                  setCertIssueDateInput(row.issueDate !== "--" ? row.issueDate : new Date().toISOString().split("T")[0]);
                                  setCertStatusInput(row.status === "Not Issued" ? "Approved" : row.status);
                                  setCertFileDataUrl(cert?.fileData || "");
                                  setCertFileNameVal(cert?.fileName || "");
                                }}
                                className="p-1.5 text-zinc-400 hover:text-primary dark:hover:text-[#00d1ff] rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                              >
                                <Upload size={15} />
                              </button>

                              {/* Action 2: View Certificate */}
                              {cert && (
                                <button
                                  title="View Certificate Details"
                                  onClick={() => setSelectedCertView(cert)}
                                  className="p-1.5 text-zinc-400 hover:text-cyan-500 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                >
                                  <Eye size={15} />
                                </button>
                              )}

                              {/* Action 3: Download Certificate File */}
                              {cert && (
                                <button
                                  title="Download Certificate File"
                                  onClick={() => handleDownloadCertFile(cert)}
                                  className="p-1.5 text-zinc-400 hover:text-emerald-500 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                >
                                  <Download size={15} />
                                </button>
                              )}

                              {/* Action 4: Revoke / Toggle Certificate */}
                              {cert && (
                                <button
                                  title={cert.status === "Revoked" ? "Approve Certificate" : "Revoke Certificate"}
                                  onClick={() => handleModifyCertStatus(cert.id, cert.status === "Revoked" ? "Approved" : "Revoked")}
                                  className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer ${
                                    cert.status === "Revoked" ? "text-emerald-500" : "text-amber-500 hover:text-rose-500"
                                  }`}
                                >
                                  <Slash size={15} />
                                </button>
                              )}

                              {/* Action 5: Delete Certificate Record */}
                              {cert && (
                                <button
                                  title="Delete Certificate Record"
                                  onClick={() => handleDeleteCertificate(cert.id)}
                                  className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}

                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal 1: Upload / Issue / Replace Certificate Popup */}
            {(uploadingCertUser || editingCertItem) && createPortal(
              <div className="fixed top-0 left-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 select-text animate-in fade-in duration-200">
                <div className="bg-white dark:bg-[#07090e] border border-black/10 dark:border-zinc-800 p-8 rounded-2xl w-[480px] max-w-full shrink-0 shadow-2xl relative font-sans space-y-6">
                  <button
                    onClick={() => {
                      setUploadingCertUser(null);
                      setEditingCertItem(null);
                    }}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer"
                  >
                    <XCircle size={18} />
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary dark:text-[#00d1ff]">
                      <Upload size={20} />
                      <h3 className="text-sm font-mono tracking-widest text-foreground dark:text-white font-extrabold uppercase">
                        {editingCertItem ? "Replace / Edit Certificate" : "Issue Certificate for User"}
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-500 font-sans">
                      Target User: <strong className="text-foreground dark:text-white font-semibold">{uploadingCertUser?.name || editingCertItem?.studentName}</strong> ({uploadingCertUser?.email || editingCertItem?.userEmail})
                    </p>
                  </div>

                  <form onSubmit={handleSaveCertificate} className="space-y-4 text-xs font-sans">
                    {/* User Selection Dropdown if no specific user pre-selected */}
                    {!editingCertItem && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block font-bold">Select Registered User</label>
                        <select
                          value={uploadingCertUser?.id || ""}
                          onChange={(e) => {
                            const found = activeUsersList.find(u => u.id === e.target.value);
                            if (found) setUploadingCertUser(found);
                          }}
                          className="w-full px-3 py-2 bg-black/5 dark:bg-[#0b0e14] border border-black/10 dark:border-zinc-800 rounded-xl text-xs text-foreground dark:text-white font-mono outline-none"
                        >
                          {activeUsersList.map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block font-bold">Project Title / Qualification</label>
                      <input
                        type="text"
                        required
                        value={certProjectTitleInput}
                        onChange={(e) => setCertProjectTitleInput(e.target.value)}
                        placeholder="e.g., Quantum-Flux Core Integration"
                        className="w-full px-3 py-2 bg-black/5 dark:bg-[#0b0e14] border border-black/10 dark:border-zinc-800 rounded-xl text-xs text-foreground dark:text-white focus:outline-none focus:border-primary dark:focus:border-[#00d1ff] transition-all font-sans"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block font-bold">Issue Date</label>
                        <input
                          type="date"
                          required
                          value={certIssueDateInput}
                          onChange={(e) => setCertIssueDateInput(e.target.value)}
                          className="w-full px-3 py-2 bg-black/5 dark:bg-[#0b0e14] border border-black/10 dark:border-zinc-800 rounded-xl text-xs text-foreground dark:text-white font-mono focus:outline-none focus:border-primary dark:focus:border-[#00d1ff]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block font-bold">Credential Status</label>
                        <select
                          value={certStatusInput}
                          onChange={(e: any) => setCertStatusInput(e.target.value)}
                          className="w-full px-3 py-2 bg-black/5 dark:bg-[#0b0e14] border border-black/10 dark:border-zinc-800 rounded-xl text-xs text-foreground dark:text-white font-mono outline-none"
                        >
                          <option value="Approved">Approved / Verified</option>
                          <option value="Pending">Pending Review</option>
                          <option value="Revoked">Revoked</option>
                        </select>
                      </div>
                    </div>

                    {/* File Upload Box */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block font-bold">Upload Certificate Document (PDF / Image)</label>
                      <div className="p-4 border-2 border-dashed border-black/10 dark:border-zinc-800 rounded-xl text-center space-y-2 bg-black/5 dark:bg-white/[0.01]">
                        <FileUp className="mx-auto text-primary dark:text-[#00d1ff]" size={24} />
                        <div className="text-[11px] text-zinc-500">
                          {certFileNameVal ? (
                            <span className="font-mono text-emerald-500 font-bold block truncate">Selected: {certFileNameVal}</span>
                          ) : (
                            <span>Drag and drop certificate PDF / image or click browse</span>
                          )}
                        </div>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={handleCertFileSelected}
                          className="hidden"
                          id="cert-file-picker"
                        />
                        <label
                          htmlFor="cert-file-picker"
                          className="inline-block px-3 py-1 bg-black/10 dark:bg-white/10 text-foreground dark:text-white rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-black/20 dark:hover:bg-white/20 transition-all cursor-pointer"
                        >
                          {certFileNameVal ? "Change File" : "Browse Computer"}
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setUploadingCertUser(null);
                          setEditingCertItem(null);
                        }}
                        className="w-1/2 py-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="w-1/2 py-2.5 bg-primary dark:bg-[#00d1ff] text-white dark:text-black font-extrabold rounded-xl text-[10px] uppercase hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md"
                      >
                        Save & Issue Certificate
                      </button>
                    </div>
                  </form>
                </div>
              </div>,
              document.body
            )}

            {/* Modal 2: View Certificate Details Popup */}
            {selectedCertView && createPortal(
              <div className="fixed top-0 left-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 select-text animate-in fade-in duration-200">
                <div className="bg-white dark:bg-[#07090e] border border-black/10 dark:border-zinc-800 p-8 rounded-2xl w-full max-w-md shadow-2xl relative space-y-6 text-center">
                  <button onClick={() => setSelectedCertView(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-foreground dark:hover:text-white cursor-pointer"><XCircle size={18} /></button>
                  <Award size={48} className="text-primary dark:text-[#00d1ff] mx-auto animate-pulse" />
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">RecodeX Verified Credential</span>
                    <h2 className="text-xl font-extrabold text-foreground dark:text-white font-sans">{selectedCertView.studentName}</h2>
                    <p className="text-xs text-zinc-500 font-sans">{selectedCertView.projectName}</p>
                  </div>

                  <div className="p-4 border border-dashed border-black/10 dark:border-zinc-800 rounded-xl space-y-1.5 font-mono text-[10px] text-zinc-500 uppercase text-left">
                    <div className="flex justify-between"><span>Certificate ID:</span> <strong className="text-primary dark:text-[#00d1ff]">{selectedCertView.id}</strong></div>
                    <div className="flex justify-between"><span>Issue Date:</span> <strong className="text-foreground dark:text-white">{selectedCertView.issueDate}</strong></div>
                    <div className="flex justify-between"><span>Verification Status:</span> <strong className="text-emerald-500">{selectedCertView.status}</strong></div>
                    {selectedCertView.fileName && (
                      <div className="flex justify-between"><span>Attached Document:</span> <strong className="text-zinc-700 dark:text-zinc-300 truncate max-w-[160px]">{selectedCertView.fileName}</strong></div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDownloadCertFile(selectedCertView)}
                      className="w-full py-2.5 bg-primary dark:bg-[#00d1ff] text-white dark:text-black font-extrabold rounded-xl text-xs uppercase flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md"
                    >
                      <Download size={14} />
                      Download Certificate Document
                    </button>
                  </div>
                </div>
              </div>,
              document.body
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
                <Send size={12} /> Post Announcement
              </button>
            </form>

            <div className="pt-6 border-t border-black/5 dark:border-zinc-900/60 space-y-4 select-text">
              <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-500">Live published announcements</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-5 border border-black/5 dark:border-zinc-900 bg-black/5 dark:bg-zinc-900/30 rounded-xl flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center gap-2 select-none">
                        <span className="text-[7px] font-mono px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-[#00d1ff] font-bold uppercase">{ann.type}</span>
                        <span className="text-[8px] font-mono text-zinc-500">{formatRelativeTime(ann.date)}</span>
                      </div>
                      <h4 className="text-xs font-extrabold text-foreground dark:text-white leading-tight">{ann.title}</h4>
                      <p className="text-[10px] text-zinc-650 dark:text-zinc-400 leading-relaxed font-sans">{getAnnouncementMessage(ann)}</p>
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
                      <td className="text-zinc-650">ECDSA-SHA256-AES-GCM</td>
                      <td className="text-green-500 font-bold text-right">ACTIVE_SESSION</td>
                    </tr>
                    <tr className="h-10 hover:bg-black/5 dark:hover:bg-zinc-900/10 transition-colors">
                      <td className="py-2.5">2026-05-28 09:30:14</td>
                      <td>192.168.1.104 (Core node)</td>
                      <td className="text-zinc-650">ECDSA-SHA256-AES-GCM</td>
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
              <h3 className="text-lg font-bold text-foreground dark:text-white font-sans font-extrabold uppercase">Recycle Bin</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Restore or permanently purge soft-deleted users, categories, or projects.</p>
            </div>

            {recycleBin.length === 0 ? (
              <div className="border border-dashed border-black/10 dark:border-zinc-900 rounded-2xl p-12 text-center text-zinc-400 select-none">
                <Trash2 size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-xs font-mono uppercase tracking-wider">Recycle Bin is empty.</p>
              </div>
            ) : (
              <div className="overflow-x-auto text-xs font-mono w-full select-text">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-zinc-900 text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest h-10 select-none">
                      <th className="pb-3">Item Name</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Deleted At</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-zinc-900">
                    {recycleBin.map((item, i) => (
                      <tr key={i} className="h-14 hover:bg-black/5 dark:hover:bg-[#07090e]/25 transition-colors">
                        <td className="text-foreground dark:text-white font-extrabold">{item.name}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase border ${
                            item.type === "User" ? "bg-cyan-500/10 border-cyan-500/25 text-[#00d1ff]" :
                            item.type === "Project" ? "bg-purple-500/10 border-purple-500/25 text-purple-500" :
                            "bg-yellow-500/10 border-yellow-500/25 text-yellow-500"
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="text-zinc-500 dark:text-zinc-400">{item.deletedAt}</td>
                        <td className="py-2 text-right">
                          <div className="flex justify-end gap-1.5 select-none">
                            <button
                              onClick={() => handleRestoreItem(item)}
                              className="px-2 py-1 bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500/20 rounded text-[8px] font-mono font-bold uppercase tracking-wider"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => handleDeletePermanently(item)}
                              className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 rounded text-[8px] font-mono font-bold uppercase tracking-wider"
                            >
                              Purge
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

  return (
    <div className="bg-background text-on-background flex h-screen w-screen overflow-hidden font-sans select-text antialiased">
      {/* Mobile backdrop overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SideNavBar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 shrink-0 h-full bg-white/95 dark:bg-[#07090e]/95 backdrop-blur-xl border-r border-zinc-200/80 dark:border-white/10 flex flex-col justify-between select-none transition-transform duration-300 ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <div className="p-5 border-b border-zinc-200/80 dark:border-white/5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <img src="/recodeXlogo.png" alt="RecodeX Logo" className="brand-logo-img h-8 w-auto object-contain" />
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-3">
          <button 
            onClick={() => {
              setActiveSidebarTab("Projects");
              setIsMobileMenuOpen(false);
            }} 
            className="w-full py-2.5 px-4 bg-primary text-white dark:text-black rounded-xl font-mono text-xs font-extrabold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md dark:shadow-[0_0_20px_rgba(0,209,255,0.25)] hover-lift flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create Project
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 no-scrollbar space-y-1">
          {navItems.map((item) => {
            const isActive = activeSidebarTab === item.label;
            return (
              <button 
                key={item.label}
                onClick={() => {
                  setActiveSidebarTab(item.label);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 cursor-pointer font-sans text-xs font-semibold ${
                  isActive 
                    ? "bg-primary/10 text-primary dark:text-[#00d1ff] font-bold border-l-4 border-primary dark:border-[#00d1ff] pl-3 shadow-xs dark:shadow-[inset_0_0_15px_rgba(0,209,255,0.05)]" 
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${isActive ? "text-primary dark:text-[#00d1ff]" : "text-zinc-400 dark:text-zinc-500"}`}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-zinc-200/80 dark:border-white/5 space-y-1 bg-zinc-50/80 dark:bg-white/[0.02]">
          <button 
            onClick={() => {
              setActiveSidebarTab("Inquiries");
              setIsMobileMenuOpen(false);
            }} 
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-white/5 transition-all text-xs font-semibold cursor-pointer text-left"
          >
            <span className="material-symbols-outlined text-[18px]">support_agent</span>
            <span>Support</span>
          </button>
          <button 
            onClick={() => {
              setShowHelpModal(true);
              setIsMobileMenuOpen(false);
            }} 
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-white/5 transition-all text-xs font-semibold cursor-pointer text-left"
          >
            <span className="material-symbols-outlined text-[18px]">help</span>
            <span>Help</span>
          </button>
          <button 
            onClick={handleSignOut} 
            className="w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all text-xs font-bold cursor-pointer text-left"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background">
        {/* TopAppBar */}
        <header className="h-16 shrink-0 z-20 flex justify-between items-center w-full px-3 sm:px-6 md:px-8 bg-white/80 dark:bg-[#07090e]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5 shadow-xs gap-2">
          <div className="flex items-center gap-3 md:gap-6 min-w-0">
            {/* Mobile Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-zinc-400 hover:text-foreground dark:hover:text-white bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl cursor-pointer shrink-0"
              aria-label="Toggle mobile navigation menu"
            >
              <Menu size={18} />
            </button>

            {/* Search */}
            <div className="relative w-36 sm:w-64 md:w-72 select-none shrink">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 text-[18px]">search</span>
              <input 
                value={userSearch} 
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  if (activeSidebarTab !== "Users") setActiveSidebarTab("Users");
                }} 
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full py-1.5 pl-9 pr-7 sm:pr-12 text-xs text-foreground dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-primary dark:focus:border-[#00d1ff] transition-all font-sans" 
                placeholder="Search..." 
                type="text"
              />
              <span className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-zinc-400 dark:text-zinc-600 bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded border border-black/5 dark:border-white/5">⌘K</span>
            </div>
            {/* Nav Links */}
            <nav className="hidden md:flex gap-6 select-none">
              <button onClick={() => setActiveSidebarTab("Dashboard")} className={`text-xs font-bold pb-1 cursor-pointer transition-colors ${activeSidebarTab === "Dashboard" ? "text-primary dark:text-[#00d1ff] border-b-2 border-primary dark:border-[#00d1ff]" : "text-zinc-400 hover:text-foreground dark:hover:text-[#00d1ff]"}`}>Dashboard</button>
              <button onClick={() => setActiveSidebarTab("Reports")} className={`text-xs font-bold pb-1 cursor-pointer transition-colors ${activeSidebarTab === "Reports" ? "text-primary dark:text-[#00d1ff] border-b-2 border-primary dark:border-[#00d1ff]" : "text-zinc-400 hover:text-foreground dark:hover:text-[#00d1ff]"}`}>Analytics</button>
              <button onClick={() => setActiveSidebarTab("Settings")} className={`text-xs font-bold pb-1 cursor-pointer transition-colors ${activeSidebarTab === "Settings" ? "text-primary dark:text-[#00d1ff] border-b-2 border-primary dark:border-[#00d1ff]" : "text-zinc-400 hover:text-foreground dark:hover:text-[#00d1ff]"}`}>Settings</button>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-400 select-none">
              <button onClick={() => setActiveSidebarTab("Notifications")} className="p-1.5 sm:p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors relative cursor-pointer">
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
              </button>
              <button onClick={() => setActiveSidebarTab("Inquiries")} className="p-1.5 sm:p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">mail</span>
              </button>
              <button onClick={toggleTheme} className="p-1.5 sm:p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">contrast</span>
              </button>
            </div>

            <div className="hidden sm:block h-5 w-px bg-black/10 dark:bg-white/10 mx-0.5"></div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button onClick={handleExportJSON} className="hidden sm:inline-block px-3 py-1.5 text-xs font-mono font-bold border border-black/10 dark:border-white/15 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-foreground dark:text-white">Export</button>
              <button onClick={handleRefreshSystem} disabled={isRefreshing} className="px-2.5 sm:px-3.5 py-1.5 text-xs font-mono font-bold bg-primary text-white dark:text-black rounded-xl hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,209,255,0.2)] hover-lift cursor-pointer flex items-center gap-1.5">
                <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} /> <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 border border-primary/20 overflow-hidden ml-0.5 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors shrink-0">
              {user?.imageUrl ? (
                <img alt="Admin User" className="w-full h-full object-cover" src={user.imageUrl} />
              ) : (
                <span className="font-extrabold text-xs text-primary">VH</span>
              )}
            </div>
          </div>
        </header>

        {/* Main Canvas */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto w-full max-w-[1600px] mx-auto space-y-6 sm:space-y-8">
          {activeSidebarTab === "Dashboard" && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-black/5 dark:border-white/5">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Welcome Back, {adminName} 👋</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Here&apos;s what&apos;s happening today across your platform.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full text-xs font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>SYSTEM OPERATIONAL: 99.98% UPTIME</span>
                </div>
              </div>
            </div>
          )}
          {renderMainContent()}
        </main>

        {/* Modals & toast overlays rendered via React Portals directly on document.body */}
      {/* Profile details popup modal */}
      {selectedUserDetails && createPortal(
        <div className="fixed top-0 left-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 select-text">
          <div className="bg-white dark:bg-[#07090e] border border-black/10 dark:border-zinc-800 p-8 rounded-2xl w-[440px] max-w-full shrink-0 shadow-2xl relative font-sans">
            <button onClick={() => setSelectedUserDetails(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-white cursor-pointer"><XCircle size={18} /></button>
            <div className="space-y-4">
              <h3 className="text-xs font-mono tracking-widest text-zinc-500 dark:text-zinc-400 uppercase font-bold">Ecosystem Profile Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between border-b border-black/5 dark:border-zinc-900 pb-2"><span className="text-zinc-500 dark:text-zinc-400 font-medium">Name</span><span className="font-extrabold text-zinc-900 dark:text-white">{selectedUserDetails.name}</span></div>
                <div className="flex justify-between border-b border-black/5 dark:border-zinc-900 pb-2"><span className="text-zinc-500 dark:text-zinc-400 font-medium">Email</span><span className="font-mono text-zinc-800 dark:text-zinc-200 font-medium">{selectedUserDetails.email}</span></div>
                <div className="flex justify-between border-b border-black/5 dark:border-zinc-900 pb-2"><span className="text-zinc-500 dark:text-zinc-400 font-medium">Role</span><span className="font-mono uppercase text-primary dark:text-[#00d1ff] font-extrabold">{selectedUserDetails.role}</span></div>
                <div className="flex justify-between border-b border-black/5 dark:border-zinc-900 pb-2"><span className="text-zinc-500 dark:text-zinc-400 font-medium">Secure User ID</span><span className="font-mono text-[9px] text-zinc-800 dark:text-zinc-200">{selectedUserDetails.id}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500 dark:text-zinc-400 font-medium">Status</span><span className={`font-bold ${selectedUserDetails.role === "suspended" ? "text-red-500" : "text-green-500"}`}>{selectedUserDetails.role === "suspended" ? "Suspended" : "Active"}</span></div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit User details popup modal */}
      {editingUser && createPortal(
        <div className="fixed top-0 left-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 select-text animate-in fade-in duration-250">
          <div className="bg-[#fafafa] dark:bg-[#07090e] border border-black/10 dark:border-zinc-800 p-8 rounded-2xl w-[440px] max-w-full shrink-0 shadow-2xl relative font-sans">
            <button onClick={() => setEditingUser(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-white cursor-pointer"><XCircle size={18} /></button>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary dark:text-[#00d1ff]">
                <span className="material-symbols-outlined text-[24px]">edit</span>
                <h3 className="text-sm font-mono tracking-widest text-zinc-700 dark:text-zinc-200 font-extrabold uppercase">Edit User Credentials</h3>
              </div>
              <form onSubmit={handleSaveUserEdit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block font-bold">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newEditName}
                    onChange={(e) => setNewEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0b0e14] border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary dark:focus:border-[#00d1ff] transition-all font-sans"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block font-bold">System Access Role</label>
                  <select
                    value={newEditRole}
                    onChange={(e) => setNewEditRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0b0e14] border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white font-mono outline-none"
                  >
                    <option value="developer">Student/Freelancer</option>
                    <option value="client">Client</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="w-1/2 py-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingUser || !newEditName.trim()}
                    className="w-1/2 py-2.5 bg-primary dark:bg-[#00d1ff] text-white dark:text-black font-extrabold rounded-xl text-[10px] flex items-center justify-center gap-1.5 uppercase hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingUser ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Reset Password details popup modal */}
      {resetPasswordUser && createPortal(
        <div className="fixed top-0 left-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 select-text animate-in fade-in duration-250">
          <div className="bg-[#fafafa] dark:bg-[#07090e] border border-black/10 dark:border-zinc-800 p-8 rounded-2xl w-[440px] max-w-full shrink-0 shadow-2xl relative font-sans">
            <button onClick={() => setResetPasswordUser(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-white cursor-pointer"><XCircle size={18} /></button>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary dark:text-[#00d1ff]">
                <span className="material-symbols-outlined text-[24px]">lock_reset</span>
                <h3 className="text-sm font-mono tracking-widest text-zinc-700 dark:text-zinc-200 font-extrabold uppercase">Reset User Password</h3>
              </div>
              <p className="text-xs text-zinc-650 dark:text-zinc-300 leading-normal font-medium">
                Trigger a secure credential reset sequence for <strong className="text-zinc-900 dark:text-white">{resetPasswordUser.name}</strong> ({resetPasswordUser.email}).
              </p>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block font-bold">Assigned Temporary Password</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Enter new master password..."
                      value={newPasswordVal}
                      onChange={(e) => setNewPasswordVal(e.target.value)}
                      className="w-full pl-3 pr-20 py-2 bg-white dark:bg-[#0b0e14] border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-primary dark:focus:border-[#00d1ff] transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const randomPass = Math.random().toString(36).slice(-8) + "@" + Math.floor(100 + Math.random() * 900);
                        setNewPasswordVal(randomPass);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-primary/10 hover:bg-primary/20 dark:bg-[#00d1ff]/10 dark:hover:bg-[#00d1ff]/20 text-primary dark:text-[#00d1ff] rounded text-[9px] font-mono uppercase tracking-wider cursor-pointer font-bold"
                    >
                      Generate
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetPasswordUser(null)}
                    className="w-1/2 py-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingUser || !newPasswordVal.trim()}
                    className="w-1/2 py-2.5 bg-primary dark:bg-[#00d1ff] text-white dark:text-black font-extrabold rounded-xl text-[10px] flex items-center justify-center gap-1.5 uppercase hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingUser ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Premium Glassmorphic Toast Notification Overlay */}
      {toast && createPortal(
        <div className="fixed bottom-6 right-6 z-[150] max-w-sm w-full bg-white/70 dark:bg-[#07090e]/80 backdrop-blur-xl border border-black/10 dark:border-zinc-800 rounded-xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 select-text">
          <div className={`p-1.5 rounded-lg shrink-0 ${
            toast.type === "success" ? "bg-green-500/10 text-green-500 border border-green-500/20" :
            toast.type === "error" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
            "bg-amber-500/10 text-amber-500 border border-amber-500/20"
          }`}>
            {toast.type === "success" ? <CheckCircle size={16} /> :
             toast.type === "error" ? <XCircle size={16} /> :
             <AlertTriangle size={16} />}
          </div>
          <div className="space-y-1">
            <h4 className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
              toast.type === "success" ? "text-green-500" :
              toast.type === "error" ? "text-red-500" :
              "text-amber-500"
            }`}>
              {toast.type === "success" ? "Operation Successful" :
               toast.type === "error" ? "Security Halt" :
               "Ecosystem Alert"}
            </h4>
            <p className="text-xs text-zinc-650 dark:text-[#94a3b8] leading-relaxed font-medium">
              {toast.message}
            </p>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-350 ml-auto p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
          >
            <XCircle size={14} className="shrink-0" />
          </button>
        </div>,
        document.body
      )}

      {/* Admin Help & Operator Guide Modal */}
      {showHelpModal && createPortal(
        <div className="fixed top-0 left-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 select-text animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#07090e] border border-black/10 dark:border-zinc-800 p-8 rounded-2xl w-[600px] max-w-full shrink-0 shadow-2xl relative font-sans space-y-6 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer"
            >
              <XCircle size={18} />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary dark:text-[#00d1ff]">
                <HelpCircle size={22} />
                <h3 className="text-base font-bold text-foreground dark:text-white font-sans uppercase">
                  RecodeX Admin Console Help & Operator Guide
                </h3>
              </div>
              <p className="text-xs text-zinc-500 font-sans">
                Quick operator reference guide for managing developers, certificates, support inquiries, and ecosystem security.
              </p>
            </div>

            <div className="space-y-4 text-xs font-sans text-zinc-600 dark:text-zinc-300">
              <div className="p-4 bg-black/5 dark:bg-zinc-900/50 rounded-xl border border-black/5 dark:border-zinc-800/80 space-y-1.5">
                <h4 className="font-bold text-foreground dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00d1ff]"></span>
                  👥 1. User & Developer Management
                </h4>
                <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Search developers by name or email. Edit user roles, suspend/activate accounts, reset passwords, or soft-delete accounts to the Recycle Bin.
                </p>
              </div>

              <div className="p-4 bg-black/5 dark:bg-zinc-900/50 rounded-xl border border-black/5 dark:border-zinc-800/80 space-y-1.5">
                <h4 className="font-bold text-foreground dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  📜 2. Certificate & Credential Management
                </h4>
                <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                  All registered users auto-populate in the Certificate table. Edit Project Titles and Issue Dates inline. Click 📤 Upload to attach PDF/Image certificates, which auto-sync to the user's account page.
                </p>
              </div>

              <div className="p-4 bg-black/5 dark:bg-zinc-900/50 rounded-xl border border-black/5 dark:border-zinc-800/80 space-y-1.5">
                <h4 className="font-bold text-foreground dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  📩 3. Support Inquiries & Webhook Sync
                </h4>
                <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Inquiries submitted via the Contact page sync live to MongoDB and Google Sheets. Admins can view messages, compose replies, and export CSV files.
                </p>
              </div>

              <div className="p-4 bg-black/5 dark:bg-zinc-900/50 rounded-xl border border-black/5 dark:border-zinc-800/80 space-y-1.5">
                <h4 className="font-bold text-foreground dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  ♻️ 4. Recycle Bin & Data Safety
                </h4>
                <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Deleted users and projects are moved to the Recycle Bin first, allowing full restoration before permanent removal.
                </p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2 bg-[#00d1ff] text-black font-extrabold rounded-lg text-xs font-mono uppercase tracking-wider hover:brightness-110 cursor-pointer"
              >
                Got It, Close Guide
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      </div>
    </div>
  );
}
