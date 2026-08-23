import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Project, MOCK_PROJECTS } from "@/data/mockData";
import { getProjects } from "@/services/api";
import { Star, GitFork, Search, Shield, CheckCircle2, ChevronRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import SubNavbar from "@/components/SubNavbar";

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();

  // Background Constellation Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const constellationRGB = theme === "dark" ? "0, 209, 255" : "0, 103, 124";

    class Particle {
      x: number = 0;
      y: number = 0;
      vx: number = 0;
      vy: number = 0;
      radius: number = 0;
      alpha: number = 0;

      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.25;
        this.vy = (Math.random() - 0.5) * 0.25;
        this.radius = Math.random() * 1.5 + 1;
        this.alpha = Math.random() * 0.4 + 0.15;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
          this.reset();
        }
      }

      draw(c: CanvasRenderingContext2D) {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = `rgba(${constellationRGB}, ${this.alpha})`;
        c.fill();
      }
    }

    const particles: Particle[] = Array.from({ length: 60 }, () => new Particle());

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle grids
      ctx.strokeStyle = `rgba(${constellationRGB}, 0.01)`;
      ctx.lineWidth = 1;
      const gridSize = 100;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      particles.forEach((p) => {
        p.update();
        p.draw(ctx);
      });

      ctx.lineWidth = 0.6;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            const alpha = (1 - dist / 150) * 0.08;
            ctx.strokeStyle = `rgba(${constellationRGB}, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  // Fetch projects from the backend (with graceful fallback to mock data)
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

  const filteredProjects = projects.filter((p) => !softDeletedProjectIds.includes(p.id));

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
        const cleaned = parsed.filter((c) => !DELETED_CATEGORIES.includes(c));
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

  const categoriesList = ["All", ...globalCategories];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-start relative font-sans select-none bg-grid-layout">
      {/* Background Constellation Mesh */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-40" />

      {/* Ambient background glows */}
      <div className="absolute top-[25%] left-[-15%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[160px] pointer-events-none z-0 overflow-hidden"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-secondary-container/5 rounded-full blur-[140px] pointer-events-none z-0 overflow-hidden"></div>

      {/* Header */}
      <SubNavbar />

      {/* Workspace Grid */}
      <main className="relative z-10 flex-grow max-w-7xl mx-auto w-full px-6 md:px-12 xl:px-24 pt-4 pb-12 md:pt-6 md:pb-16 flex flex-col lg:flex-row gap-10 items-start select-text">
        
        {/* Left Sidebar (Filters & Search) */}
        <aside className="w-full lg:w-64 shrink-0 space-y-8 sticky top-[136px] self-start z-20">
          
          {/* Search box */}
          <div className="space-y-2">
            <span className="text-[8px] font-mono text-gray-500 dark:text-zinc-500 tracking-wider block font-bold uppercase">
              Search Pipeline
            </span>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 dark:text-zinc-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-black/5 dark:bg-[#03060c]/60 border border-black/10 dark:border-zinc-800/80 rounded-lg text-xs text-foreground placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-primary transition-all font-mono"
                placeholder="Find stack, tags..."
              />
            </div>
          </div>

          {/* Category Filter links */}
          <div className="space-y-3">
            <span className="text-[8px] font-mono text-zinc-600 dark:text-zinc-400 tracking-wider block font-bold uppercase">
              Filter by Layer
            </span>
            <nav className="flex flex-col gap-1 font-mono text-[9px] font-bold uppercase tracking-widest">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-primary/5 dark:bg-[#0b101c] border-primary/20 text-foreground"
                      : "bg-transparent border-transparent text-zinc-600 dark:text-zinc-400 hover:text-foreground hover:bg-black/5 dark:hover:bg-zinc-900/10"
                  }`}
                >
                  {cat}
                  <ChevronRight size={10} className={selectedCategory === cat ? "text-primary" : "text-transparent"} />
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-grow w-full space-y-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground font-sans">
              Developer <span className="text-primary">Marketplace</span>
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs mt-1">
              Browse verified high-performance software projects and repositories.
            </p>
          </div>

          {/* Grid list of mock projects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div 
                  key={idx} 
                  className="glass-card rounded-2xl p-6 flex flex-col justify-between h-[220px] animate-pulse border border-black/5 dark:border-white/5 bg-black/5 dark:bg-zinc-900/10"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-2.5 bg-black/10 dark:bg-zinc-800 rounded-full w-20"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-black/10 dark:bg-zinc-800"></div>
                    </div>
                    <div className="h-4 bg-black/10 dark:bg-zinc-800 rounded-lg w-2/3"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-black/10 dark:bg-zinc-800 rounded-md w-full"></div>
                      <div className="h-3 bg-black/10 dark:bg-zinc-800 rounded-md w-5/6"></div>
                    </div>
                  </div>
                  <div className="pt-6 mt-6 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                    <div className="flex gap-4">
                      <div className="h-3 bg-black/10 dark:bg-zinc-800 rounded-full w-8"></div>
                      <div className="h-3 bg-black/10 dark:bg-zinc-800 rounded-full w-8"></div>
                    </div>
                    <div className="h-6 bg-black/10 dark:bg-zinc-800 rounded w-24"></div>
                  </div>
                </div>
              ))
            ) : filteredProjects.length === 0 ? (
              <div className="col-span-2 border border-dashed border-black/10 dark:border-zinc-800/80 rounded-2xl py-16 text-center text-gray-400 dark:text-zinc-600 text-xs font-mono">
                No active records found matching the search pipeline parameters.
              </div>
            ) : (
              filteredProjects.map((project) => (
                <div 
                  key={project.id}
                  className="glass-card rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 group"
                >
                  <div className="space-y-4">
                    {/* Category & Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-mono text-primary tracking-wider uppercase font-bold">
                        {project.category}
                      </span>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        project.status === "Active" ? "bg-emerald-400" :
                        project.status === "Beta" ? "bg-amber-400" : "bg-gray-400"
                      }`}></span>
                    </div>

                    <h3 className="text-base font-extrabold text-foreground font-sans tracking-tight group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                    
                    <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed font-sans font-medium line-clamp-3">
                      {project.description}
                    </p>

                    {/* Technical Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {project.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded bg-black/5 dark:bg-zinc-900 border border-black/5 dark:border-zinc-800 text-[8px] font-mono text-zinc-600 dark:text-zinc-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Stars, Forks, and Call To Action */}
                  <div className="pt-6 mt-6 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400">
                      <div className="flex items-center gap-1">
                        <Star size={11} className="text-zinc-500 dark:text-zinc-400" />
                        <span>{project.stars}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <GitFork size={11} className="text-zinc-500 dark:text-zinc-400" />
                        <span>{project.forks}</span>
                      </div>
                    </div>

                    <Link
                      to={`/projects?run=${project.id}`}
                      className="px-3.5 py-1.5 border border-black/10 dark:border-zinc-800 hover:border-primary/40 rounded text-[9px] font-mono font-bold tracking-widest uppercase text-zinc-700 dark:text-zinc-300 hover:text-foreground hover:bg-primary/5 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      Explore Stack
                      <ChevronRight size={10} />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
