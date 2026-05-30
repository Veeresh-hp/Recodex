import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { User, AtSign, Lock, SquareTerminal, Building2, Shield, CheckCircle2, AlertTriangle, Eye, EyeOff, Phone, Mail } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { syncUser } from "@/services/api";

export default function Signup() {
  const [role, setRole] = useState<"developer" | "client">("developer");
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dual signup channel and OTP verification states
  const [signupChannel, setSignupChannel] = useState<"email" | "phone">("email");
  const [phone, setPhone] = useState("");
  const [verificationStep, setVerificationStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [resendActive, setResendActive] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [showEmailBypass, setShowEmailBypass] = useState(false);
  const [emailBypassCode, setEmailBypassCode] = useState("");


  // Resend Countdown Timer effect
  useEffect(() => {
    if (countdown <= 0) {
      setResendActive(true);
      return;
    }
    setResendActive(false);
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Background Constellation Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Dynamic resize handler
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particle class
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
        // Slow float
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.radius = Math.random() * 1.8 + 1;
        this.alpha = Math.random() * 0.6 + 0.2;
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

    const particles: Particle[] = Array.from({ length: 80 }, () => new Particle());

    // Main animation loop
    const animate = () => {
      const isDark = document.documentElement.classList.contains("dark");
      ctx.clearRect(0, 0, width, height);

      // Draw faint background glow grids
      ctx.strokeStyle = isDark ? "rgba(0, 209, 255, 0.02)" : "rgba(0, 103, 124, 0.04)";
      ctx.lineWidth = 1;
      const gridSize = 80;
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

      // Draw and update particles
      particles.forEach((p) => {
        p.update();
        p.draw(ctx);
      });

      // Draw connecting lines
      ctx.lineWidth = 0.8;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            // Faint lines with opacity proportional to distance
            const alpha = (1 - dist / 120) * 0.15;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const signUpParams: any = {
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
          },
        },
      };
      if (signupChannel === "email") {
        signUpParams.email = formData.email;
      } else {
        signUpParams.phone = phone;
      }

      // 1. Dispatch OTP code signup to Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp(signUpParams);

      if (authError) {
        throw authError;
      }

      if (!data.user) {
        throw new Error("Initialization returned empty credentials record.");
      }

      // Switch to Code Entry Verification Step dynamically
      if (signupChannel === "email") {
        setEmailVerificationSent(true);
      } else {
        setVerificationStep(true);
        setCountdown(60);
      }
      setLoading(false);

      
      // Store session details directly if returned automatically (e.g. email confirmations disabled)
      if (data.session) {
        localStorage.setItem("camcod_session_token", data.session.access_token);
      }
    } catch (err) {
      const errorVal = err as Error;
      console.error("Initialization failed:", errorVal);
      setError(
        errorVal.message.includes("SMS") || errorVal.message.includes("provider") 
          ? `${errorVal.message}. Tip: Try using verification code '777777' for a developer bypass!`
          : errorVal.message || "Failed to initialize credentials record."
      );
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Developer Sandbox Bypass Option
    if (otpCode === "777777") {
      const fakeUserId = "sandbox-dev-" + Math.random().toString(36).substring(2, 10);
      try {
        await syncUser({
          id: fakeUserId,
          email: signupChannel === "email" ? formData.email : `sandbox_${phone.replace("+", "")}@recodex.io`,
          name: formData.name,
          role: role,
        });

        const bypassEmail = signupChannel === "email" ? formData.email : "";
        const isBypassAdmin = bypassEmail === "veereshhp2004@gmail.com" || bypassEmail === "veereshhp04@gmail.com";

        if (isBypassAdmin) {
          localStorage.setItem("camcod_session_token", "admin-bypass-token");
          localStorage.setItem("camcod_admin_user", "true");
          window.dispatchEvent(new Event("recodex-auth-update"));
          window.location.href = "/dashboard";
        } else {
          localStorage.setItem("camcod_session_token", "dev-bypass-token");
          window.dispatchEvent(new Event("recodex-auth-update"));
          window.location.href = "/projects";
        }
      } catch (err) {
        console.error("Sandbox sync failed:", err);
        setError("Database sync failed inside developer sandbox mode.");
        setLoading(false);
      }
      return;
    }

    try {
      const verifyParams: any = {
        token: otpCode,
        type: "signup",
      };
      if (signupChannel === "email") {
        verifyParams.email = formData.email;
      } else {
        verifyParams.phone = phone;
      }

      // 1. Verify OTP code with Supabase
      const { data, error: verifyError } = await supabase.auth.verifyOtp(verifyParams);

      if (verifyError) {
        throw verifyError;
      }

      if (!data.user) {
        throw new Error("OTP verification completed but returned empty credentials.");
      }

      // 2. Synchronize user profile with backend PostgreSQL database
      await syncUser({
        id: data.user.id,
        email: data.user.email || formData.email || "",
        name: formData.name,
        role: role, // "developer" | "client"
      });

      // 3. Store active session token
      if (data.session) {
        localStorage.setItem("camcod_session_token", data.session.access_token);
        window.dispatchEvent(new Event("recodex-auth-update"));
      }

      // Redirect to dashboard if admin, otherwise to projects page
      const isAdmin = data.user?.email === "veereshhp2004@gmail.com" || data.user?.email === "veereshhp04@gmail.com";
      if (isAdmin) {
        localStorage.setItem("camcod_admin_user", "true");
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/projects";
      }
    } catch (err) {
      const errorVal = err as Error;
      console.error("Verification failed:", errorVal);
      setError(errorVal.message || "Invalid verification code. Please check and try again.");
      setLoading(false);
    }
  };

  const handleEmailBypass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailBypassCode !== "777777") {
      setError("Invalid developer bypass token.");
      return;
    }

    setLoading(true);
    setError(null);

    const fakeUserId = "sandbox-dev-" + Math.random().toString(36).substring(2, 10);
    try {
      await syncUser({
        id: fakeUserId,
        email: formData.email,
        name: formData.name,
        role: role,
      });

      const isBypassAdmin = formData.email === "veereshhp2004@gmail.com" || formData.email === "veereshhp04@gmail.com";

      if (isBypassAdmin) {
        localStorage.setItem("camcod_session_token", "admin-bypass-token");
        localStorage.setItem("camcod_admin_user", "true");
        window.dispatchEvent(new Event("recodex-auth-update"));
        window.location.href = "/dashboard";
      } else {
        localStorage.setItem("camcod_session_token", "dev-bypass-token");
        window.dispatchEvent(new Event("recodex-auth-update"));
        window.location.href = "/projects";
      }
    } catch (err) {
      console.error("Email bypass sync failed:", err);
      setError("Database sync failed inside developer bypass mode.");
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!resendActive) return;
    setError(null);
    setCountdown(60);
    try {
      const resendParams: any = {
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
          },
        },
      };
      if (signupChannel === "email") {
        resendParams.email = formData.email;
      } else {
        resendParams.phone = phone;
      }

      const { error: resendError } = await supabase.auth.signUp(resendParams);

      if (resendError) throw resendError;
    } catch (err) {
      const errorVal = err as Error;
      console.error("Resend code failed:", errorVal);
      setError("Failed to resend verification code: " + errorVal.message);
    }
  };

  const handleSocialAuth = async (provider: "google" | "github") => {
    setLoading(true);
    setError(null);
    try {
      localStorage.setItem("recodex_auth_intent", "signup");
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: window.location.origin + "/dashboard",
        },
      });


      if (authError) {
        throw authError;
      }
    } catch (err) {
      const errorVal = err as Error;
      console.error(`OAuth login with ${provider} failed:`, errorVal);
      setError(errorVal.message || `Failed to sign in with ${provider}.`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-start relative overflow-hidden font-sans">
      {/* Background Constellation Mesh */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />
      
      {/* Ambient background glow overlays */}
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] bg-cyan-955/10 rounded-full blur-[180px] pointer-events-none z-0"></div>

      {/* Navbar header */}

      {/* Main Content Area */}
      <main className="relative z-10 flex-grow flex items-center pt-20 pb-12 lg:pt-24 lg:pb-24 px-6 md:px-12 xl:px-24 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
          
          {/* Left Column (Brand Info & Value Prop) */}
          <div className="lg:col-span-6 space-y-10 select-text lg:self-start lg:pt-12 transition-all duration-300">
            {/* System Ready Badge */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-black/10 dark:border-zinc-800 bg-black/5 dark:bg-zinc-900/50 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
              <span className="text-[10px] font-mono tracking-widest text-zinc-500 dark:text-[#94a3b8] font-bold">SYSTEM READY: V2.4.0</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-[60px] font-black tracking-tight text-foreground dark:text-white leading-[1.05]">
              Join the <br />
              Engineering <span className="text-primary dark:text-[#00d1ff] relative font-black">
                Elite.
                <span className="absolute left-0 bottom-1 w-full h-[3px] bg-primary dark:bg-[#00d1ff] opacity-40 blur-[1px]"></span>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-zinc-600 dark:text-[#94a3b8] text-base md:text-xl max-w-lg leading-relaxed font-normal">
              The most advanced developer ecosystem for high-performance projects and world-class engineers.
            </p>

            {/* Divider line */}
            <div className="w-full h-[1px] bg-gradient-to-r from-black/10 dark:from-zinc-800/80 to-transparent"></div>

            {/* Stats */}
            <div className="flex gap-20 pt-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-zinc-500 dark:text-[#64748b] tracking-wider uppercase block">Global Nodes</span>
                <span className="text-2xl md:text-4xl font-bold text-foreground dark:text-white tracking-tight font-sans">12,400+</span>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-zinc-500 dark:text-[#64748b] tracking-wider uppercase block">Avg Latency</span>
                <span className="text-2xl md:text-4xl font-bold text-foreground dark:text-white tracking-tight font-sans">14ms</span>
              </div>
            </div>
          </div>

          {/* Right Column (Glassmorphic Signup Form) */}
          <div className="lg:col-span-6 w-full flex justify-end">
            <div className="w-full max-w-[500px] flex flex-col gap-4">
              
              {/* Main signup glass card */}
              <div className="glass-card bg-white/60 dark:bg-[#07090e]/60 backdrop-blur-xl border border-black/10 dark:border-zinc-800/80 rounded-2xl p-8 md:p-9 shadow-[0_0_50px_rgba(0,0,0,0.05)] dark:shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden transition-all duration-300 hover:border-black/20 dark:hover:border-zinc-700/80">
                
                {/* Error Alert Display */}
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] font-mono text-red-400 flex items-center gap-2 uppercase tracking-wide">
                    <AlertTriangle size={12} className="shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}
                {emailVerificationSent ? (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="text-center space-y-4 py-4 select-text">
                      <div className="mx-auto w-16 h-16 rounded-full bg-[#00d1ff]/10 border border-[#00d1ff]/20 flex items-center justify-center text-[#00d1ff] animate-pulse">
                        <Mail size={32} />
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono tracking-widest text-[#00d1ff] font-bold block">
                          VERIFICATION LINK SENT
                        </span>
                        <h3 className="text-2xl font-black tracking-tight text-foreground dark:text-white">Check Your Gmail</h3>
                        <p className="text-xs text-zinc-600 dark:text-[#94a3b8] leading-relaxed max-w-sm mx-auto font-medium">
                          A confirmation link has been dispatched to:
                          <span className="block text-[#00d1ff] font-mono font-bold mt-2.5 text-sm bg-black/5 dark:bg-[#03060c]/60 p-2.5 rounded-lg border border-black/10 dark:border-zinc-800/80 break-all select-all">
                            {formData.email}
                          </span>
                        </p>
                      </div>

                      <div className="block mt-4 text-[10px] text-zinc-500 dark:text-[#94a3b8] leading-normal font-sans italic bg-[#00d1ff]/5 p-4 rounded-xl border border-[#00d1ff]/15 text-left max-w-sm mx-auto">
                        💡 <strong>How to activate your account:</strong>
                        <ol className="list-decimal pl-4 mt-2 space-y-1">
                          <li>Open your <strong>Gmail / Google Mail</strong> inbox.</li>
                          <li>Find the message from <strong>Supabase Auth</strong> or <strong>RECODEX</strong>.</li>
                          <li>Click the <strong>"Confirm email address"</strong> or verification link.</li>
                          <li>Once clicked, you will be verified and can log in!</li>
                        </ol>
                      </div>

                      {!showEmailBypass ? (
                        <button
                          type="button"
                          onClick={() => setShowEmailBypass(true)}
                          className="mt-3.5 text-[9px] font-mono text-[#00d1ff]/80 hover:text-[#00d1ff] hover:underline uppercase tracking-wider font-bold block mx-auto cursor-pointer"
                        >
                          ⚠️ Having trouble receiving the email? Click here to bypass.
                        </button>
                      ) : (
                        <div className="mt-4 p-4 border border-zinc-800/80 bg-black/25 dark:bg-[#03060c]/60 rounded-xl space-y-3 max-w-sm mx-auto text-left animate-in slide-in-from-top-2 duration-300">
                          <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block font-bold text-center">
                            Enter Developer Bypass Token
                          </label>
                          <form onSubmit={handleEmailBypass} className="space-y-3">
                            <div className="relative">
                              <input
                                type="text"
                                required
                                maxLength={6}
                                value={emailBypassCode}
                                onChange={(e) => setEmailBypassCode(e.target.value.replace(/\D/g, ""))}
                                placeholder="777777"
                                className="w-full text-center py-2 bg-black/30 border border-zinc-800/80 rounded-lg text-lg tracking-[0.5em] pl-[0.25em] text-foreground dark:text-white focus:outline-none focus:border-[#00d1ff]/80 transition-all font-mono font-bold shadow-inner"
                              />
                            </div>
                            <button
                              type="submit"
                              disabled={loading || emailBypassCode.length !== 6}
                              className="w-full py-2 bg-[#00d1ff] text-black font-extrabold rounded-lg text-[10px] tracking-wider uppercase transition-all duration-300 hover:bg-[#3ce5ff] hover:shadow-[0_0_15px_rgba(0,209,255,0.3)] disabled:opacity-50 font-sans cursor-pointer text-center"
                            >
                              {loading ? "Verifying..." : "Verify Bypass Token"}
                            </button>
                          </form>
                          <button
                            type="button"
                            onClick={() => {
                              setShowEmailBypass(false);
                              setError(null);
                              setEmailBypassCode("");
                            }}
                            className="w-full text-center text-zinc-500 dark:text-zinc-550 hover:text-zinc-400 font-mono text-[8px] uppercase font-bold tracking-widest cursor-pointer"
                          >
                            Cancel Bypass
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Link
                        to="/login"
                        className="w-full py-3.5 bg-primary dark:bg-[#00d1ff] text-on-primary dark:text-black font-extrabold rounded-lg text-xs tracking-wider uppercase transition-all duration-300 hover:bg-primary-container dark:hover:bg-[#3ce5ff] hover:shadow-[0_0_30px_rgba(0,209,255,0.45)] active:scale-[0.98] font-sans flex items-center justify-center cursor-pointer"
                      >
                        PROCEED TO LOGIN
                      </Link>

                      <button
                        type="button"
                        onClick={() => setEmailVerificationSent(false)}
                        className="w-full py-2 bg-transparent text-zinc-500 dark:text-zinc-400 hover:text-foreground dark:hover:text-white font-mono text-[10px] tracking-wider uppercase transition-all duration-300 cursor-pointer text-center font-bold"
                      >
                        ← BACK TO SIGNUP
                      </button>
                    </div>
                  </div>
                ) : verificationStep ? (
                  <form onSubmit={handleVerifyOTP} className="space-y-6">
                    <div className="text-center space-y-2 mb-2 select-text">
                      <span className="text-[10px] font-mono tracking-widest text-[#00d1ff] font-bold block">
                        03 / VERIFY IDENTITY
                      </span>
                      <h3 className="text-xl font-bold text-foreground dark:text-white">Enter Verification Code</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                        A verification code or confirmation link has been dispatched to:
                        <span className="block text-primary dark:text-[#00d1ff] font-mono font-bold mt-1 text-sm">
                          {signupChannel === "email" ? formData.email : phone}
                        </span>
                        {signupChannel === "email" && (
                          <span className="block mt-2.5 text-[10px] text-zinc-500 dark:text-[#94a3b8] leading-normal font-sans italic bg-[#00d1ff]/5 dark:bg-[#00d1ff]/5 p-3 rounded-lg border border-[#00d1ff]/15">
                            💡 <strong>Check your Gmail inbox!</strong> If you received a <strong>confirmation link</strong> in your email, click the link to activate your account and log in automatically. If you received a 6-digit code, enter it below.
                          </span>
                        )}
                      </p>

                    </div>

                    <div className="space-y-2 select-text">
                      <label className="text-[9px] font-mono text-zinc-500 dark:text-[#64748b] tracking-wider uppercase block font-semibold text-center">
                        6-Digit Security Token
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="000000"
                        className="w-full text-center py-3 bg-black/5 dark:bg-[#03060c]/60 border border-black/10 dark:border-zinc-800/80 rounded-lg text-2xl tracking-[0.75em] pl-[0.375em] text-foreground dark:text-white focus:outline-none focus:border-primary dark:focus:border-[#00d1ff]/80 transition-all font-mono font-bold shadow-inner"
                      />
                      <span className="text-[8px] font-mono text-zinc-400 dark:text-[#475569] tracking-widest uppercase block text-center mt-1.5 font-bold">
                        Tip: Enter <span className="text-[#00d1ff] font-bold">777777</span> to auto-confirm bypass for testing!
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otpCode.length !== 6}
                      className="w-full py-3.5 bg-primary dark:bg-[#00d1ff] text-on-primary dark:text-black font-extrabold rounded-lg text-xs tracking-wider uppercase transition-all duration-300 hover:bg-primary-container dark:hover:bg-[#3ce5ff] hover:shadow-[0_0_30px_rgba(0,209,255,0.45)] active:scale-[0.98] disabled:opacity-50 font-sans cursor-pointer"
                    >
                      {loading ? "Verifying..." : "Confirm Verification Code"}
                    </button>

                    <div className="flex justify-between items-center text-xs font-mono select-none">
                      <button
                        type="button"
                        onClick={() => {
                          setVerificationStep(false);
                          setError(null);
                        }}
                        className="text-zinc-550 dark:text-zinc-400 hover:text-foreground dark:hover:text-white transition-colors cursor-pointer font-bold"
                      >
                        â† BACK TO INPUTS
                      </button>

                      {resendActive ? (
                        <button
                          type="button"
                          onClick={handleResendCode}
                          className="text-primary dark:text-[#00d1ff] hover:underline font-bold cursor-pointer animate-pulse"
                        >
                          RESEND CODE
                        </button>
                      ) : (
                        <span className="text-zinc-500 font-bold">
                          RESEND IN {countdown}S
                        </span>
                      )}
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Step 01: Choose Your Role */}
                    <div className="space-y-3.5">
                      <span className="text-[10px] font-mono tracking-widest text-primary dark:text-[#00d1ff] font-bold block">
                        01 / CHOOSE YOUR ROLE
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Developer Button */}
                        <button
                          type="button"
                          onClick={() => setRole("developer")}
                          className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all duration-300 relative group cursor-pointer ${
                            role === "developer"
                              ? "bg-primary text-white dark:bg-[#0b101d] border-primary dark:border-[#00d1ff]/50 shadow-[0_0_20px_rgba(0,209,255,0.08)]"
                              : "bg-black/5 dark:bg-[#04060a]/40 border-black/5 dark:border-zinc-900 text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 hover:border-black/10 dark:hover:border-zinc-800"
                          }`}
                        >
                          <SquareTerminal className={`w-7 h-7 mb-2 transition-transform duration-300 group-hover:scale-110 ${
                            role === "developer" ? "text-white" : "text-zinc-500 dark:text-zinc-600"
                          }`} />
                          <span className="text-xs font-mono font-bold tracking-wider">Developer</span>
                        </button>

                        {/* Client Button */}
                        <button
                          type="button"
                          onClick={() => setRole("client")}
                          className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all duration-300 relative group cursor-pointer ${
                            role === "client"
                              ? "bg-primary text-white dark:bg-[#0b101d] border-primary dark:border-[#00d1ff]/50 shadow-[0_0_20px_rgba(0,209,255,0.08)]"
                              : "bg-black/5 dark:bg-[#04060a]/40 border-black/5 dark:border-zinc-900 text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 hover:border-black/10 dark:hover:border-zinc-800"
                          }`}
                        >
                          <Building2 className={`w-7 h-7 mb-2 transition-transform duration-300 group-hover:scale-110 ${
                            role === "client" ? "text-white" : "text-zinc-500 dark:text-zinc-600"
                          }`} />
                          <span className="text-xs font-mono font-bold tracking-wider">Client</span>
                        </button>
                      </div>
                    </div>

                    {/* Step 02: Signup Channel */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-mono tracking-widest text-primary dark:text-[#00d1ff] font-bold block">
                        02 / SIGNUP CHANNEL
                      </span>
                      <div className="grid grid-cols-2 gap-3 select-none">
                        {/* Email Protocol */}
                        <button
                          type="button"
                          onClick={() => setSignupChannel("email")}
                          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-center transition-all duration-300 font-mono text-xs font-bold cursor-pointer ${
                            signupChannel === "email"
                              ? "bg-primary text-white dark:bg-[#0b101d] border-primary dark:border-[#00d1ff]/50 shadow-[0_0_15px_rgba(0,209,255,0.05)]"
                              : "bg-black/5 dark:bg-[#04060a]/40 border-black/10 dark:border-zinc-900 text-zinc-500 hover:text-foreground dark:hover:text-zinc-300"
                          }`}
                        >
                          <AtSign size={13} />
                          Email Address
                        </button>

                        {/* Phone SMS */}
                        <button
                          type="button"
                          onClick={() => setSignupChannel("phone")}
                          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-center transition-all duration-300 font-mono text-xs font-bold cursor-pointer ${
                            signupChannel === "phone"
                              ? "bg-primary text-white dark:bg-[#0b101d] border-primary dark:border-[#00d1ff]/50 shadow-[0_0_15px_rgba(0,209,255,0.05)]"
                              : "bg-black/5 dark:bg-[#04060a]/40 border-black/10 dark:border-zinc-900 text-zinc-500 hover:text-foreground dark:hover:text-zinc-300"
                          }`}
                        >
                          <Phone size={13} />
                          Phone SMS
                        </button>
                      </div>
                    </div>

                    {/* Step 03: Identity */}
                    <div className="space-y-4">
                      <span className="text-[10px] font-mono tracking-widest text-primary dark:text-[#00d1ff] font-bold block">
                        03 / IDENTITY
                      </span>

                      {/* Full Name Input */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-zinc-500 dark:text-[#64748b] tracking-wider uppercase block font-semibold">
                          Full Name
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-600">
                            <User size={16} />
                          </span>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 bg-black/5 dark:bg-[#03060c]/60 border border-black/10 dark:border-zinc-800/80 rounded-lg text-sm text-foreground dark:text-white placeholder-gray-400 dark:placeholder-zinc-700 focus:outline-none focus:border-primary dark:focus:border-[#00d1ff]/80 transition-all font-mono shadow-inner"
                            placeholder="Linus Torvalds"
                          />
                        </div>
                      </div>

                      {/* Engineering Email Input */}
                      {signupChannel === "email" && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                          <label className="text-[9px] font-mono text-zinc-500 dark:text-[#64748b] tracking-wider uppercase block font-semibold">
                            Engineering Email
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-600">
                              <AtSign size={16} />
                            </span>
                            <input
                              type="email"
                              required
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className="w-full pl-10 pr-4 py-3 bg-black/5 dark:bg-[#03060c]/60 border border-black/10 dark:border-zinc-800/80 rounded-lg text-sm text-foreground dark:text-white placeholder-gray-400 dark:placeholder-zinc-700 focus:outline-none focus:border-primary dark:focus:border-[#00d1ff]/80 transition-all font-mono shadow-inner"
                              placeholder="name@recodex.io"
                            />
                          </div>
                        </div>
                      )}

                      {/* Mobile Phone Number Input */}
                      {signupChannel === "phone" && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                          <label className="text-[9px] font-mono text-zinc-500 dark:text-[#64748b] tracking-wider uppercase block font-semibold">
                            Mobile Phone Number
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-600">
                              <Phone size={16} />
                            </span>
                            <input
                              type="tel"
                              required
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-black/5 dark:bg-[#03060c]/60 border border-black/10 dark:border-zinc-800/80 rounded-lg text-sm text-foreground dark:text-white placeholder-gray-400 dark:placeholder-zinc-700 focus:outline-none focus:border-primary dark:focus:border-[#00d1ff]/80 transition-all font-mono shadow-inner"
                              placeholder="+1234567890"
                            />
                          </div>
                        </div>
                      )}

                      {/* Security Key Input */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-zinc-500 dark:text-[#64748b] tracking-wider uppercase block font-semibold">
                          Security Key
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-600">
                            <Lock size={16} />
                          </span>
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full pl-10 pr-10 py-3 bg-black/5 dark:bg-[#03060c]/60 border border-zinc-800/80 rounded-lg text-sm text-foreground dark:text-white placeholder-gray-400 dark:placeholder-zinc-700 focus:outline-none focus:border-primary dark:focus:border-[#00d1ff]/80 transition-all font-mono shadow-inner"
                            placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-primary transition-colors cursor-pointer"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <span className="text-[8px] font-mono text-zinc-400 dark:text-[#475569] tracking-widest uppercase block mt-1 font-bold">
                          Min 12 chars + special symbols
                        </span>
                      </div>
                    </div>

                    {/* Initialize Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-primary dark:bg-[#00d1ff] text-on-primary dark:text-black font-extrabold rounded-lg text-xs tracking-wider uppercase transition-all duration-300 hover:bg-primary-container dark:hover:bg-[#3ce5ff] hover:shadow-[0_0_30px_rgba(0,209,255,0.45)] active:scale-[0.98] disabled:opacity-50 font-sans cursor-pointer"
                    >
                      {loading ? "Initializing..." : "Initialize Account"}
                    </button>

                    {/* Sync Divider */}
                    <div className="relative flex py-2 items-center justify-center">
                      <div className="flex-grow border-t border-black/10 dark:border-zinc-900"></div>
                      <span className="flex-shrink mx-4 text-[8px] font-mono tracking-widest text-zinc-400 dark:text-[#475569] font-bold">
                        SYNCHRONIZATION
                      </span>
                      <div className="flex-grow border-t border-black/10 dark:border-zinc-900"></div>
                    </div>

                    {/* Social Sync Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Google Sync */}
                      <button
                        type="button"
                        onClick={() => handleSocialAuth("google")}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-black/5 dark:bg-[#04060a]/40 border border-black/10 dark:border-zinc-900 hover:border-black/20 dark:hover:border-zinc-800 text-xs font-mono tracking-wide text-zinc-650 dark:text-zinc-300 hover:text-foreground dark:hover:text-white transition-all duration-200 cursor-pointer disabled:opacity-50"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.113-5.136 4.113-3.44 0-6.24-2.8-6.24-6.24s2.8-6.24 6.24-6.24c1.7 0 3.1.6 4.2 1.6l3.3-3.3C19.14 2.235 15.84 1 12.24 1 6.04 1 1 6.04 1 12.24s5.04 11.24 11.24 11.24c6.48 0 11.24-4.56 11.24-11.24 0-.77-.08-1.5-.2-1.955H12.24z" />
                        </svg>
                        Google
                      </button>

                      {/* GitHub Sync */}
                      <button
                        type="button"
                        onClick={() => handleSocialAuth("github")}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-black/5 dark:bg-[#04060a]/40 border border-black/10 dark:border-zinc-900 hover:border-black/20 dark:hover:border-zinc-800 text-xs font-mono tracking-wide text-zinc-655 dark:text-zinc-300 hover:text-foreground dark:hover:text-white transition-all duration-200 cursor-pointer disabled:opacity-50"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                        </svg>
                        GitHub
                      </button>
                    </div>

                    {/* Part of the Network Link */}
                    <div className="text-center pt-2 select-none">
                      <span className="text-[11px] text-zinc-550 dark:text-zinc-500 font-sans">Part of the network? </span>
                      <Link
                        to="/login"
                        className="text-[11px] text-primary dark:text-[#00d1ff] hover:underline font-bold font-sans ml-1"
                      >
                        LOGIN
                      </Link>
                    </div>
                  </form>
                )}
              </div>

              {/* Terms disclaimer */}
              <div className="text-center text-[8px] font-mono tracking-wider text-[#475569] uppercase leading-relaxed max-w-[420px] mx-auto select-text font-bold">
                By initializing, you agree to <br /> protocol standards & encryption agreements
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Custom RECODEX. Tech Footer */}
      <footer className="relative z-10 border-t border-black/5 dark:border-zinc-900 bg-white/60 dark:bg-black/60 backdrop-blur-md w-full pt-16 pb-8 transition-colors select-text">
        <div className="max-w-7xl mx-auto px-6 md:px-12 xl:px-24">
          
          {/* Main Footer Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-12">
            
            {/* Brand Logo & Tagline */}
            <div className="md:col-span-6 space-y-4">
              <div className="text-2xl font-black tracking-tight text-foreground dark:text-white font-sans uppercase">
                RECODEX.
              </div>
              <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
                Architecting the future of technical execution through a decentralized elite developer network. Built for the modern engineer.
              </p>
            </div>

            {/* Columns Grid */}
            <div className="md:col-span-6 grid grid-cols-3 gap-6">
              
              {/* Nodes Column */}
              <div className="space-y-3">
                <h4 className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 font-mono uppercase tracking-widest">
                  Nodes
                </h4>
                <div className="flex flex-col gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary dark:hover:text-[#00d1ff] transition-all">
                    Github
                  </a>
                  <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary dark:hover:text-[#00d1ff] transition-all">
                    Discord Terminal
                  </a>
                  <Link to="/projects" className="hover:text-primary dark:hover:text-[#00d1ff] transition-all">
                    API Core
                  </Link>
                </div>
              </div>

              {/* Division Column */}
              <div className="space-y-3">
                <h4 className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 font-mono uppercase tracking-widest">
                  Division
                </h4>
                <div className="flex flex-col gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="cursor-default hover:text-primary dark:hover:text-[#00d1ff] transition-all">
                    Operations
                  </span>
                  <span className="cursor-default hover:text-primary dark:hover:text-[#00d1ff] transition-all">
                    Intel
                  </span>
                  <span className="cursor-default hover:text-primary dark:hover:text-[#00d1ff] transition-all">
                    Support Hub
                  </span>
                </div>
              </div>

              {/* Compliance Column */}
              <div className="space-y-3">
                <h4 className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 font-mono uppercase tracking-widest">
                  Compliance
                </h4>
                <div className="flex flex-col gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="cursor-default hover:text-primary dark:hover:text-[#00d1ff] transition-all">
                    EULA
                  </span>
                  <span className="cursor-default hover:text-primary dark:hover:text-[#00d1ff] transition-all">
                    Privacy Protocol
                  </span>
                  <span className="cursor-default hover:text-primary dark:hover:text-[#00d1ff] transition-all">
                    SLA 99.9%
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Bar: Copyright & Security Icons */}
          <div className="border-t border-black/5 dark:border-zinc-900 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-600 tracking-wider uppercase font-bold">
              Â© 2024 RECODEX GLOBAL OPERATING SYSTEM
            </span>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-black/5 dark:bg-zinc-900/30 border border-black/5 dark:border-zinc-800 flex items-center justify-center text-zinc-500" title="Secure Environment">
                <Shield size={13} />
              </div>
              <div className="w-7 h-7 rounded-full bg-black/5 dark:bg-zinc-900/30 border border-black/5 dark:border-zinc-800 flex items-center justify-center text-zinc-500" title="Check Valid Protocol">
                <CheckCircle2 size={13} />
              </div>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
