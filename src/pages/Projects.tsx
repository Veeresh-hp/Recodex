import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import TerminalModal from "../components/TerminalModal";
import { Project, MOCK_PROJECTS } from "../data/mockData";
import { getProjects } from "../services/api";
import { Search, Star, GitFork, Terminal, ShieldAlert } from "lucide-react";

function ProjectsContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);



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
    "UI/UX Design", "Data Science", "Cloud Computing", "Cybersecurity"
  ];
  const FALLBACK_CATEGORIES = ["Web Systems", "AI & Intelligence", "Blockchain & Web3", "Low-Level Shells"];

  const [globalCategories, setGlobalCategories] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("recodex_global_categories");
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        // Strip any deleted categories that might still be cached
        const cleaned = parsed.filter((c) => !DELETED_CATEGORIES.includes(c));
        // Persist the cleaned version back
        localStorage.setItem("recodex_global_categories", JSON.stringify(cleaned));
        return cleaned;
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
    const timer = setTimeout(() => {
      setLoading(true);
    }, 0);
    getProjects(
      selectedCategory === "All" ? undefined : selectedCategory,
      searchQuery
    ).then((data) => {
      if (active) {
        clearTimeout(timer);
        setProjects(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
      clearTimeout(timer);
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

  const filteredProjects = projects.filter((p) => !softDeletedProjectIds.includes(p.id));

  return (
    <>
      <main className="flex-grow pt-24 pb-16 bg-grid-layout relative min-h-screen">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              RecodeX Project Gallery
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-2">
              Discover verified low-latency systems, intelligence nodes, and zero-knowledge contracts.
            </p>
          </div>



          {/* Search & Filters */}
          <div className="space-y-6 mb-10">
            {/* Search Input */}
            <div className="relative max-w-xl mx-auto">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 dark:text-zinc-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects by name, technology stack (e.g., Rust, Go, WASM)..."
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-lg text-sm text-foreground placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm dark:shadow-none backdrop-blur-md transition-all font-mono"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-4 py-2 text-xs rounded font-semibold font-mono border transition-all duration-200 ${
                    selectedCategory === cat
                      ? "bg-primary text-white dark:text-black border-primary shadow-sm"
                      : "bg-zinc-100 dark:bg-black/30 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10"
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div 
                  key={idx} 
                  className="glass-card p-6 rounded-xl flex flex-col gap-4 h-[380px] animate-pulse border border-black/5 dark:border-white/5 bg-black/5 dark:bg-zinc-900/10"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="glass-card p-6 rounded-xl flex flex-col gap-4 group hover:-translate-y-1.5 transition-all shadow-md"
                >
                  {/* Card Image */}
                  <div className="relative h-44 w-full rounded-lg overflow-hidden border border-black/5 dark:border-white/5 bg-zinc-950">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 opacity-80"
                    />
                    <div className="absolute top-3 right-3 flex gap-2">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border backdrop-blur-md uppercase tracking-wider ${
                        project.status === "Active" ? "bg-primary/10 text-primary border-primary/20" :
                        project.status === "Beta" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                        "bg-gray-400/10 text-gray-400 border-gray-400/20"
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
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
                    <span className="ml-auto text-[9px] text-gray-500">
                      {project.category.toUpperCase()}
                    </span>
                  </div>

                  {/* View Code CTA */}
                  <button
                    onClick={() => setSelectedProject(project)}
                    className="w-full py-2 border border-black/10 dark:border-white/10 rounded-lg text-xs font-bold font-mono text-foreground hover:bg-primary hover:text-black hover:border-primary transition-all flex items-center justify-center gap-1.5"
                  >
                    <Terminal size={14} />
                    VIEW CODEBASE
                  </button>
                </div>
              ))}
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
        onClose={() => setSelectedProject(null)}
      />
    </>
  );
}

export default function Projects() {
  return (
    <>
      <Suspense fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-primary font-mono text-sm">
          Loading gallery systems...
        </div>
      }>
        <ProjectsContent />
      </Suspense>
      <Footer />
    </>
  );
}
