import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Download, Check, Shield, CheckCircle2, Image as ImageIcon, Scale, ArrowLeft } from "lucide-react";
import SubNavbar from "../components/SubNavbar";

export default function TermsAndConditions() {
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

      // Subtle network grids
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

      // Connecting lines
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

  // Smooth scrolling to section function
  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(`section-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-start relative overflow-hidden font-sans select-none print:bg-white print:text-black">
      {/* Constellation Canvas background */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-40 print:hidden" />

      {/* Ambient background glows */}
      <div className="absolute top-[25%] left-[-15%] w-[600px] h-[600px] bg-cyan-955/5 rounded-full blur-[160px] pointer-events-none z-0 print:hidden"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-zinc-900/5 rounded-full blur-[140px] pointer-events-none z-0 print:hidden"></div>

      {/* 1. Header with RecodeX branding */}
      <SubNavbar />

      {/* 2. Main Page Grid */}
      <main className="relative z-10 flex-grow max-w-7xl mx-auto w-full px-6 md:px-12 xl:px-24 pt-4 pb-12 md:pt-6 md:pb-20 flex flex-col lg:flex-row gap-12 md:gap-16 items-start select-text print:py-0 print:px-0">
        
        {/* Left Column (Static Titles, Table of Contents, and CTA) */}
        <div className="w-full lg:w-96 lg:sticky lg:top-28 space-y-6 print:hidden">
          <div className="space-y-6">
            {/* Legal Framework Badge */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-black/10 dark:border-zinc-800 bg-black/5 dark:bg-zinc-900/40 backdrop-blur-md w-fit">
              <Scale size={12} className="text-primary dark:text-[#00d1ff]" />
              <span className="text-[10px] font-mono tracking-widest text-zinc-500 dark:text-[#94a3b8] font-bold">LEGAL FRAMEWORK V2.4.0</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground dark:text-white leading-tight font-sans">
              Terms & <span className="text-primary dark:text-[#00d1ff] relative font-black">
                Conditions
                <span className="absolute left-0 bottom-1 w-full h-[3px] bg-primary dark:bg-[#00d1ff] opacity-35 blur-[1px]"></span>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-zinc-600 dark:text-[#94a3b8] text-xs leading-relaxed font-sans font-medium">
              Review our governing protocols. These terms define the operational boundaries of the RecodeX marketplace and the rights of engineers and employers within our ecosystem.
            </p>
          </div>

          {/* Table of Contents navigation menu */}
          <nav className="space-y-3 pt-6 border-t border-black/10 dark:border-zinc-900/60 font-mono text-[10px] font-bold uppercase tracking-widest w-full">
            <button
              onClick={() => scrollToSection("01")}
              className={`flex items-center gap-3 w-full text-left transition-colors cursor-pointer ${
                activeSection === "01" ? "text-primary dark:text-[#00d1ff]" : "text-zinc-500 hover:text-foreground dark:hover:text-zinc-300"
              }`}
            >
              <span className={activeSection === "01" ? "text-primary dark:text-[#00d1ff]" : "text-zinc-400 dark:text-zinc-700"}>01</span>
              Protocol Governance
            </button>

            <button
              onClick={() => scrollToSection("02")}
              className={`flex items-center gap-3 w-full text-left transition-colors cursor-pointer ${
                activeSection === "02" ? "text-primary dark:text-[#00d1ff]" : "text-zinc-500 hover:text-foreground dark:hover:text-zinc-300"
              }`}
            >
              <span className={activeSection === "02" ? "text-primary dark:text-[#00d1ff]" : "text-zinc-400 dark:text-zinc-700"}>02</span>
              Intellectual Property
            </button>

            <button
              onClick={() => scrollToSection("03")}
              className={`flex items-center gap-3 w-full text-left transition-colors cursor-pointer ${
                activeSection === "03" ? "text-primary dark:text-[#00d1ff]" : "text-zinc-500 hover:text-foreground dark:hover:text-zinc-300"
              }`}
            >
              <span className={activeSection === "03" ? "text-primary dark:text-[#00d1ff]" : "text-zinc-400 dark:text-zinc-700"}>03</span>
              Service Level Agreements
            </button>

            <button
              onClick={() => scrollToSection("04")}
              className={`flex items-center gap-3 w-full text-left transition-colors cursor-pointer ${
                activeSection === "04" ? "text-primary dark:text-[#00d1ff]" : "text-zinc-500 hover:text-foreground dark:hover:text-zinc-300"
              }`}
            >
              <span className={activeSection === "04" ? "text-primary dark:text-[#00d1ff]" : "text-zinc-400 dark:text-zinc-700"}>04</span>
              Encryption Standards
            </button>
          </nav>

          {/* Download PDF button */}
          <div className="space-y-2 pt-6 w-full">
            <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-600 font-bold uppercase tracking-wider block">
              Last Revision: Oct 2023
            </span>
            <button 
              onClick={() => window.print()}
              className="px-5 py-3.5 bg-primary dark:bg-[#00d1ff] text-on-primary dark:text-black font-extrabold rounded-lg text-xs tracking-wider uppercase transition-all duration-300 hover:bg-primary-container dark:hover:bg-[#3ce5ff] hover:shadow-[0_0_30px_rgba(0,209,255,0.4)] active:scale-[0.98] flex items-center justify-center gap-2 font-sans cursor-pointer w-full"
            >
              <Download size={14} />
              Download PDF
            </button>
          </div>
        </div>

        {/* Right Column (Sleek, Tall Glassmorphic Content Card) */}
        <div className="flex-grow w-full max-w-[720px] bg-white/60 dark:bg-[#07090e]/60 backdrop-blur-xl border border-black/10 dark:border-zinc-800/80 rounded-2xl p-8 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.05)] dark:shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden transition-all duration-300 hover:border-black/20 dark:hover:border-zinc-700/80 space-y-12 print:w-full print:max-w-none print:bg-transparent print:border-none print:shadow-none print:p-0 print:text-black print:dark:text-black print:space-y-8">
          
          {/* Section 01: Protocol Governance */}
          <div id="section-01" className="space-y-5 scroll-mt-28">
            <h2 className="text-base font-bold font-mono tracking-wider text-foreground dark:text-zinc-100 uppercase flex items-center gap-3">
              <span className="text-primary dark:text-[#00d1ff]">01 /</span> Protocol Governance
            </h2>
            <div className="space-y-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans font-medium">
              <p>
                The RecodeX platform operates under a strictly enforced algorithmic governance model. By accessing the marketplace, users agree to abide by the automated consensus mechanisms that govern project awarding, dispute resolution, and payment release cycles.
              </p>
              <p>
                Engagement protocols are established upon contract initiation. Deviation from the agreed-upon technical stack or deployment schedule requires a multi-signature verification from both parties. We maintain a non-custodial approach to escrow, ensuring that capital is locked and released only through verified milestone completions.
              </p>
            </div>

            {/* automated reputation container */}
            <div className="border border-black/10 dark:border-zinc-900 bg-black/5 dark:bg-[#04060a]/40 rounded-xl p-5 space-y-3 font-sans text-xs">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-black/10 dark:bg-zinc-900 border border-black/5 dark:border-zinc-800/80 flex items-center justify-center text-primary dark:text-[#00d1ff] shrink-0 mt-0.5">
                  <Check size={11} />
                </div>
                <span className="text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                  Automated reputation scoring based on commit frequency.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-black/10 dark:bg-zinc-900 border border-black/5 dark:border-zinc-800/80 flex items-center justify-center text-primary dark:text-[#00d1ff] shrink-0 mt-0.5">
                  <Check size={11} />
                </div>
                <span className="text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                  Zero-tolerance policy for logic manipulation.
                </span>
              </div>
            </div>
          </div>

          {/* Section 02: Intellectual Property */}
          <div id="section-02" className="space-y-5 scroll-mt-28">
            <h2 className="text-base font-bold font-mono tracking-wider text-foreground dark:text-zinc-100 uppercase flex items-center gap-3">
              <span className="text-primary dark:text-[#00d1ff]">02 /</span> Intellectual Property
            </h2>
            <div className="space-y-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans font-medium">
              <p>
                Unless otherwise specified in a custom Master Service Agreement (MSA), all codebase intellectual property transfers to the hiring entity upon 100% completion of financial disbursement. RecodeX retains a limited, non-exclusive license to metadata generated during the engineering process for the purpose of platform optimization.
              </p>
              <p>
                Developers warrant that all logic subroutines and dependencies used are either original work or validly licensed open-source components compliant with the client&apos;s licensing requirements.
              </p>
            </div>
          </div>

          {/* Section 03: Service Level Agreements */}
          <div id="section-03" className="space-y-5 scroll-mt-28">
            <h2 className="text-base font-bold font-mono tracking-wider text-foreground dark:text-zinc-100 uppercase flex items-center gap-3">
              <span className="text-primary dark:text-[#00d1ff]">03 /</span> Service Level Agreements
            </h2>
            <div className="space-y-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans font-medium">
              <p>
                Platform availability is guaranteed at 99.99% (Four Nines), excluding scheduled maintenance windows notified 48 hours in advance. API latency across the RecodeX marketplace is optimized for &lt;50ms response times globally.
              </p>
            </div>

            {/* SLA Response Time & Uptime Sync Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-black/10 dark:border-zinc-900 bg-black/5 dark:bg-[#04060a]/40 rounded-xl p-5">
                <span className="text-[9px] font-mono text-zinc-500 tracking-wider block font-bold uppercase">
                  Response Time
                </span>
                <span className="text-xl font-bold text-primary dark:text-[#00d1ff] mt-2 font-mono block">
                  1.5 HRS
                </span>
                <span className="text-[9px] text-zinc-500 mt-1 block font-medium">
                  Average support resolution
                </span>
              </div>

              <div className="border border-black/10 dark:border-zinc-900 bg-black/5 dark:bg-[#04060a]/40 rounded-xl p-5">
                <span className="text-[9px] font-mono text-zinc-500 tracking-wider block font-bold uppercase">
                  Uptime Sync
                </span>
                <span className="text-xl font-bold text-primary dark:text-[#00d1ff] mt-2 font-mono block">
                  99.99%
                </span>
                <span className="text-[9px] text-zinc-500 mt-1 block font-medium">
                  Global cluster health
                </span>
              </div>
            </div>
          </div>

          {/* Section 04: Encryption Standards */}
          <div id="section-04" className="space-y-5 scroll-mt-28">
            <h2 className="text-base font-bold font-mono tracking-wider text-foreground dark:text-zinc-100 uppercase flex items-center gap-3">
              <span className="text-primary dark:text-[#00d1ff]">04 /</span> Encryption Standards
            </h2>
            <div className="space-y-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans font-medium">
              <p>
                All data transit utilizes TLS 1.3 with AES-256 encryption. Code storage within RecodeX repositories utilizes sharded, zero-knowledge architectural patterns, ensuring that neither RecodeX employees nor unauthorized third parties can decrypt project source code without user keys.
              </p>
              <p>
                We strictly adhere to ISO/IEC 27001 standards for information security management systems.
              </p>
            </div>

            {/* Encrypted media archive block */}
            <div className="border border-black/10 dark:border-zinc-900 bg-black/5 dark:bg-[#04060a]/40 rounded-xl p-5 relative overflow-hidden flex flex-col items-center justify-center gap-4 h-48 group cursor-pointer hover:border-black/20 dark:hover:border-zinc-800 transition-all shadow-inner">
              <div className="w-14 h-14 rounded-full bg-black/10 dark:bg-zinc-900 border border-black/5 dark:border-zinc-800/80 flex items-center justify-center text-zinc-500 shadow-md group-hover:scale-105 transition-transform duration-300">
                <ImageIcon size={24} />
              </div>
              <div className="absolute bottom-4 left-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-500 font-bold uppercase tracking-wider">
                  encrypted_archive:arr_256_gcm
                </span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* 3. RecodeX Resources Legal Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-black/60 backdrop-blur-md w-full pt-16 pb-8 transition-colors select-text print:hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 xl:px-24">
          
          {/* Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-12">
            
            {/* Logo description */}
            <div className="md:col-span-6 space-y-4">
              <div className="text-xl font-black tracking-tight text-white font-sans uppercase">
                <span className="text-[#00d1ff]">Recode</span>X
              </div>
              <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
                Engineering the future of work through decentralized collaboration and high-performance talent acquisition.
              </p>
            </div>

            {/* Columns list */}
            <div className="md:col-span-6 grid grid-cols-2 gap-6">
              
              {/* Resources */}
              <div className="space-y-3">
                <h4 className="text-[9px] font-bold text-[#00d1ff] font-mono uppercase tracking-widest">
                  Resources
                </h4>
                <div className="flex flex-col gap-2 text-xs text-zinc-500">
                  <span className="hover:text-[#00d1ff] cursor-pointer transition-colors">
                    Network Status
                  </span>
                  <span className="hover:text-[#00d1ff] cursor-pointer transition-colors">
                    Security
                  </span>
                  <span className="hover:text-[#00d1ff] cursor-pointer transition-colors">
                    API Reference
                  </span>
                </div>
              </div>

              {/* Legal */}
              <div className="space-y-3">
                <h4 className="text-[9px] font-bold text-[#00d1ff] font-mono uppercase tracking-widest">
                  Legal
                </h4>
                <div className="flex flex-col gap-2 text-xs text-zinc-500">
                  <Link to="/terms" className="hover:text-[#00d1ff] transition-colors">
                    Terms of Service
                  </Link>
                  <span className="hover:text-[#00d1ff] cursor-pointer transition-colors">
                    Privacy Policy
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom copyright details */}
          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-[9px] font-mono text-zinc-650 tracking-wider uppercase font-bold">
              Â© 2024 RecodeX. Engineering the future of work.
            </span>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-zinc-900/30 border border-zinc-800 flex items-center justify-center text-zinc-500">
                <Shield size={13} />
              </div>
              <div className="w-7 h-7 rounded-full bg-zinc-900/30 border border-zinc-800 flex items-center justify-center text-zinc-500">
                <CheckCircle2 size={13} />
              </div>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
