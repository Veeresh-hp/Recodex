import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  Terminal, 
  Code, 
  Smartphone, 
  Server, 
  Globe, 
  Cpu, 
  Layout, 
  Compass, 
  ArrowRight,
  Plus,
  Send,
  Cloud,
  Database,
  MessageSquare,
  Sliders,
  Shield,
  CheckCircle2,
  TrendingUp,
  ChevronDown,
  Box
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import SubNavbar from "@/components/SubNavbar";

export default function Categories() {
  const [activeTab, setActiveTab] = useState("All Stacks");
  const [sortBy, setSortBy] = useState<"popular" | "alpha">("popular");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestStack, setRequestStack] = useState("");
  const [requestSubmitted, setRequestSubmitted] = useState(false);
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

  // Complete Technical Dataset
  const techStacks = [
    // Frontend
    { name: "React.js", category: "Frontend", projectsCount: 2400, description: "High-performance UI components with virtual DOM efficiency.", tags: ["NEXT.JS", "TAILWIND", "REDUX"], iconType: "code" },
    { name: "Vue.js", category: "Frontend", projectsCount: 1100, description: "The progressive framework for building modern user interfaces.", tags: ["NUXT.JS", "PINIA", "VITE"], iconType: "send" },
    { name: "Angular", category: "Frontend", projectsCount: 840, description: "The platform for building enterprise-grade mobile & web apps.", tags: ["RXJS", "TYPESCRIPT", "NGRX"], iconType: "compass" },
    
    // Backend
    { name: "Node.js / Express", category: "Backend", projectsCount: 3200, description: "Scale with event-driven architecture. The backbone of real-time apps.", tags: ["TS", "MONGO", "REDIS"], iconType: "server" },
    { name: "Python / Django", category: "Backend", projectsCount: 1500, description: "Rapid development with a focus on clean, pragmatic design.", tags: ["PYTHON", "POSTGRES", "REST"], iconType: "terminal" },
    { name: "Go / Gin", category: "Backend", projectsCount: 950, description: "Extremely fast concurrent systems backed by Google guidelines.", tags: ["GO", "GIN", "DOCKER"], iconType: "cpu" },
    
    // Mobile Development
    { name: "Flutter", category: "Mobile Development", projectsCount: 1800, description: "Google's UI toolkit for crafting natively compiled mobile apps.", tags: ["DART", "MOBX", "FIREBASE"], iconType: "smartphone" },
    { name: "React Native", category: "Mobile Development", projectsCount: 1600, description: "Build native apps using React. Efficient across iOS and Android.", tags: ["JS", "EXPO", "REANIMATED"], iconType: "smartphone" },
    { name: "Kotlin Multiplatform", category: "Mobile Development", projectsCount: 650, description: "Share logic across platforms with native Kotlin performance.", tags: ["KOTLIN", "ANDROID", "IOS"], iconType: "smartphone" },
    
    // Cloud & DevOps
    { name: "Kubernetes", category: "Cloud & DevOps", projectsCount: 1400, description: "Automate service orchestration and rolling container updates.", tags: ["K8S", "HELM", "DOCKER"], iconType: "cloud" },
    { name: "Docker", category: "Cloud & DevOps", projectsCount: 2200, description: "Package applications into isolated sandboxed environments.", tags: ["CONTAINERS", "IMAGES", "COMPOSE"], iconType: "box" },
    { name: "Terraform", category: "Cloud & DevOps", projectsCount: 750, description: "Provision cloud architectures predictably using declarative code.", tags: ["IAC", "AWS", "GCP"], iconType: "sliders" },
    
    // Data & AI
    { name: "PyTorch", category: "Data & AI", projectsCount: 1200, description: "An open source machine learning framework accelerating model design.", tags: ["DL", "CUDA", "LLM"], iconType: "cpu" },
    { name: "TensorBoard", category: "Data & AI", projectsCount: 800, description: "Visualization and debugging tools for machine learning runs.", tags: ["ML", "STATS", "GRAPHS"], iconType: "sliders" },
    { name: "PostgreSQL", category: "Data & AI", projectsCount: 1900, description: "The world's most advanced open source relational database.", tags: ["SQL", "ACID", "RELATIONAL"], iconType: "database" },
    
    // Productivity Tools
    { name: "Slack API", category: "Productivity Tools", projectsCount: 600, description: "Build collaborative bots, custom notifications, and chat alerts.", tags: ["BOTS", "WEBHOOKS", "CHAT"], iconType: "message" },
    { name: "Jira Automation", category: "Productivity Tools", projectsCount: 450, description: "Sync issue pipelines, project workflows, and automated releases.", tags: ["SCRUM", "API", "WEBHOOKS"], iconType: "sliders" }
  ];

  const sidebarItems = [
    "All Stacks",
    "Frontend",
    "Backend",
    "Mobile Development",
    "Cloud & DevOps",
    "Data & AI",
    "Productivity Tools"
  ];

  // Dynamic Stack Masters according to selected Active Category
  const stackMasters = {
    "All Stacks": [
      { name: "@alex_dev", role: "FRONTEND", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80" },
      { name: "@sam_arch", role: "BACKEND", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80" },
      { name: "@sarah_ops", role: "CLOUD", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=80" }
    ],
    "Frontend": [
      { name: "@alex_dev", role: "FRONTEND", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80" },
      { name: "@lucas_ui", role: "FRONTEND", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80" },
      { name: "@sophie_front", role: "UX/UI", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=80" }
    ],
    "Backend": [
      { name: "@sam_arch", role: "BACKEND", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80" },
      { name: "@elena_core", role: "ARCHITECT", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80" },
      { name: "@david_go", role: "ENGINEER", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=80" }
    ],
    "Mobile Development": [
      { name: "@john_native", role: "MOBILE", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=80" },
      { name: "@clara_flutter", role: "DART", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80" },
      { name: "@peter_kmp", role: "IOS/AND", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80" }
    ],
    "Cloud & DevOps": [
      { name: "@sarah_ops", role: "CLOUD", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80" },
      { name: "@tom_devops", role: "IAC", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80" },
      { name: "@marcus_infra", role: "K8S", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=80" }
    ],
    "Data & AI": [
      { name: "@liam_ai", role: "MLOPS", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80" },
      { name: "@anna_model", role: "CUDA", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80" },
      { name: "@sanjay_db", role: "SQL", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=80" }
    ],
    "Productivity Tools": [
      { name: "@emma_slack", role: "INTEGRATION", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80" },
      { name: "@kevin_jira", role: "API", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80" },
      { name: "@noah_trello", role: "AGILE", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=80" }
    ]
  };

  // Icon switcher helper
  const renderIcon = (type: string) => {
    switch (type) {
      case "code": return <Code size={16} />;
      case "send": return <Send size={16} />;
      case "compass": return <Compass size={16} />;
      case "server": return <Server size={16} />;
      case "terminal": return <Terminal size={16} />;
      case "cpu": return <Cpu size={16} />;
      case "smartphone": return <Smartphone size={16} />;
      case "cloud": return <Cloud size={16} />;
      case "box": return <Box size={16} />;
      case "database": return <Database size={16} />;
      case "message": return <MessageSquare size={16} />;
      case "sliders": return <Sliders size={16} />;
      default: return <Code size={16} />;
    }
  };

  // 1. Filter dataset by activeTab
  const filteredTech = activeTab === "All Stacks"
    ? techStacks
    : techStacks.filter(item => item.category === activeTab);

  // 2. Sort filtered list by selected sort configuration
  const sortedTech = [...filteredTech].sort((a, b) => {
    if (sortBy === "popular") {
      return b.projectsCount - a.projectsCount; // High projects count first
    } else {
      return a.name.localeCompare(b.name); // Alphabetical A-Z
    }
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-start relative overflow-hidden font-sans bg-grid-layout">
      {/* Background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-40" />

      {/* Ambient background glows */}
      <div className="absolute top-[25%] left-[-15%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[160px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-secondary-container/5 rounded-full blur-[140px] pointer-events-none z-0"></div>

      {/* Brand split CamCod navbar */}

      {/* Sub-Navigation Mini Navbar */}
      <SubNavbar />

      {/* Main Workspace layout */}
      <main className="relative z-10 flex-grow max-w-7xl mx-auto w-full px-6 md:px-12 xl:px-24 pt-4 pb-12 md:pb-20 select-text">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Stack Navigation Sidebar */}
          <div className="lg:col-span-3 space-y-8 lg:sticky lg:top-32 select-none">
            
            {/* Stack Navigation list */}
            <div className="space-y-4">
              <h3 className="text-[9px] font-mono text-gray-500 dark:text-zinc-500 uppercase tracking-widest font-bold block mb-2 pl-3">
                Stack Navigation
              </h3>
              <div className="space-y-1">
                {sidebarItems.map((item) => {
                  const isActive = activeTab === item;
                  return (
                    <button
                      key={item}
                      onClick={() => setActiveTab(item)}
                      className={`w-full text-left py-2.5 px-3.5 text-xs font-bold tracking-wider font-mono uppercase rounded-lg border transition-all flex items-center relative ${
                        isActive
                          ? "bg-primary/5 dark:bg-[#0b101c] border-primary/20 text-foreground"
                          : "bg-transparent border-transparent text-gray-500 hover:text-foreground hover:bg-black/5 dark:hover:bg-zinc-900/10"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-3 bg-primary rounded-r"></span>
                      )}
                      <span className={isActive ? "pl-2" : ""}>{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Request Add Box */}
            <div className="border border-black/5 dark:border-zinc-900 bg-black/5 dark:bg-zinc-950/20 p-5 rounded-xl space-y-3">
              <span className="text-[10px] text-gray-500 dark:text-zinc-500 font-sans block leading-relaxed font-semibold">
                Can&apos;t find a stack?
              </span>
              <button
                onClick={() => { setRequestSubmitted(false); setRequestStack(""); setRequestModalOpen(true); }}
                className="w-full py-2.5 border border-black/10 dark:border-outline-variant rounded-lg text-[9px] font-mono font-bold uppercase tracking-widest text-gray-500 dark:text-zinc-400 hover:bg-primary/5 hover:text-foreground hover:border-primary/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={11} />
                Request Add
              </button>
            </div>

          </div>

          {/* Right Column: Main Tech Directory Content */}
          <div className="lg:col-span-9 space-y-10">
            
            {/* Tech Directory Header Card */}
            <div className="glass-card rounded-2xl p-8">
              <h1 className="text-3xl font-black text-foreground tracking-tight font-sans">
                Tech Directory
              </h1>
              <p className="text-gray-500 text-xs leading-relaxed mt-3 max-w-2xl font-sans font-medium">
                Explore organized clusters of technology stacks curated for performance and scalability. Discover experts and projects built on your favorite frameworks.
              </p>
            </div>

            {/* Ecosystem list Header (Sorting Controls) */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-black/5 dark:border-zinc-900/60 pb-4 select-none">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2.5 font-sans uppercase tracking-wider">
                  <Layout size={16} className="text-primary shrink-0" />
                  {activeTab} Ecosystem
                </h2>

                {/* Sort selector dropdown dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-black/10 dark:border-zinc-800 hover:border-primary/40 bg-black/5 dark:bg-zinc-955/40 text-[9px] font-mono font-bold text-gray-500 dark:text-zinc-400 hover:text-foreground transition-all duration-200 cursor-pointer"
                  >
                    <span>SORT BY: {sortBy === "popular" ? "POPULARITY" : "NAME (A-Z)"}</span>
                    <ChevronDown size={10} className="text-gray-400 dark:text-zinc-500" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-white/95 dark:bg-zinc-950/90 backdrop-blur-md border border-black/5 dark:border-zinc-900 rounded-lg shadow-xl py-1 z-30 font-mono text-[9px] font-bold uppercase tracking-wider">
                      <button
                        onClick={() => {
                          setSortBy("popular");
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-black/5 dark:hover:bg-zinc-900 hover:text-foreground transition-all flex items-center justify-between ${
                          sortBy === "popular" ? "text-primary" : "text-gray-500"
                        }`}
                      >
                        Popularity
                      </button>
                      <button
                        onClick={() => {
                          setSortBy("alpha");
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-black/5 dark:hover:bg-zinc-900 hover:text-foreground transition-all flex items-center justify-between ${
                          sortBy === "alpha" ? "text-primary" : "text-gray-500"
                        }`}
                      >
                        Name (A-Z)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Categories Grid List */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {sortedTech.map((tech, index) => (
                  <div 
                    key={index}
                    className="glass-card rounded-2xl p-6 hover:border-primary/40 transition-all group flex flex-col justify-between h-[210px]"
                  >
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center select-none">
                        <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-zinc-900 border border-black/5 dark:border-zinc-800 flex items-center justify-center text-gray-500 group-hover:text-primary transition-colors shrink-0">
                          {renderIcon(tech.iconType)}
                        </div>
                        <span className="text-[8px] font-mono text-gray-500 dark:text-zinc-400 border border-black/5 dark:border-zinc-800/80 px-2 py-0.5 rounded uppercase tracking-wider bg-black/5 dark:bg-zinc-950/40 font-bold">
                          {tech.projectsCount >= 1000 ? `${(tech.projectsCount/1000).toFixed(1)}k` : tech.projectsCount} PROJECTS
                        </span>
                      </div>
                      
                      <h3 className="text-base font-extrabold text-foreground group-hover:text-primary transition-colors">
                        {tech.name}
                      </h3>
                      
                      <p className="text-[11px] text-gray-500 leading-relaxed font-sans font-medium line-clamp-3">
                        {tech.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-2 select-none">
                      {tech.tags.map(tag => (
                        <span key={tag} className="text-[8px] font-mono bg-black/5 dark:bg-zinc-900 border border-black/5 dark:border-zinc-800/50 text-gray-500 dark:text-zinc-500 px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Stack Masters Section */}
            <div className="space-y-2 pt-6">
              <div>
                <h2 className="text-lg font-bold text-foreground font-sans uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp size={16} className="text-primary" />
                  Stack Masters
                </h2>
                <p className="text-[10px] text-gray-500 font-sans font-medium">
                  Top contributors in {activeTab} this month.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6 select-none">
                {stackMasters[activeTab as keyof typeof stackMasters]?.map((master, idx) => (
                  <div 
                    key={idx}
                    className="glass-card rounded-2xl p-6 flex flex-col items-center text-center hover:border-primary/20 transition-all"
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden border border-black/5 dark:border-zinc-800 bg-black/5 dark:bg-zinc-900 flex items-center justify-center filter grayscale contrast-[1.1] shadow-inner">
                      <img 
                        src={master.image} 
                        alt={master.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[8px] font-mono font-bold text-primary tracking-widest uppercase mt-4">
                      {master.role}
                    </span>
                    <span className="text-xs font-bold text-foreground mt-1">
                      {master.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Technical Footer */}
      <footer className="relative z-10 border-t border-black/5 dark:border-zinc-900 bg-white/60 dark:bg-black/60 backdrop-blur-md w-full pt-16 pb-8 transition-colors select-text">
        <div className="max-w-7xl mx-auto px-6 md:px-12 xl:px-24">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-12">
            <div className="md:col-span-6 space-y-4">
              <div className="text-xl font-black tracking-tight text-foreground font-sans uppercase">
                <span className="text-primary">Cam</span>Cod
              </div>
              <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                Engineering the future of work through decentralized collaboration and high-performance talent acquisition.
              </p>
            </div>
            <div className="md:col-span-6 grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-[9px] font-bold text-primary font-mono uppercase tracking-widest">
                  Resources
                </h4>
                <div className="flex flex-col gap-2 text-xs text-gray-500">
                  <span className="hover:text-primary cursor-pointer transition-colors">Network Status</span>
                  <span className="hover:text-primary cursor-pointer transition-colors">Security</span>
                  <span className="hover:text-primary cursor-pointer transition-colors">API Reference</span>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-[9px] font-bold text-primary font-mono uppercase tracking-widest">
                  Legal
                </h4>
                <div className="flex flex-col gap-2 text-xs text-gray-500">
                  <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
                  <span className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-black/5 dark:border-zinc-900 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-[9px] font-mono text-gray-400 dark:text-zinc-600 tracking-wider uppercase font-bold">
              Â© 2024 RecodeX. Engineering the future of work.
            </span>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-black/5 dark:bg-zinc-900/30 border border-black/5 dark:border-zinc-800 flex items-center justify-center text-gray-500">
                <Shield size={13} />
              </div>
              <div className="w-7 h-7 rounded-full bg-black/5 dark:bg-zinc-900/30 border border-black/5 dark:border-zinc-800 flex items-center justify-center text-gray-500">
                <CheckCircle2 size={13} />
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Request Add Stack Modal */}
      {requestModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setRequestModalOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal Panel */}
          <div
            className="relative z-10 w-full max-w-md bg-white/90 dark:bg-zinc-950/95 border border-black/10 dark:border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-primary tracking-widest uppercase font-bold block">
                  Stack Request
                </span>
                <h2 className="text-xl font-black text-foreground tracking-tight font-sans">
                  Request a Stack
                </h2>
              </div>
              <button
                onClick={() => setRequestModalOpen(false)}
                className="w-8 h-8 rounded-full border border-black/10 dark:border-zinc-800 flex items-center justify-center text-gray-500 hover:text-foreground hover:border-primary/30 transition-all cursor-pointer text-lg leading-none"
              >
                Ã—
              </button>
            </div>

            {requestSubmitted ? (
              /* Success State */
              <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-primary" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-bold text-foreground font-sans">Request Submitted!</p>
                  <p className="text-[11px] text-gray-500 font-sans">
                    We'll review <span className="text-primary font-semibold">{requestStack}</span> and add it to the directory.
                  </p>
                </div>
                <button
                  onClick={() => setRequestModalOpen(false)}
                  className="mt-2 px-6 py-2.5 bg-primary text-white dark:text-black text-xs font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all"
                >
                  Done
                </button>
              </div>
            ) : (
              /* Form State */
              <div className="space-y-5">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Don't see the tech stack you're looking for? Submit a request and our curators will review it for inclusion.
                </p>

                <div className="space-y-2">
                  <label className="text-[9px] font-mono font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest block">
                    Stack / Framework Name
                  </label>
                  <input
                    type="text"
                    value={requestStack}
                    onChange={(e) => setRequestStack(e.target.value)}
                    placeholder="e.g. SvelteKit, Bun, Deno..."
                    className="w-full px-4 py-3 bg-black/5 dark:bg-zinc-900/60 border border-black/10 dark:border-zinc-800 rounded-lg text-sm text-foreground placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-primary/50 transition-all font-sans"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && requestStack.trim()) {
                        setRequestSubmitted(true);
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-mono font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest block">
                    Category
                  </label>
                  <select className="w-full px-4 py-3 bg-black/5 dark:bg-zinc-900/60 border border-black/10 dark:border-zinc-800 rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all font-sans cursor-pointer appearance-none">
                    <option>Frontend</option>
                    <option>Backend</option>
                    <option>Mobile Development</option>
                    <option>Cloud &amp; DevOps</option>
                    <option>Data &amp; AI</option>
                    <option>Productivity Tools</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setRequestModalOpen(false)}
                    className="flex-1 py-2.5 border border-black/10 dark:border-zinc-800 rounded-lg text-xs font-semibold text-gray-500 hover:text-foreground hover:border-black/20 dark:hover:border-zinc-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (requestStack.trim()) setRequestSubmitted(true);
                    }}
                    disabled={!requestStack.trim()}
                    className="flex-1 py-2.5 bg-primary text-white dark:text-black rounded-lg text-xs font-bold hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus size={12} />
                    Submit Request
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
