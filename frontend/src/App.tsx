// Client-side routing workspace
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
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
import { useAuth, useUser } from "@clerk/clerk-react";
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
  const { isLoaded, userId, getToken } = useAuth();
  const { user } = useUser();

  React.useEffect(() => {
    if (!isLoaded) return;

    const handleAuth = async () => {
      if (userId && user) {
        const token = await getToken();
        if (token) {
          localStorage.setItem("recodex_session_token", token);
        } else {
          localStorage.setItem("recodex_session_token", `clerk_${userId}`);
        }

        const userEmail = user.primaryEmailAddress?.emailAddress || "";
        const isAdmin = userEmail === "veereshhp2004@gmail.com";

        if (isAdmin) {
          localStorage.setItem("recodex_admin_user", "true");
        } else {
          localStorage.removeItem("recodex_admin_user");
        }

        localStorage.removeItem("recodex_auth_intent");
        window.dispatchEvent(new Event("recodex-auth-update"));

        const fullName = user.fullName || user.username || userEmail.split("@")[0] || "RecodeX Engineer";

        await syncUser({
          id: userId,
          email: userEmail,
          name: fullName,
          role: isAdmin ? "admin" : "developer",
          profileImage: user.imageUrl || undefined,
        });

        const currentPath = window.location.pathname;
        const isAuthPage = currentPath === "/" || currentPath === "/login" || currentPath === "/signup";
        if (isAuthPage) {
          if (isAdmin) {
            window.location.href = "/dashboard";
          } else {
            window.location.href = "/projects";
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
    };

    handleAuth();
  }, [isLoaded, userId, user, getToken]);


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
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/services" element={<Services />} />
              <Route path="/showcase" element={<Showcase />} />
              <Route path="/solutions" element={<Solutions />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/announcements" element={<Announcements />} />
            </Route>
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </Router>
      </LoginModalProvider>
    </ThemeProvider>
  );
}
