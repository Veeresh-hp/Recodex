import React from "react";
import { Link } from "react-router-dom";
import { Shield, CheckCircle2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="site-footer relative z-10 bg-black/90 dark:bg-[#04060a]/90 backdrop-blur-xl border-t border-black/10 dark:border-white/10 w-full pt-16 pb-8 transition-colors duration-300 mt-auto select-none print:hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 xl:px-24">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 pb-12">
          
          {/* Column 1: Brand Summary */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity w-fit group">
              <img 
                src="/recodeXlogo.png" 
                alt="RecodeX Logo" 
                className="brand-logo-img h-9 md:h-10 w-auto object-contain shrink-0" 
              />
              <span className="text-xl font-black tracking-tight text-white uppercase font-sans drop-shadow-sm">
                <span className="text-[#00d1ff]">Recode</span>X
              </span>
            </Link>
            <p className="text-xs md:text-sm text-zinc-400 dark:text-zinc-500 max-w-sm leading-relaxed font-sans font-medium">
              Connecting elite engineers with world-class opportunities. The technical directory for the next generation of digital builders.
            </p>
          </div>

          {/* Column 2: ECOSYSTEM */}
          <div className="md:col-span-3 flex flex-col gap-3">
            <h4 className="text-[10px] font-bold text-primary dark:text-[#00d1ff] uppercase tracking-widest font-mono mb-1">
              ECOSYSTEM
            </h4>
            <Link to="/projects" className="text-xs text-zinc-400 dark:text-zinc-400 hover:text-primary dark:hover:text-[#00d1ff] transition-all duration-200">
              Projects Directory
            </Link>
            <Link to="/marketplace" className="text-xs text-zinc-400 dark:text-zinc-400 hover:text-primary dark:hover:text-[#00d1ff] transition-all duration-200">
              Marketplace
            </Link>
            <Link to="/docs" className="text-xs text-zinc-400 dark:text-zinc-400 hover:text-primary dark:hover:text-[#00d1ff] transition-all duration-200">
              Documentation
            </Link>
            <Link to="/categories" className="text-xs text-zinc-400 dark:text-zinc-400 hover:text-primary dark:hover:text-[#00d1ff] transition-all duration-200">
              Categories
            </Link>
            <Link to="/solutions" className="text-xs text-zinc-400 dark:text-zinc-400 hover:text-primary dark:hover:text-[#00d1ff] transition-all duration-200">
              Solutions
            </Link>
          </div>

          {/* Column 3: RESOURCES */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <h4 className="text-[10px] font-bold text-primary dark:text-[#00d1ff] uppercase tracking-widest font-mono mb-1">
              RESOURCES
            </h4>
            <Link to="/services" className="text-xs text-zinc-400 dark:text-zinc-400 hover:text-primary dark:hover:text-[#00d1ff] transition-all duration-200">
              Services
            </Link>
            <Link to="/announcements" className="text-xs text-zinc-400 dark:text-zinc-400 hover:text-primary dark:hover:text-[#00d1ff] transition-all duration-200">
              Announcements
            </Link>
            <Link to="/contact" className="text-xs text-zinc-400 dark:text-zinc-400 hover:text-primary dark:hover:text-[#00d1ff] transition-all duration-200">
              Contact Support
            </Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 dark:text-zinc-400 hover:text-primary dark:hover:text-[#00d1ff] transition-all duration-200">
              GitHub
            </a>
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 dark:text-zinc-400 hover:text-primary dark:hover:text-[#00d1ff] transition-all duration-200">
              Discord
            </a>
          </div>

          {/* Column 4: LEGAL */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <h4 className="text-[10px] font-bold text-primary dark:text-[#00d1ff] uppercase tracking-widest font-mono mb-1">
              LEGAL
            </h4>
            <Link to="/terms" className="text-xs text-zinc-400 dark:text-zinc-400 hover:text-primary dark:hover:text-[#00d1ff] transition-all duration-200">
              Terms of Service
            </Link>
            <Link to="/privacy" className="text-xs text-zinc-400 dark:text-zinc-400 hover:text-primary dark:hover:text-[#00d1ff] transition-all duration-200">
              Privacy Policy
            </Link>
          </div>

        </div>

        {/* Bottom Copyright & Badges */}
        <div className="border-t border-white/10 dark:border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-500 tracking-wider uppercase font-bold">
            © 2026 RecodeX. Engineered for Performance.
          </span>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-zinc-900/50 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-[#00d1ff] transition-colors" title="ISO 27001 Security Standards">
              <Shield size={13} />
            </div>
            <div className="w-7 h-7 rounded-full bg-zinc-900/50 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-[#00d1ff] transition-colors" title="Verified System SLA">
              <CheckCircle2 size={13} />
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
