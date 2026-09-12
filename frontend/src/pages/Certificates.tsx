import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { getCertificatesApi, requestCertificateApi } from "../services/api";
import {
  Award, Shield, CheckCircle2, Download, Eye, XCircle, Printer,
  FileText, Sparkles, ArrowLeft, Search, Filter, ShieldCheck,
  Share2, Check, ExternalLink, Calendar, Send
} from "lucide-react";

interface Certificate {
  id: string;
  userId?: string;
  userEmail?: string;
  studentName: string;
  projectName: string;
  issueDate: string;
  status: "Approved" | "Pending" | "Revoked" | "Not Issued" | "ISSUED" | "PENDING" | string;
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
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestProject, setRequestProject] = useState("");
  const [requestNotes, setRequestNotes] = useState("");

  const printRef = useRef<HTMLDivElement>(null);

  const userEmail = (
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    ""
  ).toLowerCase().trim();

  const allUserEmails = (user?.emailAddresses || [])
    .map((e) => (e.emailAddress || "").toLowerCase().trim())
    .filter(Boolean);
  if (userEmail && !allUserEmails.includes(userEmail)) {
    allUserEmails.push(userEmail);
  }

  // Also support query param email or verify ID
  const queryParams = new URLSearchParams(window.location.search);
  const verifyParam = queryParams.get("verify")?.toLowerCase().trim();
  const urlEmail = queryParams.get("email")?.toLowerCase().trim();
  if (urlEmail && !allUserEmails.includes(urlEmail)) {
    allUserEmails.push(urlEmail);
  }

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.fullName || user?.username || "RecodeX Engineer";

  const fetchCerts = async () => {
    setLoading(true);
    try {
      const serverCerts: any[] = await getCertificatesApi(userEmail || undefined, userId || undefined);
      const localRaw1 = localStorage.getItem("recodex_global_certificates");
      const localRaw2 = localStorage.getItem("recodex_synced_certificates");
      const localCerts1: any[] = localRaw1 ? JSON.parse(localRaw1) : [];
      const localCerts2: any[] = localRaw2 ? JSON.parse(localRaw2) : [];

      // Combine and de-duplicate by ID
      const combinedMap = new Map<string, any>();
      [...serverCerts, ...localCerts1, ...localCerts2].forEach((c) => {
        if (c && (c.id || c.certificateId)) {
          const key = c.id || c.certificateId;
          combinedMap.set(key, c);
        }
      });

      const allList = Array.from(combinedMap.values());

      // STRICT USER PRIVACY FILTER:
      // Only display certificates assigned/uploaded by Admin for THIS authenticated user.
      const userCerts = allList.filter((c: any) => {
        if (!c) return false;
        // Filter out dummy/pending request placeholders
        if (c.id?.startsWith("CERT-REQ-") || c.credentialId?.startsWith("RCX-PEND-")) return false;
        if (["john doe", "alice vance", "sarah connor"].includes((c.studentName || c.recipientName || "").toLowerCase().trim())) return false;
        if (["cert-9402", "cert-1842", "cert-0691"].includes((c.id || "").toLowerCase().trim())) return false;

        const certEmail = (c.userEmail || c.recipientEmail || "").toLowerCase().trim();
        const certUserId = (c.userId || "").trim();

        // Direct verification match via ?verify=
        if (verifyParam && (c.id?.toLowerCase().trim() === verifyParam || c.certificateId?.toLowerCase().trim() === verifyParam)) {
          return true;
        }

        const matchEmail = allUserEmails.length > 0 && certEmail && allUserEmails.includes(certEmail);
        const matchUserId = Boolean(userId && certUserId && certUserId === userId);

        return matchEmail || matchUserId;
      });

      setCertificates(userCerts);
    } catch (err) {
      console.error("Failed to load certificates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchCerts();
    }

    window.addEventListener("recodex-certificates-update", fetchCerts);
    window.addEventListener("storage", fetchCerts);

    return () => {
      window.removeEventListener("recodex-certificates-update", fetchCerts);
      window.removeEventListener("storage", fetchCerts);
    };
  }, [isLoaded, userId, userEmail, fullName, user]);

  const handleCopyLink = (cert: Certificate) => {
    const shareUrl = `${window.location.origin}/certificates?verify=${cert.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(cert.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestProject.trim() || submittingRequest) return;

    setSubmittingRequest(true);
    try {
      await requestCertificateApi({
        studentName: fullName,
        userEmail: userEmail,
        userId: userId || undefined,
        projectName: requestProject.trim(),
        description: requestNotes.trim() || "Certificate request submitted for review.",
        notes: requestNotes.trim(),
      });

      setRequestSuccess(true);
      setTimeout(() => {
        setRequestSuccess(false);
        setRequestModalOpen(false);
        setRequestProject("");
        setRequestNotes("");
      }, 2500);
    } catch (err) {
      console.error("Failed to submit certificate request:", err);
      alert("Failed to submit certificate request. Please try again.");
    } finally {
      setSubmittingRequest(false);
    }
  };

  const filteredCerts = certificates.filter((c) => {
    const matchesSearch =
      c.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.studentName && c.studentName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filterStatus === "ALL") return matchesSearch;
    const isApprovedStatus = c.status === "Approved" || c.status === "ISSUED";
    if (filterStatus === "Approved") return matchesSearch && isApprovedStatus;
    if (filterStatus === "Pending") return matchesSearch && (c.status === "Pending" || c.status === "PENDING");
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
              Official Credentials
            </span>
          </div>
        </div>

        {/* Hero Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-black/10 dark:border-zinc-800/80 mb-8">
          <div>
            <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-widest font-bold mb-2">
              <Award size={16} />
              <span>Official Certificates</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground dark:text-white tracking-tight">
              Assigned Certificates & Documents
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-2xl">
              Authentic certificate files and official credentials uploaded and issued by the administration for your completed projects.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setRequestModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary dark:text-[#00d1ff] border border-primary/30 hover:border-primary/60 font-semibold text-xs tracking-wide transition-all shadow-[0_0_15px_rgba(0,209,255,0.12)] hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer font-sans"
            >
              <Send size={15} />
              Request Certificate from Admin
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
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Loading Certificates...</p>
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="text-center py-20 bg-white/40 dark:bg-zinc-900/40 rounded-2xl border border-dashed border-black/10 dark:border-zinc-800 p-8">
            <Award size={40} className="mx-auto text-zinc-400 dark:text-zinc-600 mb-3 opacity-60" />
            <h3 className="text-base font-bold text-foreground dark:text-white">No Certificates Available</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              You do not have any certificates assigned to your account yet. When the administrator uploads a certificate document for you, it will appear here.
            </p>
            <button
              onClick={() => setRequestModalOpen(true)}
              className="mt-5 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Send size={14} />
              <span>Send Certificate Request Message</span>
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

                    {/* Document Preview Thumbnail if uploaded */}
                    {cert.fileData && (
                      <div 
                        onClick={() => setSelectedCert(cert)}
                        className="mb-4 rounded-xl overflow-hidden border border-black/10 dark:border-zinc-800 bg-black/5 dark:bg-zinc-950 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors group/thumb"
                      >
                        {cert.fileData.toLowerCase().includes(".pdf") || cert.fileType === "application/pdf" || cert.fileData.startsWith("data:application/pdf") ? (
                          <div className="py-4 px-3.5 flex items-center gap-3 w-full bg-red-500/5 hover:bg-red-500/10 transition-colors">
                            <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                              <FileText size={20} />
                            </div>
                            <div className="min-w-0 flex-1 text-left">
                              <div className="text-xs font-mono font-bold text-foreground dark:text-zinc-200 truncate">
                                {cert.fileName || `${cert.projectName}.pdf`}
                              </div>
                              <div className="text-[10px] font-mono text-emerald-500 flex items-center gap-1 font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Verified PDF Document
                              </div>
                            </div>
                            <Eye size={15} className="text-zinc-400 group-hover/thumb:text-primary transition-colors shrink-0" />
                          </div>
                        ) : (
                          <div className="relative w-full h-36 bg-black/20 flex items-center justify-center overflow-hidden">
                            <img
                              src={cert.fileData}
                              alt={cert.projectName}
                              className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="px-2.5 py-1 bg-black/70 text-white rounded-lg text-[10px] font-mono font-bold flex items-center gap-1">
                                <Eye size={12} /> Click to View
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Description / Summary */}
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                      {cert.description || "Official certificate document issued by RecodeX Administration."}
                    </p>

                    {/* Meta Details */}
                    <div className="bg-black/[0.02] dark:bg-zinc-900/50 rounded-xl p-3 border border-black/5 dark:border-zinc-800/60 space-y-1.5 font-mono text-[10px] mb-6">
                      <div className="flex items-center justify-between text-zinc-500">
                        <span>Issued On:</span>
                        <span className="text-foreground dark:text-zinc-300 font-bold">{cert.issueDate}</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-500">
                        <span>Certificate ID:</span>
                        <span className="text-primary font-bold">{cert.credentialId || cert.id}</span>
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
                      View Certificate
                    </button>

                    {cert.fileData && (
                      <a
                        href={cert.fileData}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={cert.fileName || `Certificate_${cert.id}.pdf`}
                        className="p-2 rounded-xl bg-black/5 dark:bg-zinc-900 hover:bg-emerald-500/20 text-zinc-600 dark:text-zinc-300 hover:text-emerald-400 transition-all cursor-pointer"
                        title="Download / Open Certificate File"
                      >
                        <Download size={16} />
                      </a>
                    )}

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

      {/* DETAILED CERTIFICATE DOCUMENT VIEWER MODAL */}
      {selectedCert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-text"
          onClick={() => setSelectedCert(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-[#080b12] text-white border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(0,209,255,0.25)] max-h-[94vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            ref={printRef}
          >
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800 print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-bold">
                  Official Certificate Document
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {selectedCert.fileData && (
                  <a
                    href={selectedCert.fileData}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/30 text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 text-cyan-300 transition-colors cursor-pointer"
                  >
                    <ExternalLink size={13} />
                    <span>Open in Cloudinary</span>
                  </a>
                )}

                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 text-zinc-200 transition-colors cursor-pointer"
                >
                  <Printer size={13} />
                  <span>Print</span>
                </button>

                <button
                  onClick={() => setSelectedCert(null)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <XCircle size={18} />
                </button>
              </div>
            </div>

            {/* REAL CLOUDINARY UPLOADED DOCUMENT VIEW */}
            {selectedCert.fileData ? (
              <div className="mt-6 space-y-4">
                <div className="p-2 sm:p-4 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden flex flex-col items-center justify-center min-h-[420px]">
                  {selectedCert.fileData.toLowerCase().includes(".pdf") || selectedCert.fileType === "application/pdf" || selectedCert.fileData.startsWith("data:application/pdf") ? (
                    <iframe
                      src={selectedCert.fileData}
                      title={`Certificate ${selectedCert.id}`}
                      className="w-full h-[620px] rounded-xl border border-zinc-800 bg-white"
                    />
                  ) : (
                    <div className="w-full flex flex-col items-center">
                      <img
                        src={selectedCert.fileData}
                        alt={`Certificate for ${selectedCert.studentName}`}
                        className="max-h-[640px] w-auto max-w-full rounded-xl object-contain shadow-2xl border border-zinc-800/80"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800 text-xs font-mono">
                  <div className="space-y-0.5 text-left">
                    <p className="text-zinc-400">Recipient: <strong className="text-white">{selectedCert.studentName}</strong> ({selectedCert.userEmail})</p>
                    <p className="text-zinc-500 text-[10px]">Project: {selectedCert.projectName} • Issued on: {selectedCert.issueDate}</p>
                  </div>
                  <a
                    href={selectedCert.fileData}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={selectedCert.fileName || `Certificate_${selectedCert.studentName.replace(/\s+/g, "_")}.pdf`}
                    className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold rounded-xl flex items-center gap-2 uppercase tracking-wider transition-all"
                  >
                    <Download size={14} />
                    <span>Download Official Certificate</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="mt-6 p-8 text-center bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-3">
                <FileText size={36} className="mx-auto text-zinc-500" />
                <h3 className="text-sm font-bold text-white">Official Certificate #{selectedCert.id}</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Certificate issued for <strong>{selectedCert.projectName}</strong>. The uploaded document is being synchronized by the administration.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REQUEST CERTIFICATE MESSAGE TO ADMIN MODAL */}
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
                <Send size={16} />
                <span>Send Certificate Request Message to Admin</span>
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
                <h3 className="text-base font-bold text-foreground dark:text-white">Message Sent to Admin!</h3>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  Your request has been forwarded directly to the Admin Dashboard inquiries. Once the admin verifies and uploads your official certificate document, it will appear in your account.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider font-bold block mb-1.5">
                    Your Name & Email
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${fullName} (${userEmail})`}
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
                    Message to Admin & Project Deliverables / Links *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide your project link, test deliverables, and message to the admin..."
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
                    disabled={submittingRequest}
                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-2"
                  >
                    {submittingRequest ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Send Message to Admin</span>
                      </>
                    )}
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
