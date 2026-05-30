import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const projectsToSeed = [
  {
    id: "quantum-flux-core",
    title: "Quantum-Flux Core",
    description: "A high-frequency trading engine optimized for sub-millisecond latency using Rust and specialized memory management.",
    longDescription: "Engineered specifically for financial markets where nanoseconds represent profit, Quantum-Flux Core bypasses traditional garbage collectors using Rust's memory safety compile models. It establishes direct-to-NIC socket connections, uses lock-free queues, and provides WASM bindings for quick browser charts integrations.",
    status: "Active",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDC74dtLRZ4AhBIqPMG9il9UoLwodr2gs9tcRhNoI8bguSo5g94ueedWm4dpUPrDPh-UxPJYMaY8Qb-dSxourWjS1yvBOH1e8RPLsyB461yG3oGPhsFf9HH9AcfykAdN5cgR3SygzZE4c7ExlFgYhjUelkk55e5RVT7h8aRgK1CB-McNJ8u5osF8XZs7Ef7AUaW1mDsulXYQcCEaV9iDJSSqrG31OpbsMofLX6-bPd124rFQlhWt6zxfVSHe9KUau2xZU6igs3OUpHA",
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
    id: "nebula-arch",
    title: "Nebula Arch",
    description: "Next-gen microservices orchestration platform designed for seamless scaling across multi-cloud environments.",
    longDescription: "Bypass complex cloud dashboards. Nebula Arch coordinates distributed server networks, providing automated mesh networking, localized DNS resolutions, and zero-downtime rolling updates. Styled with gRPC support for ultra-low payload serialization speeds.",
    status: "Active",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBqPIdtfo2t7xA4ZTGcEdeq4L9ZNnEOWw4B0eB_QRD2jeq210iVyJJ1nUGJbAEdP13ctu4BnV89ZA66eEr5wM8SaW5Oc-fdBNZzGGGgMEdwJ8pCoxuuxeOVcxUGJbPsalq-_bKSiDIG-AkfDT7O_FYkv6KnXtj0o5VD-BJ9sNMAlK19kLi8eNEsPR6GozRRvUoDnTjwIgMxRYtVuka7thRgOU1nVIlGksBcT9AwCD6M_VYEWUET6Qiplg1BA5LiD8vLPPYWqK0Lib_z",
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
    id: "neural-sift",
    title: "Neural Sift",
    description: "AI-driven vulnerability detection tool that scans millions of lines of code in seconds using custom LLM weights.",
    longDescription: "Combining static analysis with machine intelligence, Neural Sift points out zero-days, logic flaws, and credential leaks inside your pipelines before deployment. It hooks into GitHub actions, parses AST structures, and explains security remediation steps in plain English.",
    status: "Active",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCZbdA8CghNSTvzADwydKaCjL0OSCNrv6bnhflH7ESi-Wez34kiFBug-v1SvvV1wHqkcR3p9kIZTSE5LxEqlyxNfTFQdYH4QydJipFZyKFCpez8gjBy59P-xcMGs9BHY6b5D6Neoebn0iH6EwpnK_HZvaBjB8-L-fi4QHtIU6UhevC-DmecN6cJaqJgS_bHcP12BrHzKtoCprIVe1mC4HAdEETMQFSjlyxJ6BT4a5qtdUeGMoLA-qalHDbqVRF3fmzkuvkA89IwhS2w",
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
        return self.tokenizer.decode(outputs[0], skip_special_tokens=True)`
    }
  },
  {
    id: "titan-shell",
    title: "Titan Shell",
    description: "A custom Linux shell environment focused on extreme security and terminal productivity for power users.",
    longDescription: "Titan Shell acts as a sandboxed terminal interface, automatically encrypting logs, blocking dangerous command overrides, and tracking user memory leaks. Packed with visual utilities to speed up shell navigation.",
    status: "Maintenance",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAFTL4LVReMdP0p323JZAtw0PqD7DknanMOq8827KLDQaH9CA9oG1cuR6MN2Ld6fkUzcUD4jpUvUTz4zD4uqsYfKT7qQ-qdu7_eF38zeX2FO2J3YHKT7rGf_VuKfOEJusGKxcp5fH0IzquC0AMqStQ-UkGjBzsXpyoFD0LybOB4A5dvbXagxerZ6rb9DzB4PqsrcTxJ1Q4QaS07bGHXflehBvvjAgULLSpuMl4dDwD-YoAxTWKblTxeauppwjoEcAlGK6srBEqmPqjJ",
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
    title: "Lumina UI",
    description: "A design system and component library built with accessibility and motion at its core.",
    longDescription: "The absolute frontend system. Responsive Tailwind configurations, fluid interactive sliders, smooth Framer Motion routes, and strict ADA compliant keyboard focus bindings to make your web screens sing.",
    status: "Active",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBeKXyILHBGh-XVsYeyqPUo0t9ste7oP4Bx6dE7OEAebKrMyxE10VjYr28UWY08uoIsW4F_oOjXvDX9Hj1lpcbUqgpuF8WXiigdbhdfYM-JIq7_THtvNmS0FsFICK-NMEGprHHYk4jlgktfsM3iDOEYsV5czSAH_9TS43Qz76DmPn3CAFcmuD7C9Ar83J9j7Fl6R8lPlFzCRhOb0cGxs84cMfGEP4fM6M-qShaLdtk_1J7Vzpu3UAlWGPsPUTRJQbe6iSaii8zl0OWH",
    category: "Web Systems",
    tags: ["TYPESCRIPT", "TAILWIND", "FRAMER"],
    devsCount: 58,
    stars: 3105,
    forks: 410,
    files: {
      "LuminaButton.tsx": `"use client";

import React from "react";
import { motion } from "framer-motion";

export const LuminaButton = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="px-6 py-2.5 bg-primary text-black font-semibold rounded-md shadow-lg transition-shadow duration-200"
    >
      {children}
    </motion.button>
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
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDHAdbOPkGoNAIW47Wgd4vUErhzvQd66tv20rFqWZ2QWm71aEkX1puuwdumHfeqxaYx158ggVPFzfod8LT-OZOdwilS6tKYc2vZE-tmFF7B_xsEPt3WV26eDRmpTNu-LFStfrMsFNQaK1qf8Hu-Urrhph2oY-Gqe5ESNrELpJbPdZMHas_01oMVdvqBk98lJxiDAXi8h-Abd1_oB9Vf3ykJtCsxg3PzmaXxU2kfO3Nyf-RvJ1DDBNLPKVE0jmsfw75SMoIQ3o-sDk9A",
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

    function verifyIdentity(address _user, bytes32 _challenge) external view returns (bool) {
        return identityProofs[_user] == _challenge;
    }
}`
    }
  }
];

async function main() {
  console.log("Starting database seed script...");

  // Clear existing items to avoid duplicates
  await prisma.projectDev.deleteMany({});
  await prisma.project.deleteMany({});

  console.log("Cleared old projects.");

  for (const item of projectsToSeed) {
    const project = await prisma.project.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        title: item.title,
        description: item.description,
        longDescription: item.longDescription,
        status: item.status,
        imageUrl: item.imageUrl,
        category: item.category,
        tags: item.tags,
        devsCount: item.devsCount,
        stars: item.stars,
        forks: item.forks,
        files: item.files as any,
      },
    });
    console.log(`Seeded project: ${project.title}`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
