import React from "react";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Cpu, Code, Server, Shield, Sparkles, Layers } from "lucide-react";

export default function Services() {
  const serviceDecks = [
    {
      icon: <Code className="text-primary" size={28} />,
      title: "Mini Projects",
      description: "Quick, modular, and robust single-purpose application nodes, custom micro-utilities, or focused scripts built to perform specific tasks.",
      features: ["Rapid prototyping turnaround", "Clean, modular, and reusable structure", "Full source code ownership"]
    },
    {
      icon: <Server className="text-primary" size={28} />,
      title: "Major Projects",
      description: "High-concurrency full-stack platforms, low-latency database engines, microservice networks, and enterprise system architectures built for scale.",
      features: ["Scalable distributed architectures", "Secure end-to-end user authentication", "Full deployment pipeline configurations"]
    },
    {
      icon: <Cpu className="text-primary" size={28} />,
      title: "Frontend Projects",
      description: "Pixel-perfect, visually premium, and highly responsive user interfaces packed with modern typography, smooth animations, and high-performance Web Vitals.",
      features: ["Harmonious design systems (HSL tailored)", "Sleek custom canvas graphics & animations", "Highly responsive layout grids"]
    },
    {
      icon: <Sparkles className="text-primary" size={28} />,
      title: "Idea Your Project Build by Us",
      description: "Bring your product concept, wireframe notes, or specification documents, and our elite engineering teams will translate your idea into a production-ready, fully verified architecture.",
      features: ["Comprehensive spec audits", "Custom user flow & data modeling", "Full architectural implementation"]
    },
    {
      icon: <Layers className="text-primary" size={28} />,
      title: "Product & Idea Both From Us",
      description: "Stuck in the conceptual phase? We will design the complete product idea, compile market features research, build the designs, and construct the entire application end-to-end.",
      features: ["Product strategy & research", "Full UI/UX interactive wireframes", "End-to-end design & development"]
    }
  ];

  return (
    <>

      <main className="flex-grow pt-24 pb-16 bg-grid-layout relative min-h-screen">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          
          {/* Page Title */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground font-sans">
              Developer Solutions & Services
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-2">
              High-performance architectural services tailored to your technical requirements.
            </p>
          </div>

          {/* Grid Layout (3 columns on large screens for pristine 5-element card layout) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {serviceDecks.map((service, index) => (
              <div
                key={index}
                className="glass-card p-8 rounded-xl flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300 shadow-md"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{service.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed min-h-[60px]">{service.description}</p>
                  
                  <hr className="border-black/5 dark:border-white/5 my-4" />
                  
                  <ul className="space-y-2 text-xs font-mono text-gray-400">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-glow-cyan"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-6 mt-6 border-t border-black/5 dark:border-white/5 font-mono text-[9px] font-bold">
                  <span className="text-primary uppercase tracking-wider">
                    For Price: Contact Developers
                  </span>
                  <Link
                    to="/contact"
                    className="px-3.5 py-1.5 bg-primary/10 border border-primary/20 hover:bg-primary hover:text-black text-primary rounded uppercase tracking-widest transition-all text-center select-none"
                  >
                    CONTACT_US
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Enterprise SLA Section */}
          <div className="glass-card p-8 rounded-2xl max-w-4xl mx-auto border border-primary/15 relative overflow-hidden bg-zinc-950/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
              <div className="space-y-4 md:w-2/3">
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold font-mono uppercase text-primary tracking-wider">
                  Enterprise SLA
                </div>
                <h3 className="text-2xl font-bold text-foreground">Need Custom Team Allocations?</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  We build cross-functional architectural engineering squads. Equipped with technical managers, senior dev leads, and security auditors, we deliver enterprise assets on guaranteed service schedules.
                </p>
              </div>
              <div className="md:w-1/3 w-full flex justify-center md:justify-end">
                <Link
                  to="/contact"
                  className="px-6 py-3 bg-primary text-black font-semibold rounded-md hover:brightness-110 hover:shadow-[0_0_20px_rgba(0,209,255,0.4)] transition-all active:scale-95 text-sm"
                >
                  Request Consultation
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
