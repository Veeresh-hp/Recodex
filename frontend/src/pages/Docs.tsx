import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  BookOpen, Terminal, Code2, Cpu, Shield, Search, ChevronRight, Copy, Check, ExternalLink, Zap, Layers, FileText 
} from "lucide-react";
import SubNavbar from "../components/SubNavbar";

export default function Docs() {
  const [activeSection, setActiveSection] = useState("quickstart");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const sections = [
    { id: "quickstart", title: "Quickstart Guide", icon: Zap },
    { id: "architecture", title: "Architecture Overview", icon: Layers },
    { id: "api", title: "API Reference", icon: Code2 },
    { id: "projects", title: "Project Runner Engine", icon: Terminal },
    { id: "security", title: "Security & Auditing", icon: Shield },
  ];

  return (
    <>
      <SubNavbar />

      <main className="min-h-screen bg-background text-foreground relative font-sans bg-grid-layout">
        {/* Glows */}
        <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none z-0"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-6 pb-20">
          
          {/* Hero Header */}
          <div className="space-y-4 mb-10 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-container/10 border border-outline-variant/30 text-primary rounded-full backdrop-blur-sm">
              <BookOpen size={14} className="text-primary animate-pulse" />
              <span className="font-mono uppercase tracking-widest text-[9px] font-bold">Official Technical Specification</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              RecodeX <span className="text-primary italic">Developer Documentation</span>
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Complete technical guides, API references, architecture standards, and runtime instructions for deploying and interacting with RecodeX projects.
            </p>

            {/* Search Input */}
            <div className="pt-2 max-w-md relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search documentation, APIs, endpoints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-foreground placeholder-zinc-500 focus:outline-none focus:border-primary transition-all font-mono"
              />
            </div>
          </div>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-3 space-y-2 sticky top-[136px] self-start z-20 select-none">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold px-3 block mb-2">
                Documentation Modules
              </span>
              <div className="space-y-1">
                {sections.map((sec) => {
                  const IconComponent = sec.icon;
                  const isActive = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => setActiveSection(sec.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        isActive
                          ? "bg-primary text-white dark:bg-[#0b101c] border-primary dark:border-[#00d1ff]/25 font-bold"
                          : "bg-surface/50 border-outline-variant/30 text-zinc-600 dark:text-zinc-400 hover:text-foreground dark:hover:text-white hover:border-outline-variant"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <IconComponent size={14} className={isActive ? "text-white dark:text-[#00d1ff]" : "text-zinc-400"} />
                        <span>{sec.title}</span>
                      </div>
                      <ChevronRight size={12} className={isActive ? "text-white dark:text-[#00d1ff]" : "text-transparent"} />
                    </button>
                  );
                })}
              </div>

              {/* Quick Contact Card */}
              <div className="pt-4">
                <div className="p-4 rounded-xl border border-outline-variant/40 bg-surface/40 backdrop-blur-md space-y-2">
                  <h4 className="text-xs font-bold text-foreground">Need Custom Architecture?</h4>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Our core team is available for enterprise technical consultation and dedicated support.
                  </p>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline pt-1"
                  >
                    <span>Contact Engineering</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            </aside>

            {/* Main Content Pane */}
            <div className="lg:col-span-9 space-y-8">
              
              {/* Section 1: Quickstart Guide */}
              {activeSection === "quickstart" && (
                <div className="space-y-6">
                  <div className="glass-card p-6 md:p-8 rounded-2xl border border-outline-variant/40 space-y-4">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Quickstart Guide</h2>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      Follow these steps to explore projects, run live interactive applications in the RecodeX sandbox, and interact with the API endpoints.
                    </p>

                    <div className="space-y-4 pt-2">
                      <div className="p-4 rounded-xl bg-black/5 dark:bg-black/40 border border-outline-variant/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-primary">1. Clone &amp; Install Dependencies</span>
                          <button
                            onClick={() => handleCopyCode("git clone https://github.com/Veeresh-hp/Recodex.git\ncd Recodex\nnpm run setup", 1)}
                            className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedIndex === 1 ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                            <span>{copiedIndex === 1 ? "COPIED" : "COPY"}</span>
                          </button>
                        </div>
                        <pre className="font-mono text-[11px] text-zinc-300 overflow-x-auto p-2 bg-black/60 rounded">
                          <code>git clone https://github.com/Veeresh-hp/Recodex.git&#10;cd Recodex&#10;npm run setup</code>
                        </pre>
                      </div>

                      <div className="p-4 rounded-xl bg-black/5 dark:bg-black/40 border border-outline-variant/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-primary">2. Launch Full-Stack Server &amp; Client</span>
                          <button
                            onClick={() => handleCopyCode("npm run dev", 2)}
                            className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedIndex === 2 ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                            <span>{copiedIndex === 2 ? "COPIED" : "COPY"}</span>
                          </button>
                        </div>
                        <pre className="font-mono text-[11px] text-zinc-300 overflow-x-auto p-2 bg-black/60 rounded">
                          <code>npm run dev</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 2: Architecture Overview */}
              {activeSection === "architecture" && (
                <div className="space-y-6">
                  <div className="glass-card p-6 md:p-8 rounded-2xl border border-outline-variant/40 space-y-4">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">System Architecture</h2>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      RecodeX combines a high-performance React/Vite single-page frontend with an Express API back-end powered by MongoDB and Prisma ORM.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 font-mono text-xs">
                      <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 space-y-2">
                        <div className="flex items-center gap-2 text-primary font-bold">
                          <Layers size={14} />
                          <span>Frontend Layer</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 font-sans">
                          Built with Vite, React 18, Tailwind CSS, Lucide icons, and Clerk Authentication for high speed and accessibility.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 space-y-2">
                        <div className="flex items-center gap-2 text-primary font-bold">
                          <Cpu size={14} />
                          <span>Backend API Layer</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 font-sans">
                          Express server on port 5000 connected to MongoDB Atlas via Prisma ORM for projects, users, and telemetry data.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 3: API Reference */}
              {activeSection === "api" && (
                <div className="space-y-6">
                  <div className="glass-card p-6 md:p-8 rounded-2xl border border-outline-variant/40 space-y-4">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">API Endpoints Reference</h2>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      Standard JSON REST API endpoints exposed by the RecodeX backend server:
                    </p>

                    <div className="space-y-3 font-mono text-xs pt-2">
                      <div className="p-3.5 rounded-xl bg-surface border border-outline-variant/40 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold text-[10px]">GET</span>
                          <span className="text-foreground font-bold">/api/projects</span>
                        </div>
                        <span className="text-[11px] text-zinc-500 font-sans">Fetch list of active repository projects</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-surface border border-outline-variant/40 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold text-[10px]">POST</span>
                          <span className="text-foreground font-bold">/api/users/sync</span>
                        </div>
                        <span className="text-[11px] text-zinc-500 font-sans">Sync authenticated user profile metadata</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-surface border border-outline-variant/40 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold text-[10px]">GET</span>
                          <span className="text-foreground font-bold">/api/announcements</span>
                        </div>
                        <span className="text-[11px] text-zinc-500 font-sans">Retrieve live platform announcements</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 4: Project Runner Engine */}
              {activeSection === "projects" && (
                <div className="space-y-6">
                  <div className="glass-card p-6 md:p-8 rounded-2xl border border-outline-variant/40 space-y-4">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Project Runner &amp; Sandbox</h2>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      Each project featured in RecodeX can be executed live inside an isolated modal iframe or opened directly in a new full browser window.
                    </p>

                    <div className="pt-2 flex flex-wrap gap-4">
                      <Link
                        to="/projects"
                        className="px-5 py-2.5 bg-primary text-white dark:text-black font-semibold rounded-xl text-xs flex items-center gap-2 hover:brightness-110 transition-all"
                      >
                        <Terminal size={14} />
                        <span>Explore Projects Live</span>
                      </Link>
                      <Link
                        to="/marketplace"
                        className="px-5 py-2.5 bg-surface border border-outline-variant text-foreground font-semibold rounded-xl text-xs flex items-center gap-2 hover:bg-surface-container-low transition-all"
                      >
                        <Code2 size={14} />
                        <span>Browse Marketplace</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 5: Security */}
              {activeSection === "security" && (
                <div className="space-y-6">
                  <div className="glass-card p-6 md:p-8 rounded-2xl border border-outline-variant/40 space-y-4">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Security &amp; Compliance</h2>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      RecodeX enforces zero-trust data access, Clerk authentication, CORS isolation, and sanitized static asset rendering for high reliability.
                    </p>

                    <div className="p-4 rounded-xl bg-surface border border-outline-variant/40 space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-emerald-500 font-bold">
                        <Shield size={16} />
                        <span>Sanitized Asset Serving</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                        All third-party dependencies are verified and scanned. Polyfill and untrusted external scripts are stripped out to guarantee browser safety.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </main>
    </>
  );
}
