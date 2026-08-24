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
import Docs from "./pages/Docs";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Profile from "./pages/Profile";
import Announcements from "./pages/Announcements";
import About from "./pages/About";
import { ThemeProvider } from "./context/ThemeContext";
import { LoginModalProvider, useLoginModal } from "./context/LoginModalContext";
import InteractiveGrid from "./components/InteractiveGrid";
import LoginModal from "./components/LoginModal";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { useAuth, useUser } from "@clerk/clerk-react";
import { syncUser } from "./services/api";


function RedirectToLoginPopup() {
  const { openLogin } = useLoginModal();

  React.useEffect(() => {
    openLogin();
  }, [openLogin]);

  return <Navigate to="/" replace />;
}

// Persistent layout — Navbar & Footer rendered once here for all pages
function PersistentLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

export default function App() {
  const { isLoaded, userId, getToken } = useAuth();
  const { user } = useUser();

  React.useEffect(() => {
    if (!isLoaded) return;

    // Purge legacy dummy accounts from local storage
    try {
      const raw = localStorage.getItem("recodex_synced_users");
      if (raw) {
        const dummyEmails = ["john.doe@recodex.io", "sarah@skynet.com", "vance@blackmesa.org"];
        const cleaned = JSON.parse(raw).filter((u: any) => u && u.email && !dummyEmails.includes(u.email.toLowerCase()));
        localStorage.setItem("recodex_synced_users", JSON.stringify(cleaned));
      }
    } catch (e) {
      console.error(e);
    }

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

        const firstName = user.firstName || "";
        const lastName = user.lastName || "";
        const fullName = [firstName, lastName].filter(Boolean).join(" ") || user.fullName || user.username || userEmail.split("@")[0] || "RecodeX Engineer";

        await syncUser({
          id: userId,
          email: userEmail,
          name: fullName,
          role: isAdmin ? "admin" : "client",
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
              <Route path="/showcase" element={<Navigate to="/projects" replace />} />
              <Route path="/solutions" element={<Solutions />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/about" element={<About />} />
            </Route>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </LoginModalProvider>
    </ThemeProvider>
  );
}
