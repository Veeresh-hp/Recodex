import React, { useState, useEffect } from "react";
import { Megaphone, Bell, Calendar, ShieldAlert } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  date: string;
}

const formatRelativeTime = (timestampStr: string): string => {
  if (!timestampStr) return "";
  let date = new Date(timestampStr);

  if (isNaN(date.getTime())) {
    const match = timestampStr.match(/^(\d+)\s*([a-z]+)\s*ago$/i);
    if (match) {
      const val = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      const nowMs = Date.now();
      if (unit.startsWith("m") && !unit.startsWith("mo")) date = new Date(nowMs - val * 60 * 1000);
      else if (unit.startsWith("h")) date = new Date(nowMs - val * 3600 * 1000);
      else if (unit.startsWith("d")) date = new Date(nowMs - val * 86400 * 1000);
      else if (unit.startsWith("mo")) date = new Date(nowMs - val * 30 * 86400 * 1000);
      else if (unit.startsWith("y")) date = new Date(nowMs - val * 365 * 86400 * 1000);
      else return timestampStr;
    } else {
      return timestampStr;
    }
  }

  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 45) return "Just now";
  if (diffMin < 60) return `${Math.max(1, diffMin)}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return `${diffYear}y ago`;
};

const getAnnouncementMessage = (ann: Announcement): string => {
  if (ann.id === "ann-02") {
    const date = new Date(ann.date);
    if (!isNaN(date.getTime())) {
      const monthStr = date.toLocaleString("en-US", { month: "long" });
      const dayNum = date.getDate();
      if (ann.message.includes("[DATE]")) {
        return ann.message.replace("[DATE]", `${monthStr} ${dayNum}`);
      }
      return ann.message.replace(/updates on [A-Za-z]+ \d+/, `updates on ${monthStr} ${dayNum}`);
    }
  }
  return ann.message;
};

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const stored = localStorage.getItem("recodex_global_announcements");
    if (stored) return JSON.parse(stored);

    const now = new Date();
    const betaDate = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
    const maintenanceDate = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
    const maintenanceDateObj = new Date(maintenanceDate);
    const maintenanceMonth = maintenanceDateObj.toLocaleString("en-US", { month: "long" });
    const maintenanceDay = maintenanceDateObj.getDate();
    const maintenanceString = `${maintenanceMonth} ${maintenanceDay}`;

    const initialAnnouncements = [
      { 
        id: "ann-01", 
        title: "RecodeX v1.0.0 Mainnet Beta", 
        message: "Global deployment orchestration active across all categories. Synchronize your developer keys now.", 
        type: "New Feature", 
        date: betaDate 
      },
      { 
        id: "ann-02", 
        title: "Server Maintenance Schedule", 
        message: `Decentralized database nodes will undergo updates on ${maintenanceString} at 04:00 UTC. Uptime SLA will be maintained at 99.9%.`, 
        type: "Maintenance Notice", 
        date: maintenanceDate 
      }
    ];

    localStorage.setItem("recodex_global_announcements", JSON.stringify(initialAnnouncements));
    return initialAnnouncements;
  });

  const [, setTick] = useState(0);

  useEffect(() => {
    const syncAnnouncements = () => {
      try {
        const stored = localStorage.getItem("recodex_global_announcements");
        if (stored) {
          setAnnouncements(JSON.parse(stored));
        }
      } catch (err) {
        console.error("Failed to sync announcements:", err);
      }
    };

    window.addEventListener("storage", syncAnnouncements);
    window.addEventListener("recodex-announcements-update", syncAnnouncements);

    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);

    return () => {
      window.removeEventListener("storage", syncAnnouncements);
      window.removeEventListener("recodex-announcements-update", syncAnnouncements);
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between font-sans select-none">

      <main className="flex-grow pt-28 pb-16 bg-grid-layout relative min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none z-0"></div>
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 space-y-12 select-text">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h1 className="text-3xl sm:text-4xl font-black text-foreground flex items-center justify-center gap-3">
              <Megaphone size={28} className="text-primary dark:text-[#00d1ff] animate-pulse" />
              Ecosystem Broadcast Hub
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              Live updates, hackathon announcements, software feature releases, and developer nodes telemetry.
            </p>
          </div>

          {/* Announcements Feed Grid */}
          {announcements.length === 0 ? (
            <div className="py-20 text-center bg-white/5 dark:bg-black/20 rounded-2xl border border-black/5 dark:border-white/5 max-w-lg mx-auto space-y-3 shadow-inner">
              <ShieldAlert className="mx-auto text-zinc-500 dark:text-zinc-400 mb-2 animate-bounce" size={42} />
              <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-foreground">No broadcasts active</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xs mx-auto leading-normal">
                Check back later! Active administrative broadcasts will automatically populate here in real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="bg-white/40 dark:bg-zinc-950/45 border border-black/10 dark:border-white/10 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl shadow-md hover:-translate-y-1 hover:shadow-lg hover:border-primary/20 dark:hover:border-[#00d1ff]/20 transition-all duration-300 flex flex-col sm:flex-row gap-6 group"
                >
                  {/* Decorative glowing gradient circle behind category tags */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 dark:bg-[#00d1ff]/5 rounded-full blur-2xl pointer-events-none"></div>

                  {/* Left Column: Icon & Tags */}
                  <div className="flex sm:flex-col items-start gap-4 shrink-0 sm:w-36">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary dark:text-[#00d1ff] group-hover:scale-110 transition-transform">
                      <Bell size={18} />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold font-mono px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary dark:text-[#00d1ff] uppercase tracking-wider block w-max">
                        {ann.type}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                        <Calendar size={10} />
                        {formatRelativeTime(ann.date)}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Title & Message */}
                  <div className="flex-grow space-y-2.5">
                    <h3 className="text-base font-extrabold text-foreground group-hover:text-primary transition-colors leading-tight">
                      {ann.title}
                    </h3>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans font-medium">
                      {getAnnouncementMessage(ann)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
