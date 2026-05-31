export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  status: "Active" | "Maintenance" | "Beta";
  image: string;
  category: "Web Systems" | "AI & Intelligence" | "Blockchain & Web3" | "Low-Level Shells";
  tags: string[];
  devsCount: number;
  stars: number;
  forks: number;
  files: Record<string, string>; // Files inside mock repo
}

export const MOCK_PROJECTS: Project[] = [
  {
    id: "quantum-flux-core",
    title: "Quantum-Flux Core",
    description: "A high-frequency trading engine optimized for sub-millisecond latency using Rust and specialized memory management.",
    longDescription: "Engineered specifically for financial markets where nanoseconds represent profit, Quantum-Flux Core bypasses traditional garbage collectors using Rust's memory safety compile models. It establishes direct-to-NIC socket connections, uses lock-free queues, and provides WASM bindings for quick browser charts integrations.",
    status: "Active",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80",
    category: "Low-Level Shells",
    tags: ["RUST", "WEBSOCKETS", "WASM"],
    devsCount: 45,
    stars: 2840,
    forks: 341,
    files: {
      "src/main.rs": `use tokio::net::TcpListener;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let mut core = QuantumCore::new();
    println!("[SYS] Initializing lock-free pipelines...");
    core.scale(10_000);
    
    let listener = TcpListener::bind("127.0.0.1:8080").await?;
    println!("[SYS] Active listener listening on port 8080");
    
    loop {
        let (socket, _) = listener.accept().await?;
        tokio::spawn(async move {
            process_trade_feed(socket).await;
        });
    }
}`,
      "src/core.rs": `pub struct QuantumCore {
    buffer: Vec<u8>,
    capacity: usize,
}

impl QuantumCore {
    pub fn new() -> Self {
        Self { buffer: Vec::with_capacity(4096), capacity: 4096 }
    }
    
    pub fn scale(&mut self, nodes: usize) {
        println!("[SCALE] Mounting dynamic buffers to {} cores", nodes);
    }
}`
    }
  },
  {
    id: "apex-glow-analytics",
    title: "Apex-Glow Dashboard",
    description: "A premium real-time charts and data visualization system built with customizable glowing gradients and responsive canvas.",
    longDescription: "Bypass flat analytical libraries. Apex-Glow Dashboard renders high-concurrency client telemetry datasets through a hardware-accelerated HTML5 Canvas grid. Integrates custom cubic Bezier curves, micro-hover interactions, and localized HSL gradient maps to keep data interfaces alive.",
    status: "Active",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
    category: "Web Systems",
    tags: ["REACT", "TAILWIND", "CANVAS"],
    devsCount: 38,
    stars: 1980,
    forks: 245,
    files: {
      "ApexChart.tsx": `import React, { useEffect, useRef } from "react";

export const ApexChart = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#00d1ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(10, 150);
    ctx.bezierCurveTo(100, 10, 200, 290, 300, 50);
    ctx.stroke();
  }, []);

  return <canvas ref={canvasRef} width={400} height={200} />;
};`
    }
  },
  {
    id: "nebula-arch",
    title: "Nebula Arch",
    description: "Next-gen microservices orchestration platform designed for seamless scaling across multi-cloud environments.",
    longDescription: "Bypass complex cloud dashboards. Nebula Arch coordinates distributed server networks, providing automated mesh networking, localized DNS resolutions, and zero-downtime rolling updates. Styled with gRPC support for ultra-low payload serialization speeds.",
    status: "Active",
    image: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=600&q=80",
    category: "Web Systems",
    tags: ["GO", "KUBERNETES", "GRPC"],
    devsCount: 92,
    stars: 1720,
    forks: 189,
    files: {
      "main.go": `package main

import (
	"context"
	"log"
	"net"
	"google.golang.org/grpc"
)

type server struct {
	UnimplementedNebulaServiceServer
}

func main() {
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	s := grpc.NewServer()
	RegisterNebulaServiceServer(s, &server{})
	log.Println("[INFO] Nebula Arch gRPC listening on :50051")
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}`
    }
  },
  {
    id: "vortex-3d-particle",
    title: "Vortex Particle Sandbox",
    description: "A hardware-accelerated 2D/3D physics sandbox rendering thousands of fluid particle matrices in real-time.",
    longDescription: "A glorious interactive particle sandbox designed for visual excellence. Spawns thousands of high-speed glowing particles following dynamic gravitational nodes. Powered by requestAnimationFrame pipelines and custom math formulas to simulate celestial motion.",
    status: "Beta",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=600&q=80",
    category: "Web Systems",
    tags: ["JAVASCRIPT", "CANVAS", "MATH"],
    devsCount: 19,
    stars: 1205,
    forks: 110,
    files: {
      "VortexSandbox.js": `// Fluid particle engine constructor
class FluidNode {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;
  }
  
  update(gravityX, gravityY) {
    let dx = gravityX - this.x;
    let dy = gravityY - this.y;
    let dist = Math.sqrt(dx*dx + dy*dy) || 1;
    this.vx += (dx / dist) * 0.15;
    this.vy += (dy / dist) * 0.15;
    this.x += this.vx;
    this.y += this.vy;
  }
}`
    }
  },
  {
    id: "neural-sift",
    title: "Neural Sift",
    description: "AI-driven vulnerability detection tool that scans millions of lines of code in seconds using custom LLM weights.",
    longDescription: "Combining static analysis with machine intelligence, Neural Sift points out zero-days, logic flaws, and credential leaks inside your pipelines before deployment. It hooks into GitHub actions, parses AST structures, and explains security remediation steps in plain English.",
    status: "Active",
    image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=600&q=80",
    category: "AI & Intelligence",
    tags: ["PYTHON", "PYTORCH", "C++"],
    devsCount: 31,
    stars: 4310,
    forks: 512,
    files: {
      "sift.py": `import torch
import warnings
from transformers import AutoModelForCausalLM, AutoTokenizer

class NeuralSifter:
    def __init__(self, model_path="devmarket/neural-sift-7b"):
        print("[AI] Loading AI vulnerability models...")
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.model = AutoModelForCausalLM.from_pretrained(model_path)

    def scan_code(self, source_code: str):
        inputs = self.tokenizer(f"Scan code for exploits:\\n{source_code}", return_tensors="pt")
        outputs = self.model.generate(**inputs, max_length=200)
        return self.tokenizer.decode(outputs[0], skip_special_tokens=True)
`
    }
  },
  {
    id: "titan-shell",
    title: "Titan Shell",
    description: "A custom Linux shell environment focused on extreme security and terminal productivity for power users.",
    longDescription: "Titan Shell acts as a sandboxed terminal interface, automatically encrypting logs, blocking dangerous command overrides, and tracking user memory leaks. Packed with visual utilities to speed up shell navigation.",
    status: "Maintenance",
    image: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=600&q=80",
    category: "Low-Level Shells",
    tags: ["C", "LINUX", "ZSH"],
    devsCount: 14,
    stars: 940,
    forks: 82,
    files: {
      "titan.c": `#include <stdio.h>
#include <unistd.h>
#include <string.h>

int main(int argc, char **argv) {
    char input[1024];
    printf("[TITAN] Sandboxed terminal initialized.\\n");
    while(1) {
        printf("titan $ ");
        if (!fgets(input, 1024, stdin)) break;
        input[strcspn(input, "\\n")] = 0;
        if (strcmp(input, "exit") == 0) break;
        
        // Custom security filtering
        if (strstr(input, "rm -rf /")) {
            printf("[BLOCK] Crucial payload execution prevented!\\n");
        } else {
            system(input);
        }
    }
    return 0;
}`
    }
  },
  {
    id: "lumina-ui",
    title: "Lumina UI Elements",
    description: "A premium glassmorphic UI design system and micro-interaction sandbox built for absolute visual accessibility.",
    longDescription: "The absolute frontend system. Responsive Tailwind configurations, fluid interactive sliders, smooth Framer Motion routes, and strict ADA compliant keyboard focus bindings to make your web screens sing.",
    status: "Active",
    image: "https://images.unsplash.com/photo-1586717799252-bd134ad00e26?auto=format&fit=crop&w=600&q=80",
    category: "Web Systems",
    tags: ["TYPESCRIPT", "TAILWIND", "REACT"],
    devsCount: 58,
    stars: 3105,
    forks: 410,
    files: {
      "LuminaButton.tsx": `import React, { useState } from "react";

export const LuminaButton = () => {
  const [clickCount, setClickCount] = useState(0);
  return (
    <button
      onClick={() => setClickCount(c => c + 1)}
      className="px-6 py-2.5 bg-primary text-black font-mono font-bold rounded-lg shadow-lg hover:shadow-primary/30 transition-all active:scale-95"
    >
      CLICK FEEDBACK: {clickCount}
    </button>
  );
};`
    }
  },
  {
    id: "chain-prism",
    title: "Chain Prism",
    description: "A secure, decentralized identity protocol featuring zero-knowledge proofs for enterprise privacy.",
    longDescription: "Secure user profiles without storing passwords or emails on centralized hardware. Chain Prism creates encrypted cryptographic hashes, verifying age, nationality, or credential assets through Circom zero-knowledge math circuits.",
    status: "Beta",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=600&q=80",
    category: "Blockchain & Web3",
    tags: ["SOLIDITY", "CIRCOM", "ETHERJS"],
    devsCount: 22,
    stars: 810,
    forks: 94,
    files: {
      "PrismIdentity.sol": `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PrismIdentity {
    mapping(address => bytes32) public identityProofs;
    
    event ProofRegistered(address indexed user, bytes32 proof);

    function registerProof(bytes32 _zkProof) external {
        identityProofs[msg.sender] = _zkProof;
        emit ProofRegistered(msg.sender, _zkProof);
    }
}`
    }
  }
];

export const ECOSYSTEMS = [
  {
    id: "web-systems",
    title: "Web Systems",
    count: "2,450+",
    activeDevs: "Active Devs",
    bullets: [
      "High-scale React/Next.js architectures",
      "Complex Node/Go backend systems",
      "Performance & Core Web Vitals audit"
    ],
    color: "primary",
    borderColor: "border-l-primary/50",
    bgIcon: "language",
    devCount: 2450
  },
  {
    id: "ai-intelligence",
    title: "AI & Intelligence",
    count: "840+",
    activeDevs: "Active Devs",
    bullets: [
      "LLM fine-tuning & integration",
      "Computer Vision & Signal Processing",
      "Data Engineering & MLOps pipelines"
    ],
    color: "error",
    borderColor: "border-l-error/50",
    bgIcon: "psychology",
    devCount: 840
  },
  {
    id: "blockchain-web3",
    title: "Blockchain & Web3",
    count: "520+",
    activeDevs: "Active Devs",
    bullets: [
      "Smart Contract security audits",
      "L1/L2 Protocol development",
      "DeFi & NFT ecosystem architecture"
    ],
    color: "outline",
    borderColor: "border-l-gray-400/50",
    bgIcon: "currency_bitcoin",
    devCount: 520
  }
];
