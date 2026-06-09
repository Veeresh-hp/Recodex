import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/5 w-full py-16 transition-colors duration-300 mt-auto select-none">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Brand Summary */}
        <div className="md:col-span-6 flex flex-col gap-4">
          <div className="text-2xl font-bold tracking-tight text-white font-sans">
            <span className="font-extrabold text-white">Recode</span>
            <span className="font-light text-[#00d1ff]">X</span>
          </div>
          <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
            Connecting elite engineers with world-class opportunities. The technical directory for the next generation of digital builders.
          </p>
          <p className="text-xs text-zinc-600 font-mono mt-2">
            © 2026 RecodeX. Engineered for Performance.
          </p>
        </div>

        {/* Column 2: ECOSYSTEM */}
        <div className="md:col-span-3 flex flex-col gap-3">
          <h4 className="text-xs font-semibold text-white uppercase tracking-widest mb-1 font-mono">
            ECOSYSTEM
          </h4>
          <Link
            to="/projects"
            className="text-sm text-zinc-500 hover:text-[#00d1ff] transition-all duration-200"
          >
            API
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 hover:text-[#00d1ff] transition-all duration-200"
          >
            Github
          </a>
          <a
            href="https://discord.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 hover:text-[#00d1ff] transition-all duration-200"
          >
            Discord
          </a>
        </div>

        {/* Column 3: LEGAL */}
        <div className="md:col-span-3 flex flex-col gap-3">
          <h4 className="text-xs font-semibold text-white uppercase tracking-widest mb-1 font-mono">
            LEGAL
          </h4>
          <Link
            to="/privacy"
            className="text-sm text-zinc-500 hover:text-[#00d1ff] transition-all duration-200"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="text-sm text-zinc-500 hover:text-[#00d1ff] transition-all duration-200"
          >
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
