import React, { useState } from "react";
import Footer from "../components/Footer";
import { Megaphone, Bell, Calendar, Layers, ShieldAlert } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  date: string;
}

export default function Announcements() {
  const [announcements] = useState<Announcement[]>(() => {
    const stored = localStorage.getItem("recodex_global_announcements");
    return stored ? JSON.parse(stored) : [
      { id: "ann-01", title: "RecodeX v1.0.0 Mainnet Beta", message: "Global deployment orchestration active across all categories. Synchronize your developer keys now.", type: "New Feature", date: "3h ago" },
      { id: "ann-02", title: "Server Maintenance Schedule", message: "Decentralized database nodes will undergo updates on May 30 at 04:00 UTC. Uptime SLA will be maintained at 99.9%.", type: "Maintenance Notice", date: "1d ago" }
    ];
  });

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
            <p className="text-xs sm:text-sm text-gray-555 dark:text-zinc-400">
              Live updates, hackathon announcements, software feature releases, and developer nodes telemetry.
            </p>
          </div>

          {/* Announcements Feed Grid */}
          {announcements.length === 0 ? (
            <div className="py-20 text-center bg-white/5 dark:bg-black/20 rounded-2xl border border-black/5 dark:border-white/5 max-w-lg mx-auto space-y-3 shadow-inner">
              <ShieldAlert className="mx-auto text-gray-500 mb-2 animate-bounce" size={42} />
              <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-foreground">No broadcasts active</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto leading-normal">
                Check back later! Active administrative broadcasts will automatically populate here in real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {announcements.map((ann, i) => (
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
                      <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                        <Calendar size={10} />
                        {ann.date}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Title & Message */}
                  <div className="flex-grow space-y-2.5">
                    <h3 className="text-base font-extrabold text-foreground group-hover:text-primary transition-colors leading-tight">
                      {ann.title}
                    </h3>
                    <p className="text-xs text-gray-650 dark:text-zinc-350 leading-relaxed font-sans font-medium">
                      {ann.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
