import React, { useState } from "react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import TerminalModal from "@/components/TerminalModal";
import { MOCK_PROJECTS, ECOSYSTEMS } from "@/data/mockData";
import { ArrowUpRight, Terminal as TerminalIcon, Code, ShieldCheck, Cpu, Award } from "lucide-react";

export default function Home() {
  const [selectedProject, setSelectedProject] = useState<(typeof MOCK_PROJECTS)[0] | null>(null);

  // We can pick Quantum-Flux Core as the homepage interactive showcase repo
  const quantumProj = MOCK_PROJECTS[0];

  return (
    <>
      
      {/* Dynamic glow coordinates background grid */}
      <main className="flex-grow pt-20 bg-grid-layout relative min-h-screen">
        
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-16 pb-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-[10px] font-mono uppercase tracking-widest backdrop-blur-sm font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse pulse-glow-cyan mr-0.5"></span>
                HIGH-PERFORMANCE NETWORK
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] font-sans">
                Engineered for <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">
                  Excellence.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-gray-500 max-w-xl leading-relaxed">
                Connect with top-tier developers, architects, and engineers. Build scalable solutions with professionals who understand the architecture of modern software.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  to="/signup"
                  className="bg-primary text-white dark:text-black px-6 py-3 rounded-md text-sm font-semibold hover:scale-[1.02] transition-all shadow-[0_0_25px_rgba(0,209,255,0.25)] flex items-center gap-1.5"
                >
                  Get Started
                </Link>
                <Link
                  to="/projects"
                  className="bg-transparent border border-black/10 dark:border-white/15 text-foreground px-6 py-3 rounded-md text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                >
                  Browse Projects
                </Link>
              </div>

              <div className="flex items-center gap-4 pt-6 text-sm text-gray-400 font-mono">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-800 border-2 border-white dark:border-black flex items-center justify-center text-[10px] font-bold overflow-hidden">
                    <img alt="Dev" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-800 border-2 border-white dark:border-black flex items-center justify-center text-[10px] font-bold overflow-hidden">
                    <img alt="Dev" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-800 border-2 border-white dark:border-black flex items-center justify-center text-[10px] font-bold overflow-hidden">
                    <img alt="Dev" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=80" />
                  </div>
                </div>
                <p>Join 10,000+ elite engineers</p>
              </div>
            </div>

            {/* Right Showcase: Interactive Code Panel */}
            <div className="relative h-[450px] w-full rounded-xl overflow-hidden glass-card flex items-center justify-center border border-black/5 dark:border-white/5 animate-float shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none z-0"></div>
              
              <div className="w-[90%] h-[85%] bg-black/85 rounded-lg border border-black/10 dark:border-white/10 flex flex-col overflow-hidden z-10 shadow-2xl font-mono">
                {/* File Header */}
                <div className="h-11 border-b border-white/5 flex items-center px-4 justify-between bg-zinc-900/60">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    <span className="text-[11px] text-gray-500 ml-3">architecture.rs</span>
                  </div>
                  <button
                    onClick={() => setSelectedProject(quantumProj)}
                    className="text-[10px] bg-primary/10 text-primary border border-primary/25 rounded px-2.5 py-1 hover:bg-primary hover:text-white dark:hover:text-black transition-all flex items-center gap-1 font-semibold"
                  >
                    <TerminalIcon size={10} />
                    Run Core Code
                  </button>
                </div>

                {/* Editor Content */}
                <div className="p-4 text-xs text-gray-400 leading-relaxed overflow-hidden flex-grow select-text bg-[#030405]">
                  <div className="flex select-none">
                    <div className="text-gray-600 text-right pr-4 select-none flex flex-col w-5 border-r border-white/5">
                      <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span>
                    </div>
                    <div className="pl-4 text-gray-300">
                      <span className="text-[#c678dd]">pub fn</span> <span className="text-[#61afef] font-semibold">initialize_system</span>() -&gt; <span className="text-[#e5c07b]">Result</span>&lt;(), <span className="text-[#e5c07b]">Error</span>&gt;<br />
                      &#123;<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#c678dd]">let</span> mut core = <span className="text-[#e5c07b]">Engine</span>::<span className="text-[#61afef]">new</span>();<br />
                      <br />
                      &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-gray-600">{"// Optimal routing established"}</span><br />
                      &nbsp;&nbsp;&nbsp;&nbsp;core.<span className="text-[#61afef]">mount</span>(<span className="text-[#98c379]">{"\"marketplace\""}</span>, routes);<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;core.<span className="text-[#61afef]">scale</span>(<span className="text-[#d19a66]">10_000</span>);<br />
                      <br />
                      &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#c678dd]">Ok</span>(())<br />
                      &#125;
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Trending Stacks Infinite Marquee */}
        <div className="w-full border-y border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-zinc-950/40 backdrop-blur-sm overflow-hidden py-4">
          <div className="animate-marquee whitespace-nowrap flex select-none">
            <div className="flex items-center gap-16 px-8 text-sm font-semibold tracking-wider font-mono">
              <span className="text-gray-400 flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-primary pulse-glow-cyan"></span> 
                TRENDING LAB STACKS
              </span>
              <span className="text-foreground">REACT & NEXT.JS</span>
              <span className="text-foreground">RUST / WASM</span>
              <span className="text-foreground">PYTHON AI/ML</span>
              <span className="text-foreground">SOLIDITY WEB3</span>
              <span className="text-foreground">KUBERNETES CLOUD</span>
              <span className="text-foreground">TAILWIND CSS</span>
              <span className="text-foreground">POSTGRESQL DB</span>
            </div>
            
            {/* Duplicate for infinite seamless scroll */}
            <div className="flex items-center gap-16 px-8 text-sm font-semibold tracking-wider font-mono">
              <span className="text-gray-400 flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-primary pulse-glow-cyan"></span> 
                TRENDING LAB STACKS
              </span>
              <span className="text-foreground">REACT & NEXT.JS</span>
              <span className="text-foreground">RUST / WASM</span>
              <span className="text-foreground">PYTHON AI/ML</span>
              <span className="text-foreground">SOLIDITY WEB3</span>
              <span className="text-foreground">KUBERNETES CLOUD</span>
              <span className="text-foreground">TAILWIND CSS</span>
              <span className="text-foreground">POSTGRESQL DB</span>
            </div>
          </div>
        </div>

        {/* Ecosystems Grid */}
        <section className="max-w-7xl mx-auto px-6 py-20 relative z-10">
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Ecosystems
              </h2>
              <p className="text-base text-gray-500 mt-2">
                Specialized developer talent engineered for complex architectures.
              </p>
            </div>
            <Link
              to="/categories"
              className="text-primary hover:underline flex items-center gap-1.5 font-semibold text-sm"
            >
              View all categories
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ECOSYSTEMS.map((eco) => (
              <div
                key={eco.id}
                className={`glass-card rounded-xl p-6 flex flex-col border-t-2 border-t-zinc-300 dark:border-t-zinc-800 ${eco.borderColor}`}
              >
                <div className="flex justify-between items-center mb-6">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    eco.color === "primary" ? "bg-primary/10 text-primary" : 
                    eco.color === "error" ? "bg-red-500/10 text-red-400" : "bg-gray-400/10 text-gray-400"
                  }`}>
                    <Code size={24} />
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold font-mono ${
                      eco.color === "primary" ? "text-primary" : 
                      eco.color === "error" ? "text-red-400" : "text-gray-400"
                    }`}>{eco.count}</div>
                    <div className="text-[10px] uppercase text-gray-500 font-mono tracking-widest">{eco.activeDevs}</div>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-foreground mb-4">{eco.title}</h3>
                
                <ul className="space-y-2 text-sm text-gray-500 mb-6">
                  {eco.bullets.map((bullet, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                      {bullet}
                    </li>
                  ))}
                </ul>

                <Link
                  to={`/projects?category=${encodeURIComponent(eco.title)}`}
                  className="mt-auto w-full py-2 bg-gray-100 dark:bg-white/5 rounded text-center text-xs font-semibold text-foreground hover:bg-primary hover:text-white dark:hover:text-black transition-colors"
                >
                  Explore Stack
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="max-w-7xl mx-auto px-6 py-20 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              How it Works
            </h2>
            <p className="text-base text-gray-500 mt-2">
              Simple. Technical. Efficient.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Common SVG Definitions for glowing lines */}
            <svg className="absolute w-0 h-0 pointer-events-none overflow-hidden" aria-hidden="true">
              <defs>
                <filter id="neonArrowGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
            </svg>

            {/* Connection Line 1: Step 1 -> Step 2 */}
            <div className="hidden md:block absolute top-8 left-[calc(16.6%+32px)] w-[calc(33.3%-64px)] h-8 z-0 pointer-events-none -translate-y-1/2">
              <svg viewBox="0 0 100 20" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <path
                  d="M 0 10 Q 50 12, 98 10"
                  fill="transparent"
                  stroke="currentColor"
                  className="text-primary/45 dark:text-[#00d1ff]/25"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <path
                  d="M 93 7 L 99 10 L 93 13 Z"
                  fill="currentColor"
                  className="text-primary dark:text-[#00d1ff]"
                  filter="url(#neonArrowGlow)"
                />
              </svg>
            </div>

            {/* Connection Line 2: Step 2 -> Step 3 */}
            <div className="hidden md:block absolute top-8 left-[calc(50%+32px)] w-[calc(33.3%-64px)] h-8 z-0 pointer-events-none -translate-y-1/2">
              <svg viewBox="0 0 100 20" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <path
                  d="M 0 10 Q 50 12, 98 10"
                  fill="transparent"
                  stroke="currentColor"
                  className="text-primary/45 dark:text-[#00d1ff]/25"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <path
                  d="M 93 7 L 99 10 L 93 13 Z"
                  fill="currentColor"
                  className="text-primary dark:text-[#00d1ff]"
                  filter="url(#neonArrowGlow)"
                />
              </svg>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:scale-105 transition-all shadow-[0_0_15px_rgba(0,209,255,0.15)]">
                <Code size={28} />
              </div>
              <h4 className="text-lg font-bold text-foreground">1. Discovery</h4>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                Filter by specific GitHub contributions, tech stack mastery, and past architectural impact.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:scale-105 transition-all shadow-[0_0_15px_rgba(0,209,255,0.15)]">
                <Cpu size={28} />
              </div>
              <h4 className="text-lg font-bold text-foreground">2. Selection</h4>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                Review code samples, verified skills, and real-world performance metrics from previous clients.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:scale-105 transition-all shadow-[0_0_15px_rgba(0,209,255,0.15)]">
                <Award size={28} />
              </div>
              <h4 className="text-lg font-bold text-foreground">3. Integration</h4>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                Onboard talent seamlessly with our integrated project management and secure escrow systems.
              </p>
            </div>
          </div>
        </section>

        {/* Security & Stats Section */}
        <section className="border-y border-black/5 dark:border-white/5 py-20 bg-gray-50/50 dark:bg-zinc-950/20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight text-foreground font-sans">
                  Security-first Infrastructure
                </h2>
                <p className="text-base text-gray-500 leading-relaxed max-w-xl">
                  We verify every line of code and every developer to ensure your intellectual property is protected by the highest industry standards.
                </p>
                
                <div className="grid grid-cols-2 gap-4 mt-8 font-mono text-xs font-semibold text-gray-400">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-primary" />
                    <span>100% CODE VERIFIED</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-primary" />
                    <span>SECURE ESCROW</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-primary" />
                    <span>IP PROTECTION</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-primary" />
                    <span>SMART CONTRACTS</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="glass-card p-8 rounded-xl flex flex-col items-center justify-center text-center border-b-4 border-b-primary shadow-lg">
                  <div className="text-4xl lg:text-5xl font-extrabold text-primary font-mono tracking-tight">99.9%</div>
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider font-mono mt-3">Success Rate</div>
                </div>
                
                <div className="glass-card p-8 rounded-xl flex flex-col items-center justify-center text-center border-b-4 border-b-gray-500 dark:border-b-zinc-800 shadow-lg">
                  <div className="text-4xl lg:text-5xl font-extrabold text-foreground font-mono tracking-tight">5M+</div>
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider font-mono mt-3">Lines Scanned</div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* CTA Container */}
        <section className="max-w-7xl mx-auto px-6 py-20 relative z-10">
          <div className="bg-gradient-to-br from-primary/10 via-gray-50 to-white dark:via-[#090b0c] dark:to-black rounded-2xl p-10 lg:p-16 border border-black/5 dark:border-white/10 text-center space-y-6 relative overflow-hidden shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight font-sans">
              Ready to build the future?
            </h2>
            <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Join the world&apos;s most performant developer network and scale your engineering team with elite talent today.
            </p>
            <div className="flex justify-center pt-2">
              <Link
                to="/signup"
                className="bg-primary text-white dark:text-black px-8 py-3.5 rounded-md text-sm font-bold hover:brightness-110 hover:shadow-[0_0_30px_rgba(0,209,255,0.4)] transition-all active:scale-95"
              >
                Hire Elite Talent
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />

      {/* Terminal View Dialog Overlay */}
      <TerminalModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </>
  );
}
