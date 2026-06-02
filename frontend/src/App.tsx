// Client-side routing workspace
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Admin from "./pages/Admin";
import Categories from "./pages/Categories";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import Projects from "./pages/Projects";
import Services from "./pages/Services";
import Showcase from "./pages/Showcase";
import Solutions from "./pages/Solutions";
import Terms from "./pages/Terms";
import Profile from "./pages/Profile";
import Announcements from "./pages/Announcements";
import { ThemeProvider } from "./context/ThemeContext";
import { LoginModalProvider, useLoginModal } from "./context/LoginModalContext";
import InteractiveGrid from "./components/InteractiveGrid";
import LoginModal from "./components/LoginModal";
import Navbar from "./components/Navbar";
import { supabase } from "./lib/supabase";
import { syncUser } from "./services/api";


function RedirectToLoginPopup() {
  const { openLogin } = useLoginModal();

  React.useEffect(() => {
    openLogin();
  }, [openLogin]);

  return <Navigate to="/" replace />;
}

// Persistent layout — Navbar rendered once here, never re-mounts on route change
function PersistentLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

export default function App() {
  React.useEffect(() => {
    // Dynamically load Google Identity Service script for One Tap login
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1028308691515-m3u34d0qfef2lqffn55s9a9m9c9q9o9u.apps.googleusercontent.com";
      if (!googleClientId || googleClientId.includes("YOUR_")) return;

      try {
        const { google } = window as any;
        if (!google?.accounts?.id) return;

        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            console.log("[RECODEX AUTH] Google One Tap Token Received");
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: response.credential,
            });

            if (error) {
              console.error("[RECODEX AUTH] Google One Tap Auth failed:", error.message);
            } else {
              console.log("[RECODEX AUTH] Google One Tap Sign-In successful!", data);
            }
          },
          auto_select: false,
          itp_support: true,
        });

        // Only prompt if the user is not authenticated
        const currentToken = localStorage.getItem("recodex_session_token");
        if (!currentToken) {
          google.accounts.id.prompt();
        }
      } catch (err) {
        console.warn("[RECODEX AUTH] Google One Tap initialization warning:", err);
      }
    };
    document.body.appendChild(script);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[RECODEX AUTH] Event: ${event}`, session);

      if (session) {
        const intent = localStorage.getItem("recodex_auth_intent");

        if (intent !== "signup") {
          // Verify if user exists in the public users table
          const { data: dbUser, error: checkError } = await supabase
            .from("users")
            .select("id")
            .eq("id", session.user.id)
            .maybeSingle();

          const isAdmin = session.user.email === "veereshhp2004@gmail.com" || session.user.email === "veereshhp04@gmail.com";

          if ((!dbUser || checkError) && !isAdmin) {
            console.warn("[RECODEX AUTH] Access Denied: User record not found in database. Signup required.");
            
            // Sign out completely
            await supabase.auth.signOut();
            localStorage.removeItem("recodex_session_token");
            localStorage.removeItem("recodex_admin_user");
            localStorage.removeItem("recodex_auth_intent");
            window.dispatchEvent(new Event("recodex-auth-update"));
            
            // Redirect to login with error parameter
            window.location.href = "/login?error=user_not_found";
            return;
          }
        }

        // Standard user sync (for signups or valid logins)
        localStorage.setItem("recodex_session_token", session.access_token);
        localStorage.removeItem("recodex_auth_intent");
        window.dispatchEvent(new Event("recodex-auth-update"));

        if (session.user) {
          const fullName = session.user.user_metadata?.full_name ||
                           session.user.user_metadata?.name ||
                           session.user.email?.split("@")[0] ||
                           "RecodeX Engineer";

          await syncUser({
            id: session.user.id,
            email: session.user.email || "",
            name: fullName,
            role: session.user.user_metadata?.role || "developer",
            profileImage: session.user.user_metadata?.avatar_url || null,
          });

          // Auto-login redirect for landing / auth pages after signup/signin resolves
          const currentPath = window.location.pathname;
          const isAuthPage = currentPath === "/" || currentPath === "/login" || currentPath === "/signup";
          if (isAuthPage) {
            const isAdmin = session.user.email === "veereshhp2004@gmail.com" || session.user.email === "veereshhp04@gmail.com";
            if (isAdmin) {
              localStorage.setItem("recodex_admin_user", "true");
              window.dispatchEvent(new Event("recodex-auth-update"));
              window.location.href = "/dashboard";
            } else {
              window.dispatchEvent(new Event("recodex-auth-update"));
              window.location.href = "/projects";
            }
          }
        }
      } else {
        const currentToken = localStorage.getItem("recodex_session_token");
        if (currentToken && currentToken !== "admin-bypass-token") {
          localStorage.removeItem("recodex_session_token");
          localStorage.removeItem("recodex_admin_user");
          window.dispatchEvent(new Event("recodex-auth-update"));
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <ThemeProvider>
      <LoginModalProvider>
        <Router>
          <InteractiveGrid />
          <LoginModal />
          <Routes>
            {/* All routes share the single persistent Navbar via PersistentLayout */}
            <Route element={<PersistentLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<RedirectToLoginPopup />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/services" element={<Services />} />
              <Route path="/showcase" element={<Showcase />} />
              <Route path="/solutions" element={<Solutions />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/announcements" element={<Announcements />} />
            </Route>
          </Routes>
        </Router>
      </LoginModalProvider>
    </ThemeProvider>
  );
}
