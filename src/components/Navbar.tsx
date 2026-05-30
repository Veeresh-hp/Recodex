import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon, Menu, X, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLoginModal } from "@/context/LoginModalContext";

export default function Navbar() {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { openLogin } = useLoginModal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [navAvatar, setNavAvatar] = useState<string | null>(null);
  const [navInitials, setNavInitials] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);

    // Check if the user is authenticated via local bypass
    const isBypassAdmin =
      localStorage.getItem("camcod_session_token") === "admin-bypass-token" ||
      localStorage.getItem("camcod_admin_user") === "true";

    if (isBypassAdmin) {
      setTimeout(() => {
        setIsAuthenticated(true);
        setIsAdmin(true);
        // Load bypass avatar
        const savedAvatar = localStorage.getItem("profile_avatar_sandbox-admin-001");
        if (savedAvatar) setNavAvatar(savedAvatar);
        setNavInitials("VH");
      }, 0);
    } else {
      // Check if a live Supabase Auth session exists
      const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsAuthenticated(true);
          if (session.user && (session.user.email === "veereshhp2004@gmail.com" || session.user.email === "veereshhp04@gmail.com")) {
            setIsAdmin(true);
          }
          // Load avatar: prefer localStorage override, then Google avatar
          const userId = session.user.id;
          const savedAvatar = localStorage.getItem(`profile_avatar_${userId}`);
          const googleAvatar = session.user.user_metadata?.avatar_url || null;
          setNavAvatar(savedAvatar || googleAvatar);
          // Build initials
          const name = session.user.user_metadata?.full_name ||
                       session.user.user_metadata?.name ||
                       session.user.email?.split("@")[0] || "";
          setNavInitials(name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase());
        }
      };
      checkSession();
    }

    // Listen for avatar updates from Profile page
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "recodex_user_avatar" && e.newValue) {
        setNavAvatar(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Subscribe to session transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        if (session.user && (session.user.email === "veereshhp2004@gmail.com" || session.user.email === "veereshhp04@gmail.com")) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
        // Update avatar from localStorage or Google
        const userId = session.user.id;
        const savedAvatar = localStorage.getItem(`profile_avatar_${userId}`);
        const googleAvatar = session.user.user_metadata?.avatar_url || null;
        setNavAvatar(savedAvatar || googleAvatar);
        const name = session.user.user_metadata?.full_name ||
                     session.user.user_metadata?.name ||
                     session.user.email?.split("@")[0] || "";
        setNavInitials(name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase());
      } else {
        const stillBypassed = 
          localStorage.getItem("camcod_session_token") === "admin-bypass-token" ||
          localStorage.getItem("camcod_admin_user") === "true";
        setIsAuthenticated(stillBypassed);
        setIsAdmin(stillBypassed);
        if (!stillBypassed) {
          setNavAvatar(null);
          setNavInitials("");
        }
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase sign out error:", err);
    }
    
    // Clear all bypass tokens
    localStorage.removeItem("camcod_session_token");
    localStorage.removeItem("camcod_admin_user");
    setIsAuthenticated(false);
    
    // Redirect to home page
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
          className="text-2xl font-bold tracking-tight text-foreground hover:text-primary transition-colors flex items-center gap-1 font-sans"
        >
          <span className="font-extrabold text-black dark:text-white">Recode</span>
          <span className="font-light text-primary dark:text-[#00d1ff]">X</span>
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
                    ? "text-primary border-b-2 border-primary rounded-b-none"
                    : "text-gray-500 hover:text-foreground hover:bg-gray-100/50 dark:hover:bg-white/5"
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
            className="p-2 text-gray-500 hover:text-primary transition-colors hover:bg-gray-100 dark:hover:bg-white/5 rounded-full flex items-center justify-center active:scale-90"
            aria-label="Toggle theme"
          >
            {mounted ? (
              theme === "dark" ? <Sun size={20} className="text-primary" /> : <Moon size={20} />
            ) : (
              <div className="w-5 h-5" />
            )}
          </button>
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link
                  to="/dashboard"
                  className="text-sm font-semibold text-gray-500 hover:text-primary transition-colors py-1.5"
                >
                  Dashboard
                </Link>
              )}
              <Link
                to="/profile"
                className="w-9 h-9 rounded-full bg-black/5 dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 flex items-center justify-center text-zinc-550 dark:text-zinc-450 hover:text-primary dark:hover:text-[#00d1ff] hover:border-primary dark:hover:border-[#00d1ff]/50 transition-all hover:shadow-[0_0_12px_rgba(0,209,255,0.15)] active:scale-95 shrink-0 overflow-hidden"
                title="View secure profile"
              >
                {navAvatar ? (
                  <img src={navAvatar} alt="Profile" className="w-full h-full object-cover rounded-full" />
                ) : navInitials ? (
                  <span className="text-[10px] font-black text-foreground dark:text-white">{navInitials}</span>
                ) : (
                  <User size={16} />
                )}
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 px-5 py-2 rounded-md transition-all active:scale-95 cursor-pointer"
              >
                Sign Out
              </button>
            </>
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
            className="p-2 text-gray-500 hover:text-primary transition-colors rounded-full"
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
            className="p-2 text-gray-500 hover:text-foreground transition-colors"
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
                      : "text-gray-500 hover:text-foreground hover:bg-gray-100 dark:hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <hr className="border-black/5 dark:border-white/5" />
          <div className="flex flex-col gap-3 pt-2">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center font-semibold border border-black/10 dark:border-white/10 text-foreground py-2.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center font-semibold border border-black/10 dark:border-white/10 text-foreground py-2.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  My Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-center font-semibold bg-red-500/15 text-red-500 py-2.5 rounded-md hover:brightness-110 transition-colors cursor-pointer"
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
