import React, { useState } from "react";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { 
  MapPin, 
  Mail, 
  MessageSquare, 
  Send, 
  Globe, 
  ChevronDown, 
  CheckCircle2, 
  Play 
} from "lucide-react";
import { submitInquiry } from "@/services/api";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    type: "",
    message: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Accordion state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await submitInquiry(formData);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit message to database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqData = [
    {
      question: "How do I verify my developer credentials?",
      answer: "We integrate with your GitHub profile, verify past contributions, review code audits, and perform technical assessments to certify credentials."
    },
    {
      question: "What is the average turnaround for custom stacks?",
      answer: "For standard low-latency systems or custom pipelines, turnaround averages 2-4 weeks from formal consultation to secure handoff."
    },
    {
      question: "Do you offer enterprise-level SLAs?",
      answer: "Yes, we offer guaranteed uptime, prioritized patch response schedules, secure escrow integrations, and dedicated SLA contracts for enterprises."
    }
  ];

  return (
    <>

      <main className="flex-grow pt-20 pb-16 bg-grid-layout bg-background text-foreground relative min-h-screen">
        
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          
          {/* Header Section */}
          <div className="text-center mb-16 pt-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-[#00171f]/50 text-primary text-[10px] font-mono uppercase tracking-widest font-semibold backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse mr-0.5"></span>
              CONNECT WITH ENGINEERING
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-none">
              Get in touch.
            </h1>
            
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Whether you&apos;re looking to hire top-tier talent or have questions about our marketplace stack, our team is here to help you scale.
            </p>
          </div>

          {/* Form & Sidebar split */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
            
            {/* Left Column: Form Card */}
            <div className="md:col-span-7 bg-white dark:bg-[#050505] border border-zinc-200 dark:border-white/5 p-8 rounded-xl shadow-xl dark:shadow-2xl relative">
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs font-mono font-bold uppercase tracking-wider">
                      {error}
                    </div>
                  )}
                  
                  {/* Name & Email side-by-side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Full Name"
                      className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/5 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-primary/50 transition-all font-sans"
                    />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Email Address"
                      className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/5 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-primary/50 transition-all font-sans"
                    />
                  </div>

                  {/* Inquiry Dropdown */}
                  <div className="relative">
                    <select
                      value={formData.type}
                      required
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/5 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-primary/50 transition-all font-sans appearance-none"
                    >
                      <option value="" disabled>Select a Project Tier / Inquiry Type</option>
                      <option value="mini">Mini Projects</option>
                      <option value="major">Major Projects</option>
                      <option value="frontend">Frontend Projects</option>
                      <option value="spec-build">Idea Your Project Build by Us</option>
                      <option value="concept-asset">Product & Idea Both From Us</option>
                      <option value="others">Others</option>
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-zinc-400 dark:text-gray-400">
                      <ChevronDown size={16} />
                    </div>
                  </div>

                  {/* Message field */}
                  <div className="space-y-1.5">
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="How can we help you?"
                      className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/5 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-primary/50 transition-all font-sans resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-primary text-white dark:text-black font-semibold rounded-lg text-sm flex items-center justify-center gap-2 hover:brightness-110 hover:shadow-[0_0_25px_rgba(0,209,255,0.4)] transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  >
                    Send Message
                    <Play size={10} className="fill-white dark:fill-black stroke-none ml-0.5" />
                  </button>
                  
                </form>
              ) : (
                <div className="text-center py-10 space-y-6">
                  <CheckCircle2 size={48} className="text-primary mx-auto animate-pulse" />
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Transmission Delivered</h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                      Thank you. We have registered your inquiry details and our engineering lead will connect with you shortly.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({ name: "", email: "", type: "", message: "" });
                      setError(null);
                    }}
                    className="px-6 py-2 border border-zinc-200 dark:border-white/10 rounded-lg text-xs font-semibold text-zinc-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-mono cursor-pointer"
                  >
                    NEW TRANSMISSION
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Sidebar Contacts */}
            <div className="md:col-span-5 space-y-8 pl-0 md:pl-6">
              
              {/* Offices Section */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-sans">
                  Our Offices
                </h3>
                
                <div className="space-y-6">
                  {/* SF Office */}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-500 dark:text-gray-400 shrink-0">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">San Francisco</h4>
                      <p className="text-xs text-zinc-600 dark:text-gray-400 mt-1 leading-normal font-sans">
                        123 Market St, Suite 455<br />
                        San Francisco, CA 94106
                      </p>
                    </div>
                  </div>
                  
                  {/* London Office */}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-500 dark:text-gray-400 shrink-0">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">London</h4>
                      <p className="text-xs text-zinc-600 dark:text-gray-400 mt-1 leading-normal font-sans">
                        88 Kingsway, Holborn<br />
                        London WC2B 6AA, UK
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Contact Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-sans">
                  Direct Contact
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-500 dark:text-gray-400 shrink-0">
                    <Mail size={18} />
                  </div>
                  <a 
                    href="mailto:hello@recodex.dev" 
                    className="text-sm font-semibold text-zinc-700 dark:text-gray-300 hover:text-primary transition-colors font-sans"
                  >
                    hello@recodex.dev
                  </a>
                </div>
              </div>

              {/* Network / Social links */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-sans">
                  Network
                </h3>
                <div className="flex gap-3">
                  <a 
                    href="https://discord.com" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="w-10 h-10 rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-500 dark:text-gray-400 hover:text-primary hover:border-primary/30 transition-all"
                  >
                    <MessageSquare size={18} />
                  </a>
                  <a 
                    href="mailto:hello@recodex.dev" 
                    className="w-10 h-10 rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-500 dark:text-gray-400 hover:text-primary hover:border-primary/30 transition-all"
                  >
                    <Send size={18} />
                  </a>
                  <a 
                    href="https://github.com" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="w-10 h-10 rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-500 dark:text-gray-400 hover:text-primary hover:border-primary/30 transition-all"
                  >
                    <Globe size={18} />
                  </a>
                </div>
              </div>

            </div>

          </div>

          {/* FAQ Accordion Section */}
          <div className="mt-28">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white text-center mb-10">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-4 max-w-2xl mx-auto">
              {faqData.map((faq, index) => {
                const isOpen = activeFaq === index;
                return (
                  <div 
                    key={index} 
                    onClick={() => toggleFaq(index)}
                    className="border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#050505]/40 backdrop-blur-md px-6 py-4 rounded-xl cursor-pointer hover:border-zinc-300 dark:hover:border-white/10 transition-all select-none shadow-sm dark:shadow-none"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-sans">
                        {faq.question}
                      </h4>
                      <ChevronDown 
                        size={16} 
                        className={`text-gray-500 shrink-0 transition-transform duration-300 ${
                          isOpen ? "rotate-180 text-primary" : ""
                        }`} 
                      />
                    </div>
                    
                    {isOpen && (
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-3 leading-relaxed border-t border-zinc-100 dark:border-white/5 pt-3 font-sans transition-all duration-300">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* World Map Section at the bottom */}
          <div className="mt-28 border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#050505] rounded-xl overflow-hidden shadow-xl dark:shadow-2xl relative p-4">
            
            {/* World Map SVG Layout */}
            <div className="w-full aspect-[2.2/1] relative flex items-center justify-center bg-zinc-50 dark:bg-[#020202]">
              <svg 
                viewBox="0 0 1000 450" 
                className="w-full h-full opacity-35 dark:opacity-30 pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Simplified high-tech polygon shapes for world continents */}
                {/* North America */}
                <polygon points="120,80 280,70 330,120 280,180 200,210 180,170 120,130" className="fill-zinc-200 dark:fill-[#141414] stroke-zinc-300 dark:stroke-[#222222]" strokeWidth="1" />
                {/* South America */}
                <polygon points="260,220 340,240 370,300 340,380 290,410 270,330 250,260" className="fill-zinc-200 dark:fill-[#141414] stroke-zinc-300 dark:stroke-[#222222]" strokeWidth="1" />
                {/* Europe */}
                <polygon points="460,90 580,75 600,120 540,160 480,140" className="fill-zinc-200 dark:fill-[#141414] stroke-zinc-300 dark:stroke-[#222222]" strokeWidth="1" />
                {/* Africa */}
                <polygon points="480,170 580,180 620,240 600,320 560,350 510,290 470,230" className="fill-zinc-200 dark:fill-[#141414] stroke-zinc-300 dark:stroke-[#222222]" strokeWidth="1" />
                {/* Asia */}
                <polygon points="600,80 880,90 910,180 840,250 780,260 700,200 600,140" className="fill-zinc-200 dark:fill-[#141414] stroke-zinc-300 dark:stroke-[#222222]" strokeWidth="1" />
                {/* Australia */}
                <polygon points="800,290 890,300 870,360 810,350" className="fill-zinc-200 dark:fill-[#141414] stroke-zinc-300 dark:stroke-[#222222]" strokeWidth="1" />

                {/* Arced network connections with animation attributes */}
                {/* SF to London */}
                <path d="M 210 140 Q 360 80 500 110" fill="transparent" className="stroke-primary animate-[dash_20s_linear_infinite]" strokeWidth="1.5" strokeDasharray="5,5" opacity="0.8" />
                {/* SF to Tokyo */}
                <path d="M 210 140 Q 510 60 830 140" fill="transparent" className="stroke-primary" strokeWidth="1.2" opacity="0.6" />
                {/* London to Tokyo */}
                <path d="M 500 110 Q 665 80 830 140" fill="transparent" className="stroke-primary" strokeWidth="1" opacity="0.5" />
                {/* London to Singapore */}
                <path d="M 500 110 Q 630 180 760 230" fill="transparent" className="stroke-primary" strokeWidth="1.2" strokeDasharray="4,4" opacity="0.7" />
                {/* Singapore to Sydney */}
                <path d="M 760 230 Q 810 280 850 320" fill="transparent" className="stroke-primary" opacity="0.8" />
                {/* SF to Sao Paulo */}
                <path d="M 210 140 Q 285 220 320 280" fill="transparent" className="stroke-primary" strokeWidth="1" opacity="0.4" />
                
                {/* Active Hub coordinate pulsing highlights */}
                {/* SF */}
                <circle cx="210" cy="140" r="4" className="fill-primary" />
                <circle cx="210" cy="140" r="10" fill="transparent" className="stroke-primary animate-[ping_2s_infinite]" strokeWidth="1.5" opacity="0.8" />
                
                {/* London */}
                <circle cx="500" cy="110" r="4" className="fill-primary" />
                <circle cx="500" cy="110" r="10" fill="transparent" className="stroke-primary animate-[ping_2.5s_infinite]" strokeWidth="1.5" opacity="0.8" />

                {/* Sao Paulo */}
                <circle cx="320" cy="280" r="3" className="fill-primary" opacity="0.7" />

                {/* Tokyo */}
                <circle cx="830" cy="140" r="4" className="fill-primary" />
                <circle cx="830" cy="140" r="10" fill="transparent" className="stroke-primary animate-[ping_2.2s_infinite]" strokeWidth="1.5" opacity="0.8" />

                {/* Singapore */}
                <circle cx="760" cy="230" r="4" className="fill-primary" />
                
                {/* Sydney */}
                <circle cx="850" cy="320" r="4" className="fill-primary" />
                <circle cx="850" cy="320" r="8" fill="transparent" className="stroke-primary animate-[ping_3s_infinite]" strokeWidth="1" opacity="0.8" />
              </svg>

              {/* Floating Map availability badge */}
              <div className="absolute bottom-6 left-6 z-10">
                <div className="flex items-center gap-2 font-mono text-[9px] text-primary bg-white/95 dark:bg-[#020709]/90 border border-primary/20 rounded-full px-3 py-1.5 tracking-widest font-semibold uppercase backdrop-blur-md shadow-lg shadow-primary/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                  GLOBAL AVAILABILITY: 24/7/365
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
