import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import {
  User as UserIcon, Shield, Mail, Phone, Cpu, ArrowLeft,
  CheckCircle, ExternalLink, Camera, Upload, X, Check
} from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  role: string;
  id: string;
  isGoogleUser: boolean;
}

// 10 predefined premium avatar options (DiceBear SVG avatars as data URIs)
const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=recodex1&backgroundColor=0f172a",
  "https://api.dicebear.com/7.x/bottts/svg?seed=recodex2&backgroundColor=0f172a",
  "https://api.dicebear.com/7.x/bottts/svg?seed=recodex3&backgroundColor=0f172a",
  "https://api.dicebear.com/7.x/bottts/svg?seed=recodex4&backgroundColor=0f172a",
  "https://api.dicebear.com/7.x/bottts/svg?seed=recodex5&backgroundColor=0f172a",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=recodex6",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=recodex7",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=recodex8",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=recodex9&backgroundColor=1e293b",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=recodex10&backgroundColor=1e293b",
];

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarSaved, setAvatarSaved] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);

      const sessionToken = localStorage.getItem("camcod_session_token");
      const isAdminBypass = sessionToken === "admin-bypass-token";
      const isDevBypass = sessionToken === "dev-bypass-token";

      if (isAdminBypass) {
        const savedAvatar = localStorage.getItem("profile_avatar_sandbox-admin-001");
        const p: UserProfile = {
          id: "sandbox-admin-001",
          name: "Veeresh H P",
          email: "veereshhp2004@gmail.com",
          phone: "+1 (555) 777-2004",
          avatar: savedAvatar || null,
          role: "admin",
          isGoogleUser: false,
        };
        setProfile(p);
        setCurrentAvatar(savedAvatar || null);
        setLoading(false);
        return;
      }

      if (isDevBypass) {
        const savedAvatar = localStorage.getItem("profile_avatar_sandbox-dev-002");
        const p: UserProfile = {
          id: "sandbox-dev-002",
          name: "Veeresh H P (Dev)",
          email: "veereshhp04@gmail.com",
          phone: "+1 (555) 040-2004",
          avatar: savedAvatar || null,
          role: "developer",
          isGoogleUser: false,
        };
        setProfile(p);
        setCurrentAvatar(savedAvatar || null);
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const fullName = user.user_metadata?.full_name ||
                           user.user_metadata?.name ||
                           user.email?.split("@")[0] ||
                           "RecodeX Engineer";

          const isGoogle = user.app_metadata?.provider === "google" ||
                           user.app_metadata?.providers?.includes("google");

          // Check for a locally saved override avatar
          const savedAvatar = localStorage.getItem(`profile_avatar_${user.id}`);
          // Google users auto-get their google avatar unless they've picked a different one
          const resolvedAvatar = savedAvatar || user.user_metadata?.avatar_url || null;

          const p: UserProfile = {
            id: user.id,
            name: fullName,
            email: user.email || "No email linked",
            phone: user.phone || "No phone linked",
            avatar: resolvedAvatar,
            role: user.email === "veereshhp2004@gmail.com" ? "admin" : (user.user_metadata?.role || "developer"),
            isGoogleUser: !!isGoogle,
          };
          setProfile(p);
          setCurrentAvatar(resolvedAvatar);
        } else {
          window.location.href = "/";
        }
      } catch (err) {
        console.error("Failed to load user profile details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleSelectPreset = (url: string) => {
    setPendingAvatar(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPendingAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    if (!pendingAvatar || !profile) return;
    setSavingAvatar(true);
    try {
      // Save to localStorage so it persists
      localStorage.setItem(`profile_avatar_${profile.id}`, pendingAvatar);
      // Also broadcast it globally so Navbar picks it up
      localStorage.setItem("recodex_user_avatar", pendingAvatar);
      window.dispatchEvent(new StorageEvent("storage", {
        key: "recodex_user_avatar",
        newValue: pendingAvatar,
      }));

      setCurrentAvatar(pendingAvatar);
      setProfile((prev) => prev ? { ...prev, avatar: pendingAvatar } : prev);
      setPendingAvatar(null);
      setShowAvatarPicker(false);
      setAvatarSaved(true);
      setTimeout(() => setAvatarSaved(false), 3000);
    } catch (err) {
      console.error("Avatar save error:", err);
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleCancelAvatarPicker = () => {
    setPendingAvatar(null);
    setShowAvatarPicker(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between font-sans">
        <main className="flex-grow flex items-center justify-center pt-24 pb-16">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Loading secure identity profiles...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) return null;

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const displayAvatar = currentAvatar;
  const previewAvatar = pendingAvatar || displayAvatar;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Background Ambience overlays */}
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] bg-cyan-955/10 rounded-full blur-[180px] pointer-events-none z-0"></div>


      <main className="relative z-10 flex-grow pt-28 pb-16 px-6 md:px-12 max-w-4xl mx-auto w-full flex flex-col justify-center">

        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-primary transition-colors uppercase tracking-wider mb-6 group cursor-pointer">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to core
        </Link>

        {/* Success banner */}
        {avatarSaved && (
          <div className="mb-4 px-4 py-2.5 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-500 text-xs font-mono font-bold uppercase tracking-wider animate-fade-in">
            <Check size={14} />
            Profile picture updated successfully!
          </div>
        )}

        {/* Profile identity panel card */}
        <div className="glass-card bg-white/60 dark:bg-[#07090e]/60 backdrop-blur-xl border border-black/10 dark:border-zinc-800/80 rounded-2xl p-8 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.05)] dark:shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">

          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">

            {/* Avatar section */}
            <div className="relative shrink-0 group">
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-primary to-blue-500 p-[3px] shadow-[0_0_25px_rgba(0,209,255,0.25)]">
                <div className="w-full h-full rounded-full bg-[#07090e] flex items-center justify-center overflow-hidden">
                  {previewAvatar ? (
                    <img src={previewAvatar} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black tracking-tight text-white font-sans">{initials}</span>
                  )}
                </div>
              </div>
              {/* Status dot */}
              <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#07090e] ${
                profile.role === "admin" ? "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.7)]" : "bg-primary shadow-[0_0_8px_rgba(0,209,255,0.7)]"
              }`}></span>
              {/* Edit overlay button */}
              <button
                onClick={() => setShowAvatarPicker(true)}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                title="Change profile picture"
              >
                <Camera size={22} className="text-white" />
              </button>
            </div>

            {/* Profile specifications */}
            <div className="space-y-4 flex-grow">
              <div>
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground dark:text-white leading-none">
                    {profile.name}
                  </h1>
                  <span className={`self-center px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-wider border ${
                    profile.role === "admin" ? "bg-purple-500/10 border-purple-500/25 text-purple-600 dark:text-purple-400" :
                    "bg-primary/10 border-primary/25 text-primary dark:text-[#00d1ff]"
                  }`}>
                    {profile.role}
                  </span>
                  {profile.isGoogleUser && (
                    <span className="self-center px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-wider border bg-red-500/10 border-red-500/20 text-red-400">
                      Google Account
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-mono text-zinc-500 mt-2 tracking-wide uppercase">RECODEX SECURITY ACCOUNT SIGNATURE</p>
              </div>

              {/* Change avatar button */}
              <button
                onClick={() => setShowAvatarPicker(true)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-black/5 dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 rounded-lg text-xs font-mono font-bold text-zinc-500 hover:text-primary hover:border-primary/40 transition-all"
              >
                <Camera size={13} />
                Change Profile Picture
              </button>

              {/* Specs grid list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-black/5 dark:border-zinc-900/60 select-text">

                <div className="flex items-center gap-3 text-zinc-650 dark:text-zinc-350">
                  <Mail size={16} className="text-zinc-400 shrink-0" />
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block leading-none">Credentials Email</span>
                    <span className="text-xs font-mono font-medium block">{profile.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-zinc-650 dark:text-zinc-350">
                  <Phone size={16} className="text-zinc-400 shrink-0" />
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block leading-none">Contact Phone</span>
                    <span className="text-xs font-mono font-medium block">{profile.phone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-zinc-650 dark:text-zinc-350 sm:col-span-2">
                  <Cpu size={16} className="text-zinc-400 shrink-0" />
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block leading-none">Global Cryptographic User ID</span>
                    <span className="text-xs font-mono font-semibold block text-primary dark:text-[#00d1ff] tracking-tight truncate">{profile.id}</span>
                  </div>
                </div>

              </div>

              {/* Actions footer */}
              <div className="pt-6 mt-6 border-t border-black/5 dark:border-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
                <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 font-bold uppercase">
                  <Shield size={12} className="text-[#10b981]" />
                  <span>Verified Identity sync successful</span>
                </div>

                {profile.role === "admin" && (
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary dark:bg-[#00d1ff] text-on-primary dark:text-black font-extrabold rounded-lg text-[10px] font-mono uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,209,255,0.25)]"
                  >
                    Manage Console
                    <ExternalLink size={11} />
                  </Link>
                )}
              </div>

            </div>
          </div>

        </div>

      </main>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#07090e] border border-black/10 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-black/5 dark:border-zinc-900">
              <div>
                <h3 className="font-bold text-foreground dark:text-white text-sm uppercase tracking-wider font-mono">Profile Picture</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Choose a preset, upload your own, or keep your current picture</p>
              </div>
              <button onClick={handleCancelAvatarPicker} className="text-zinc-400 hover:text-foreground transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

              {/* Preview */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-blue-500 p-[2px] shadow-[0_0_15px_rgba(0,209,255,0.2)] shrink-0">
                  <div className="w-full h-full rounded-full bg-[#07090e] overflow-hidden flex items-center justify-center">
                    {previewAvatar ? (
                      <img src={previewAvatar} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-black text-white">{initials}</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground dark:text-white">Preview</p>
                  <p className="text-[10px] text-zinc-500 font-mono">{pendingAvatar ? "New selection (unsaved)" : "Current picture"}</p>
                </div>
              </div>

              {/* Upload section */}
              <div>
                <p className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-2">Upload Custom Image</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 border-2 border-dashed border-black/10 dark:border-zinc-800 rounded-xl flex flex-col items-center gap-2 text-zinc-500 hover:border-primary/50 hover:text-primary transition-all cursor-pointer"
                >
                  <Upload size={20} />
                  <span className="text-xs font-mono">Click to upload (JPG, PNG, GIF â€” max 5MB)</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {/* Preset Avatars */}
              <div>
                <p className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-3">Choose Preset Avatar</p>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectPreset(url)}
                      className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        pendingAvatar === url
                          ? "border-primary shadow-[0_0_12px_rgba(0,209,255,0.4)]"
                          : "border-black/10 dark:border-zinc-800 hover:border-primary/50"
                      }`}
                      title={`Preset avatar ${idx + 1}`}
                    >
                      <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover bg-zinc-900" />
                      {pendingAvatar === url && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <CheckCircle size={16} className="text-primary" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {profile.isGoogleUser && profile.avatar && (
                <div>
                  <p className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-3">Your Google Account Picture</p>
                  <button
                    onClick={() => handleSelectPreset(profile.avatar!)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      pendingAvatar === profile.avatar
                        ? "border-primary shadow-[0_0_12px_rgba(0,209,255,0.4)]"
                        : "border-black/10 dark:border-zinc-800 hover:border-primary/50"
                    }`}
                  >
                    <img src={profile.avatar} alt="Google avatar" className="w-full h-full object-cover" />
                    {pendingAvatar === profile.avatar && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <CheckCircle size={16} className="text-primary" />
                      </div>
                    )}
                  </button>
                </div>
              )}

            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-black/5 dark:border-zinc-900 flex items-center justify-between gap-3">
              <button
                onClick={handleCancelAvatarPicker}
                className="px-4 py-2 text-xs font-mono font-bold text-zinc-500 hover:text-foreground border border-black/10 dark:border-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAvatar}
                disabled={!pendingAvatar || savingAvatar}
                className="px-5 py-2 text-xs font-mono font-bold bg-primary text-white dark:text-black rounded-lg hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
              >
                {savingAvatar ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={13} />
                    Save Picture
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
