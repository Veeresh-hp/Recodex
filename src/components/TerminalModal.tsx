import React, { useState, useEffect, useRef } from "react";
import { Project } from "../data/mockData";
import { 
  X, Play, RefreshCw, Terminal, FileCode, CheckCircle, 
  Sun, Moon, Zap, Sliders, Database, Sparkles, PlayCircle,
  Activity, ShieldCheck
} from "lucide-react";

interface TerminalModalProps {
  project: Project | null;
  onClose: () => void;
}

export default function TerminalModal({ project, onClose }: TerminalModalProps) {
  let files: Record<string, string> = {};
  if (project && project.files) {
    if (typeof project.files === "string") {
      try {
        files = JSON.parse(project.files);
      } catch (e) {
        files = {};
      }
    } else if (typeof project.files === "object") {
      files = project.files as Record<string, string>;
    }
  }
  const fileNames = Object.keys(files);
  const [selectedFile, setSelectedFile] = useState<string>("");
  
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "logs" | "output">("code");

  // Sync selected file and initial logs when project selection changes
  useEffect(() => {
    if (!project) return;
    
    // Set first file as active
    if (fileNames.length > 0) {
      setSelectedFile(fileNames[0]);
    } else {
      setSelectedFile("");
    }

    // Reset logs
    setTerminalLogs([
      `$ cd ${project.id}`,
      `$ git status`,
      `On branch main. Your branch is up to date with 'origin/main'.`,
      `nothing to commit, working tree clean`,
      `$ run-diagnostics --verbose`,
      `[OK] Security audit passed (0 vulnerabilities detected)`,
      `[OK] Performance benchmark: sub-millisecond latencies confirmed`,
      `Ready to compile. Press "Run Build" or switch to "Live Output" to interact.`
    ]);

    // Reset tab to code
    setActiveTab("code");
  }, [project]);

  // --- 1. APEX-GLOW LIVE CHART TELEMETRY STATE ---
  const [chartType, setChartType] = useState<"LINE" | "AREA" | "BAR">("LINE");
  const [chartData, setChartData] = useState<number[]>([42, 58, 48, 65, 59, 80, 72]);
  
  // --- 2. VORTEX PARTICLE PHYSICS SANDBOX CORE ---
  const sandboxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gravityPull, setGravityPull] = useState(0.15);
  const [particleColor, setParticleColor] = useState<"CYAN" | "PURPLE" | "EMERALD">("CYAN");

  // --- 3. LUMINA BUTTON ELEMENT LAB STATE ---
  const [glowIntensity, setGlowIntensity] = useState(10);
  const [btnClicks, setBtnClicks] = useState(0);
  const [labLogs, setLabLogs] = useState<string[]>(["[LAB] Lumina UI compiler active. Feed ready."]);

  // --- 4. BACKEND RUNTIME TELEMETRY STATE ---
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [activeThreads, setActiveThreads] = useState(8);
  const [requestCount, setRequestCount] = useState(1420);

  // --- 5. QUANTUM-FLUX TRADING TERMINAL STATE ---
  const [fluxPrice, setFluxPrice] = useState(96402.15);
  const [tradeSize, setTradeSize] = useState(1.5);
  const [tradeLog, setTradeLog] = useState<string[]>([
    "[06:34:01] SYS: High-frequency memory channels aligned.",
    "[06:34:02] SYS: Multi-NIC sockets listening on 127.0.0.1:8080."
  ]);

  // --- 6. NEBULA MICROSERVICES ORCHESTRATOR STATE ---
  const [replicaCount, setReplicaCount] = useState(4);
  const [balancerState, setBalancerState] = useState<"ACTIVE" | "REBOOTING" | "SYNCING">("ACTIVE");
  const [nebulaLogs, setNebulaLogs] = useState<string[]>([
    "[SYSTEM] Load Balancer initialized on ingress route.",
    "[SYSTEM] 4 active nodes registered in mesh net."
  ]);

  // --- 7. NEURAL SIFT VULNERABILITY RADAR STATE ---
  const [isSiftScanning, setIsSiftScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [siftLogs, setSiftLogs] = useState<string[]>(["[SIFT] Deep AST analyzer online. Code scanner idle."]);

  // --- 8. TITAN SHELL INTERACTIVE CONSOLE STATE ---
  const [shellCommand, setShellCommand] = useState("");
  const [shellHistory, setShellHistory] = useState<string[]>([
    "Titan Sandboxed Web Terminal [Version 1.0.428]",
    "System: Sandboxed Alpine Linux / gnu-gcc node20",
    "Type 'help' to list available command pipelines."
  ]);

  // --- 9. CHAIN PRISM ZK-PROOF VERIFIER STATE ---
  const [zkOver21, setZkOver21] = useState(true);
  const [zkDeveloper, setZkDeveloper] = useState(true);
  const [zkProofStatus, setZkProofStatus] = useState<"IDLE" | "GENERATING" | "VERIFIED">("IDLE");
  const [zkLogs, setZkLogs] = useState<string[]>(["[DID] Identity provider ready. Circom proof feeds active."]);

  // Quantum-Flux real-time price fluctuation
  useEffect(() => {
    if (!project || project.id !== "quantum-flux-core" || activeTab !== "output") return;
    const interval = setInterval(() => {
      setFluxPrice((prev) => {
        const delta = (Math.random() - 0.5) * 15;
        return parseFloat((prev + delta).toFixed(2));
      });
    }, 800);
    return () => clearInterval(interval);
  }, [project?.id, activeTab]);

  // Compile Trigger Simulation
  const handleCompile = () => {
    if (!project) return;
    setIsCompiling(true);
    setActiveTab("logs");
    setTerminalLogs((prev) => [
      ...prev,
      `$ npm run build`,
      `[BUILD] Loading build compiler config...`,
      `[BUILD] Packaging ${project.title} systems...`
    ]);

    setTimeout(() => {
      setTerminalLogs((prev) => [
        ...prev,
        `[COMPILING] Optimizing critical dependency pipelines...`,
        `[COMPILING] Running static analysis checks...`
      ]);
    }, 1000);

    setTimeout(() => {
      setIsCompiling(false);
      setTerminalLogs((prev) => [
        ...prev,
        `[SUCCESS] Zero errors, zero warnings. Compiled successfully!`,
        `[SUCCESS] Output directory built. Speed metrics stable.`,
        `$`
      ]);
    }, 2500);
  };

  // Run Backend Diagnostic loop simulation
  const triggerDiagnostics = () => {
    setDiagnosticsRunning(true);
    setTimeout(() => {
      setDiagnosticsRunning(false);
      setActiveThreads(Math.floor(Math.random() * 8) + 4);
      setRequestCount((c) => c + Math.floor(Math.random() * 50) + 20);
    }, 2000);
  };

  // Apex Glow real-time dynamic charts update
  useEffect(() => {
    if (!project || project.id !== "apex-glow-analytics" || activeTab !== "output") return;
    const interval = setInterval(() => {
      setChartData((prev) => {
        const next = [...prev.slice(1)];
        const last = prev[prev.length - 1];
        const shift = Math.floor((Math.random() - 0.5) * 20);
        next.push(Math.min(99, Math.max(10, last + shift)));
        return next;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [project?.id, activeTab]);

  // Vortex 3D Particle physics simulation canvas loop
  useEffect(() => {
    if (!project || project.id !== "vortex-3d-particle" || activeTab !== "output") return;

    const canvas = sandboxCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 240);

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    canvas.addEventListener("mousemove", handleMouseMove);

    class GravitationalParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.size = Math.random() * 2 + 0.8;
        this.alpha = Math.random() * 0.7 + 0.3;
      }

      update() {
        let dx = mouseX - this.x;
        let dy = mouseY - this.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // Dynamic pull factor
        this.vx += (dx / dist) * gravityPull * 0.4;
        this.vy += (dy / dist) * gravityPull * 0.4;

        // Friction damping
        this.vx *= 0.98;
        this.vy *= 0.98;

        this.x += this.vx;
        this.y += this.vy;

        // Bounce borders
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw(c: CanvasRenderingContext2D) {
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        
        let colorStr = "0, 209, 255"; // Cyan default
        if (particleColor === "PURPLE") colorStr = "168, 85, 247";
        if (particleColor === "EMERALD") colorStr = "16, 185, 129";

        c.fillStyle = `rgba(${colorStr}, ${this.alpha})`;
        c.fill();
      }
    }

    const systemParticles = Array.from({ length: 150 }, () => new GravitationalParticle());

    const renderLoop = () => {
      ctx.clearRect(0, 0, width, height);

      // Faint central gravity field ring
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 25, 0, Math.PI * 2);
      ctx.strokeStyle = particleColor === "CYAN" ? "rgba(0, 209, 255, 0.08)" : particleColor === "PURPLE" ? "rgba(168, 85, 247, 0.08)" : "rgba(16, 185, 129, 0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();

      systemParticles.forEach((p) => {
        p.update();
        p.draw(ctx);
      });

      animId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, [project?.id, activeTab, gravityPull, particleColor]);

  // Render content block for Live Output sandbox Tab
  const renderLiveOutput = () => {
    if (!project) return null;
    switch (project.id) {
      // 1. APEX-GLOW DASHBOARD
      case "apex-glow-analytics":
        return (
          <div className="space-y-4 h-full flex flex-col justify-between font-sans">
            <div className="flex justify-between items-center select-none">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={12} className="text-[#00d1ff] animate-pulse" />
                  Live SVG Telemetry Flow
                </h4>
                <p className="text-[10px] text-gray-500 font-medium">Real-time Bezier canvas nodes updating dynamically.</p>
              </div>

              {/* Chart type triggers */}
              <div className="flex items-center gap-1 bg-[#0f1217] border border-white/5 p-0.5 rounded font-mono text-[9px] font-bold">
                {["LINE", "AREA", "BAR"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setChartType(type as any)}
                    className={`px-2 py-0.5 rounded text-[8px] cursor-pointer ${
                      chartType === type ? "bg-primary text-black" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Live SVG Chart */}
            <div className="flex-grow bg-[#040608]/80 border border-white/5 rounded-lg p-4 flex items-center justify-center min-h-[170px] relative overflow-hidden">
              <svg viewBox="0 0 400 150" className="w-full h-full overflow-visible">
                {/* Horizontal Guide Lines */}
                <line x1="0" y1="30" x2="400" y2="30" stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="3" />
                <line x1="0" y1="75" x2="400" y2="75" stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="3" />
                <line x1="0" y1="120" x2="400" y2="120" stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="3" />

                {/* AREA CHART PATH */}
                {chartType === "AREA" && (
                  <path
                    d={`M 0 150 
                       L 0 ${150 - (chartData[0] * 1.2)} 
                       C 50 ${150 - (chartData[1] * 1.2)}, 100 ${150 - (chartData[2] * 1.2)}, 150 ${150 - (chartData[3] * 1.2)} 
                       C 200 ${150 - (chartData[4] * 1.2)}, 250 ${150 - (chartData[5] * 1.2)}, 300 ${150 - (chartData[6] * 1.2)} 
                       L 400 ${150 - (chartData[6] * 1.2)}
                       L 400 150 Z`}
                    fill="rgba(0, 209, 255, 0.1)"
                    stroke="transparent"
                  />
                )}

                {/* LINE CHART PATH */}
                {chartType !== "BAR" ? (
                  <path
                    d={`M 0 ${150 - (chartData[0] * 1.2)} 
                       C 50 ${150 - (chartData[1] * 1.2)}, 100 ${150 - (chartData[2] * 1.2)}, 150 ${150 - (chartData[3] * 1.2)} 
                       C 200 ${150 - (chartData[4] * 1.2)}, 250 ${150 - (chartData[5] * 1.2)}, 300 ${150 - (chartData[6] * 1.2)} 
                       L 400 ${150 - (chartData[6] * 1.2)}`}
                    fill="transparent"
                    stroke="#00d1ff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                ) : (
                  // BAR CHART NODES
                  chartData.map((val, idx) => (
                    <rect
                      key={idx}
                      x={idx * 55 + 20}
                      y={150 - (val * 1.2)}
                      width="20"
                      height={val * 1.2}
                      rx="3"
                      fill="#00d1ff"
                      opacity="0.85"
                      className="transition-all duration-300"
                    />
                  ))
                )}

                {/* Dynamic Data point circles (only in Line/Area) */}
                {chartType !== "BAR" && (
                  <circle cx="300" cy={150 - (chartData[5] * 1.2)} r="4" fill="#00d1ff" className="animate-ping" />
                )}
              </svg>
            </div>

            {/* Metrics Info Board */}
            <div className="grid grid-cols-3 gap-2.5 font-mono text-[9px] text-gray-500 uppercase font-bold pt-2">
              <div className="bg-[#0f1217]/50 border border-white/5 p-2 rounded">
                <span className="block text-gray-600 mb-0.5">DATA_FLOW</span>
                <span className="text-[#00d1ff] text-xs">{(chartData[chartData.length - 1] * 0.1).toFixed(1)} KB/S</span>
              </div>
              <div className="bg-[#0f1217]/50 border border-white/5 p-2 rounded">
                <span className="block text-gray-600 mb-0.5">NODE_THROUGHPUT</span>
                <span className="text-white text-xs">{98 + (chartData[chartData.length - 1] % 2)}%</span>
              </div>
              <div className="bg-[#0f1217]/50 border border-white/5 p-2 rounded">
                <span className="block text-gray-600 mb-0.5">SYS_HEALTH</span>
                <span className="text-[#10b981] text-xs">A+_ACTIVE</span>
              </div>
            </div>
          </div>
        );

      // 2. VORTEX PARTICLE SANDBOX
      case "vortex-3d-particle":
        return (
          <div className="space-y-4 h-full flex flex-col justify-between font-sans select-none">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Zap size={12} className="text-[#00d1ff] animate-pulse" />
                  Interactive Gravitational Matrix
                </h4>
                <p className="text-[10px] text-gray-500 font-medium">Hover your mouse inside the sandbox viewport to pull the particles!</p>
              </div>

              {/* Gravity control slider */}
              <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-gray-500">
                <Sliders size={11} />
                <span>GRAVITY: {gravityPull.toFixed(2)}</span>
                <input
                  type="range"
                  min="0.05"
                  max="0.45"
                  step="0.05"
                  value={gravityPull}
                  onChange={(e) => setGravityPull(parseFloat(e.target.value))}
                  className="w-16 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Sandbox Canvas space */}
            <div className="flex-grow bg-black rounded-lg border border-white/5 overflow-hidden min-h-[170px] relative">
              <canvas ref={sandboxCanvasRef} className="absolute inset-0 w-full h-full block cursor-crosshair" />
            </div>

            {/* Colors picker controls */}
            <div className="flex justify-between items-center font-mono text-[9px] font-bold">
              <span className="text-gray-500 uppercase tracking-widest">ACTIVE_SPECTRA:</span>
              <div className="flex gap-2">
                {["CYAN", "PURPLE", "EMERALD"].map((color) => (
                  <button
                    key={color}
                    onClick={() => setParticleColor(color as any)}
                    className={`px-3 py-1.5 rounded border text-[8px] cursor-pointer ${
                      particleColor === color
                        ? "bg-white/5 border-primary text-[#00d1ff]"
                        : "bg-transparent border-white/5 text-gray-500 hover:text-white"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      // 3. LUMINA GLASS UI BUTTONS
      case "lumina-ui":
        return (
          <div className="space-y-5 h-full flex flex-col justify-between font-sans">
            <div className="space-y-0.5 select-none">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={12} className="text-[#00d1ff]" />
                Lumina Glass Component Lab
              </h4>
              <p className="text-[10px] text-gray-500 font-medium">Render live responsive components. Interact to test click event loggers.</p>
            </div>

            {/* Buttons preview sandbox */}
            <div className="flex-grow bg-[#040608]/80 border border-white/5 rounded-lg p-5 flex flex-col items-center justify-center gap-4 min-h-[150px]">
              <div className="flex flex-wrap gap-4 items-center justify-center">
                {/* Glow Primary Component */}
                <button
                  onClick={() => {
                    setBtnClicks(c => c + 1);
                    setLabLogs(l => [`[CLICK] CyberPrimary activated (clicks: ${btnClicks + 1})`, ...l.slice(0, 3)]);
                  }}
                  className="px-5 py-2.5 bg-primary text-black font-mono font-bold rounded-lg text-xs tracking-wider uppercase hover:brightness-110 transition-all cursor-pointer active:scale-95 shadow-md"
                  style={{ boxShadow: `0 0 ${glowIntensity}px rgba(0, 209, 255, 0.45)` }}
                >
                  CyberPrimary
                </button>

                {/* Glassmorphic Secondary Button */}
                <button
                  onClick={() => {
                    setBtnClicks(c => c + 1);
                    setLabLogs(l => [`[CLICK] GlassSecondary toggled (clicks: ${btnClicks + 1})`, ...l.slice(0, 3)]);
                  }}
                  className="px-5 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 text-white font-mono font-bold rounded-lg text-xs tracking-wider uppercase backdrop-blur-md transition-all cursor-pointer active:scale-95"
                >
                  GlassSecondary
                </button>
              </div>

              {/* Lab Glow Intensity Controller */}
              <div className="w-full max-w-[280px] flex items-center justify-between text-[9px] font-mono font-bold text-gray-500 select-none pt-2">
                <span>GLOW_SPREAD: {glowIntensity}PX</span>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="5"
                  value={glowIntensity}
                  onChange={(e) => setGlowIntensity(parseInt(e.target.value))}
                  className="w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Micro-Event Logger logs */}
            <div className="bg-[#050708] border border-white/5 rounded p-3 h-[75px] overflow-y-auto font-mono text-[9px] text-[#00d1ff] space-y-1 select-text">
              {labLogs.map((log, idx) => (
                <div key={idx} className={log.startsWith("[CLICK]") ? "text-[#00d1ff]" : "text-gray-500"}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        );

      // 4. QUANTUM-FLUX CORE (HIGH-FREQUENCY TRADING PANEL)
      case "quantum-flux-core": {
        return (
          <div className="space-y-4 h-full flex flex-col justify-between font-sans text-gray-300">
            {/* Header / Digital Ticker */}
            <div className="flex justify-between items-end border-b border-white/5 pb-2.5">
              <div>
                <span className="text-[9px] font-mono tracking-widest text-gray-500 uppercase font-bold block">QUANTUM_FLUX_FEED</span>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mt-0.5 font-sans">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  High-Frequency Order Engine
                </h4>
              </div>
              <div className="text-right font-mono select-none">
                <span className="text-xs text-emerald-400 font-bold block">{fluxPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} QFX</span>
                <span className="text-[9px] text-gray-500 font-medium">+1.42% (LATENCY: 114ns)</span>
              </div>
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5 flex-grow min-h-[160px]">
              {/* Live Order Book (3 Columns) */}
              <div className="sm:col-span-3 bg-[#040608]/80 border border-white/5 rounded-lg p-3 flex flex-col justify-between font-mono text-[9px]">
                <div className="space-y-1">
                  <div className="flex justify-between text-gray-600 font-bold border-b border-white/5 pb-1 select-none">
                    <span>TYPE</span>
                    <span>PRICE</span>
                    <span>SIZE</span>
                  </div>
                  
                  {/* Simulated bids and asks */}
                  <div className="space-y-0.5">
                    {/* Ask rows (Red) */}
                    <div className="flex justify-between text-[#f43f5e] font-semibold hover:bg-[#f43f5e]/5 px-1 py-0.5 rounded transition-colors">
                      <span>ASK</span>
                      <span>{(fluxPrice + 1.25).toFixed(2)}</span>
                      <span>0.7482</span>
                    </div>
                    <div className="flex justify-between text-[#f43f5e] font-semibold hover:bg-[#f43f5e]/5 px-1 py-0.5 rounded transition-colors">
                      <span>ASK</span>
                      <span>{(fluxPrice + 0.40).toFixed(2)}</span>
                      <span>1.5284</span>
                    </div>
                    {/* Bid rows (Green) */}
                    <div className="flex justify-between text-[#10b981] font-semibold hover:bg-[#10b981]/5 px-1 py-0.5 rounded transition-colors">
                      <span>BID</span>
                      <span>{(fluxPrice - 0.35).toFixed(2)}</span>
                      <span>2.1105</span>
                    </div>
                    <div className="flex justify-between text-[#10b981] font-semibold hover:bg-[#10b981]/5 px-1 py-0.5 rounded transition-colors">
                      <span>BID</span>
                      <span>{(fluxPrice - 1.10).toFixed(2)}</span>
                      <span>0.9840</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-gray-500 font-bold border-t border-white/5 pt-2 select-none uppercase">
                  <span>THROUGHPUT: 945.8K/S</span>
                  <span>CORE_LOAD: 2.4%</span>
                </div>
              </div>

              {/* Trade Panel (2 Columns) */}
              <div className="sm:col-span-2 bg-[#090b0d] border border-white/5 rounded-lg p-3 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <span className="text-[9px] font-mono tracking-widest text-gray-500 uppercase font-bold block select-none">TRADE_EXECUTION</span>
                  
                  {/* Size slider */}
                  <div className="space-y-1 select-none">
                    <div className="flex justify-between text-[9px] font-mono font-bold text-gray-400">
                      <span>ORDER_SIZE:</span>
                      <span className="text-white">{tradeSize.toFixed(2)} BTC</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={tradeSize}
                      onChange={(e) => setTradeSize(parseFloat(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Buy/Sell Buttons */}
                <div className="flex gap-2 font-mono text-[9px] font-bold mt-3 select-none">
                  <button
                    onClick={() => {
                      const timeStr = new Date().toLocaleTimeString();
                      setTradeLog(l => [`[${timeStr}] ORDER SUBMITTED: BUY ${tradeSize} QFX @ $${fluxPrice.toFixed(2)} (Latency: 114ns)`, ...l.slice(0, 4)]);
                    }}
                    className="flex-1 py-2 bg-emerald-500 text-black hover:brightness-110 active:scale-95 transition-all rounded font-bold cursor-pointer"
                  >
                    BUY / BID
                  </button>
                  <button
                    onClick={() => {
                      const timeStr = new Date().toLocaleTimeString();
                      setTradeLog(l => [`[${timeStr}] ORDER SUBMITTED: SELL ${tradeSize} QFX @ $${(fluxPrice - 0.2).toFixed(2)} (Latency: 120ns)`, ...l.slice(0, 4)]);
                    }}
                    className="flex-1 py-2 bg-[#f43f5e] text-white hover:brightness-110 active:scale-95 transition-all rounded font-bold cursor-pointer"
                  >
                    SELL / ASK
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Trade Log */}
            <div className="bg-[#050708] border border-white/5 rounded p-2.5 h-[65px] overflow-y-auto font-mono text-[8px] text-gray-500 space-y-0.5 select-text">
              {tradeLog.map((log, idx) => (
                <div key={idx} className={log.includes("ORDER SUBMITTED") ? "text-[#10b981]" : "text-gray-600"}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        );
      }

      // 5. NEBULA ARCH (DISTRIBUTED ORCHESTRATOR SCALE PANEL)
      case "nebula-arch": {
        const handleReboot = () => {
          setBalancerState("REBOOTING");
          const timeStr = new Date().toLocaleTimeString();
          setNebulaLogs(l => [`[${timeStr}] WARNING: Initiating Load Balancer reload cycle...`, ...l.slice(0, 3)]);
          
          setTimeout(() => {
            setBalancerState("SYNCING");
            setNebulaLogs(l => [`[${new Date().toLocaleTimeString()}] INFO: Load Balancer cycling routes. Node discovery in progress.`, ...l.slice(0, 3)]);
          }, 1500);

          setTimeout(() => {
            setBalancerState("ACTIVE");
            setNebulaLogs(l => [`[${new Date().toLocaleTimeString()}] SUCCESS: Cluster synchronized. Routing tables normal.`, ...l.slice(0, 3)]);
          }, 3000);
        };

        return (
          <div className="space-y-4 h-full flex flex-col justify-between font-sans text-gray-300">
            {/* Header Control Panels */}
            <div className="flex justify-between items-center border-b border-white/5 pb-2.5 select-none">
              <div>
                <span className="text-[9px] font-mono tracking-widest text-gray-500 uppercase font-bold block">NEBULA_CLUSTER_NET</span>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mt-0.5 font-sans">
                  <Database size={12} className="text-purple-400" />
                  Distributed Mesh Node Scaler
                </h4>
              </div>
              <button
                onClick={handleReboot}
                disabled={balancerState !== "ACTIVE"}
                className={`px-3 py-1.5 text-[9px] font-mono font-bold uppercase rounded border transition-all cursor-pointer ${
                  balancerState !== "ACTIVE"
                    ? "bg-zinc-900 border-zinc-800 text-zinc-600"
                    : "bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-black"
                }`}
              >
                {balancerState === "ACTIVE" ? "REBOOT_GATEWAY" : balancerState}
              </button>
            </div>

            {/* Orbit Node Visualizer and Pod Scaler Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5 flex-grow min-h-[160px]">
              {/* Dynamic Cluster Node Map (3 Columns) */}
              <div className="sm:col-span-3 bg-[#040608]/80 border border-white/5 rounded-lg p-4 flex items-center justify-center relative overflow-hidden select-none min-h-[140px]">
                {/* Visual Connection Rings */}
                <div className="absolute w-20 h-20 border border-purple-500/10 rounded-full animate-pulse"></div>
                <div className="absolute w-32 h-32 border border-purple-500/5 rounded-full animate-ping [animation-duration:4s]"></div>

                {/* Orchestrator Center Gateway */}
                <div className="relative z-10 flex flex-col items-center justify-center">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center bg-black transition-all ${
                    balancerState === "ACTIVE" ? "border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.4)]" : "border-yellow-500 animate-pulse"
                  }`}>
                    <Activity size={12} className={balancerState === "ACTIVE" ? "text-purple-400" : "text-yellow-400 animate-spin"} />
                  </div>
                  <span className="text-[7px] font-mono font-bold text-white mt-1 uppercase">GATEWAY_V1</span>
                </div>

                {/* Scalable Glowing Replicas around center node */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {Array.from({ length: replicaCount }).map((_, idx) => {
                    const angle = (idx * 360) / replicaCount;
                    const radius = 48; // Distance from center
                    const x = radius * Math.cos((angle * Math.PI) / 180);
                    const y = radius * Math.sin((angle * Math.PI) / 180);
                    
                    return (
                      <div
                        key={idx}
                        className={`absolute w-4 h-4 rounded-full border bg-black/80 flex items-center justify-center transition-all duration-500 ${
                          balancerState === "ACTIVE" ? "border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "border-yellow-500/30 animate-bounce"
                        }`}
                        style={{
                          transform: `translate(${x}px, ${y}px)`,
                        }}
                      >
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Scaler Panel (2 Columns) */}
              <div className="sm:col-span-2 bg-[#090b0d] border border-white/5 rounded-lg p-3 flex flex-col justify-between select-none">
                <div className="space-y-3">
                  <span className="text-[9px] font-mono tracking-widest text-gray-500 uppercase font-bold block">SCALE_METRICS</span>
                  
                  {/* Replica slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono font-bold text-gray-400">
                      <span>REPLICA_PODS:</span>
                      <span className="text-purple-400">{replicaCount} ACTIVE</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="1"
                      value={replicaCount}
                      disabled={balancerState !== "ACTIVE"}
                      onChange={(e) => {
                        const count = parseInt(e.target.value);
                        setReplicaCount(count);
                        const timeStr = new Date().toLocaleTimeString();
                        setNebulaLogs(l => [`[${timeStr}] SCALE: Configured active mesh cluster topology to ${count} active pods.`, ...l.slice(0, 3)]);
                      }}
                      className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="font-mono text-[8px] text-gray-500 space-y-1 uppercase border-t border-white/5 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span>CPU_ALLOC:</span>
                    <span className="text-white">{(replicaCount * 12.5).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>NETWORK_IO:</span>
                    <span className="text-white">{(48.2 * replicaCount).toFixed(0)} MB/S</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Event Logs */}
            <div className="bg-[#050708] border border-white/5 rounded p-2.5 h-[65px] overflow-y-auto font-mono text-[8px] text-gray-500 space-y-0.5 select-text">
              {nebulaLogs.map((log, idx) => (
                <div key={idx} className={log.includes("SUCCESS") ? "text-emerald-400" : log.includes("WARNING") ? "text-yellow-400" : "text-purple-400/80"}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        );
      }

      // 6. NEURAL SIFT (CODE AUDIT SECURITY SCROLLER)
      case "neural-sift": {
        const handleScan = () => {
          setIsSiftScanning(true);
          setScanProgress(0);
          setSiftLogs(["[06:35:01] SIFT: Initializing scanning pipelines..."]);
          
          let current = 0;
          const timer = setInterval(() => {
            current += 10;
            setScanProgress(current);
            
            if (current === 20) {
              setSiftLogs(l => ["[06:35:03] SIFT: Loading custom model neural weights devmarket-7b...", ...l]);
            }
            if (current === 40) {
              setSiftLogs(l => ["[06:35:05] SIFT: Parsing AST syntax tree code structures...", ...l]);
            }
            if (current === 70) {
              setSiftLogs(l => ["[06:35:07] WARNING: Vulnerability signature match in query.go:L42 (SQL Injection)...", ...l]);
            }
            
            if (current >= 100) {
              clearInterval(timer);
              setIsSiftScanning(false);
              setSiftLogs(l => ["[06:35:09] SUCCESS: Scan completed. 1 vulnerabilities, 0 logic leaks found.", ...l]);
            }
          }, 300);
        };

        return (
          <div className="space-y-4 h-full flex flex-col justify-between font-sans text-gray-300">
            {/* Header / Trigger */}
            <div className="flex justify-between items-center border-b border-white/5 pb-2.5 select-none">
              <div>
                <span className="text-[9px] font-mono tracking-widest text-gray-500 uppercase font-bold block">NEURAL_SIFT_CORE</span>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mt-0.5 font-sans">
                  <ShieldCheck size={12} className="text-amber-400" />
                  Security Vulnerability AI Radar
                </h4>
              </div>
              <button
                onClick={handleScan}
                disabled={isSiftScanning}
                className={`px-3 py-1.5 text-[9px] font-mono font-bold uppercase rounded border transition-all cursor-pointer ${
                  isSiftScanning
                    ? "bg-zinc-900 border-zinc-800 text-zinc-600"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-black"
                }`}
              >
                {isSiftScanning ? `SCANNING ${scanProgress}%` : "TRIGGER_AI_SCAN"}
              </button>
            </div>

            {/* Code Scanning Workspace */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5 flex-grow min-h-[160px]">
              {/* Code Screen (3 Columns) */}
              <div className="sm:col-span-3 bg-[#040608]/80 border border-white/5 rounded-lg p-3 flex flex-col justify-between font-mono text-[9px] overflow-hidden select-text relative">
                <div className="space-y-1">
                  <span className="text-gray-600 block border-b border-white/5 pb-1 select-none">SCANNING_VIEWPORT: main.go</span>
                  
                  {/* Mock code block with highlighting */}
                  <pre className="text-[8px] text-gray-400 leading-relaxed font-mono pt-1">
                    <div>1:  package main</div>
                    <div>2:  import "database/sql"</div>
                    <div>3:  func handleRequest(w http.ResponseWriter, r *http.Request) &#123;</div>
                    <div className={scanProgress >= 70 ? "bg-amber-500/10 text-amber-400 border-l border-amber-500 pl-1 py-0.5" : ""}>
                      4:    query := r.URL.Query().Get("user")
                    </div>
                    <div className={scanProgress >= 70 ? "bg-amber-500/10 text-amber-400 border-l border-amber-500 pl-1 py-0.5" : ""}>
                      5:    db.Query("SELECT * FROM users WHERE name = '" + query + "'")
                    </div>
                    <div>6:  &#125;</div>
                  </pre>
                </div>

                {/* Progress bar inside scanning viewport */}
                {isSiftScanning && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
                    <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
                  </div>
                )}
              </div>

              {/* Threat Severity Panel (2 Columns) */}
              <div className="sm:col-span-2 bg-[#090b0d] border border-white/5 rounded-lg p-3 flex flex-col justify-between select-none">
                <div className="space-y-3">
                  <span className="text-[9px] font-mono tracking-widest text-gray-500 uppercase font-bold block">SEVERITY_LEVEL</span>
                  
                  {/* Gauge indicator */}
                  <div className="flex flex-col items-center justify-center py-2 relative">
                    <div className={`w-14 h-14 rounded-full border-4 flex flex-col items-center justify-center transition-all ${
                      scanProgress >= 70
                        ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)] text-red-500"
                        : isSiftScanning
                        ? "border-amber-500 animate-pulse text-amber-400"
                        : "border-emerald-500 text-emerald-400"
                    }`}>
                      <span className="text-[8px] font-bold uppercase tracking-wide">
                        {scanProgress >= 70 ? "CRITICAL" : isSiftScanning ? "SCAN" : "SAFE"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="font-mono text-[8px] text-gray-500 space-y-1 uppercase border-t border-white/5 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span>SEVERITY_INDEX:</span>
                    <span className={scanProgress >= 70 ? "text-red-500 font-bold" : "text-white"}>{scanProgress >= 70 ? "8.4 / 10" : "0.0 / 10"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>THREAT_CLASS:</span>
                    <span className="text-white">{scanProgress >= 70 ? "SQL_INJECTION" : "CLEAN"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Scanner Log history */}
            <div className="bg-[#050708] border border-white/5 rounded p-2.5 h-[65px] overflow-y-auto font-mono text-[8px] text-gray-500 space-y-0.5 select-text">
              {siftLogs.map((log, idx) => (
                <div key={idx} className={log.includes("SUCCESS") ? "text-emerald-400" : log.includes("WARNING") ? "text-red-400 font-bold" : "text-amber-500/80"}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        );
      }

      // 7. TITAN SHELL (CRT SHELL TERMINAL SIMULATOR)
      case "titan-shell": {
        const handleCommandSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          if (!shellCommand.trim()) return;

          const cmd = shellCommand.trim();
          const cleanCmd = cmd.toLowerCase();
          setShellHistory(h => [...h, `titan $ ${cmd}`]);
          
          setTimeout(() => {
            if (cleanCmd === "help") {
              setShellHistory(h => [
                ...h,
                "Supported commands:",
                "  sysinfo : Display core telemetry and memory alloc",
                "  vuln    : Scan sandbox partition signatures",
                "  clear   : Empty command terminal log screen",
                "  motd    : Render platform banner announcement"
              ]);
            } else if (cleanCmd === "sysinfo") {
              setShellHistory(h => [
                ...h,
                "[SYSINFO] Memory Allocated: 14.8 MB (Lock-free node)",
                "[SYSINFO] Core Temp: 38.4C (Liquid cooled core)",
                "[SYSINFO] Uptime: 45d 12h 4m (99.98% SLA)"
              ]);
            } else if (cleanCmd === "vuln") {
              setShellHistory(h => [
                ...h,
                "[SCAN] Initiating local security verification audit...",
                "[OK] Sandbox jail constraints: ENFORCED",
                "[OK] Signature scans: 0 threat models matches detected."
              ]);
            } else if (cleanCmd === "clear") {
              setShellHistory([]);
            } else if (cleanCmd === "motd") {
              setShellHistory(h => [
                ...h,
                "==================================================",
                "   TITAN SHELL SECURITY SANDBOX SYSTEM v1.0       ",
                "=================================================="
              ]);
            } else {
              setShellHistory(h => [...h, `titan: command not found: '${cmd}'. Type 'help' for pipelines.`]);
            }
          }, 80);

          setShellCommand("");
        };

        return (
          <div className="h-full flex flex-col justify-between font-mono text-[9px] text-[#00ff66] bg-black border border-[#00ff66]/20 rounded-lg p-3 select-text select-none">
            {/* CRT Phosphor Terminal History Log Screen */}
            <div className="flex-grow overflow-y-auto space-y-1 h-[190px] pr-2 select-text custom-terminal-scroll border-b border-[#00ff66]/10 pb-2">
              {shellHistory.map((line, idx) => (
                <div key={idx} className={line.startsWith("titan $") ? "text-white" : line.includes("command not found") || line.includes("WARNING") ? "text-rose-500" : "text-[#00ff66]/80"}>
                  {line}
                </div>
              ))}
              <div className="flex items-center mt-1 text-white">
                <span>titan $</span>
                <form onSubmit={handleCommandSubmit} className="flex-grow ml-1.5">
                  <input
                    type="text"
                    value={shellCommand}
                    onChange={(e) => setShellCommand(e.target.value)}
                    placeholder="Type command (e.g. 'help', 'sysinfo', 'vuln')..."
                    className="w-full bg-transparent border-none outline-none focus:ring-0 text-[#00ff66] font-mono text-[9px] caret-[#00ff66] p-0"
                    autoFocus
                  />
                </form>
              </div>
            </div>

            {/* Shell footer diagnostics */}
            <div className="flex justify-between items-center text-[8px] text-[#00ff66]/40 uppercase tracking-widest pt-2 select-none">
              <span>TITAN_SECURE: ENFORCED</span>
              <span>TTY: WEB_PTY_0</span>
            </div>
          </div>
        );
      }

      // 8. CHAIN PRISM (ZK PROOF GENERATOR)
      case "chain-prism": {
        const handleZKGenerate = () => {
          setZkProofStatus("GENERATING");
          const timeStr = new Date().toLocaleTimeString();
          setZkLogs(l => [`[${timeStr}] CIRCOM: Initializing zkSNARK constraints compiler...`, ...l.slice(0, 3)]);
          
          setTimeout(() => {
            setZkLogs(l => [`[${new Date().toLocaleTimeString()}] CIRCOM: Generating witness matrices (Over21=${zkOver21}, Dev=${zkDeveloper})...`, ...l.slice(0, 3)]);
          }, 1000);

          setTimeout(() => {
            setZkProofStatus("VERIFIED");
            const finalHash = "0x" + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
            setZkLogs(l => [`[${new Date().toLocaleTimeString()}] SUCCESS: Proof hash generated: ${finalHash.slice(0, 16)}...`, ...l.slice(0, 3)]);
          }, 2000);
        };

        return (
          <div className="space-y-4 h-full flex flex-col justify-between font-sans text-gray-300">
            {/* Header controls */}
            <div className="flex justify-between items-center border-b border-white/5 pb-2.5 select-none">
              <div>
                <span className="text-[9px] font-mono tracking-widest text-gray-500 uppercase font-bold block">CHAIN_PRISM_DID</span>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mt-0.5 font-sans">
                  <ShieldCheck size={12} className="text-[#00d1ff] animate-pulse" />
                  Zero-Knowledge Proof Generator
                </h4>
              </div>
              <button
                onClick={handleZKGenerate}
                disabled={zkProofStatus === "GENERATING"}
                className={`px-3 py-1.5 text-[9px] font-mono font-bold uppercase rounded border transition-all cursor-pointer ${
                  zkProofStatus === "GENERATING"
                    ? "bg-zinc-900 border-zinc-800 text-zinc-600"
                    : "bg-primary/10 border-primary/20 text-[#00d1ff] hover:bg-primary hover:text-black"
                }`}
              >
                {zkProofStatus === "GENERATING" ? "GENERATING..." : zkProofStatus === "VERIFIED" ? "PROOF_RE-GENERATE" : "GENERATE_PROOF"}
              </button>
            </div>

            {/* Main proof builder form */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5 flex-grow min-h-[160px]">
              {/* Claim checklist (3 Columns) */}
              <div className="sm:col-span-3 bg-[#040608]/80 border border-white/5 rounded-lg p-4 flex flex-col justify-between font-mono text-[9px] select-none">
                <div className="space-y-2">
                  <span className="text-gray-600 block border-b border-white/5 pb-1 uppercase font-bold">Identity Credentials</span>
                  
                  {/* Toggles */}
                  <div className="space-y-2 pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={zkOver21}
                        disabled={zkProofStatus === "GENERATING"}
                        onChange={(e) => {
                          setZkOver21(e.target.checked);
                          setZkProofStatus("IDLE");
                        }}
                        className="rounded border-white/10 bg-white/5 text-primary focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                      />
                      <span className="text-gray-300">Prove age is Over 21 years old</span>
                    </label>
                    
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={zkDeveloper}
                        disabled={zkProofStatus === "GENERATING"}
                        onChange={(e) => {
                          setZkDeveloper(e.target.checked);
                          setZkProofStatus("IDLE");
                        }}
                        className="rounded border-white/10 bg-white/5 text-primary focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                      />
                      <span className="text-gray-300">Prove verified active Developer role</span>
                    </label>
                  </div>
                </div>

                <div className="text-gray-500 font-bold uppercase tracking-wider border-t border-white/5 pt-2">
                  SCHEMA_VERSION: 1.0.4-DID
                </div>
              </div>

              {/* Status holographic badge (2 Columns) */}
              <div className="sm:col-span-2 bg-[#090b0d] border border-white/5 rounded-lg p-3 flex flex-col justify-between select-none">
                <div className="space-y-3">
                  <span className="text-[9px] font-mono tracking-widest text-gray-500 uppercase font-bold block">VERIFICATION_STATUS</span>
                  
                  {/* holographic badge circle */}
                  <div className="flex flex-col items-center justify-center py-2">
                    <div className={`w-14 h-14 rounded-full border-4 flex flex-col items-center justify-center transition-all ${
                      zkProofStatus === "VERIFIED"
                        ? "border-[#00d1ff] shadow-[0_0_12px_rgba(0,209,255,0.4)] text-[#00d1ff]"
                        : zkProofStatus === "GENERATING"
                        ? "border-yellow-500 animate-pulse text-yellow-400"
                        : "border-gray-700 text-gray-500"
                    }`}>
                      {zkProofStatus === "VERIFIED" ? (
                        <CheckCircle size={18} className="text-[#00d1ff] animate-pulse" />
                      ) : (
                        <span className="text-[9px] font-bold uppercase tracking-wide">
                          {zkProofStatus === "GENERATING" ? "SNARK" : "IDLE"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="font-mono text-[8px] text-gray-500 space-y-1 uppercase border-t border-white/5 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span>PROOF_ALGO:</span>
                    <span className="text-white">groth16</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CONSTRAINTS:</span>
                    <span className="text-white">124,042 NODES</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable logs */}
            <div className="bg-[#050708] border border-white/5 rounded p-2.5 h-[65px] overflow-y-auto font-mono text-[8px] text-gray-500 space-y-0.5 select-text">
              {zkLogs.map((log, idx) => (
                <div key={idx} className={log.includes("SUCCESS") ? "text-emerald-400 font-bold" : log.includes("CIRCOM") ? "text-[#00d1ff]" : "text-gray-600"}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        );
      }

      // DEFAULT BACKEND INFRASTRUCTURE TELEMETRY (GENERIC FALLBACK)
      default:
        return (
          <div className="space-y-4 h-full flex flex-col justify-between font-sans">
            <div className="flex justify-between items-center select-none">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Database size={12} className="text-primary animate-pulse" />
                  Cluster Server Diagnostics
                </h4>
                <p className="text-[10px] text-gray-500 font-medium">Real-time Node health and thread allocations.</p>
              </div>

              <button
                onClick={triggerDiagnostics}
                disabled={diagnosticsRunning}
                className={`px-3 py-1 text-[9px] font-mono font-bold uppercase rounded border transition-all cursor-pointer ${
                  diagnosticsRunning
                    ? "bg-zinc-900 border-zinc-800 text-zinc-600"
                    : "bg-primary/10 border-primary/20 text-[#00d1ff] hover:bg-primary hover:text-black"
                }`}
              >
                {diagnosticsRunning ? "RUNNING..." : "RUN_DIAGNOSTICS"}
              </button>
            </div>

            {/* Simulated server logs */}
            <div className="flex-grow bg-[#040608]/80 border border-white/5 rounded-lg p-4 flex flex-col justify-between min-h-[160px] font-mono text-[10px] select-text">
              <div className="space-y-1.5 text-green-500/80">
                <div>[SERVER] Mounting core repository database connection: OK</div>
                <div>[SERVER] Accessing Supabase secure credential keys: VALID</div>
                <div>[SERVER] Latency throughput rating: <span className="text-[#00d1ff] font-bold">14ms stable</span></div>
                {diagnosticsRunning ? (
                  <div className="text-cyan-400 font-bold animate-pulse flex items-center gap-1.5">
                    <RefreshCw size={11} className="animate-spin" />
                    Scanning database indexing sectors...
                  </div>
                ) : (
                  <div className="text-gray-600">[SERVER] Diagnostics idle. Systems nominal.</div>
                )}
              </div>

              {/* Telemetry charts */}
              <div className="grid grid-cols-2 gap-3 font-mono text-[9px] text-gray-500 uppercase font-bold select-none pt-2 border-t border-white/5">
                <div>
                  <span className="block text-gray-600 mb-0.5">ACTIVE_THREADS</span>
                  <span className="text-white text-xs">{activeThreads} THREADS</span>
                </div>
                <div>
                  <span className="block text-gray-600 mb-0.5">QUERY_COUNT</span>
                  <span className="text-[#00d1ff] text-xs">{requestCount} REQS</span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-4xl bg-[#090b0c] border border-primary/20 rounded-lg overflow-hidden shadow-2xl flex flex-col h-[550px] font-mono">
        {/* Terminal Header */}
        <div className="bg-[#121518] px-4 py-3 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500/80 cursor-pointer" onClick={onClose}></span>
              <span className="w-3.5 h-3.5 rounded-full bg-yellow-500/80"></span>
              <span className="w-3.5 h-3.5 rounded-full bg-green-500/80"></span>
            </div>
            <span className="text-xs text-gray-400 font-semibold tracking-wider flex items-center gap-1.5 ml-2">
              <Terminal size={14} className="text-primary" />
              TERMINAL - {project.title.toLowerCase()}.git
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* Action Bar */}
        <div className="bg-[#0b0e11] px-4 py-2.5 flex items-center justify-between border-b border-white/5 gap-2 flex-wrap">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("code")}
              className={`px-3 py-1 text-xs rounded transition-all flex items-center gap-1.5 ${
                activeTab === "code"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <FileCode size={13} />
              Code View
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-3 py-1 text-xs rounded transition-all flex items-center gap-1.5 ${
                activeTab === "logs"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Terminal size={13} />
              Terminal Logs
            </button>
            <button
              onClick={() => setActiveTab("output")}
              className={`px-3 py-1 text-xs rounded transition-all flex items-center gap-1.5 ${
                activeTab === "output"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <PlayCircle size={13} />
              Live Output
            </button>
          </div>

          {/* Build actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCompile}
              disabled={isCompiling}
              className={`px-3 py-1 text-xs rounded font-semibold transition-all flex items-center gap-1.5 ${
                isCompiling
                  ? "bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed"
                  : "bg-primary text-white dark:text-black hover:brightness-110 hover:shadow-[0_0_15px_rgba(0,209,255,0.4)]"
              }`}
            >
              {isCompiling ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Play size={13} fill="currentColor" />
              )}
              Run Build
            </button>
          </div>
        </div>

        {/* Main Work Area */}
        <div className="flex-grow flex overflow-hidden">
          {/* File sidebar (Only in Code View) */}
          {activeTab === "code" && (
            <div className="w-52 bg-[#0c0f12] border-r border-white/5 p-2 overflow-y-auto hidden sm:block">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest block px-2 mb-2">
                Files
              </span>
              <div className="flex flex-col gap-1">
                {fileNames.map((fileName) => (
                  <button
                    key={fileName}
                    onClick={() => setSelectedFile(fileName)}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded transition-all truncate flex items-center gap-2 ${
                      selectedFile === fileName
                        ? "bg-white/5 text-primary border-l-2 border-primary"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <FileCode size={14} className={selectedFile === fileName ? "text-primary" : "text-gray-500"} />
                    {fileName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Code/Logs/Output Screen */}
          <div className="flex-grow bg-[#050708] p-4 overflow-auto terminal-scrollbar relative">
            {activeTab === "code" ? (
              <pre className="text-xs text-gray-300 whitespace-pre leading-relaxed select-text font-mono">
                <code>{files[selectedFile] || "// No source files indexed inside this repository."}</code>
              </pre>
            ) : activeTab === "logs" ? (
              <div className="text-xs text-green-400 space-y-1.5 select-text font-mono">
                {terminalLogs.map((log, idx) => (
                  <div key={idx} className={log.startsWith("$") ? "text-white font-semibold" : log.startsWith("[SUCCESS]") ? "text-cyan-400" : log.startsWith("[ERROR]") ? "text-red-400" : "text-green-500/80"}>
                    {log}
                  </div>
                ))}
                {isCompiling && (
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold mt-1">
                    <RefreshCw size={12} className="animate-spin" />
                    Compiling in debug mode...
                  </div>
                )}
                {!isCompiling && (
                  <div className="flex items-center gap-1 mt-1 text-white">
                    <span>$</span>
                    <span className="w-1.5 h-4 bg-green-400 animate-pulse ml-0.5"></span>
                  </div>
                )}
              </div>
            ) : (
              // LIVE SANDBOX INTERACTIVE CONTAINER RENDER
              <div className="w-full h-full min-h-[220px]">
                {renderLiveOutput()}
              </div>
            )}
          </div>
        </div>

        {/* Terminal Footer */}
        <div className="bg-[#121518] px-4 py-2 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-500">
          <span>utf-8</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle size={10} className="text-primary" />
            Environment: Docker/Sandboxed-Linux (React Node20)
          </span>
        </div>
      </div>
    </div>
  );
}
