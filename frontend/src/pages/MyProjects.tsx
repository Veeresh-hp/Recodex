import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import {
  FolderGit2, Activity, Clock, ListTodo, ShieldCheck, CheckCircle2,
  ExternalLink, Terminal, Code2, ArrowLeft, Search, Filter,
  Sparkles, Calendar, Layers, GitBranch, Cpu, CheckCircle,
  FileCode2, Users, AlertCircle, ArrowUpRight, Play, MessageSquare
} from "lucide-react";
import TerminalModal from "../components/TerminalModal";

interface ProjectDeliverable {
  title: string;
  category: string;
  status: "Active" | "In Review" | "Completed" | "Deploying";
  progress: number;
  startDate: string;
  expectedDate: string;
  daysRemaining: number;
  repositoryUrl: string;
  liveUrl?: string;
  leadArchitect: string;
  techStack: string[];
  milestones: {
    id: number;
    name: string;
    description: string;
    completed: boolean;
    current?: boolean;
  }[];
  deliverablesList: string[];
  contractId: string;
}

export default function MyProjects() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const [clientProjects, setClientProjects] = useState<ProjectDeliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTerminalProject, setSelectedTerminalProject] = useState<any | null>(null);
  const [modalTab, setModalTab] = useState<"code" | "logs" | "output">("output");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "Active" | "Completed">("ALL");

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.fullName || user?.username || "RecodeX Client";
  const userEmail = (user?.primaryEmailAddress?.emailAddress || "").toLowerCase().trim();

  useEffect(() => {
    // Load real client projects assigned to this user from storage / API
    try {
      const stored = localStorage.getItem("recodex_client_projects");
      if (stored) {
        const parsed: ProjectDeliverable[] = JSON.parse(stored);
        setClientProjects(parsed);
      } else {
        setClientProjects([]);
      }
    } catch (e) {
      console.warn("Failed to load client projects:", e);
      setClientProjects([]);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, userEmail]);

  const filteredProjects = clientProjects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.contractId.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === "ALL") return matchesSearch;
    return matchesSearch && p.status === filterStatus;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[15%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[180px] pointer-events-none z-0"></div>

      <main className="relative z-10 flex-grow pt-28 pb-16 px-6 md:px-12 max-w-7xl mx-auto w-full">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-primary transition-colors uppercase tracking-wider group cursor-pointer"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Profile
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/25">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Client Telemetry Space
            </span>
          </div>
        </div>

        {/* Hero Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-black/10 dark:border-zinc-800/80 mb-8">
          <div>
            <div className="flex items-center gap-2 text-emerald-500 font-mono text-xs uppercase tracking-widest font-bold mb-2">
              <FolderGit2 size={16} />
              <span>Dedicated Client Space</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground dark:text-white tracking-tight">
              My Projects & Deliverables
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-2xl">
              Track live sprint progress, review milestone completions, inspect production repositories, and run cloud live demos in real time.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/projects"
              className="px-4 py-2.5 rounded-xl bg-black/5 dark:bg-zinc-900 hover:bg-black/10 dark:hover:bg-zinc-800 border border-black/10 dark:border-zinc-800 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer text-foreground dark:text-white"
            >
              <Code2 size={15} className="text-primary" />
              Explore All Showcases
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        {clientProjects.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search active project contracts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/70 dark:bg-zinc-900/70 border border-black/10 dark:border-zinc-800 rounded-xl text-xs text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-primary transition-all font-sans"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs font-mono text-zinc-400 font-bold uppercase mr-1">Filter:</span>
              <div className="flex items-center gap-1 p-1 bg-black/5 dark:bg-zinc-900/80 border border-black/10 dark:border-zinc-800 rounded-xl">
                {(["ALL", "Active", "Completed"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer font-sans ${
                      filterStatus === status
                        ? "bg-white dark:bg-zinc-800 text-foreground dark:text-white shadow-sm border border-black/5 dark:border-zinc-700 font-semibold"
                        : "text-zinc-500 hover:text-foreground dark:hover:text-zinc-200"
                    }`}
                  >
                    {status === "ALL" ? "All Projects" : status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Projects Content / Empty State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Loading Client Projects...</p>
          </div>
        ) : clientProjects.length === 0 ? (
          <div className="text-center py-20 bg-white/40 dark:bg-[#07090e]/60 backdrop-blur-xl rounded-3xl border border-dashed border-black/10 dark:border-zinc-800 p-8 sm:p-14 max-w-3xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
              <FolderGit2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-foreground dark:text-white tracking-tight">
              No Contracted Projects Yet
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-lg mx-auto leading-relaxed">
              Administration has not assigned any active client projects to your account yet. When a custom development project or technical milestone is initiated, you will be able to track live sprint progress, review GitHub repositories, and run cloud execution terminals here.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/projects"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Code2 size={15} />
                Explore Public Projects
              </Link>
              <Link
                to="/contact"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-black/5 dark:bg-zinc-900 hover:bg-black/10 dark:hover:bg-zinc-800 border border-black/10 dark:border-zinc-800 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer text-foreground dark:text-white"
              >
                <MessageSquare size={15} className="text-amber-500" />
                Contact Team
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredProjects.map((project, idx) => (
              <div
                key={idx}
                className="bg-white/70 dark:bg-[#07090e]/80 backdrop-blur-xl border border-black/10 dark:border-zinc-800/90 hover:border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-[0_20px_50px_rgba(16,185,129,0.1)] transition-all space-y-6"
              >
                {/* Card Top Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-black/5 dark:border-zinc-800/80">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 flex items-center gap-1.5">
                        <Activity size={12} />
                        {project.status}
                      </span>
                      <span className="text-xs font-mono text-zinc-400 font-bold">
                        Contract: {project.contractId}
                      </span>
                      <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
                        • {project.category}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-white tracking-tight pt-1">
                      {project.title}
                    </h2>
                  </div>

                  {/* Progress Metric Pill */}
                  <div className="flex items-center gap-4 bg-black/[0.02] dark:bg-zinc-900/60 px-5 py-3 rounded-2xl border border-black/5 dark:border-zinc-800/70 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold block">Overall Completion</span>
                      <span className="text-xl font-mono font-black text-emerald-500">{project.progress}%</span>
                    </div>
                    <div className="w-12 h-12 rounded-full border-2 border-emerald-500/30 flex items-center justify-center relative">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Activity size={18} className="text-emerald-500 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-500">
                      Started: <strong className="text-foreground dark:text-zinc-300">{project.startDate}</strong>
                    </span>
                    <span className="text-emerald-500 font-bold">
                      {project.daysRemaining} days remaining (Target: {project.expectedDate})
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-black/5 dark:bg-zinc-900 rounded-full overflow-hidden border border-black/5 dark:border-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-1000"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Milestones & Sprint Progress Roadmap */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <ListTodo size={14} className="text-emerald-500" />
                    <span>Phase Deliverables & Engineering Milestones</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {project.milestones.map((m) => (
                      <div
                        key={m.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          m.completed
                            ? "bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                            : m.current
                            ? "bg-cyan-500/5 dark:bg-cyan-950/20 border-cyan-500/50 text-cyan-950 dark:text-cyan-200 shadow-[0_0_15px_rgba(0,209,255,0.1)]"
                            : "bg-black/[0.02] dark:bg-zinc-900/40 border-black/5 dark:border-zinc-800/60 text-zinc-500 opacity-70"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Phase 0{m.id}</span>
                          {m.completed ? (
                            <CheckCircle size={15} className="text-emerald-500" />
                          ) : m.current ? (
                            <span className="px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse">
                              IN PROGRESS
                            </span>
                          ) : (
                            <Clock size={14} className="text-zinc-500" />
                          )}
                        </div>
                        <h5 className="text-xs font-bold text-foreground dark:text-white mb-1 leading-snug">
                          {m.name}
                        </h5>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {m.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tech Stack & Architect Details */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-black/5 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold mr-1">Stack:</span>
                    {project.techStack.map((tech, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-black/5 dark:bg-zinc-900 border border-black/5 dark:border-zinc-800 rounded-lg text-[10px] font-mono text-zinc-600 dark:text-zinc-300 font-semibold"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => {
                        setSelectedTerminalProject({
                          title: project.title,
                          category: project.category,
                          description: "Interactive live cloud execution sandbox for this project.",
                          codeSnippet: `// RecodeX Live Execution\nimport { createServer } from "recodex-runtime";\n\nconst app = createServer({\n  cluster: "us-east-cluster-01",\n  contractId: "${project.contractId}"\n});\n\napp.start(() => {\n  console.log("Telemetry Engine Online 🚀");\n});`,
                          sampleOutput: `[INIT] Initializing runtime for ${project.contractId}...\n[INFO] Connecting to RecodeX Core v2.4.9\n[SUCCESS] TLS 1.3 Handshake completed.\n[TELEMETRY] 0 errors, 142ms latency, 99.99% uptime.\n[READY] Interactive preview active.`
                        });
                        setModalTab("output");
                      }}
                      className="px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Terminal size={14} />
                      Launch Live Console
                    </button>

                    <a
                      href={project.repositoryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-black/5 dark:bg-zinc-900 hover:bg-black/10 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-all cursor-pointer"
                      title="View GitHub Repository"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* TERMINAL RUNNER MODAL */}
      {selectedTerminalProject && (
        <TerminalModal
          project={selectedTerminalProject}
          initialTab={modalTab}
          onClose={() => setSelectedTerminalProject(null)}
        />
      )}
    </div>
  );
}
