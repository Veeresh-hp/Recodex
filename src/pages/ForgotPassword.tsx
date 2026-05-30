import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { AtSign, ArrowLeft, SquareTerminal, Shield, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background Constellation Animation (Visual System Continuity)
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
        this.alpha = Math.random() * 0.5 + 0.15;
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
        c.fillStyle = isDark ? `rgba(255, 255, 255, ${this.alpha})` : `rgba(0, 103, 124, ${this.alpha})`;
        c.fill();
      }
    }

    const particles: Particle[] = Array.from({ length: 60 }, () => new Particle());

    const animate = () => {
      const isDark = document.documentElement.classList.contains("dark");
      ctx.clearRect(0, 0, width, height);

      // Subtle network background grids
      ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 103, 124, 0.02)";
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

      // Connection lines
      ctx.lineWidth = 0.6;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            const alpha = (1 - dist / 150) * 0.1;
            ctx.strokeStyle = isDark ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 103, 124, ${alpha})`;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-start relative overflow-hidden font-sans">
      {/* Background Constellation Mesh */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-40" />

      {/* Ambient background glows */}
      <div className="absolute top-[25%] left-[-15%] w-[600px] h-[600px] bg-zinc-900/10 rounded-full blur-[160px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-cyan-955/5 rounded-full blur-[140px] pointer-events-none z-0"></div>

      {/* Navbar header */}

      {/* Main Grid Workspace */}
      <main className="relative z-10 flex-grow flex items-center pt-20 pb-12 lg:pt-24 lg:pb-24 px-6 md:px-12 xl:px-24 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">

          {/* Left Column (Recovery Protocol Grid & Logs) */}
          <div className="lg:col-span-6 space-y-8 select-text">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-black/10 dark:border-zinc-800 bg-black/5 dark:bg-zinc-900/40 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-primary dark:bg-[#00d1ff] animate-pulse"></span>
              <span className="text-[10px] font-mono tracking-widest text-zinc-500 dark:text-[#94a3b8] font-bold">SYSTEM STATUS: STANDBY</span>
            </div>

            {/* Main Header */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground dark:text-white leading-tight font-sans">
              Recovery Protocol
            </h1>

            {/* 2x2 Tech Status Cards Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Neural Entropy */}
              <div className="border border-black/10 dark:border-zinc-900/60 bg-black/5 dark:bg-[#080a0f]/40 backdrop-blur-md rounded-xl p-5">
                <span className="text-[9px] font-mono text-zinc-500 tracking-wider block font-bold uppercase">
                  Neural_Entropy
                </span>
                <span className="text-sm font-bold text-foreground dark:text-zinc-200 mt-2 font-mono block">
                  0.00427_v
                </span>
              </div>

              {/* Encryption Layer */}
              <div className="border border-black/10 dark:border-zinc-900/60 bg-black/5 dark:bg-[#080a0f]/40 backdrop-blur-md rounded-xl p-5">
                <span className="text-[9px] font-mono text-zinc-500 tracking-wider block font-bold uppercase">
                  Encryption_Layer
                </span>
                <span className="text-sm font-bold text-foreground dark:text-zinc-200 mt-2 font-mono block">
                  AES-256_GCM
                </span>
              </div>

              {/* Uplink Stability */}
              <div className="border border-black/10 dark:border-zinc-900/60 bg-black/5 dark:bg-[#080a0f]/40 backdrop-blur-md rounded-xl p-5">
                <span className="text-[9px] font-mono text-zinc-500 tracking-wider block font-bold uppercase">
                  Uplink_Stability
                </span>
                <span className="text-sm font-bold text-foreground dark:text-zinc-200 mt-2 font-mono block">
                  99.998%
                </span>
              </div>

              {/* Gateway ID */}
              <div className="border border-black/10 dark:border-zinc-900/60 bg-black/5 dark:bg-[#080a0f]/40 backdrop-blur-md rounded-xl p-5">
                <span className="text-[9px] font-mono text-zinc-500 tracking-wider block font-bold uppercase">
                  Gateway_ID
                </span>
                <span className="text-sm font-bold text-foreground dark:text-zinc-200 mt-2 font-mono block">
                  CC-REC-01X
                </span>
              </div>
            </div>

            {/* Technical logs console */}
            <div className="space-y-1 text-[10px] font-mono text-zinc-600 leading-relaxed pt-4 font-bold select-none uppercase tracking-wider">
              <div>[LOG] INITIALIZING HANDSHAKE...</div>
              <div>[LOG] SECTOR 7G READ AUTHENTICATED...</div>
              <div>[LOG] REQUESTING PACKET VALIDATION FROM SEED NODE...</div>
              <div className="flex items-center gap-1.5">
                <span>[LOG] WAITING FOR USER INPUT COMMAND...</span>
                <span className="w-1 h-3 bg-zinc-600 animate-pulse"></span>
              </div>
            </div>
          </div>

          {/* Right Column (CamCod Reset Form) */}
          <div className="lg:col-span-6 w-full flex flex-col items-end gap-6 justify-between min-h-[460px]">
            
            {/* Branded Header */}
            <div className="w-full max-w-[460px] text-left select-text">
              <Link to="/" className="text-2xl font-black tracking-tight text-foreground dark:text-white uppercase font-sans">
                <span className="text-primary dark:text-[#00d1ff]">Recode</span>X
              </Link>
            </div>

            {/* Password Reset Glass Card */}
            <div className="w-full max-w-[460px] bg-white/60 dark:bg-[#07090e]/60 backdrop-blur-xl border border-black/10 dark:border-zinc-800/80 rounded-2xl p-8 md:p-9 shadow-[0_0_50px_rgba(0,0,0,0.05)] dark:shadow-[0_0_50px_rgba(0,0,0,0.85)] relative overflow-hidden transition-all duration-300">
              
              {!sent ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground dark:text-white font-sans">
                      Reset Access
                    </h2>
                    <p className="text-zinc-500 text-xs leading-relaxed font-sans font-medium">
                      Initiate the secure handshake to regain access to your engineering environment.
                    </p>
                  </div>

                  {/* Engineering Email Input */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-zinc-500 dark:text-[#64748b] tracking-wider uppercase block font-bold">
                      Engineering Email
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-600">
                        <AtSign size={16} />
                      </span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3.5 bg-black/5 dark:bg-[#03060c]/60 border border-black/10 dark:border-zinc-800/80 rounded-lg text-sm text-foreground dark:text-white placeholder-gray-400 dark:placeholder-zinc-700 focus:outline-none focus:border-primary dark:focus:border-[#00d1ff]/80 transition-all font-mono shadow-inner"
                        placeholder="dev@recodex.network"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-primary dark:bg-[#00d1ff] text-on-primary dark:text-black font-extrabold rounded-lg text-xs tracking-wider uppercase transition-all duration-300 hover:bg-primary-container dark:hover:bg-[#3ce5ff] hover:shadow-[0_0_30px_rgba(0,209,255,0.45)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 font-sans cursor-pointer"
                  >
                    {loading ? "INITIALIZING..." : "INITIALIZE RECOVERY"}
                    {!loading && <SquareTerminal size={14} />}
                  </button>

                  {/* Return to Login */}
                  <div className="text-center pt-2">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 text-[10px] font-mono text-primary dark:text-[#00d1ff] hover:underline font-bold uppercase tracking-wider cursor-pointer"
                    >
                      <ArrowLeft size={12} />
                      Return to Login
                    </Link>
                  </div>
                </form>
              ) : (
                <div className="text-center py-6 space-y-6">
                  <div className="w-14 h-14 rounded-full bg-black/5 dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 flex items-center justify-center mx-auto text-primary dark:text-[#00d1ff] shadow-[0_0_20px_rgba(0,209,255,0.05)] dark:shadow-[0_0_20px_rgba(0,209,255,0.15)] animate-pulse">
                    <SquareTerminal size={24} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-foreground dark:text-white font-sans">Reset Handshake Sent</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed font-sans max-w-sm mx-auto">
                      A recovery key handshake token was dispatched to <span className="font-mono text-primary dark:text-[#00d1ff] font-bold">{email}</span>. Please verify your inbox protocols.
                    </p>
                  </div>
                  <button
                    onClick={() => setSent(false)}
                    className="text-xs text-primary dark:text-[#00d1ff] hover:underline font-mono tracking-wider font-bold uppercase cursor-pointer"
                  >
                    Resend Transmission?
                  </button>
                </div>
              )}
            </div>

            {/* Bottom telemetry stats */}
            <div className="w-full max-w-[460px] flex items-center justify-between text-[9px] font-mono text-zinc-500 dark:text-zinc-600 font-bold uppercase tracking-widest pt-4">
              <div className="space-y-0.5">
                <span className="text-zinc-400 dark:text-zinc-700 block">Auth Protocol</span>
                <span className="text-zinc-500 block">Secure_Auth_v3</span>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-zinc-400 dark:text-zinc-700 block">Latency</span>
                <span className="text-zinc-500 block">12ms</span>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Standalone Authentication bottom Copyright bar */}
      <footer className="relative z-10 border-t border-black/5 dark:border-zinc-955 bg-white/40 dark:bg-black/40 backdrop-blur-md w-full py-6 select-text">
        <div className="max-w-7xl mx-auto px-6 md:px-12 xl:px-24 flex items-center justify-between text-[8px] font-mono text-zinc-500 dark:text-zinc-700 tracking-wider uppercase font-bold">
          <span>
            Â© 2024 RECODEX Developer Marketplace. All rights reserved.
          </span>
          <div className="flex items-center gap-3">
            <Shield size={12} />
            <CheckCircle2 size={12} />
          </div>
        </div>
      </footer>
    </div>
  );
}
