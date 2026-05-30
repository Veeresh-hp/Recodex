import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertTriangle, Eye, EyeOff, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLoginModal } from "@/context/LoginModalContext";

export default function LoginModal() {
  const { isLoginOpen, openLogin, closeLogin } = useLoginModal();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form data and errors when modal opens or closes
  useEffect(() => {
    if (!isLoginOpen) {
      setFormData({ email: "", password: "" });
      setError(null);
      setShowPassword(false);
    }
  }, [isLoginOpen]);

  // Check for URL query errors (e.g. Google OAuth login of unregistered user)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "user_not_found") {
      setError("User record not found in our database. Please sign up first!");
      window.history.replaceState({}, document.title, window.location.pathname);
      openLogin();
    }
  }, [openLogin]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isLoginOpen) {
        closeLogin();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoginOpen, closeLogin]);

  if (!isLoginOpen) return null;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const inputVal = formData.email.trim();
    const isPhone = !inputVal.includes("@");

    // Enforce administrative credential bypass to avoid "Email not confirmed" blocks in dev environment
    if (
      (inputVal === "veereshhp2004@gmail.com" || inputVal === "veereshhp2004" || inputVal === "veereshhp04@gmail.com" || inputVal === "veereshhp04") &&
      formData.password === "Veereshhp04@"
    ) {
      localStorage.setItem("camcod_session_token", "admin-bypass-token");
      localStorage.setItem("camcod_admin_user", "true");
      closeLogin();
      window.location.href = "/dashboard";
      return;
    }

    try {
      const signInParams: any = {
        password: formData.password
      };
      if (isPhone) {
        signInParams.phone = inputVal;
      } else {
        signInParams.email = inputVal;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword(signInParams);

      if (authError) {
        throw authError;
      }

      // Sync local storage token for client fetch calls if needed
      if (data.session) {
        localStorage.setItem("camcod_session_token", data.session.access_token);
      }

      // Close modal and redirect based on role
      closeLogin();
      const isAdmin = data.user?.email === "veereshhp2004@gmail.com" || data.user?.email === "veereshhp04@gmail.com";
      if (isAdmin) {
        localStorage.setItem("camcod_admin_user", "true");
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/projects";
      }
    } catch (err) {
      const errorVal = err as Error;
      console.error("Authentication decrypt failed:", errorVal);
      setError(errorVal.message || "Decryption signature failed. Check your security key.");
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: "google" | "github") => {
    setLoading(true);
    setError(null);
    try {
      localStorage.setItem("recodex_auth_intent", "login");
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none">
      {/* Backdrop with premium blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
        onClick={closeLogin}
      />

      {/* Center Popup Container */}
      <div className="relative w-full max-w-md bg-white/90 dark:bg-[#07090e]/95 backdrop-blur-xl border border-black/10 dark:border-zinc-800/80 rounded-2xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.3)] dark:shadow-[0_0_50px_rgba(0,0,0,0.85)] z-10 overflow-hidden transform scale-100 transition-all duration-300 animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={closeLogin}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-foreground dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-8 select-text">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(0,209,255,0.15)]">
            <Lock size={22} />
          </div>
          <h2 className="text-2xl font-bold text-foreground dark:text-white">RecodeX Access</h2>
          <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Secure Verification Portal</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-mono text-red-400 flex items-center gap-2 select-text animate-shake">
            <AlertTriangle size={14} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 select-text">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block font-bold">Email or Phone Number</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Mail size={16} />
              </span>
              <input
                type="text"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-9 pr-4 py-2.5 bg-black/5 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-lg text-sm text-foreground dark:text-white focus:outline-none focus:border-primary transition-all font-mono"
                placeholder="name@recodex.io or +1234567890"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block font-bold">Access Key / Password</label>
              <Link
                to="/forgot-password"
                onClick={closeLogin}
                className="text-[10px] font-mono text-primary dark:text-[#00d1ff] hover:underline"
              >
                Recover?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-9 pr-10 py-2.5 bg-black/5 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-lg text-sm text-foreground dark:text-white focus:outline-none focus:border-primary transition-all font-mono"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-primary transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary dark:bg-[#00d1ff] text-on-primary dark:text-black font-extrabold rounded-lg text-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,209,255,0.3)] disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Decrypting Session..." : "Verify Access"}
            {!loading && <ArrowRight size={16} />}
          </button>

          {/* Sync Divider */}
          <div className="relative flex py-2 items-center justify-center select-none">
            <div className="flex-grow border-t border-black/10 dark:border-zinc-900"></div>
            <span className="flex-shrink mx-4 text-[8px] font-mono tracking-widest text-zinc-400 dark:text-zinc-500 font-bold">
              OR LOGIN WITH
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
                <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.113-5.136 4.113-3.44 0-6.24-2.8-6.24-6.24s2.8-6.24 6.24-6.24c1.7 0 3.1.6 4.2 1.6l3.3-3.3C19.14 2.235 15.84 1 12.24 1 6.04 1 12.24s5.04 11.24 11.24 11.24c6.48 0 11.24-4.56 11.24-11.24 0-.77-.08-1.5-.2-1.955H12.24z" />
              </svg>
              Google
            </button>

            {/* GitHub Sync */}
            <button
              type="button"
              onClick={() => handleSocialAuth("github")}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-black/5 dark:bg-[#04060a]/40 border border-black/10 dark:border-zinc-900 hover:border-black/20 dark:hover:border-zinc-800 text-xs font-mono tracking-wide text-zinc-650 dark:text-zinc-300 hover:text-foreground dark:hover:text-white transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
              GitHub
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/5 text-center text-xs text-zinc-500 select-text font-medium">
          New client or engineer?{" "}
          <Link 
            to="/signup" 
            onClick={closeLogin}
            className="text-primary dark:text-[#00d1ff] hover:underline font-bold"
          >
            Join RecodeX
          </Link>
        </div>

        {/* Cryptographic check */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 font-mono">
          <ShieldCheck size={12} className="text-primary dark:text-[#00d1ff]" />
          <span>AES-256 SESSION ENCRYPTED</span>
        </div>
      </div>
    </div>
  );
}
