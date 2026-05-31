import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function SubNavbar() {
  const { pathname } = useLocation();

  const subNavItems = [
    { label: "Marketplace", href: "/marketplace" },
    { label: "Solutions", href: "/solutions" },
    { label: "Showcase", href: "/showcase" },
    { label: "Docs", href: "/terms" },
  ];

  return (
    <>
      {/* Fixed sub-navbar — sits directly below the fixed primary Navbar (top-20 = 80px) */}
      <div className="fixed top-20 left-0 right-0 w-full z-40 border-b border-black/5 dark:border-zinc-900/60 bg-white/80 dark:bg-black/80 backdrop-blur-md px-6 md:px-12 xl:px-24 py-3 flex items-center justify-center select-none transition-colors duration-300 print:hidden">
        <nav className="flex items-center gap-8 font-mono text-[9px] font-bold tracking-widest uppercase">
          {subNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`transition-all duration-200 ${
                  isActive
                    ? "text-primary drop-shadow-[0_0_5px_rgba(0,209,255,0.4)] border-b border-primary pb-0.5"
                    : "text-gray-500 dark:text-gray-400 hover:text-primary hover:drop-shadow-[0_0_5px_rgba(0,209,255,0.4)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Spacer: pushes page content below both fixed navbars (80px main + ~40px sub = 120px) */}
      <div className="h-[120px] print:hidden" />
    </>
  );
}
