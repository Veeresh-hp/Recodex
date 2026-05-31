import React, { useEffect, useRef } from "react";
import { 
  Cpu, Shield, CheckCircle2, ShieldCheck, ArrowRight,
  Fingerprint, Lock, RefreshCw, Brain, Network, Braces, BarChart3
} from "lucide-react";
import SubNavbar from "../components/SubNavbar";
import Footer from "../components/Footer";
import { useTheme } from "../context/ThemeContext";

export default function Solutions() {
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

  return (
    <>
      <SubNavbar />

      <main className="min-h-screen bg-background text-foreground relative overflow-hidden font-sans bg-grid-layout">
        {/* Background Constellation Mesh */}
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-40" />

        {/* Ambient background glows */}
        <div className="absolute top-[15%] left-[-15%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[160px] pointer-events-none z-0"></div>
        <div className="absolute bottom-[30%] right-[-10%] w-[500px] h-[500px] bg-secondary-container/5 rounded-full blur-[140px] pointer-events-none z-0"></div>

        {/* Hero Section */}
        <section className="relative pt-6 pb-16 px-6 max-w-7xl mx-auto overflow-hidden z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="w-full lg:w-1/2 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-container/10 border border-outline-variant/30 text-primary rounded-full backdrop-blur-sm">
                <ShieldCheck size={16} className="text-primary animate-pulse" />
                <span className="font-mono uppercase tracking-widest text-[9px] font-bold">Elite Engineering Services</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground leading-[1.1]">
                High-Precision <br />
                <span className="text-primary italic">Developer Solutions</span>
              </h1>
              <p className="text-base sm:text-lg text-gray-500 max-w-lg leading-relaxed">
                Custom-engineered infrastructure, rigorous security auditing, and production-grade AI integration for organizations requiring 99.99% reliability.
              </p>
              <div className="pt-2 flex flex-wrap gap-4">
                <button className="px-6 py-3.5 bg-primary text-white dark:text-black font-semibold rounded-lg shadow-lg hover:shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 text-sm">
                  View Engineering Docs
                  <ArrowRight size={16} />
                </button>
                <button className="px-6 py-3.5 bg-surface border border-outline-variant text-foreground font-semibold rounded-lg hover:bg-surface-container-low transition-all text-sm">
                  Speak with an Expert
                </button>
              </div>
            </div>

            <div className="w-full lg:w-1/2 relative h-[420px] rounded-2xl overflow-hidden border border-outline-variant bg-surface shadow-2xl flex items-center justify-center">
              <img 
                alt="Server Architecture" 
                className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity dark:mix-blend-multiply" 
                src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-background/30 via-transparent to-transparent pointer-events-none"></div>
              
              {/* System Health Overlay Widget */}
              <div className="relative z-10 bg-white/90 dark:bg-black/85 backdrop-blur-md p-6 rounded-xl border border-outline-variant/50 shadow-2xl w-full max-w-[280px] space-y-4">
                <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-2">
                  <span className="font-mono text-[10px] text-primary font-bold tracking-wider uppercase">Sys_Health</span>
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                </div>
                <div className="space-y-2">
                  <div className="h-1 bg-black/5 dark:bg-white/10 rounded-full w-full"></div>
                  <div className="h-1 bg-black/5 dark:bg-white/10 rounded-full w-[85%]"></div>
                  <div className="h-1 bg-primary rounded-full w-[60%] shadow-[0_0_8px_rgba(0,103,124,0.4)]"></div>
                </div>
                <p className="font-mono text-[10px] text-gray-500 dark:text-zinc-400">Uptime: 99.9992%</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 01: Custom Architecture */}
        <section className="py-20 bg-white/40 dark:bg-black/20 border-y border-black/5 dark:border-zinc-900/60 z-10 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              {/* Sticky Sidebar */}
              <div className="lg:col-span-4 lg:sticky lg:top-32 space-y-6">
                <div className="space-y-3">
                  <span className="font-mono text-[10px] text-primary tracking-widest uppercase font-bold block">Solution 01</span>
                  <h2 className="text-3xl font-black tracking-tight text-foreground">Custom Architecture</h2>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Scalable, distributed systems designed for high-concurrency workloads. We build the resilient backbone of your enterprise networks.
                  </p>
                </div>
                <ul className="space-y-3 font-mono text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-primary" />
                    Microservices Orchestration
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-primary" />
                    Multi-Region Cloud Strategy
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-primary" />
                    Database Optimization
                  </li>
                </ul>
                <div className="pt-2">
                  <button className="w-full py-3.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white dark:hover:text-black font-semibold rounded-lg active:scale-95 transition-all text-xs tracking-wider uppercase">
                    Request Proposal
                  </button>
                </div>
              </div>

              {/* Technical Breakdown Cards */}
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card rounded-2xl p-6 space-y-5 flex flex-col justify-between hover:translate-y-[-4px] transition-all duration-300">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-lg bg-black/5 dark:bg-zinc-900 border border-black/5 dark:border-zinc-800 flex items-center justify-center text-primary">
                        <Network size={20} />
                      </div>
                      <span className="text-[9px] font-mono font-bold bg-primary/10 text-primary border border-primary/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        SLA 99.9%
                      </span>
                    </div>
                    <h3 className="text-lg font-black tracking-tight text-foreground">Mesh Integration</h3>
                    <p className="text-gray-500 text-xs leading-relaxed">
                      Deployment of enterprise-grade service mesh for unified observability, traffic routing control, and core protocol security.
                    </p>
                  </div>
                  <div className="pt-2 font-mono text-[10px] bg-black/5 dark:bg-[#03060c]/60 p-3.5 rounded-lg border border-black/5 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-400">
                    <code>&gt; init_mesh_controller --zone=us-east-1<br/>&gt; status: active [OK]</code>
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-6 space-y-5 flex flex-col justify-between hover:translate-y-[-4px] transition-all duration-300">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-lg bg-black/5 dark:bg-zinc-900 border border-black/5 dark:border-zinc-800 flex items-center justify-center text-primary">
                        <Cpu size={20} />
                      </div>
                      <span className="text-[9px] font-mono font-bold bg-primary/10 text-primary border border-primary/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        RT &lt; 50ms
                      </span>
                    </div>
                    <h3 className="text-lg font-black tracking-tight text-foreground">Edge Computing</h3>
                    <p className="text-gray-500 text-xs leading-relaxed">
                      Minimizing service latency by pushing compute layers closer to end-users via our globally routed edge networking protocols.
                    </p>
                  </div>
                  <div className="pt-2 font-mono text-[10px] bg-black/5 dark:bg-[#03060c]/60 p-3.5 rounded-lg border border-black/5 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-400">
                    <code>&gt; push_logic_to_edge --global<br/>&gt; latency_reduction: 68%</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 02: Security Audits (Bento Layout) */}
        <section className="py-20 bg-black/5 dark:bg-black/40 border-b border-black/5 dark:border-zinc-900/60 z-10 relative">
          <div className="max-w-7xl mx-auto px-6 space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="font-mono text-[10px] text-primary tracking-widest uppercase font-bold block">Solution 02</span>
              <h2 className="text-3xl font-black tracking-tight text-foreground">Security Audits</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Hardening your software stack against sophisticated threats with our robust zero-trust pipeline methodologies and continuous code evaluations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Wide Bento Card */}
              <div className="md:col-span-2 glass-card p-8 rounded-2xl flex flex-col justify-between overflow-hidden relative group min-h-[340px]">
                <div className="space-y-6 z-10 relative">
                  <h3 className="text-xl font-black tracking-tight text-foreground">Zero-Trust Framework</h3>
                  <p className="text-gray-500 text-xs leading-relaxed max-w-md">
                    Implementation of continuous cryptographic verification for every user, device, and transactional layer within your cloud runtime clusters.
                  </p>
                  <ul className="space-y-3 font-mono text-[10px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                    <li className="flex items-center gap-2.5">
                      <Shield size={16} className="text-primary" /> Identity-Aware Access Control
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Fingerprint size={16} className="text-primary" /> Multi-Factor Core Authentication
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Lock size={16} className="text-primary" /> End-to-End Payload Encryption
                    </li>
                  </ul>
                </div>
                <div className="mt-8 z-10 relative">
                  <button className="px-5 py-2.5 bg-[#1e2224] hover:bg-[#2d3133] dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-semibold rounded-lg text-xs tracking-wider uppercase transition-all duration-200">
                    Audit My Stack
                  </button>
                </div>
                {/* Large Background Graphic Symbol */}
                <div className="absolute right-[-40px] bottom-[-40px] text-primary/5 dark:text-white/5 pointer-events-none select-none opacity-40 group-hover:opacity-60 transition-opacity duration-500">
                  <Shield size={260} className="stroke-[0.5]" />
                </div>
              </div>

              {/* Tight Primary Accent Bento Card */}
              <div className="bg-primary text-white dark:text-black p-8 rounded-2xl flex flex-col justify-between shadow-2xl relative overflow-hidden min-h-[340px]">
                <div className="space-y-3">
                  <span className="font-mono text-[9px] font-bold text-white/70 dark:text-black/60 uppercase tracking-widest">Penetration Test</span>
                  <h3 className="text-xl font-black tracking-tight text-white dark:text-black">Vulnerability Labs</h3>
                </div>
                <div className="space-y-3.5 py-4 font-mono text-[10px] font-bold uppercase tracking-wider text-white/90 dark:text-black/80">
                  <div className="h-px bg-white/15 dark:bg-black/10 w-full"></div>
                  <div className="flex justify-between items-center">
                    <span>OWASP Top 10</span>
                    <span className="text-xs font-black">Covered</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Threat Modeling</span>
                    <span className="text-xs font-black">Included</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Compliance</span>
                    <span className="text-xs font-black">SOC2/GDPR</span>
                  </div>
                </div>
                <div className="absolute top-4 right-4 text-white/20 dark:text-black/25">
                  <RefreshCw size={54} className="animate-spin [animation-duration:10s] stroke-[1]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 03: AI Integration */}
        <section className="py-20 bg-white/40 dark:bg-black/20 border-b border-black/5 dark:border-zinc-900/60 z-10 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              {/* Concentric AI Visualizer */}
              <div className="w-full lg:w-1/2 relative flex items-center justify-center">
                <div className="aspect-square bg-white dark:bg-zinc-950 border border-outline-variant/60 rounded-full p-12 flex items-center justify-center w-full max-w-[420px] relative">
                  <div className="absolute inset-0 rounded-full border border-primary/20 animate-pulse"></div>
                  <div className="absolute inset-8 rounded-full border border-primary/30 animate-[pulse_2.5s_infinite]"></div>
                  <div className="absolute inset-16 rounded-full border border-primary/40"></div>
                  <Brain size={100} className="text-primary shrink-0 stroke-[1.2]" />
                  
                  {/* Info Badges */}
                  <div className="absolute top-10 right-0 p-3 bg-white dark:bg-zinc-900 border border-outline-variant/50 rounded-lg shadow-xl font-mono text-[9px] font-bold text-foreground">
                    Model Precision: 0.992
                  </div>
                  <div className="absolute bottom-10 left-0 p-3 bg-white dark:bg-zinc-900 border border-outline-variant/50 rounded-lg shadow-xl font-mono text-[9px] font-bold text-foreground">
                    Training: Complete
                  </div>
                </div>
              </div>

              {/* Copy & Features */}
              <div className="w-full lg:w-1/2 space-y-6">
                <span className="font-mono text-[10px] text-primary tracking-widest uppercase font-bold block">Solution 03</span>
                <h2 className="text-3xl font-black tracking-tight text-foreground">AI &amp; Machine Learning</h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Moving beyond generative wrappers. We train and deploy LLMs and customized computer vision networks in isolated network environments focused strictly on factual deterministic accuracy.
                </p>

                <div className="space-y-6 pt-4">
                  <div className="flex gap-4 group">
                    <div className="h-12 w-12 shrink-0 bg-primary/10 text-primary flex items-center justify-center rounded-xl border border-primary/20 group-hover:bg-primary group-hover:text-white dark:group-hover:text-black transition-all duration-300">
                      <Brain size={20} />
                    </div>
                    <div>
                      <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-foreground">Custom Fine-Tuning</h4>
                      <p className="text-xs text-gray-500 leading-relaxed mt-1">
                        Isolated deployment of parameter models tailored to your internal technical documentation databases.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 group">
                    <div className="h-12 w-12 shrink-0 bg-primary/10 text-primary flex items-center justify-center rounded-xl border border-primary/20 group-hover:bg-primary group-hover:text-white dark:group-hover:text-black transition-all duration-300">
                      <Braces size={20} />
                    </div>
                    <div>
                      <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-foreground">RAG Architecture</h4>
                      <p className="text-xs text-gray-500 leading-relaxed mt-1">
                        Factually grounded generation networks utilizing vectorized knowledge bases to mitigate hallucination rates.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 group">
                    <div className="h-12 w-12 shrink-0 bg-primary/10 text-primary flex items-center justify-center rounded-xl border border-primary/20 group-hover:bg-primary group-hover:text-white dark:group-hover:text-black transition-all duration-300">
                      <BarChart3 size={20} />
                    </div>
                    <div>
                      <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-foreground">Predictive Pipelines</h4>
                      <p className="text-xs text-gray-500 leading-relaxed mt-1">
                        High-availability forecasting nodes analyzing transaction systems and cluster metrics in real-time.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button className="px-6 py-3.5 bg-primary text-white dark:text-black font-semibold rounded-lg shadow-lg hover:shadow-primary/20 hover:brightness-110 active:scale-95 transition-all text-xs tracking-wider uppercase">
                    Integrate AI Today
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Panel Section */}
        <section className="py-20 z-10 relative">
          <div className="max-w-5xl mx-auto px-6">
            <div className="bg-[#1e2224] dark:bg-zinc-950/80 rounded-3xl p-10 lg:p-14 text-center text-white border border-white/5 shadow-2xl relative overflow-hidden">
              {/* Subtle background grids */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-grid-layout bg-repeat"></div>
              
              <div className="relative z-10 space-y-6">
                <h2 className="text-3xl font-black tracking-tight text-white leading-tight">Ready to upgrade your engineering?</h2>
                <p className="text-gray-400 text-sm max-w-xl mx-auto leading-relaxed">
                  Our specialized engineering squads are ready to allocate on your most challenging infrastructure and compliance objectives.
                </p>
                <div className="flex flex-wrap justify-center gap-4 pt-4">
                  <button className="px-6 py-3.5 bg-primary text-white dark:text-black font-semibold rounded-lg hover:brightness-110 active:scale-95 transition-all text-xs tracking-wider uppercase">
                    Start a Project
                  </button>
                  <button className="px-6 py-3.5 bg-transparent border border-gray-600 text-white hover:bg-white/5 font-semibold rounded-lg active:scale-95 transition-all text-xs tracking-wider uppercase">
                    Talk to Sales
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
