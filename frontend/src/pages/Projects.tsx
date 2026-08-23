import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import TerminalModal from "../components/TerminalModal";
import { Project, MOCK_PROJECTS } from "../data/mockData";
import { getProjects } from "../services/api";
import { Search, Star, GitFork, Terminal, ShieldAlert, Play, ExternalLink } from "lucide-react";

function ProjectsContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [modalTab, setModalTab] = useState<"code" | "logs" | "output">("output");



  const selectedCategory = searchParams.get("category") || "All";

  const handleCategoryChange = (cat: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat === "All") {
      params.delete("category");
    } else {
      params.set("category", cat);
    }
    navigate(`/projects?${params.toString()}`);
  };

  // Categories deleted by admin â€” auto-filtered from any stale localStorage
  const DELETED_CATEGORIES = [
    "Web Development", "App Development", "AI/ML",
    "UI/UX Design", "Data Science", "Cloud Computing", "Cybersecurity",
    "Web Systems", "AI & Intelligence", "Blockchain & Web3", "Low-Level Shells"
  ];
  const FALLBACK_CATEGORIES = ["Web Apps & Tools", "Games", "Landing Pages & Portfolios", "Utilities"];

  const [globalCategories, setGlobalCategories] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("recodex_global_categories");
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        // Strip any deleted categories that might still be cached
        const cleaned = parsed.filter((c) => !DELETED_CATEGORIES.includes(c));
        const finalCategories = cleaned.length > 0 ? cleaned : FALLBACK_CATEGORIES;
        localStorage.setItem("recodex_global_categories", JSON.stringify(finalCategories));
        return finalCategories;
      }
      return FALLBACK_CATEGORIES;
    } catch {
      return FALLBACK_CATEGORIES;
    }
  });

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "recodex_global_categories") {
        try {
          const parsed: string[] = e.newValue ? JSON.parse(e.newValue) : [];
          const cleaned = parsed.filter((c) => !DELETED_CATEGORIES.includes(c));
          setGlobalCategories(cleaned);
        } catch (err) {
          console.error("Storage parse error:", err);
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const categories = ["All", ...globalCategories];

  // Fetch projects dynamically from the database
  useEffect(() => {
    let active = true;
    getProjects(
      selectedCategory === "All" ? undefined : selectedCategory,
      searchQuery
    ).then((data) => {
      if (active && data && data.length > 0) {
        setProjects(data);
      }
    });
    return () => {
      active = false;
    };
  }, [selectedCategory, searchQuery]);

  // Filter out soft-deleted projects
  const [softDeletedProjectIds, setSoftDeletedProjectIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("recodex_soft_deleted_projects");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "recodex_soft_deleted_projects") {
        try {
          setSoftDeletedProjectIds(e.newValue ? JSON.parse(e.newValue) : []);
        } catch (err) {
          console.error("Storage parse error:", err);
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const getProjectNum = (p: Project, idx: number) => {
    const match = p.dir?.match(/^(\d+)\./) || p.id.match(/^(\d+)-/);
    if (match) return `#${match[1].padStart(2, '0')}`;
    return `#${String(idx + 1).padStart(2, '0')}`;
  };

  const getCategoryBadgeLabel = (cat: string) => {
    const lower = cat.toLowerCase();
    if (lower.includes("landing") || lower.includes("portfolio") || lower.includes("site")) return "SITES";
    if (lower.includes("game")) return "GAMES";
    if (lower.includes("util")) return "UTILITY";
    return "APPS";
  };

  const sortedProjects = [...projects].sort((a, b) => {
    const parseNum = (p: Project) => {
      const match = p.dir?.match(/^(\d+)\./) || p.id.match(/^(\d+)-/);
      return match ? parseInt(match[1], 10) : 999;
    };
    return parseNum(a) - parseNum(b);
  });

  const filteredProjects = sortedProjects.filter((p) => {
    if (softDeletedProjectIds.includes(p.id)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const num = getProjectNum(p, 0).toLowerCase();
      const matchesNum = num.includes(q) || num.replace("#", "").includes(q);
      const matchesTitle = p.title.toLowerCase().includes(q);
      const matchesDesc = p.description.toLowerCase().includes(q);
      const matchesTags = p.tags.some(t => t.toLowerCase().includes(q));
      const matchesCat = p.category.toLowerCase().includes(q);
      return matchesNum || matchesTitle || matchesDesc || matchesTags || matchesCat;
    }
    return true;
  });

  return (
    <>
      <main className="flex-grow pt-24 pb-16 bg-grid-layout relative min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              RecodeX Project Gallery
            </h1>
            <p className="text-xs sm:text-base text-zinc-600 dark:text-zinc-400 mt-2">
              Discover the 50 Frontend Projects Suite — complete with interactive web apps, games, landing pages, and developer tools.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-10">
            {/* Search Input */}
            <div className="relative max-w-xl mx-auto">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 dark:text-zinc-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search project name or number (e.g. Weather, Piano, 17)..."
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-lg text-xs sm:text-sm text-foreground placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm dark:shadow-none backdrop-blur-md transition-all font-mono"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs rounded font-semibold font-mono border transition-all duration-200 ${
                    selectedCategory === cat
                      ? "bg-primary text-white dark:text-black border-primary shadow-sm"
                      : "bg-zinc-100 dark:bg-black/30 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10"
                  }`}
                >
                  {cat === "All" ? `All (${projects.length})` : cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div 
                  key={idx} 
                  className="glass-card p-4 sm:p-6 rounded-xl flex flex-col gap-4 h-[380px] animate-pulse border border-black/5 dark:border-white/5 bg-black/5 dark:bg-zinc-900/10"
                >
                  <div className="h-44 w-full rounded-lg bg-black/10 dark:bg-zinc-800"></div>
                  <div className="space-y-2 mt-2">
                    <div className="h-4 bg-black/10 dark:bg-zinc-800 rounded w-2/3"></div>
                    <div className="h-3 bg-black/10 dark:bg-zinc-800 rounded w-full"></div>
                    <div className="h-3 bg-black/10 dark:bg-zinc-800 rounded w-5/6"></div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <div className="h-4 bg-black/10 dark:bg-zinc-800 rounded w-12"></div>
                    <div className="h-4 bg-black/10 dark:bg-zinc-800 rounded w-12"></div>
                  </div>
                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-black/5 dark:border-white/5">
                    <div className="flex gap-4">
                      <div className="h-3 bg-black/10 dark:bg-zinc-800 rounded-full w-8"></div>
                      <div className="h-3 bg-black/10 dark:bg-zinc-800 rounded-full w-8"></div>
                    </div>
                    <div className="h-6 bg-black/10 dark:bg-zinc-800 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredProjects.map((project, index) => {
                const projNum = getProjectNum(project, index);
                const catBadge = getCategoryBadgeLabel(project.category);
                const projectUrl = `/Frontend_Project/${encodeURIComponent(project.dir || project.id)}/index.html`;

                return (
                  <div
                    key={project.id}
                    className="glass-card p-4 sm:p-6 rounded-xl flex flex-col gap-4 group hover:-translate-y-1.5 transition-all shadow-md relative"
                  >
                    {/* Top Badges Row (Image 1 style) */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-md bg-primary/20 text-primary border border-primary/30">
                        {projNum}
                      </span>
                      <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 uppercase tracking-wider">
                        {catBadge}
                      </span>
                    </div>

                    {/* Card Image */}
                    <div className="relative h-40 w-full rounded-lg overflow-hidden border border-black/5 dark:border-white/5 bg-zinc-950">
                      <img
                        src={project.image}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 opacity-85"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600";
                        }}
                      />
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                        {project.description}
                      </p>
                    </div>

                    {/* Tech Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] font-bold font-mono bg-zinc-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded uppercase tracking-wider"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Star Metrics */}
                    <div className="flex items-center gap-4 text-[11px] text-gray-400 font-mono mt-auto border-t border-black/5 dark:border-white/5 pt-3">
                      <span className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-500" fill="currentColor" />
                        {project.stars}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitFork size={12} />
                        {project.forks}
                      </span>
                      <span className="ml-auto text-[9px] text-gray-500 truncate max-w-[100px] text-right">
                        {project.category.toUpperCase()}
                      </span>
                    </div>

                    {/* Action Row: Run Project + Open in New Tab + View Codebase */}
                    <div className="flex gap-1.5 sm:gap-2 pt-1 mt-auto">
                      <button
                        onClick={() => {
                          setSelectedProject(project);
                          setModalTab("output");
                        }}
                        className="flex-grow py-2.5 px-3 bg-primary text-white dark:text-black font-mono font-bold text-xs rounded-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
                      >
                        <Play size={14} fill="currentColor" />
                        Run Project
                      </button>

                      <a
                        href={projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open in new tab"
                        className="px-2.5 sm:px-3 py-2.5 bg-zinc-100 dark:bg-white/10 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 text-foreground rounded-lg transition-all flex items-center justify-center cursor-pointer shrink-0"
                      >
                        <ExternalLink size={15} />
                      </a>

                      <button
                        onClick={() => {
                          setSelectedProject(project);
                          setModalTab("code");
                        }}
                        title="View Codebase"
                        className="px-2.5 sm:px-3 py-2.5 bg-zinc-100 dark:bg-white/10 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 text-foreground rounded-lg transition-all flex items-center justify-center cursor-pointer shrink-0"
                      >
                        <Terminal size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/5 dark:bg-black/20 rounded-xl border border-black/5 dark:border-white/5 max-w-xl mx-auto">
              <ShieldAlert className="mx-auto text-gray-500 mb-4 animate-bounce" size={40} />
              <h3 className="text-lg font-bold text-foreground">No repositories found</h3>
              <p className="text-sm text-gray-500 mt-1">
                Try modifying your search queries or filter categories.
              </p>
            </div>
          )}

        </div>
      </main>

      {/* Terminal View Modal Overlay */}
      <TerminalModal
        project={selectedProject}
        initialTab={modalTab}
        onClose={() => {
          setSelectedProject(null);
          setModalTab("output");
        }}
      />
    </>
  );
}

export default function Projects() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center text-primary font-mono text-sm">
        Loading gallery systems...
      </div>
    }>
      <ProjectsContent />
    </Suspense>
  );
}
