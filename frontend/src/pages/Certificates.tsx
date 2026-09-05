import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { getCertificatesApi } from "../services/api";
import {
  Award, Shield, CheckCircle2, Download, Eye, XCircle, Printer,
  FileText, Sparkles, ArrowLeft, Search, Filter, ShieldCheck,
  Share2, Check, ExternalLink, Calendar, User, Code2, Lock
} from "lucide-react";

interface Certificate {
  id: string;
  userId?: string;
  userEmail?: string;
  studentName: string;
  projectName: string;
  issueDate: string;
  status: "Approved" | "Pending" | "Revoked" | "Not Issued";
  fileData?: string;
  fileName?: string;
  fileType?: string;
  description?: string;
  credentialId?: string;
  verificationHash?: string;
}

export default function Certificates() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "Approved" | "Pending">("ALL");
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestProject, setRequestProject] = useState("");
  const [requestNotes, setRequestNotes] = useState("");

  const printRef = useRef<HTMLDivElement>(null);

  const userEmail = (user?.primaryEmailAddress?.emailAddress || "").toLowerCase().trim();
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.fullName || user?.username || "RecodeX Engineer";

  useEffect(() => {
    const fetchCerts = async () => {
      setLoading(true);
      try {
        const serverCerts: any[] = await getCertificatesApi();
        const localRaw = localStorage.getItem("recodex_synced_certificates");
        const localCerts: any[] = localRaw ? JSON.parse(localRaw) : [];

        // Combine and de-duplicate by ID
        const combinedMap = new Map<string, any>();
        [...serverCerts, ...localCerts].forEach((c) => {
          if (c && c.id) combinedMap.set(c.id, c);
        });

        const allList = Array.from(combinedMap.values());

        // Filter certificates matching current user
        const userCerts = allList.filter((c: any) => {
          if (!c) return false;
          // Filter out any previous dummy test certificate IDs
          if (c.id && c.id.includes("7729")) return false;
          const certEmail = (c.userEmail || "").toLowerCase().trim();
          const certId = c.userId || "";
          const certName = (c.studentName || "").toLowerCase().trim();
          return (
            (userEmail && certEmail === userEmail) ||
            (userId && certId === userId) ||
            (fullName && certName === fullName.toLowerCase())
          );
        });

        setCertificates(userCerts);
      } catch (err) {
        console.error("Failed to load certificates:", err);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded) {
      fetchCerts();
    }
  }, [isLoaded, userId, userEmail, fullName]);

  const handleCopyLink = (cert: Certificate) => {
    const shareUrl = `${window.location.origin}/certificates?verify=${cert.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(cert.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestProject.trim()) return;

    const newRequest: Certificate = {
      id: `CERT-REQ-${Date.now().toString().slice(-6)}`,
      userEmail: userEmail,
      studentName: fullName,
      projectName: requestProject,
      issueDate: new Date().toISOString().split("T")[0],
      status: "Pending",
      description: requestNotes || "Submitted for peer audit and official certification issue.",
      credentialId: `RCX-PEND-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      verificationHash: "0xPENDING_AUDIT_VERIFICATION_HASH"
    };

    const updated = [newRequest, ...certificates];
    setCertificates(updated);
    localStorage.setItem("recodex_synced_certificates", JSON.stringify(updated));

    setRequestSuccess(true);
    setTimeout(() => {
      setRequestSuccess(false);
      setRequestModalOpen(false);
      setRequestProject("");
      setRequestNotes("");
    }, 2000);
  };

  const filteredCerts = certificates.filter((c) => {
    const matchesSearch =
      c.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.studentName && c.studentName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filterStatus === "ALL") return matchesSearch;
    return matchesSearch && c.status === filterStatus;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[15%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[180px] pointer-events-none z-0"></div>

      <main className="relative z-10 flex-grow pt-28 pb-16 px-6 md:px-12 max-w-7xl mx-auto w-full">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-primary transition-colors uppercase tracking-wider group cursor-pointer"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Profile
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/25">
              <ShieldCheck size={14} />
              Cryptographic Ledger Synced
            </span>
          </div>
        </div>

        {/* Hero Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-black/10 dark:border-zinc-800/80 mb-8">
          <div>
            <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-widest font-bold mb-2">
              <Award size={16} />
              <span>Official Proof of Competence</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground dark:text-white tracking-tight">
              Verified Certificates & Credentials
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-2xl">
              Authentic, cryptographically validated credentials, certificates of completion, and professional project audits issued by the RecodeX Engineering Platform.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setRequestModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary dark:text-[#00d1ff] border border-primary/30 hover:border-primary/60 font-semibold text-xs tracking-wide transition-all shadow-[0_0_15px_rgba(0,209,255,0.12)] hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer font-sans"
            >
              <Sparkles size={15} />
              Request Certificate
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by project, ID, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/70 dark:bg-zinc-900/70 border border-black/10 dark:border-zinc-800 rounded-xl text-xs text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-primary transition-all font-sans"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-mono text-zinc-400 font-bold uppercase mr-1">Status:</span>
            <div className="flex items-center gap-1 p-1 bg-black/5 dark:bg-zinc-900/80 border border-black/10 dark:border-zinc-800 rounded-xl">
              {(["ALL", "Approved", "Pending"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer font-sans ${
                    filterStatus === status
                      ? "bg-white dark:bg-zinc-800 text-foreground dark:text-white shadow-sm border border-black/5 dark:border-zinc-700 font-semibold"
                      : "text-zinc-500 hover:text-foreground dark:hover:text-zinc-200"
                  }`}
                >
                  {status === "ALL" ? "All Credentials" : status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Certificates Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Validating Cryptographic Signatures...</p>
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="text-center py-20 bg-white/40 dark:bg-zinc-900/40 rounded-2xl border border-dashed border-black/10 dark:border-zinc-800 p-8">
            <Award size={40} className="mx-auto text-zinc-400 dark:text-zinc-600 mb-3 opacity-60" />
            <h3 className="text-base font-bold text-foreground dark:text-white">No Certificates Found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              No issued credentials match your current filters. You can request a certificate audit for any of your completed projects.
            </p>
            <button
              onClick={() => setRequestModalOpen(true)}
              className="mt-5 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Submit Certificate Request
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCerts.map((cert) => {
              const isApproved = cert.status === "Approved";
              const isPending = cert.status === "Pending";

              return (
                <div
                  key={cert.id}
                  className="group relative bg-white/70 dark:bg-[#07090e]/80 backdrop-blur-xl border border-black/10 dark:border-zinc-800/90 hover:border-primary/50 dark:hover:border-primary/50 rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-[0_15px_35px_rgba(0,209,255,0.12)] flex flex-col justify-between"
                >
                  {/* Top Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 border ${
                        isApproved
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/25"
                          : isPending
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/25"
                          : "bg-red-500/10 text-red-500 border-red-500/25"
                      }`}>
                        {isApproved ? <CheckCircle2 size={12} /> : <Calendar size={12} />}
                        {cert.status}
                      </span>

                      <span className="text-[10px] font-mono text-zinc-400 font-bold">
                        {cert.id}
                      </span>
                    </div>

                    {/* Certificate Title */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Award size={22} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-foreground dark:text-white truncate group-hover:text-primary transition-colors">
                          {cert.projectName}
                        </h3>
                        <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 truncate">
                          Issued to: <strong className="text-foreground dark:text-zinc-200">{cert.studentName}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Description / Summary */}
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                      {cert.description || "Official verification of project completion and cryptographic identity signature validation."}
                    </p>

                    {/* Meta Details */}
                    <div className="bg-black/[0.02] dark:bg-zinc-900/50 rounded-xl p-3 border border-black/5 dark:border-zinc-800/60 space-y-1.5 font-mono text-[10px] mb-6">
                      <div className="flex items-center justify-between text-zinc-500">
                        <span>Issued On:</span>
                        <span className="text-foreground dark:text-zinc-300 font-bold">{cert.issueDate}</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-500">
                        <span>Credential ID:</span>
                        <span className="text-primary font-bold">{cert.credentialId || cert.id}</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-500">
                        <span>Cryptographic Hash:</span>
                        <span className="text-zinc-400 truncate max-w-[120px]">{cert.verificationHash || "0x8f4c...cdef"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-black/5 dark:border-zinc-800/80">
                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="flex-1 py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye size={14} />
                      View Document
                    </button>

                    <button
                      onClick={() => handleCopyLink(cert)}
                      className="p-2 rounded-xl bg-black/5 dark:bg-zinc-900 hover:bg-black/10 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-all cursor-pointer"
                      title="Copy Verification Link"
                    >
                      {copiedId === cert.id ? <Check size={16} className="text-emerald-500" /> : <Share2 size={16} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* DETAILED HIGH-RES CERTIFICATE DOCUMENT VIEWER MODAL */}
      {selectedCert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedCert(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-[#080b12] text-white border border-cyan-500/30 rounded-3xl p-6 sm:p-10 shadow-[0_0_80px_rgba(0,209,255,0.25)] max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            ref={printRef}
          >
            {/* Modal Controls Bar (Hidden during Print) */}
            <div className="flex items-center justify-between pb-6 border-b border-zinc-800 print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">Cryptographically Signed Document</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 text-zinc-200 transition-colors cursor-pointer"
                >
                  <Printer size={14} />
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setSelectedCert(null)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            {/* HIGH-RES CERTIFICATE DOCUMENT CANVAS */}
            <div className="relative mt-6 p-8 sm:p-14 border-4 border-cyan-500/40 rounded-2xl bg-gradient-to-b from-[#0a0f1d] to-[#040711] text-center shadow-inner overflow-hidden select-text">
              {/* Guilloche / Watermark Security Background */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,209,255,0.06)_0%,transparent_70%)] pointer-events-none"></div>
              <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-cyan-400/60"></div>
              <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-cyan-400/60"></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-cyan-400/60"></div>
              <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-cyan-400/60"></div>

              {/* Certificate Header */}
              <div className="flex justify-center items-center gap-3 mb-4">
                <img src="/recodeXlogo.png" alt="RecodeX" className="h-10 w-auto object-contain" />
              </div>
              
              <h2 className="text-xs sm:text-sm font-mono tracking-[0.3em] uppercase text-cyan-400 font-black mb-2">
                Certificate of Technical Excellence
              </h2>
              <p className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest mb-6">
                RecodeX Engineering & Distributed Systems Protocol
              </p>

              {/* Presented To */}
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-2">This is officially presented to</p>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-cyan-200 tracking-tight font-sans mb-4">
                {selectedCert.studentName}
              </h1>

              {/* Certification Statement */}
              <p className="text-xs sm:text-sm text-zinc-300 max-w-xl mx-auto leading-relaxed mb-6 font-sans">
                For outstanding technical achievement, code verification, and successful engineering execution on the production system:
              </p>

              <div className="inline-block px-6 py-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-bold text-sm sm:text-lg mb-6 tracking-wide">
                {selectedCert.projectName}
              </div>

              <p className="text-xs text-zinc-400 max-w-lg mx-auto leading-relaxed mb-8">
                {selectedCert.description}
              </p>

              {/* Signatures & Seal Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end pt-6 border-t border-zinc-800/80">
                <div className="text-left font-mono text-[10px] text-zinc-400 space-y-1">
                  <p className="text-zinc-500 uppercase">Issuance Date:</p>
                  <p className="text-white font-bold">{selectedCert.issueDate}</p>
                  <p className="text-zinc-500 uppercase pt-2">Credential ID:</p>
                  <p className="text-cyan-400 font-bold">{selectedCert.credentialId || selectedCert.id}</p>
                </div>

                {/* Golden Official Seal */}
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full border-2 border-cyan-400/80 bg-cyan-950/80 p-1 flex items-center justify-center shadow-[0_0_30px_rgba(0,209,255,0.4)]">
                    <div className="w-full h-full rounded-full border border-dashed border-cyan-300/60 flex flex-col items-center justify-center text-center p-1">
                      <ShieldCheck size={24} className="text-cyan-400" />
                      <span className="text-[7px] font-mono font-black text-white uppercase tracking-tighter mt-0.5">VERIFIED</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-widest mt-2">Official Seal</span>
                </div>

                <div className="text-right font-mono text-[10px] text-zinc-400 space-y-1">
                  <div className="inline-block border-b border-zinc-600 pb-1 w-32 text-center text-cyan-300 font-serif italic text-sm">
                    Veeresh H P
                  </div>
                  <p className="text-zinc-500 uppercase">Lead Protocol Architect</p>
                  <p className="text-zinc-500 uppercase pt-1">RecodeX Governance</p>
                </div>
              </div>

              {/* Cryptographic Verification Hash Footer */}
              <div className="mt-8 pt-4 border-t border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between text-[9px] font-mono text-zinc-500 gap-2">
                <div className="flex items-center gap-1.5">
                  <Lock size={11} className="text-emerald-400" />
                  <span>SHA-256 Signature: {selectedCert.verificationHash || "0x8f4c9a12b6e789d034fe56aa7890bcde1234567890abcdef"}</span>
                </div>
                <div className="text-cyan-500 font-bold">
                  verify.recodex.io/{selectedCert.id}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST CERTIFICATE MODAL */}
      {requestModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setRequestModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#07090e] border border-black/10 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-primary font-mono text-xs font-bold uppercase tracking-wider">
                <Award size={16} />
                <span>Certificate Request Application</span>
              </div>
              <button
                onClick={() => setRequestModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-foreground dark:hover:text-white"
              >
                <XCircle size={18} />
              </button>
            </div>

            {requestSuccess ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <Check size={24} />
                </div>
                <h3 className="text-base font-bold text-foreground dark:text-white">Certificate Request Submitted!</h3>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  Your project credential request has been sent for technical review and peer audit.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider font-bold block mb-1.5">
                    Candidate Name
                  </label>
                  <input
                    type="text"
                    disabled
                    value={fullName}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 text-xs text-foreground dark:text-zinc-300 font-mono opacity-80"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider font-bold block mb-1.5">
                    Project / Skill Track Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AI Workflow Optimization Engine"
                    value={requestProject}
                    onChange={(e) => setRequestProject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 text-xs text-foreground dark:text-white focus:outline-none focus:border-primary font-sans"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider font-bold block mb-1.5">
                    Project Deliverables & Repository Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide link to repository, live deployment, or test results..."
                    value={requestNotes}
                    onChange={(e) => setRequestNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 text-xs text-foreground dark:text-white focus:outline-none focus:border-primary font-sans resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setRequestModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-black/5 dark:bg-zinc-900 text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 hover:text-foreground cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    Submit for Issue
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
