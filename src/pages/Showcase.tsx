import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Project, MOCK_PROJECTS } from "../data/mockData";
import { getProjects } from "../services/api";
import { Star, GitFork, ChevronRight, Terminal, Eye, FileCode, Shield, CheckCircle2 } from "lucide-react";
import SubNavbar from "../components/SubNavbar";

function ShowcaseContent() {
  const [searchParams] = useSearchParams();
  const initialRepoId = searchParams.get("repo") || MOCK_PROJECTS[0].id;

  const [repos, setRepos] = useState<Project[]>(MOCK_PROJECTS);
  
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

  const filteredRepos = repos.filter((p) => !softDeletedProjectIds.includes(p.id));

  const [selectedRepo, setSelectedRepo] = useState<Project>(
    MOCK_PROJECTS.find((p) => p.id === initialRepoId && !softDeletedProjectIds.includes(p.id)) ||
    MOCK_PROJECTS.find((p) => !softDeletedProjectIds.includes(p.id)) ||
    MOCK_PROJECTS[0]
  );
  
  const [selectedFile, setSelectedFile] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync repositories and current repository with Express live backend
  useEffect(() => {
    getProjects().then((liveRepos) => {
      if (liveRepos && liveRepos.length > 0) {
        setRepos(liveRepos);
        const activeLive = liveRepos.filter((p) => !softDeletedProjectIds.includes(p.id));
        const matchingLive = activeLive.find((p) => p.id === initialRepoId);
        if (matchingLive) {
          setSelectedRepo(matchingLive);
        } else if (activeLive.length > 0) {
          setSelectedRepo(activeLive[0]);
        }
      }
    });
  }, [initialRepoId, softDeletedProjectIds]);

  // Sync selected file when repository selection changes
  useEffect(() => {
    if (!selectedRepo) return;
    const fileKeys = Object.keys(selectedRepo.files);
    if (fileKeys.length > 0) {
      setSelectedFile(fileKeys[0]);
    } else {
      setSelectedFile("");
    }
  }, [selectedRepo]);

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
        const isDark = document.documentElement.classList.contains("dark");
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = isDark ? `rgba(0, 209, 255, ${this.alpha})` : `rgba(0, 103, 124, ${this.alpha})`;
        c.fill();
      }
    }

    const particles: Particle[] = Array.from({ length: 60 }, () => new Particle());

    const animate = () => {
      const isDark = document.documentElement.classList.contains("dark");
      ctx.clearRect(0, 0, width, height);

      // Subtle grids
      ctx.strokeStyle = isDark ? "rgba(0, 209, 255, 0.01)" : "rgba(0, 103, 124, 0.02)";
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
            ctx.strokeStyle = isDark ? `rgba(0, 209, 255, ${alpha})` : `rgba(0, 103, 124, ${alpha})`;
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
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-start relative overflow-hidden font-sans select-none">
      {/* Constellation canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-40" />

      {/* Ambient background glows */}
      <div className="absolute top-[25%] left-[-15%] w-[600px] h-[600px] bg-cyan-955/5 rounded-full blur-[160px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-zinc-900/5 rounded-full blur-[140px] pointer-events-none z-0"></div>

      {/* Header */}
      <SubNavbar />

      {/* Main Grid Workspace */}
      <main className="relative z-10 flex-grow max-w-7xl mx-auto w-full px-6 md:px-12 xl:px-24 pt-4 pb-12 md:pt-6 md:pb-16 flex flex-col lg:flex-row gap-8 items-start select-text">
        
        {/* Left Column (Repository Selectors & Stats) */}
        <aside className="w-full lg:w-72 space-y-6 lg:sticky lg:top-24 select-none">
          <div className="space-y-1">
            <span className="text-[8px] font-mono text-zinc-500 tracking-wider block font-bold uppercase">
              Select Workspace
            </span>
            <div className="space-y-1.5 flex flex-col w-full">
              {filteredRepos.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedRepo(p)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl border text-left transition-all cursor-pointer group ${
                    selectedRepo.id === p.id
                      ? "bg-primary text-white dark:bg-[#0b101c] border-primary dark:border-[#00d1ff]/25"
                      : "bg-black/5 dark:bg-[#04060a]/40 border-black/5 dark:border-zinc-900 text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 hover:border-black/10 dark:hover:border-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Terminal size={13} className={selectedRepo.id === p.id ? "text-white dark:text-[#00d1ff]" : "text-zinc-400 dark:text-zinc-600"} />
                    <span className="text-xs font-bold font-sans tracking-tight">{p.title}</span>
                  </div>
                  <ChevronRight size={10} className={selectedRepo.id === p.id ? "text-white dark:text-[#00d1ff]" : "text-transparent"} />
                </button>
              ))}
            </div>
          </div>

          {/* Selected Repository statistics */}
          <div className="border border-black/10 dark:border-zinc-900 bg-black/5 dark:bg-zinc-950/20 rounded-2xl p-5 space-y-4">
            <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-600 tracking-widest uppercase font-bold block">
              Workspace Telemetry
            </span>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-[8px] text-zinc-400 dark:text-zinc-600 font-bold block">ACTIVE_DEVS</span>
                <span className="text-foreground dark:text-white font-bold block">{selectedRepo.devsCount}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] text-zinc-400 dark:text-zinc-600 font-bold block">COMMIT_RATING</span>
                <span className="text-primary dark:text-[#00d1ff] font-bold block">A+</span>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] text-zinc-400 dark:text-zinc-600 font-bold block">STARS_COUNT</span>
                <span className="text-foreground dark:text-white font-bold block flex items-center gap-1">
                  <Star size={10} className="text-zinc-500" />
                  {selectedRepo.stars}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] text-zinc-400 dark:text-zinc-600 font-bold block">FORKS_COUNT</span>
                <span className="text-foreground dark:text-white font-bold block flex items-center gap-1">
                  <GitFork size={10} className="text-zinc-500" />
                  {selectedRepo.forks}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Column (Terminal Code Editor & Descriptions) */}
        <div className="flex-grow w-full space-y-6">
          
          {/* Main workspace title */}
          <div className="flex items-center justify-between select-none">
            <div className="flex items-center gap-2 text-zinc-500 font-mono text-[10px] uppercase font-bold tracking-widest">
              <Eye size={12} className="text-[#00d1ff]" />
              <span>Workspace / {selectedRepo.id}</span>
            </div>
          </div>

          {/* Interactive Code Editor Console */}
          <div className="w-full bg-black rounded-2xl border border-zinc-900 overflow-hidden shadow-2xl flex flex-col font-mono">
            {/* Editor Top Bar (File Tabs) */}
            <div className="bg-zinc-950/80 px-4 h-11 border-b border-zinc-900 flex items-center justify-between select-none">
              <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none py-2">
                {/* Visual Close/Minimize/Maximize dots */}
                <div className="flex items-center gap-1.5 shrink-0 mr-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                </div>

                {/* File keys selector buttons */}
                {Object.keys(selectedRepo.files).map((fileName) => (
                  <button
                    key={fileName}
                    onClick={() => setSelectedFile(fileName)}
                    className={`px-3 py-1 text-[10px] font-bold rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                      selectedFile === fileName
                        ? "bg-zinc-900 border border-zinc-800 text-white"
                        : "bg-transparent border border-transparent text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <FileCode size={11} className={selectedFile === fileName ? "text-[#00d1ff]" : "text-zinc-600"} />
                    {fileName}
                  </button>
                ))}
              </div>

              <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest hidden sm:block">
                RecodeX terminal_v1.0
              </div>
            </div>

            {/* Code Output Area */}
            <div className="p-5 overflow-auto max-h-[300px] text-xs leading-relaxed text-zinc-300 bg-[#030406]/60 select-text select-all font-mono min-h-[220px]">
              {selectedRepo.files[selectedFile] ? (
                <div className="flex">
                  {/* File Line Numbers */}
                  <div className="text-zinc-700 text-right pr-4 border-r border-zinc-900 select-none w-6 shrink-0 flex flex-col font-bold">
                    {selectedRepo.files[selectedFile].split("\n").map((_, i) => (
                      <span key={i}>{i + 1}</span>
                    ))}
                  </div>
                  {/* File Code text */}
                  <pre className="pl-4 font-mono text-[11px] text-zinc-300 overflow-x-auto whitespace-pre">
                    <code>{selectedRepo.files[selectedFile]}</code>
                  </pre>
                </div>
              ) : (
                <span className="text-zinc-600">Selecting telemetry code assets...</span>
              )}
            </div>
          </div>

          {/* Long Description and Technical Specs */}
          <div className="glass-card bg-white/60 dark:bg-[#07090e]/60 backdrop-blur-xl border border-black/10 dark:border-zinc-800/80 rounded-2xl p-6 md:p-8 space-y-4">
            <h3 className="text-sm font-extrabold text-foreground dark:text-white font-sans tracking-tight">
              Architectural Overview
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed font-sans font-medium">
              {selectedRepo.longDescription}
            </p>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-black/5 dark:border-zinc-900 bg-white/60 dark:bg-black/60 backdrop-blur-md w-full pt-16 pb-8 transition-colors select-text">
        <div className="max-w-7xl mx-auto px-6 md:px-12 xl:px-24">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-12">
            <div className="md:col-span-6 space-y-4">
              <div className="text-xl font-black tracking-tight text-foreground dark:text-white font-sans uppercase">
                <span className="text-primary dark:text-[#00d1ff]">Cam</span>Cod
              </div>
              <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
                Engineering the future of work through decentralized collaboration and high-performance talent acquisition.
              </p>
            </div>
            <div className="md:col-span-6 grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-[9px] font-bold text-primary dark:text-[#00d1ff] font-mono uppercase tracking-widest">
                  Resources
                </h4>
                <div className="flex flex-col gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="hover:text-primary dark:hover:text-[#00d1ff] cursor-pointer transition-colors">Network Status</span>
                  <span className="hover:text-primary dark:hover:text-[#00d1ff] cursor-pointer transition-colors">Security</span>
                  <span className="hover:text-primary dark:hover:text-[#00d1ff] cursor-pointer transition-colors">API Reference</span>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-[9px] font-bold text-primary dark:text-[#00d1ff] font-mono uppercase tracking-widest">
                  Legal
                </h4>
                <div className="flex flex-col gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <Link to="/terms" className="hover:text-primary dark:hover:text-[#00d1ff] transition-colors">Terms of Service</Link>
                  <span className="hover:text-primary dark:hover:text-[#00d1ff] cursor-pointer transition-colors">Privacy Policy</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-black/5 dark:border-zinc-900 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-600 tracking-wider uppercase font-bold">
              Â© 2024 RecodeX. Engineering the future of work.
            </span>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-black/5 dark:bg-zinc-900/30 border border-black/5 dark:border-zinc-800 flex items-center justify-center text-zinc-500">
                <Shield size={13} />
              </div>
              <div className="w-7 h-7 rounded-full bg-black/5 dark:bg-zinc-900/30 border border-black/5 dark:border-zinc-800 flex items-center justify-center text-zinc-500">
                <CheckCircle2 size={13} />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Showcase() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between items-center py-24 select-none font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-500">
        <span>INITIALIZING WORKSPACE TELEMETRY...</span>
      </div>
    }>
      <ShowcaseContent />
    </React.Suspense>
  );
}
