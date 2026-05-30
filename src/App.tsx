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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[RECODEX AUTH] Event: ${event}`, session);

      if (session) {
        localStorage.setItem("camcod_session_token", session.access_token);

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
        }
      } else {
        const currentToken = localStorage.getItem("camcod_session_token");
        if (currentToken && currentToken !== "admin-bypass-token") {
          localStorage.removeItem("camcod_session_token");
          localStorage.removeItem("camcod_admin_user");
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
