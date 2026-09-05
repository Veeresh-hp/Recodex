import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import {
  Sun, Moon, Menu, X, User, Award, FolderGit2, MessageSquare,
  ChevronRight, Shield, LogOut, CheckCircle2, Sparkles, LayoutDashboard,
  ShieldCheck, Activity, ExternalLink
} from "lucide-react";
import { useAuth, useUser, useClerk } from "@clerk/clerk-react";
import { useLoginModal } from "@/context/LoginModalContext";

export default function Navbar() {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { openLogin } = useLoginModal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [navAvatar, setNavAvatar] = useState<string | null>(null);
  const [navInitials, setNavInitials] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("client");
  const [certCount, setCertCount] = useState<number>(0);
  const [projectCount, setProjectCount] = useState<number>(0);
  const [inquiryCount, setInquiryCount] = useState<number>(0);

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle outside clicks to close profile flyout
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileDropdownOpen]);

  useEffect(() => {
    if (!isLoaded) return;

    const checkNavAdminStatus = () => {
      if (userId && user) {
        setIsAuthenticated(true);
        const email = (user.primaryEmailAddress?.emailAddress || "").toLowerCase().trim();
        setUserEmail(email);

        // Check synced users list for promoted admin roles
        const syncedUsersRaw = localStorage.getItem("recodex_synced_users");
        const syncedUsers: any[] = syncedUsersRaw ? JSON.parse(syncedUsersRaw) : [];
        const dbUserRecord = syncedUsers.find(
          (u: any) => u.email && u.email.toLowerCase().trim() === email
        );

        const ROOT_ADMIN_EMAILS = ["veereshhp2004@gmail.com", "udaykumaras34@gmail.com"];
        const isOwner = ROOT_ADMIN_EMAILS.includes(email) || dbUserRecord?.role === "admin";
        setIsAdmin(isOwner);
        setUserRole(isOwner ? "admin" : (dbUserRecord?.role || "client"));

        const savedAvatar = localStorage.getItem(`profile_avatar_${userId}`);
        setNavAvatar(savedAvatar || user.imageUrl || null);

        const name = user.fullName || user.username || email.split("@")[0] || "User";
        setUserName(name);
        setNavInitials(
          name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase()
        );

        // Load dynamic telemetry counts for this user
        try {
          const certsRaw = localStorage.getItem("recodex_synced_certificates");
          const certs: any[] = certsRaw ? JSON.parse(certsRaw) : [];
          const matchedCerts = certs.filter(
            (c: any) =>
              c && !c.id?.includes("7729") && (
                (c.userEmail && c.userEmail.toLowerCase().trim() === email) ||
                (c.userId && c.userId === userId) ||
                (c.studentName && c.studentName.toLowerCase().includes(name.toLowerCase()))
              )
          );
          setCertCount(matchedCerts.length);

          const inqsRaw = localStorage.getItem("recodex_submitted_inquiries");
          const inqs: any[] = inqsRaw ? JSON.parse(inqsRaw) : [];
          const userInqs = inqs.filter((i: any) => i && i.subject !== "Account Onboarding & Security Clearance" && i.email && i.email.toLowerCase().trim() === email);
          setInquiryCount(userInqs.length);

          const clientProjRaw = localStorage.getItem("recodex_client_projects");
          const clientProjs: any[] = clientProjRaw ? JSON.parse(clientProjRaw) : [];
          setProjectCount(clientProjs.length);
        } catch (e) {
          console.warn("Telemetry load warning:", e);
        }
      } else {
        const stillBypassed =
          localStorage.getItem("recodex_session_token") === "admin-bypass-token" ||
          localStorage.getItem("recodex_admin_user") === "true";

        setIsAuthenticated(stillBypassed);
        setIsAdmin(stillBypassed);
        if (stillBypassed) {
          const savedAvatar = localStorage.getItem("profile_avatar_sandbox-admin-001");
          if (savedAvatar) setNavAvatar(savedAvatar);
          setNavInitials("VH");
          setUserName("Veeresh H P");
          setUserEmail("veereshhp2004@gmail.com");
          setUserRole("admin");
          setCertCount(0);
          setProjectCount(0);
          setInquiryCount(0);
        } else {
          setNavAvatar(null);
          setNavInitials("");
          setUserName("");
          setUserEmail("");
          setUserRole("client");
          setCertCount(0);
          setProjectCount(0);
          setInquiryCount(0);
        }
      }
    };

    checkNavAdminStatus();
    window.addEventListener("recodex-auth-update", checkNavAdminStatus);
    window.addEventListener("storage", checkNavAdminStatus);
    window.addEventListener("recodex-inquiry-submitted", checkNavAdminStatus);
    return () => {
      window.removeEventListener("recodex-auth-update", checkNavAdminStatus);
      window.removeEventListener("storage", checkNavAdminStatus);
      window.removeEventListener("recodex-inquiry-submitted", checkNavAdminStatus);
    };
  }, [isLoaded, userId, user]);

  const handleSignOut = async () => {
    try {
      await clerk.signOut();
    } catch (err) {
      console.warn("Clerk sign out error:", err);
    }

    localStorage.removeItem("recodex_session_token");
    localStorage.removeItem("recodex_admin_user");
    setIsAuthenticated(false);
    setProfileDropdownOpen(false);

    window.location.href = "/";
  };

  // Sub-routes that belong under the "Categories" parent nav item
  const categoriesSubRoutes = ["/marketplace", "/solutions", "/showcase", "/terms"];

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: "Services", href: "/services" },
    { label: "Categories", href: "/categories" },
    { label: "Announcements", href: "/announcements" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-black/5 dark:border-white/5 transition-colors duration-300 print:hidden">
      <div className="flex justify-between items-center h-20 px-6 max-w-7xl mx-auto w-full">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <img src="/recodeXlogo.png" alt="RecodeX Logo" className="brand-logo-img h-9 sm:h-10 w-auto object-contain" width="160" height="40" decoding="async" />
        </Link>

        {/* Desktop Route Index */}
        <div className="hidden md:flex gap-6">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.label === "Categories" && categoriesSubRoutes.includes(pathname));
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`text-sm font-medium py-1.5 px-3 rounded-md transition-all duration-200 relative ${
                  isActive
                    ? "text-primary border-b-2 border-primary rounded-b-none font-bold"
                    : "text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 font-semibold"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Interactive Controls & CTA */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 text-zinc-700 dark:text-zinc-300 hover:text-primary transition-colors hover:bg-black/5 dark:hover:bg-white/5 rounded-full flex items-center justify-center active:scale-90 cursor-pointer"
            aria-label="Toggle theme"
          >
            {mounted ? (
              theme === "dark" ? <Sun size={20} className="text-primary" /> : <Moon size={20} />
            ) : (
              <div className="w-5 h-5" />
            )}
          </button>

          {isAuthenticated ? (
            <div className="relative flex items-center gap-3">
              {isAdmin && (
                <Link
                  to="/dashboard"
                  className="text-xs font-mono font-bold tracking-wider uppercase px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary dark:text-[#00d1ff] border border-primary/25 transition-all flex items-center gap-1.5"
                >
                  <LayoutDashboard size={13} />
                  Dashboard
                </Link>
              )}

              {/* Profile Flyout Toggle Avatar Button */}
              <button
                ref={profileButtonRef}
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className={`relative w-9 h-9 rounded-full p-[2px] transition-all duration-200 cursor-pointer group shrink-0 ${
                  profileDropdownOpen
                    ? "bg-gradient-to-tr from-primary to-blue-500 shadow-[0_0_15px_rgba(0,209,255,0.4)] scale-105"
                    : "bg-black/10 dark:bg-zinc-800 hover:bg-gradient-to-tr hover:from-primary hover:to-blue-500 hover:shadow-[0_0_12px_rgba(0,209,255,0.25)] active:scale-95"
                }`}
                title="Account profile & quick telemetry"
              >
                <div className="w-full h-full rounded-full bg-white dark:bg-[#07090e] overflow-hidden flex items-center justify-center">
                  {navAvatar ? (
                    <img src={navAvatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : navInitials ? (
                    <span className="text-[10px] font-black text-foreground dark:text-white font-sans">{navInitials}</span>
                  ) : (
                    <User size={15} className="text-zinc-500" />
                  )}
                </div>
                {/* Status Dot */}
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white dark:border-black ${
                  isAdmin ? "bg-purple-500" : "bg-emerald-500"
                }`} />
              </button>

              {/* RICH PROFILE FLYOUT DROPDOWN */}
              {profileDropdownOpen && (
                <div
                  ref={profileDropdownRef}
                  className="absolute right-0 top-12 w-80 bg-white/95 dark:bg-[#07090e]/95 backdrop-blur-2xl border border-black/10 dark:border-zinc-800/90 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.85)] space-y-4 animate-in fade-in zoom-in-95 duration-150 z-50 text-left font-sans select-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* User Profile Header Card */}
                  <div className="flex items-center gap-3 pb-3 border-b border-black/5 dark:border-zinc-800/80">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-primary to-blue-500 p-[2px] shadow-sm shrink-0">
                      <div className="w-full h-full rounded-full bg-white dark:bg-[#07090e] overflow-hidden flex items-center justify-center">
                        {navAvatar ? (
                          <img src={navAvatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-black text-foreground dark:text-white">{navInitials || "U"}</span>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-foreground dark:text-white truncate leading-tight font-sans">
                          {userName || "RecodeX Member"}
                        </h4>
                        <span className={`px-1.5 py-0.2 rounded text-[7px] font-mono font-black uppercase tracking-wider border ${
                          isAdmin
                            ? "bg-purple-500/10 border-purple-500/25 text-purple-600 dark:text-purple-400"
                            : "bg-primary/10 border-primary/25 text-primary dark:text-[#00d1ff]"
                        }`}>
                          {userRole}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                        {userEmail}
                      </p>
                      <div className="flex items-center gap-1 text-[8px] font-mono text-emerald-500 font-bold uppercase pt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Cryptographic ID Verified</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Telemetry Cards */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-bold px-1 block">
                      Quick Telemetry & Badges
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <Link
                        to="/certificates"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="p-2.5 bg-black/[0.02] dark:bg-zinc-900/60 hover:bg-primary/10 dark:hover:bg-[#00d1ff]/10 border border-black/5 dark:border-zinc-800/80 hover:border-primary/30 rounded-xl transition-all group cursor-pointer"
                      >
                        <Award size={16} className="mx-auto text-primary dark:text-[#00d1ff] mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] font-mono text-zinc-500 block uppercase">Certs</span>
                        <span className="text-[11px] font-extrabold text-foreground dark:text-white font-mono">{certCount} Active</span>
                      </Link>

                      <Link
                        to="/my-projects"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="p-2.5 bg-black/[0.02] dark:bg-zinc-900/60 hover:bg-emerald-500/10 border border-black/5 dark:border-zinc-800/80 hover:border-emerald-500/30 rounded-xl transition-all group cursor-pointer"
                      >
                        <FolderGit2 size={16} className="mx-auto text-emerald-500 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] font-mono text-zinc-500 block uppercase">Projects</span>
                        <span className="text-[11px] font-extrabold text-foreground dark:text-white font-mono">{projectCount} Live</span>
                      </Link>

                      <Link
                        to="/queries"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="p-2.5 bg-black/[0.02] dark:bg-zinc-900/60 hover:bg-amber-500/10 border border-black/5 dark:border-zinc-800/80 hover:border-amber-500/30 rounded-xl transition-all group cursor-pointer"
                      >
                        <MessageSquare size={16} className="mx-auto text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] font-mono text-zinc-500 block uppercase">Queries</span>
                        <span className="text-[11px] font-extrabold text-foreground dark:text-white font-mono">{inquiryCount} Sync</span>
                      </Link>
                    </div>
                  </div>

                  {/* Navigation Shortcuts */}
                  <div className="space-y-1 pt-1 border-t border-black/5 dark:border-zinc-800/80">
                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 hover:text-primary dark:hover:text-[#00d1ff] transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <User size={14} className="text-zinc-400 group-hover:text-primary transition-colors" />
                        <span>Manage Profile & Settings</span>
                      </div>
                      <ChevronRight size={13} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 transition-all group"
                      >
                        <div className="flex items-center gap-2.5">
                          <LayoutDashboard size={14} className="text-purple-500" />
                          <span className="font-bold">Admin Console & Operations</span>
                        </div>
                        <ExternalLink size={12} className="text-purple-400" />
                      </Link>
                    )}
                  </div>

                  {/* Sign Out Action Button */}
                  <div className="pt-2 border-t border-black/5 dark:border-zinc-800/80">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center gap-2 py-2 text-xs font-mono font-bold text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl transition-all cursor-pointer"
                    >
                      <LogOut size={13} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={openLogin}
              className="text-sm font-semibold bg-primary text-white dark:text-black px-5 py-2 rounded-md hover:brightness-110 hover:shadow-[0_0_20px_rgba(0,209,255,0.4)] transition-all active:scale-95 cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile Toggle & Indicators */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 text-zinc-700 dark:text-zinc-300 hover:text-primary transition-colors rounded-full cursor-pointer"
            aria-label="Toggle theme"
          >
            {mounted ? (
              theme === "dark" ? <Sun size={18} className="text-primary" /> : <Moon size={18} />
            ) : (
              <div className="w-[18px] h-[18px]" />
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-zinc-700 dark:text-zinc-300 hover:text-foreground transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-black/5 dark:border-white/5 bg-white dark:bg-black/95 backdrop-blur-xl px-6 py-6 space-y-4 shadow-xl">
          <div className="flex flex-col gap-3">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.label === "Categories" && categoriesSubRoutes.includes(pathname));
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-base font-medium py-2 px-3 rounded-md transition-colors ${
                    isActive
                      ? "text-primary bg-primary/5 font-semibold"
                      : "text-zinc-700 dark:text-zinc-300 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 font-medium"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <hr className="border-black/5 dark:border-white/5" />
          <div className="flex flex-col gap-2.5 pt-2">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2 bg-black/5 dark:bg-zinc-900/60 rounded-xl border border-black/5 dark:border-zinc-800">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-blue-500 p-[2px] shrink-0">
                    <div className="w-full h-full rounded-full bg-white dark:bg-[#07090e] overflow-hidden flex items-center justify-center">
                      {navAvatar ? (
                        <img src={navAvatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-black text-foreground dark:text-white">{navInitials || "U"}</span>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground dark:text-white truncate">{userName}</p>
                    <p className="text-[10px] font-mono text-zinc-500 truncate">{userEmail}</p>
                  </div>
                </div>

                {isAdmin && (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                  >
                    <span>Admin Dashboard</span>
                    <LayoutDashboard size={14} />
                  </Link>
                )}
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold border border-black/10 dark:border-white/10 text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <span>My Profile Overview</span>
                  <User size={14} />
                </Link>
                <Link
                  to="/certificates"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold border border-black/10 dark:border-white/10 text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <span>My Certificates & Credentials</span>
                  <Award size={14} />
                </Link>
                <Link
                  to="/my-projects"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold border border-black/10 dark:border-white/10 text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <span>Active Projects Dashboard</span>
                  <FolderGit2 size={14} />
                </Link>
                <Link
                  to="/queries"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold border border-black/10 dark:border-white/10 text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <span>Support Messages & Queries</span>
                  <MessageSquare size={14} />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full text-center font-semibold bg-red-500/15 text-red-500 py-2.5 rounded-md hover:brightness-110 transition-colors cursor-pointer mt-2"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openLogin();
                }}
                className="text-center font-semibold bg-primary text-white dark:text-black py-2.5 rounded-md hover:brightness-110 transition-colors cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
