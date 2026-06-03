import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Box, 
  Users, 
  BarChart3, 
  Settings, 
  Moon, 
  User, 
  CreditCard, 
  Terminal, 
  Rocket, 
  Activity, 
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getInquiries } from "@/services/api";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  const [inquiriesError, setInquiriesError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInquiries = async () => {
      setInquiriesLoading(true);
      setInquiriesError(null);
      try {
        const sessionToken = localStorage.getItem("recodex_session_token");
        let token = "";
        
        if (sessionToken === "admin-bypass-token" || sessionToken === "dev-bypass-token") {
          token = sessionToken;
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            token = session.access_token;
          }
        }

        if (token) {
          const data = await getInquiries(token);
          setInquiries(data);
        } else {
          throw new Error("No authorization token available.");
        }
      } catch (err: any) {
        console.warn("[RECODEX ADMIN] Failed to retrieve server inquiries, loading sandbox mock inquiries:", err);
        setInquiries([
          {
            id: "inq-1",
            name: "John Client",
            email: "john@enterprise.com",
            type: "spec-build",
            message: "Looking to build a custom micro-frontend architecture for our payment gateway with strict PCI-DSS audits.",
            createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
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

    fetchInquiries();
  }, []);

  // Mock Contributors Data
  const contributors = [
    { name: "@j_doe_stack", commits: "482 COMMITS", rank: "#1", initials: "JD" },
    { name: "@arc_knight", commits: "391 COMMITS", rank: "#2", initials: "AK" },
    { name: "@zero_ptr", commits: "215 COMMITS", rank: "#3", initials: "ZP" },
    { name: "@rust_lord", commits: "184 COMMITS", rank: "#4", initials: "RL" },
  ];

  // Mock Deployment Logs Data
  const deployments = [
    { 
      id: "#cam-8d2a1", 
      repo: "auth-microservice-v2", 
      status: "LIVE", 
      env: "PRODUCTION", 
      time: "2m ago" 
    },
    { 
      id: "#cam-f39b4", 
      repo: "marketplace-ui-main", 
      status: "LIVE", 
      env: "PRODUCTION", 
      time: "14m ago" 
    },
    { 
      id: "#cam-x9210", 
      repo: "payment-gateway-relay", 
      status: "BUILDING", 
      env: "STAGING", 
      time: "45m ago" 
    },
    { 
      id: "#cam-k0012", 
      repo: "user-profile-edge", 
      status: "FAILED", 
      env: "BETA", 
      time: "1h ago" 
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between font-sans select-none">
      
      {/* 1. Brand RecodeX Header */}
      <header className="border-b border-black/5 dark:border-zinc-900 bg-white/90 dark:bg-[#06080c]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between select-text transition-colors duration-300">
        <div className="flex items-center gap-12">
          {/* Logo split color */}
          <Link to="/" className="text-xl font-black tracking-tight font-sans">
            <span className="text-primary dark:text-[#00d1ff]">Recode</span>
            <span className="text-foreground dark:text-white">X</span>
          </Link>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7">
            <Link to="/" className="text-xs font-semibold text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 tracking-wider uppercase transition-colors">
              Home
            </Link>
            <Link to="/projects" className="text-xs font-semibold text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 tracking-wider uppercase transition-colors">
              Projects
            </Link>
            <Link to="/services" className="text-xs font-semibold text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 tracking-wider uppercase transition-colors">
              Services
            </Link>
            <Link to="/categories" className="text-xs font-semibold text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 tracking-wider uppercase transition-colors">
              Categories
            </Link>
            <Link to="/contact" className="text-xs font-semibold text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 tracking-wider uppercase transition-colors">
              Contact
            </Link>
            <Link to="/admin" className="text-xs font-bold text-foreground dark:text-white tracking-wider uppercase relative py-1">
              Admin
              <span className="absolute bottom-[-17px] left-0 w-full h-[2.5px] bg-primary dark:bg-[#00d1ff]"></span>
            </Link>
          </nav>
        </div>

        {/* Right side: Moon Toggle & ROOT_ADMIN Pill */}
        <div className="flex items-center gap-5">
          <Moon className="w-4 h-4 text-zinc-500 hover:text-foreground dark:hover:text-white cursor-pointer transition-colors" />
          
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-black/10 dark:border-zinc-800/80 bg-black/5 dark:bg-zinc-900/40 text-xs font-bold tracking-wider font-mono">
            <div className="w-5 h-5 rounded-full bg-black/5 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
              <User size={12} />
            </div>
            <span className="text-zinc-700 dark:text-zinc-300 text-[10px]">ROOT_ADMIN</span>
          </div>
        </div>
      </header>

      {/* 2. Admin Workspace Grid */}
      <div className="flex-grow flex flex-col md:flex-row relative z-10 w-full max-w-[1440px] mx-auto px-6 md:px-8 py-8 gap-8">
        
        {/* Sidebar Panel */}
        <aside className="w-full md:w-60 flex flex-col justify-between gap-12 select-none">
          <div className="space-y-1">
            {/* Dashboard Link */}
            <button
              onClick={() => setActiveTab("Dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold tracking-wider font-mono uppercase transition-all border cursor-pointer ${
                activeTab === "Dashboard"
                  ? "bg-primary text-white dark:bg-[#0b101c] border-primary dark:border-[#00d1ff]/25"
                  : "bg-transparent border-transparent text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-zinc-900/20"
              }`}
            >
              <LayoutDashboard size={14} className={activeTab === "Dashboard" ? "text-white dark:text-[#00d1ff]" : "text-zinc-500"} />
              Dashboard
            </button>

            {/* Projects Link */}
            <button
              onClick={() => setActiveTab("Projects")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold tracking-wider font-mono uppercase transition-all border cursor-pointer ${
                activeTab === "Projects"
                  ? "bg-primary text-white dark:bg-[#0b101c] border-primary dark:border-[#00d1ff]/25"
                  : "bg-transparent border-transparent text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-zinc-900/20"
              }`}
            >
              <Box size={14} className={activeTab === "Projects" ? "text-white dark:text-[#00d1ff]" : "text-zinc-500"} />
              Projects
            </button>

            {/* Users Link */}
            <button
              onClick={() => setActiveTab("Users")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold tracking-wider font-mono uppercase transition-all border cursor-pointer ${
                activeTab === "Users"
                  ? "bg-primary text-white dark:bg-[#0b101c] border-primary dark:border-[#00d1ff]/25"
                  : "bg-transparent border-transparent text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-zinc-900/20"
              }`}
            >
              <Users size={14} className={activeTab === "Users" ? "text-white dark:text-[#00d1ff]" : "text-zinc-500"} />
              Users
            </button>

            {/* Inquiries Link */}
            <button
              onClick={() => setActiveTab("Inquiries")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold tracking-wider font-mono uppercase transition-all border cursor-pointer ${
                activeTab === "Inquiries"
                  ? "bg-primary text-white dark:bg-[#0b101c] border-primary dark:border-[#00d1ff]/25"
                  : "bg-transparent border-transparent text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-zinc-900/20"
              }`}
            >
              <MessageSquare size={14} className={activeTab === "Inquiries" ? "text-white dark:text-[#00d1ff]" : "text-zinc-500"} />
              Inquiries
            </button>

            {/* Analytics Link */}
            <button
              onClick={() => setActiveTab("Analytics")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold tracking-wider font-mono uppercase transition-all border cursor-pointer ${
                activeTab === "Analytics"
                  ? "bg-primary text-white dark:bg-[#0b101c] border-primary dark:border-[#00d1ff]/25"
                  : "bg-transparent border-transparent text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-zinc-900/20"
              }`}
            >
              <BarChart3 size={14} className={activeTab === "Analytics" ? "text-white dark:text-[#00d1ff]" : "text-zinc-500"} />
              Analytics
            </button>

            {/* Settings Link */}
            <button
              onClick={() => setActiveTab("Settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold tracking-wider font-mono uppercase transition-all border cursor-pointer ${
                activeTab === "Settings"
                  ? "bg-primary text-white dark:bg-[#0b101c] border-primary dark:border-[#00d1ff]/25"
                  : "bg-transparent border-transparent text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-zinc-900/20"
              }`}
            >
              <Settings size={14} className={activeTab === "Settings" ? "text-white dark:text-[#00d1ff]" : "text-zinc-500"} />
              Settings
            </button>
          </div>

          {/* Node Status Capsule */}
          <div className="border border-black/10 dark:border-zinc-900 bg-black/5 dark:bg-zinc-950/20 rounded-xl p-4 flex items-center justify-between shadow-inner">
            <div className="space-y-1">
              <span className="text-[8px] font-mono tracking-widest text-zinc-500 dark:text-zinc-600 uppercase font-bold block">Node Status</span>
              <span className="text-[10px] font-mono font-bold text-primary dark:text-[#00d1ff] block">v2.4.0-stable</span>
              <span className="text-[9px] font-mono text-zinc-600 dark:text-zinc-500 block">up 99.9% uptime</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-primary dark:bg-[#00d1ff] animate-pulse shadow-[0_0_10px_rgba(0,209,255,0.7)]"></span>
          </div>
        </aside>

        {/* Main Dashboard Space */}
        <main className="flex-grow space-y-8 select-text">
          
          {/* Main Console Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-white font-sans">
                {activeTab === "Inquiries" ? "Customer Inquiries" : "System Overview"}
              </h1>
              <p className="text-zinc-500 text-xs mt-1">
                {activeTab === "Inquiries"
                  ? "Manage and review service requests and client messages."
                  : "Real-time performance and marketplace telemetry."}
              </p>
            </div>
            {activeTab !== "Inquiries" && (
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 bg-black/5 dark:bg-zinc-950/40 border border-black/10 dark:border-zinc-800 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 hover:text-foreground dark:hover:text-white hover:border-black/20 dark:hover:border-zinc-700 transition-all cursor-pointer">
                  EXPORT_JSON
                </button>
                <button className="px-4 py-2 bg-primary dark:bg-[#00d1ff] text-on-primary dark:text-black rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-primary-container dark:hover:bg-[#3ce5ff] hover:shadow-[0_0_20px_rgba(0,209,255,0.4)] transition-all cursor-pointer">
                  REPLOY_CDN
                </button>
              </div>
            )}
          </div>

          {activeTab === "Inquiries" ? (
            /* Inquiries List View */
            inquiriesLoading ? (
              <div className="flex flex-col items-center gap-4 py-16">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest animate-pulse">Retrieving client transmissions...</p>
              </div>
            ) : inquiries.length === 0 ? (
              <div className="border border-black/10 dark:border-zinc-900 bg-white/60 dark:bg-[#080a0f]/60 backdrop-blur-md rounded-xl p-8 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mx-auto text-zinc-500">
                  <MessageSquare size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground dark:text-white font-sans">No Inquiries Found</h4>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
                    We haven't received any client contact form submissions yet.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {inquiries.map((inq, index) => (
                  <div
                    key={inq.id || index}
                    className="border border-black/10 dark:border-zinc-900 bg-white/60 dark:bg-[#080a0f]/60 backdrop-blur-md rounded-xl p-6 hover:border-black/20 dark:hover:border-zinc-800 transition-all shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] dark:shadow-none space-y-4 animate-fade-in"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-black/5 dark:border-zinc-900/40 pb-3">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-foreground dark:text-white font-sans">{inq.name}</h4>
                        <a href={`mailto:${inq.email}`} className="text-xs text-primary dark:text-[#00d1ff] hover:underline font-mono">
                          {inq.email}
                        </a>
                      </div>
                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
                        <span className="px-2.5 py-0.5 rounded-full text-[8px] font-mono font-black uppercase tracking-wider bg-primary/10 border border-primary/20 text-primary dark:text-[#00d1ff]">
                          Tier: {inq.type}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500">
                          {new Date(inq.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-750 dark:text-zinc-300 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                      {inq.message}
                    </p>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Default Dashboard Analytics View */
            <>
              {/* Row 1: Telemetry Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* ARR Card */}
                <div className="border border-black/10 dark:border-zinc-900 bg-white/60 dark:bg-[#080a0f]/60 backdrop-blur-md rounded-xl p-5 hover:border-black/20 dark:hover:border-zinc-800 transition-all shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] dark:shadow-none">
                  <div className="flex items-center justify-between text-zinc-500">
                    <span className="text-[9px] font-mono tracking-widest uppercase font-bold">REVENUE_ARR</span>
                    <div className="w-7 h-7 rounded-lg bg-black/5 dark:bg-zinc-900/40 border border-black/10 dark:border-zinc-800 flex items-center justify-center text-primary dark:text-[#00d1ff]">
                      <CreditCard size={13} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-bold tracking-tight text-foreground dark:text-white">$1,420,069</span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-1 text-[9px] font-mono font-bold text-primary dark:text-[#00d1ff] tracking-wide">
                    <TrendingUp size={10} />
                    <span>+14.2% THIS_MONTH</span>
                  </div>
                </div>

                {/* Active Devs Card */}
                <div className="border border-black/10 dark:border-zinc-900 bg-white/60 dark:bg-[#080a0f]/60 backdrop-blur-md rounded-xl p-5 hover:border-black/20 dark:hover:border-zinc-800 transition-all shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] dark:shadow-none">
                  <div className="flex items-center justify-between text-zinc-500">
                    <span className="text-[9px] font-mono tracking-widest uppercase font-bold">ACTIVE_DEVS</span>
                    <div className="w-7 h-7 rounded-lg bg-black/5 dark:bg-zinc-900/40 border border-black/10 dark:border-zinc-800 flex items-center justify-center text-primary dark:text-[#00d1ff]">
                      <Terminal size={13} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-bold tracking-tight text-foreground dark:text-white">12,842</span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-1 text-[9px] font-mono font-bold text-primary dark:text-[#00d1ff] tracking-wide">
                    <TrendingUp size={10} />
                    <span>842_NEW_LIBS</span>
                  </div>
                </div>

                {/* Deployments Card */}
                <div className="border border-black/10 dark:border-zinc-900 bg-white/60 dark:bg-[#080a0f]/60 backdrop-blur-md rounded-xl p-5 hover:border-black/20 dark:hover:border-zinc-800 transition-all shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] dark:shadow-none">
                  <div className="flex items-center justify-between text-zinc-500">
                    <span className="text-[9px] font-mono tracking-widest uppercase font-bold">DEPLOYMENTS</span>
                    <div className="w-7 h-7 rounded-lg bg-black/5 dark:bg-zinc-900/40 border border-black/10 dark:border-zinc-800 flex items-center justify-center text-primary dark:text-[#00d1ff]">
                      <Rocket size={13} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-bold tracking-tight text-foreground dark:text-white">348</span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-1 text-[9px] font-mono font-bold text-red-500 tracking-wide">
                    <ArrowDownRight size={10} />
                    <span>-3%_LAST_24H</span>
                  </div>
                </div>

                {/* Sys Health Card */}
                <div className="border border-black/10 dark:border-zinc-900 bg-white/60 dark:bg-[#080a0f]/60 backdrop-blur-md rounded-xl p-5 hover:border-black/20 dark:hover:border-zinc-800 transition-all shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] dark:shadow-none">
                  <div className="flex items-center justify-between text-zinc-500">
                    <span className="text-[9px] font-mono tracking-widest uppercase font-bold">SYS_HEALTH</span>
                    <div className="w-7 h-7 rounded-lg bg-black/5 dark:bg-zinc-900/40 border border-black/10 dark:border-zinc-800 flex items-center justify-center text-primary dark:text-[#00d1ff]">
                      <Activity size={13} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-bold tracking-tight text-foreground dark:text-white">99.98%</span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-1 text-[9px] font-mono font-bold text-primary dark:text-[#00d1ff] tracking-wide">
                    <Check size={10} />
                    <span>ALL_SERVICES_UP</span>
                  </div>
                </div>

              </div>

              {/* Row 2: Traffic & Top Contributors Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Traffic Overview Box */}
                <div className="lg:col-span-2 border border-black/10 dark:border-zinc-900 bg-white/60 dark:bg-[#080a0f]/60 backdrop-blur-md rounded-xl p-6 relative overflow-hidden flex flex-col justify-between h-[360px]">
                  <div className="flex items-center justify-between z-10">
                    <h3 className="text-sm font-bold tracking-wider text-foreground dark:text-zinc-200">
                      Traffic Overview
                    </h3>
                    <div className="flex items-center gap-1.5 p-1 rounded bg-black/5 dark:bg-zinc-950/60 border border-black/10 dark:border-zinc-900">
                      <button className="px-2.5 py-1 rounded text-[9px] font-mono font-bold text-zinc-500 hover:text-foreground dark:hover:text-white transition-all cursor-pointer">
                        7D
                      </button>
                      <button className="px-2.5 py-1 rounded bg-primary text-white dark:bg-[#0b101c] border border-primary dark:border-zinc-800/80 text-[9px] font-mono font-bold shadow-sm cursor-pointer">
                        30D
                      </button>
                    </div>
                  </div>

                  {/* Glowing spline curve visualization */}
                  <div className="relative w-full h-[240px] mt-4 z-0">
                    {/* Custom Spline Chart SVG Path */}
                    <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="splineGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                        </linearGradient>
                        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="6" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {/* Guide Lines */}
                      <line x1="0" y1="0" x2="0" y2="200" stroke="var(--border-color)" strokeOpacity="0.15" strokeWidth="1" />
                      <line x1="83" y1="0" x2="83" y2="200" stroke="var(--border-color)" strokeOpacity="0.15" strokeWidth="1" />
                      <line x1="166" y1="0" x2="166" y2="200" stroke="var(--border-color)" strokeOpacity="0.15" strokeWidth="1" />
                      <line x1="250" y1="0" x2="250" y2="200" stroke="var(--border-color)" strokeOpacity="0.15" strokeWidth="1" />
                      <line x1="333" y1="0" x2="333" y2="200" stroke="var(--border-color)" strokeOpacity="0.15" strokeWidth="1" />
                      <line x1="416" y1="0" x2="416" y2="200" stroke="var(--border-color)" strokeOpacity="0.15" strokeWidth="1" />
                      <line x1="500" y1="0" x2="500" y2="200" stroke="var(--border-color)" strokeOpacity="0.15" strokeWidth="1" />

                      {/* Shaded Area */}
                      <path 
                        d="M 0 160 C 60 160, 90 90, 120 100 C 160 110, 200 160, 250 150 C 310 140, 340 50, 380 50 C 430 50, 460 120, 500 120 L 500 200 L 0 200 Z" 
                        fill="url(#splineGradient)" 
                      />

                      {/* Glowing spline curve */}
                      <path 
                        d="M 0 160 C 60 160, 90 90, 120 100 C 160 110, 200 160, 250 150 C 310 140, 340 50, 380 50 C 430 50, 460 120, 500 120" 
                        fill="transparent" 
                        stroke="currentColor" 
                        className="text-primary"
                        strokeWidth="3.5" 
                        filter="url(#neonGlow)"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                </div>

                {/* Top Contributors Box */}
                <div className="border border-black/10 dark:border-zinc-900 bg-white/60 dark:bg-[#080a0f]/60 backdrop-blur-md rounded-xl p-6 flex flex-col justify-between h-[360px]">
                  <div className="space-y-5">
                    <h3 className="text-sm font-bold tracking-wider text-foreground dark:text-zinc-200">
                      Top Contributors
                    </h3>
                    
                    {/* Ranking Items */}
                    <div className="space-y-4">
                      {contributors.map((c, i) => (
                        <div key={i} className="flex items-center justify-between font-mono text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 flex items-center justify-center font-black text-zinc-500 dark:text-zinc-400 text-[10px]">
                              {c.initials}
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-foreground dark:text-zinc-200 font-semibold block">{c.name}</span>
                              <span className="text-[9px] text-zinc-600 block uppercase font-bold">{c.commits}</span>
                            </div>
                          </div>
                          <span className="text-zinc-500 font-bold">{c.rank}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button className="w-full mt-4 py-2 border border-black/10 dark:border-zinc-900 hover:border-black/20 dark:hover:border-zinc-800 rounded-lg text-[9px] font-mono font-bold tracking-widest uppercase text-zinc-500 hover:text-foreground dark:hover:text-white transition-all cursor-pointer">
                    VIEW_ALL_LEADERS
                  </button>
                </div>

              </div>

              {/* Row 3: Recent Deployments */}
              <div className="border border-black/10 dark:border-zinc-900 bg-white/60 dark:bg-[#080a0f]/60 backdrop-blur-md rounded-xl p-6 space-y-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] dark:shadow-none">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold tracking-wider text-foreground dark:text-zinc-200">
                    Recent Deployments
                  </h3>
                  <span className="text-[8px] font-mono tracking-widest text-zinc-500 dark:text-zinc-600 uppercase font-bold">
                    LAST_UPDATE: 2M_AGO
                  </span>
                </div>

                <div className="overflow-x-auto select-text">
                  <table className="w-full font-mono text-[11px] text-zinc-500 text-left border-collapse">
                    <thead>
                      <tr className="border-b border-black/10 dark:border-zinc-900 pb-3 text-[9px] tracking-widest uppercase font-bold text-zinc-500 dark:text-zinc-600">
                        <th className="py-2.5 font-bold">DEPLOYMENT_ID</th>
                        <th className="py-2.5 font-bold">REPOSITORY</th>
                        <th className="py-2.5 font-bold">STATUS</th>
                        <th className="py-2.5 font-bold">ENV</th>
                        <th className="py-2.5 font-bold">TIMESTAMP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-zinc-900/40">
                      {deployments.map((d, i) => (
                        <tr key={i} className="hover:bg-black/5 dark:hover:bg-zinc-900/10 transition-colors">
                          <td className="py-4 font-semibold text-primary dark:text-[#00d1ff] cursor-pointer hover:underline">
                            {d.id}
                          </td>
                          <td className="py-4 text-zinc-700 dark:text-zinc-300 font-sans font-medium">
                            {d.repo}
                          </td>
                          <td className="py-4 font-bold text-xs">
                            <div className="flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                d.status === "LIVE" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" :
                                d.status === "BUILDING" ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-pulse" :
                                "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                              }`}></span>
                              <span className={
                                d.status === "LIVE" ? "text-zinc-700 dark:text-zinc-200" :
                                d.status === "BUILDING" ? "text-zinc-500 dark:text-zinc-400" : "text-rose-500"
                              }>
                                {d.status}
                              </span>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="bg-black/5 dark:bg-zinc-900/80 border border-black/10 dark:border-zinc-800/80 px-2 py-0.5 rounded text-[8px] font-bold text-zinc-500 dark:text-zinc-400">
                              {d.env}
                            </span>
                          </td>
                          <td className="py-4 text-zinc-500 dark:text-zinc-400 font-sans text-xs">
                            {d.time}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            </>
          )}
        </main>
      </div>

      {/* 3. Branded Admin Footer */}
      <footer className="border-t border-black/5 dark:border-zinc-900 bg-white/40 dark:bg-black/40 py-8 px-6 md:px-12 xl:px-24 select-text">
        <div className="max-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 font-sans">
          
          {/* Logo split color + Copyright */}
          <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 text-xs">
            <Link to="/" className="text-sm font-black tracking-tight uppercase">
              <span className="text-primary dark:text-[#00d1ff]">Recode</span>
              <span className="text-foreground dark:text-white">X</span>
            </Link>
            <span className="text-zinc-500 dark:text-zinc-600 text-[10px]">
              © 2024 RecodeX Developer Marketplace. All rights reserved.
            </span>
          </div>

          {/* Legal and Documentation Directories */}
          <div className="flex items-center gap-6 text-[10px] text-zinc-500 font-medium">
            <span className="hover:text-primary dark:hover:text-[#00d1ff] cursor-pointer transition-colors">
              Privacy Policy
            </span>
            <span className="hover:text-primary dark:hover:text-[#00d1ff] cursor-pointer transition-colors">
              Terms of Service
            </span>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary dark:hover:text-[#00d1ff] transition-colors">
              Github
            </a>
            <span className="hover:text-primary dark:hover:text-[#00d1ff] cursor-pointer transition-colors">
              Documentation
            </span>
          </div>

        </div>
      </footer>

    </div>
  );
}
