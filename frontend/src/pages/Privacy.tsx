import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Download, Check, Shield, CheckCircle2, Lock, Scale } from "lucide-react";
import SubNavbar from "../components/SubNavbar";

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState("01");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background Constellation Canvas for Visual System Continuity
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

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(`section-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-start relative overflow-hidden font-sans select-none print:bg-white print:text-black">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-40 print:hidden" />

      <div className="absolute top-[25%] left-[-15%] w-[600px] h-[600px] bg-cyan-955/5 rounded-full blur-[160px] pointer-events-none z-0 print:hidden"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-zinc-900/5 rounded-full blur-[140px] pointer-events-none z-0 print:hidden"></div>

      <SubNavbar />

      <main className="relative z-10 flex-grow max-w-7xl mx-auto w-full px-6 md:px-12 xl:px-24 pt-4 pb-12 md:pt-6 md:pb-20 flex flex-col lg:flex-row gap-12 md:gap-16 items-start select-text print:py-0 print:px-0">
        
        {/* Left Column Navigation */}
        <div className="w-full lg:w-96 lg:sticky lg:top-28 space-y-6 print:hidden">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-black/10 dark:border-zinc-800 bg-black/5 dark:bg-zinc-900/40 backdrop-blur-md w-fit">
              <Shield size={12} className="text-primary dark:text-[#00d1ff]" />
              <span className="text-[10px] font-mono tracking-widest text-zinc-500 dark:text-[#94a3b8] font-bold">PRIVACY FRAMEWORK V2.4.0</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground dark:text-white leading-tight font-sans">
              Privacy <span className="text-primary dark:text-[#00d1ff] relative font-black">
                Policy
                <span className="absolute left-0 bottom-1 w-full h-[3px] bg-primary dark:bg-[#00d1ff] opacity-35 blur-[1px]"></span>
              </span>
            </h1>

            <p className="text-zinc-600 dark:text-[#94a3b8] text-xs leading-relaxed font-sans font-medium">
              We prioritize data privacy, zero-knowledge architecture, and transparent telemetry. Learn how RecodeX safeguards user identities, codebase data, and communications.
            </p>
          </div>

          <nav className="space-y-3 pt-6 border-t border-black/10 dark:border-zinc-900/60 font-mono text-[10px] font-bold uppercase tracking-widest w-full">
            <button
              onClick={() => scrollToSection("01")}
              className={`flex items-center gap-3 w-full text-left transition-colors cursor-pointer ${
                activeSection === "01" ? "text-primary dark:text-[#00d1ff]" : "text-zinc-500 hover:text-foreground dark:hover:text-zinc-300"
              }`}
            >
              <span className={activeSection === "01" ? "text-primary dark:text-[#00d1ff]" : "text-zinc-400 dark:text-zinc-700"}>01</span>
              Data Telemetry & Scope
            </button>

            <button
              onClick={() => scrollToSection("02")}
              className={`flex items-center gap-3 w-full text-left transition-colors cursor-pointer ${
                activeSection === "02" ? "text-primary dark:text-[#00d1ff]" : "text-zinc-500 hover:text-foreground dark:hover:text-zinc-300"
              }`}
            >
              <span className={activeSection === "02" ? "text-primary dark:text-[#00d1ff]" : "text-zinc-400 dark:text-zinc-700"}>02</span>
              Zero-Knowledge Architecture
            </button>

            <button
              onClick={() => scrollToSection("03")}
              className={`flex items-center gap-3 w-full text-left transition-colors cursor-pointer ${
                activeSection === "03" ? "text-primary dark:text-[#00d1ff]" : "text-zinc-500 hover:text-foreground dark:hover:text-zinc-300"
              }`}
            >
              <span className={activeSection === "03" ? "text-primary dark:text-[#00d1ff]" : "text-zinc-400 dark:text-zinc-700"}>03</span>
              Third-Party Integrations
            </button>

            <button
              onClick={() => scrollToSection("04")}
              className={`flex items-center gap-3 w-full text-left transition-colors cursor-pointer ${
                activeSection === "04" ? "text-primary dark:text-[#00d1ff]" : "text-zinc-500 hover:text-foreground dark:hover:text-zinc-300"
              }`}
            >
              <span className={activeSection === "04" ? "text-primary dark:text-[#00d1ff]" : "text-zinc-400 dark:text-zinc-700"}>04</span>
              User Rights & Deletion
            </button>
          </nav>

          <div className="space-y-2 pt-6 w-full">
            <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-600 font-bold uppercase tracking-wider block">
              Last Revision: Jan 2026
            </span>
            <button 
              onClick={() => window.print()}
              className="px-5 py-3.5 bg-primary dark:bg-[#00d1ff] text-on-primary dark:text-black font-extrabold rounded-lg text-xs tracking-wider uppercase transition-all duration-300 hover:bg-primary-container dark:hover:bg-[#3ce5ff] hover:shadow-[0_0_30px_rgba(0,209,255,0.4)] active:scale-[0.98] flex items-center justify-center gap-2 font-sans cursor-pointer w-full"
            >
              <Download size={14} />
              Download Policy PDF
            </button>
          </div>
        </div>

        {/* Right Column Content Card */}
        <div className="flex-grow w-full max-w-[720px] bg-white/60 dark:bg-[#07090e]/60 backdrop-blur-xl border border-black/10 dark:border-zinc-800/80 rounded-2xl p-8 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.05)] dark:shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden transition-all duration-300 hover:border-black/20 dark:hover:border-zinc-700/80 space-y-12 print:w-full print:max-w-none print:bg-transparent print:border-none print:shadow-none print:p-0 print:text-black print:dark:text-black print:space-y-8">
          
          {/* Section 01: Data Telemetry */}
          <div id="section-01" className="space-y-5 scroll-mt-28">
            <h2 className="text-base font-bold font-mono tracking-wider text-foreground dark:text-zinc-100 uppercase flex items-center gap-3">
              <span className="text-primary dark:text-[#00d1ff]">01 /</span> Data Telemetry & Scope
            </h2>
            <div className="space-y-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans font-medium">
              <p>
                RecodeX collects minimal telemetry data essential for operating our high-performance technical directory. Information processed includes user profile identifiers, technical project metadata, and session tokens.
              </p>
              <p>
                We do not collect or store unencrypted financial credentials or personal biometric telemetry. All user identity synchronization is strictly verified through secure cryptographic tokens.
              </p>
            </div>

            <div className="border border-black/10 dark:border-zinc-900 bg-black/5 dark:bg-[#04060a]/40 rounded-xl p-5 space-y-3 font-sans text-xs">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-black/10 dark:bg-zinc-900 border border-black/5 dark:border-zinc-800/80 flex items-center justify-center text-primary dark:text-[#00d1ff] shrink-0 mt-0.5">
                  <Check size={11} />
                </div>
                <span className="text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                  Cryptographically hashed session storage.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-black/10 dark:bg-zinc-900 border border-black/5 dark:border-zinc-800/80 flex items-center justify-center text-primary dark:text-[#00d1ff] shrink-0 mt-0.5">
                  <Check size={11} />
                </div>
                <span className="text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                  No selling or renting of personal user records to data brokers.
                </span>
              </div>
            </div>
          </div>

          {/* Section 02: Zero-Knowledge Architecture */}
          <div id="section-02" className="space-y-5 scroll-mt-28">
            <h2 className="text-base font-bold font-mono tracking-wider text-foreground dark:text-zinc-100 uppercase flex items-center gap-3">
              <span className="text-primary dark:text-[#00d1ff]">02 /</span> Zero-Knowledge Architecture
            </h2>
            <div className="space-y-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans font-medium">
              <p>
                Source code, project repository files, and developer deliverables uploaded to RecodeX are stored using sharded zero-knowledge encryption patterns.
              </p>
              <p>
                Neither RecodeX personnel nor external networks can decrypt or inspect private repository logic without your explicit authorization keys.
              </p>
            </div>
          </div>

          {/* Section 03: Third-Party Services */}
          <div id="section-03" className="space-y-5 scroll-mt-28">
            <h2 className="text-base font-bold font-mono tracking-wider text-foreground dark:text-zinc-100 uppercase flex items-center gap-3">
              <span className="text-primary dark:text-[#00d1ff]">03 /</span> Third-Party Integrations
            </h2>
            <div className="space-y-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans font-medium">
              <p>
                RecodeX integrates with trusted identity and infrastructure providers such as Clerk and Supabase. Third-party data exchange is restricted to necessary authentication routines adhering strictly to OAuth 2.0 and TLS 1.3 standards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-black/10 dark:border-zinc-900 bg-black/5 dark:bg-[#04060a]/40 rounded-xl p-5">
                <span className="text-[9px] font-mono text-zinc-500 tracking-wider block font-bold uppercase">
                  Authentication Layer
                </span>
                <span className="text-lg font-bold text-primary dark:text-[#00d1ff] mt-2 font-mono block">
                  Clerk Auth
                </span>
                <span className="text-[9px] text-zinc-500 mt-1 block font-medium">
                  Encrypted JWT validation
                </span>
              </div>

              <div className="border border-black/10 dark:border-zinc-900 bg-black/5 dark:bg-[#04060a]/40 rounded-xl p-5">
                <span className="text-[9px] font-mono text-zinc-500 tracking-wider block font-bold uppercase">
                  Data Layer
                </span>
                <span className="text-lg font-bold text-primary dark:text-[#00d1ff] mt-2 font-mono block">
                  PostgreSQL / Supabase
                </span>
                <span className="text-[9px] text-zinc-500 mt-1 block font-medium">
                  AES-256 encrypted at rest
                </span>
              </div>
            </div>
          </div>

          {/* Section 04: User Rights */}
          <div id="section-04" className="space-y-5 scroll-mt-28">
            <h2 className="text-base font-bold font-mono tracking-wider text-foreground dark:text-zinc-100 uppercase flex items-center gap-3">
              <span className="text-primary dark:text-[#00d1ff]">04 /</span> User Rights & Deletion
            </h2>
            <div className="space-y-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans font-medium">
              <p>
                You retain full ownership of your data. Users may request an export of their stored profile data or trigger complete account purging at any time by contacting compliance@recodex.io or navigating to the Account Settings dashboard.
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
