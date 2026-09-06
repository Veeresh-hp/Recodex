import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { getInquiries, getInquiryById, deleteInquiry } from "../services/api";
import {
  MessageSquare, ShieldCheck, Clock, CheckCircle2, ArrowLeft,
  Search, Filter, Plus, Send, AlertCircle, ChevronRight,
  User, Check, Sparkles, RefreshCw, HelpCircle, FileText, Trash2,
  Share2, ExternalLink, Copy
} from "lucide-react";

interface Inquiry {
  id: string;
  ticketId?: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  createdAt: string;
  reply?: string;
  repliedAt?: string;
  status?: "Pending" | "In Review" | "Resolved";
  category?: string;
  priority?: "Normal" | "High" | "Critical";
}

const renderFormattedInquiryMessage = (msg: string) => {
  if (!msg) return null;

  if (msg.includes("[CERTIFICATE REQUEST]")) {
    const projectMatch = msg.match(/Project:\s*["']?([^"'\.]+)["']?/i);
    const notesMatch = msg.match(/Deliverables\s*(?:\/\s*Message to Admin)?:\s*(.*?)(?=\.\s*User:|$)/is);
    const userMatch = msg.match(/User:\s*(.*?)(?=\.|$)/is);

    const project = projectMatch ? projectMatch[1].trim() : "";
    const notes = notesMatch ? notesMatch[1].trim() : "";
    const user = userMatch ? userMatch[1].trim() : "";

    return (
      <div className="space-y-3 select-text">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 uppercase tracking-wider">
          📜 Certificate Issuance Application
        </div>

        {project && (
          <div className="p-3 bg-black/5 dark:bg-zinc-900/60 rounded-xl border border-black/5 dark:border-zinc-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block">Requested Project / Track:</span>
            <span className="text-sm font-bold text-foreground dark:text-white font-sans">{project}</span>
          </div>
        )}

        {notes && (
          <div className="p-3 bg-black/5 dark:bg-zinc-900/60 rounded-xl border border-black/5 dark:border-zinc-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block">Candidate Message & Deliverables:</span>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 font-sans leading-relaxed whitespace-pre-wrap">{notes}</p>
          </div>
        )}

        {user && (
          <div className="p-2.5 bg-black/5 dark:bg-zinc-900/40 rounded-lg border border-black/5 dark:border-zinc-800 text-[11px] font-mono text-zinc-500 flex items-center justify-between">
            <span>Candidate Identification:</span>
            <span className="text-foreground dark:text-zinc-200 font-bold">{user}</span>
          </div>
        )}
      </div>
    );
  }

  // Regular messages: split sentences / paragraphs for clean alignment
  const paragraphs = msg.split(/\n+/).filter(Boolean);
  return (
    <div className="space-y-2.5 select-text">
      {paragraphs.map((para, i) => (
        <p key={i} className="text-xs text-zinc-700 dark:text-zinc-300 font-sans leading-relaxed">
          {para}
        </p>
      ))}
    </div>
  );
};

export default function Queries() {
  const { id: queryParamId } = useParams();
  const { isLoaded, userId, getToken } = useAuth();
  const { user } = useUser();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(queryParamId || "");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Pending" | "Resolved">("ALL");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New ticket state
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("Technical Support");
  const [ticketPriority, setTicketPriority] = useState<"Normal" | "High" | "Critical">("Normal");
  const [ticketMessage, setTicketMessage] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const userEmail = (user?.primaryEmailAddress?.emailAddress || "").toLowerCase().trim();
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.fullName || user?.username || "RecodeX Member";

  const fetchUserInquiries = async () => {
    setLoading(true);
    try {
      // Clean previous invalid test query from local cache
      try {
        const rawLocal = localStorage.getItem("recodex_submitted_inquiries");
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal).filter((i: any) => 
            i.id !== "inq-1787642424751" && (i.message || "").trim() !== "sdsadas"
          );
          localStorage.setItem("recodex_submitted_inquiries", JSON.stringify(parsed));
        }

        const rawDeleted = localStorage.getItem("recodex_deleted_inquiries");
        const deletedList: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
        if (!deletedList.includes("inq-1787642424751")) {
          deletedList.push("inq-1787642424751");
          localStorage.setItem("recodex_deleted_inquiries", JSON.stringify(deletedList));
        }
      } catch (e) {}

      const all: any[] = await getInquiries("", userEmail);
      const localRepliesRaw = localStorage.getItem("recodex_inquiry_replies");
      const repliesMap = localRepliesRaw ? JSON.parse(localRepliesRaw) : {};

      const localStatusesRaw = localStorage.getItem("recodex_inquiry_statuses");
      const statusesMap = localStatusesRaw ? JSON.parse(localStatusesRaw) : {};

      const localInquiriesRaw = localStorage.getItem("recodex_submitted_inquiries");
      const localInquiries: any[] = localInquiriesRaw ? JSON.parse(localInquiriesRaw) : [];

      const map = new Map<string, any>();

      const processItem = (inq: any) => {
        if (!inq) return;
        if (inq.id === "inq-1787642424751" || (inq.message || "").trim() === "sdsadas") return;
        if (inq.subject === "Account Onboarding & Security Clearance") return;

        const inqId = inq.ticketId || inq.id || "";
        const inqEmail = (inq.email || "").toLowerCase().trim();
        const inqMsg = (inq.message || "").trim();
        const emailMsgKey = `${inqEmail}-${inqMsg}`;
        const key = inqId || emailMsgKey;

        const existing = map.get(key) || (inqId ? map.get(inqId) : undefined) || map.get(emailMsgKey) ||
          Array.from(map.values()).find((x: any) =>
            (x.ticketId && inq.ticketId && x.ticketId === inq.ticketId) ||
            (x.id && inq.id && x.id === inq.id) ||
            (x.email && inqEmail && x.email.toLowerCase().trim() === inqEmail && x.message && inqMsg && x.message.trim() === inqMsg)
          );

        const r = inq.reply || existing?.reply || repliesMap[inqId] || repliesMap[key] || repliesMap[emailMsgKey] || (inq.ticketId ? repliesMap[inq.ticketId] : undefined);
        const isResolved =
          (existing?.status || "").toLowerCase() === "resolved" ||
          (inq.status || "").toLowerCase() === "resolved" ||
          (statusesMap[inqId] || "").toLowerCase() === "resolved" ||
          (statusesMap[key] || "").toLowerCase() === "resolved" ||
          !!r;
        const finalStatus: "Resolved" | "Pending" = isResolved ? "Resolved" : "Pending";

        const normalized = {
          ...existing,
          ...inq,
          id: inqId || existing?.id || key,
          ticketId: inq.ticketId || existing?.ticketId || inqId || key,
          reply: r || undefined,
          status: finalStatus,
          category: inq.category || existing?.category || "Technical Query",
          priority: inq.priority || existing?.priority || "Normal",
          createdAt: inq.createdAt || existing?.createdAt || inq.timestamp || new Date().toISOString(),
        };

        map.set(key, normalized);
        map.set(emailMsgKey, normalized);
        if (inqId) map.set(inqId, normalized);
      };

      all.forEach(processItem);
      localInquiries.forEach(processItem);

      // Return unique inquiries for this user
      const uniqueList: any[] = [];
      const seenIds = new Set<string>();

      const clerkEmails = (user?.emailAddresses || []).map((e) => e.emailAddress.toLowerCase().trim());
      if (userEmail && !clerkEmails.includes(userEmail)) {
        clerkEmails.push(userEmail);
      }

      Array.from(map.values()).forEach((item) => {
        const itemEmail = (item.email || "").toLowerCase().trim();
        const matchesUser =
          clerkEmails.length === 0 ||
          clerkEmails.includes(itemEmail) ||
          (userEmail && itemEmail === userEmail);

        if (matchesUser) {
          const uniqueKey = item.ticketId || item.id || `${item.email}-${item.message}`;
          if (!seenIds.has(uniqueKey)) {
            seenIds.add(uniqueKey);
            uniqueList.push(item);
          }
        }
      });

      // If direct ticket ID is requested via URL (/queries/:id), load and prioritize it
      if (queryParamId) {
        try {
          const directMatch = await getInquiryById(queryParamId);
          if (directMatch) {
            processItem(directMatch);
            const uKey = directMatch.ticketId || directMatch.id;
            const existingIdx = uniqueList.findIndex((x) => x.id === uKey || x.ticketId === uKey);
            if (existingIdx >= 0) {
              uniqueList.splice(existingIdx, 1);
            }
            uniqueList.unshift(directMatch);
          }
        } catch (dirErr) {
          console.warn("Direct ticket lookup error:", dirErr);
        }
      }

      uniqueList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      setInquiries(uniqueList);
    } catch (e) {
      console.warn("Failed to load inquiries:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTicket = async (id: string) => {
    try {
      const token = await getToken();
      await deleteInquiry(id, token || "");
      const updated = inquiries.filter((i) => i.id !== id && i.ticketId !== id);
      setInquiries(updated);
    } catch (e) {
      console.warn("Failed to delete ticket:", e);
      const updated = inquiries.filter((i) => i.id !== id && i.ticketId !== id);
      setInquiries(updated);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchUserInquiries();
    }
    const handleSync = () => fetchUserInquiries();
    window.addEventListener("recodex-inquiry-replied", handleSync);
    window.addEventListener("recodex-inquiry-status-updated", handleSync);
    window.addEventListener("recodex-inquiry-submitted", handleSync);
    window.addEventListener("recodex-inquiry-deleted", handleSync);
    return () => {
      window.removeEventListener("recodex-inquiry-replied", handleSync);
      window.removeEventListener("recodex-inquiry-status-updated", handleSync);
      window.removeEventListener("recodex-inquiry-submitted", handleSync);
      window.removeEventListener("recodex-inquiry-deleted", handleSync);
    };
  }, [isLoaded, userEmail, queryParamId]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    setSubmitting(true);
    const newInquiry: Inquiry = {
      id: `TKT-${Date.now().toString().slice(-6)}`,
      name: fullName,
      email: userEmail,
      subject: ticketSubject,
      message: ticketMessage,
      category: ticketCategory,
      priority: ticketPriority,
      createdAt: new Date().toISOString(),
      status: "Pending"
    };

    const updated = [newInquiry, ...inquiries];
    setInquiries(updated);

    // Persist to localStorage
    const localRaw = localStorage.getItem("recodex_submitted_inquiries");
    const localList: any[] = localRaw ? JSON.parse(localRaw) : [];
    localStorage.setItem("recodex_submitted_inquiries", JSON.stringify([newInquiry, ...localList]));
    window.dispatchEvent(new Event("recodex-inquiry-submitted"));

    setSubmitting(false);
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setNewTicketModalOpen(false);
      setTicketSubject("");
      setTicketMessage("");
    }, 2000);
  };

  const filteredInquiries = inquiries.filter((inq) => {
    const matchesSearch =
      (inq.subject && inq.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      inq.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "ALL") return matchesSearch;
    return matchesSearch && (inq.status || "Pending") === statusFilter;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[15%] left-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[180px] pointer-events-none z-0"></div>

      <main className="relative z-10 flex-grow pt-28 pb-16 px-6 md:px-12 max-w-7xl mx-auto w-full">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-primary transition-colors uppercase tracking-wider group cursor-pointer"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Profile
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/25">
              <ShieldCheck size={14} />
              24/7 SLA Support Desk
            </span>
          </div>
        </div>

        {/* Hero Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-black/10 dark:border-zinc-800/80 mb-8">
          <div>
            <div className="flex items-center gap-2 text-amber-500 font-mono text-xs uppercase tracking-widest font-bold mb-2">
              <MessageSquare size={16} />
              <span>Direct Support Telemetry</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground dark:text-white tracking-tight">
              Support Queries & Resolution
            </h1>
            <p className="text-zinc-500 text-sm mt-2 max-w-xl">
              Track your service inquiries, support tickets, and direct verified admin resolutions in real-time.
            </p>
          </div>

          <button
            onClick={() => setNewTicketModalOpen(true)}
            className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>Open Support Query</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket ID, subject, or message..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/50 dark:bg-zinc-900/50 border border-black/10 dark:border-zinc-800 focus:outline-none focus:border-amber-500 text-xs font-mono transition-all"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <div className="bg-black/5 dark:bg-zinc-900/80 p-1 rounded-xl border border-black/5 dark:border-zinc-800 flex items-center gap-1">
              {(["ALL", "Pending", "Resolved"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    statusFilter === status
                      ? status === "Resolved"
                        ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 shadow-sm"
                        : status === "Pending"
                        ? "bg-amber-500/15 text-amber-500 border border-amber-500/30 shadow-sm"
                        : "bg-white dark:bg-zinc-800 text-foreground dark:text-white shadow-sm border border-black/5 dark:border-zinc-700"
                      : "text-zinc-500 hover:text-foreground dark:hover:text-zinc-200"
                  }`}
                >
                  {status === "ALL" ? "All Inquiries" : status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Direct Query Focus Banner when accessing /queries/:id */}
        {queryParamId && (
          <div className="mb-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in shadow-[0_0_25px_rgba(0,209,255,0.1)]">
            <div className="flex items-center gap-2.5 text-cyan-400 text-xs font-mono">
              <Sparkles size={16} className="shrink-0 animate-pulse text-cyan-400" />
              <span>Viewing Direct Ticket: <strong className="text-foreground dark:text-white underline">{queryParamId}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const directUrl = `${window.location.origin}/queries/${queryParamId}`;
                  navigator.clipboard.writeText(directUrl);
                  setCopiedId(queryParamId);
                  setTimeout(() => setCopiedId(null), 2500);
                }}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-cyan-500/30"
              >
                {copiedId === queryParamId ? (
                  <>
                    <Check size={13} className="text-emerald-400" />
                    <span className="text-emerald-400">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={13} />
                    <span>Copy Ticket URL</span>
                  </>
                )}
              </button>
              <Link
                to="/queries"
                onClick={() => setSearchQuery("")}
                className="px-3 py-1.5 rounded-lg bg-black/10 hover:bg-black/20 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-mono font-bold text-zinc-600 dark:text-zinc-300 transition-all border border-black/5 dark:border-zinc-700"
              >
                View All Queries
              </Link>
            </div>
          </div>
        )}

        {/* Tickets Stream */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/40 dark:bg-zinc-900/40 rounded-2xl border border-black/5 dark:border-zinc-800">
            <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Loading Support Tickets...</p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="text-center py-20 bg-white/40 dark:bg-zinc-900/40 rounded-2xl border border-dashed border-black/10 dark:border-zinc-800 p-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
              <MessageSquare size={22} />
            </div>
            <h3 className="text-base font-bold text-foreground dark:text-white">No Tickets Found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              You haven't opened any support queries matching this filter. Need assistance? Submit a direct ticket to our team.
            </p>
            <button
              onClick={() => setNewTicketModalOpen(true)}
              className="mt-5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
            >
              <Plus size={14} />
              <span>Open New Query</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredInquiries.map((inq) => {
              const isResolved = (inq.status || "").toLowerCase() === "resolved" || !!inq.reply;

              return (
                <div
                  key={inq.id}
                  className={`bg-white/80 dark:bg-[#090d14] backdrop-blur-xl border rounded-2xl overflow-hidden transition-all duration-200 shadow-sm ${
                    isResolved
                      ? "border-emerald-500/30 hover:border-emerald-500/50 shadow-[0_4px_20px_rgba(16,185,129,0.05)]"
                      : "border-amber-500/30 hover:border-amber-500/50 shadow-[0_4px_20px_rgba(245,158,11,0.05)]"
                  }`}
                >
                  {/* Professional Ticket Header Bar */}
                  <div className="px-6 py-4 bg-black/[0.02] dark:bg-zinc-900/60 border-b border-black/5 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider border ${
                        isResolved
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                      }`}>
                        {isResolved ? (
                          <>
                            <CheckCircle2 size={13} className="text-emerald-500" />
                            Resolved & Closed
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                            In Review / Open
                          </>
                        )}
                      </span>

                      <span className="px-2.5 py-1 rounded-md bg-black/5 dark:bg-zinc-800/80 border border-black/5 dark:border-zinc-700 text-[11px] font-mono font-semibold text-zinc-600 dark:text-zinc-300">
                        {inq.category || "Support Inquiry"}
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-zinc-500 font-semibold">
                          ID: <span className="text-foreground dark:text-zinc-200 font-bold">{inq.ticketId || inq.id}</span>
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const tid = inq.ticketId || inq.id;
                            const directUrl = `${window.location.origin}/queries/${tid}`;
                            navigator.clipboard.writeText(directUrl);
                            setCopiedId(tid);
                            setTimeout(() => setCopiedId(null), 2500);
                          }}
                          className="p-1 rounded text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                          title="Copy direct ticket URL (https://www.recodex.in/queries/...)"
                        >
                          {copiedId === (inq.ticketId || inq.id) ? (
                            <Check size={13} className="text-emerald-400" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                        <Link
                          to={`/queries/${inq.ticketId || inq.id}`}
                          className="p-1 rounded text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                          title="Open dedicated ticket view"
                        >
                          <ExternalLink size={13} />
                        </Link>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          const tid = inq.ticketId || inq.id;
                          const directUrl = `${window.location.origin}/queries/${tid}`;
                          navigator.clipboard.writeText(directUrl);
                          setCopiedId(tid);
                          setTimeout(() => setCopiedId(null), 2500);
                        }}
                        className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/5 dark:bg-zinc-800 text-[11px] font-mono text-zinc-400 hover:text-cyan-400 border border-black/5 dark:border-zinc-700 transition-colors cursor-pointer"
                        title="Share Ticket Link"
                      >
                        {copiedId === (inq.ticketId || inq.id) ? (
                          <>
                            <Check size={12} className="text-emerald-400" />
                            <span className="text-emerald-400">Link Copied!</span>
                          </>
                        ) : (
                          <>
                            <Share2 size={12} />
                            <span>Share</span>
                          </>
                        )}
                      </button>
                      <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-500">
                        <Clock size={13} />
                        <span>
                          {inq.createdAt && !isNaN(new Date(inq.createdAt).getTime())
                            ? new Date(inq.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })
                            : "Recently Submitted"}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteTicket(inq.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Ticket Record"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-6">
                    {/* User Inquiry Details Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-1.5">
                          <User size={13} className="text-cyan-500" />
                          Inquiry Submission Details
                        </span>
                        {inq.subject && (
                          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            {inq.subject}
                          </span>
                        )}
                      </div>

                      <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-zinc-900/40 border border-black/5 dark:border-zinc-800/80">
                        {renderFormattedInquiryMessage(inq.message)}
                      </div>
                    </div>

                    {/* Official Admin Resolution Response Section */}
                    {inq.reply ? (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.03] dark:bg-emerald-950/10 overflow-hidden">
                        <div className="px-4 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-emerald-500" />
                            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                              Official Admin Resolution
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-600/80 dark:text-emerald-400/80 font-semibold">
                            Verified Desk Reply
                          </span>
                        </div>
                        <div className="p-4 space-y-2">
                          <p className="text-xs md:text-sm text-foreground dark:text-zinc-100 font-sans leading-relaxed whitespace-pre-wrap">
                            {inq.reply}
                          </p>
                          <div className="pt-2 border-t border-emerald-500/15 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 size={12} />
                              Resolution Delivered & Synchronized
                            </span>
                            <span>Case Closed</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3 text-xs">
                        <Clock size={16} className="text-amber-500 mt-0.5 shrink-0 animate-spin" />
                        <div className="space-y-1">
                          <p className="font-mono font-bold text-amber-500 uppercase tracking-wide text-[11px]">
                            Ticket In Active SLA Review
                          </p>
                          <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
                            Our team is reviewing your query. You will receive the verified resolution here as soon as an administrator responds.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* NEW TICKET MODAL */}
      {newTicketModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setNewTicketModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#07090e] border border-black/10 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-amber-500 font-mono text-xs font-bold uppercase tracking-wider">
                <MessageSquare size={16} />
                <span>Open New Support Ticket</span>
              </div>
              <button
                onClick={() => setNewTicketModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-foreground dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {submitSuccess ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <Check size={24} />
                </div>
                <h3 className="text-base font-bold text-foreground dark:text-white">Ticket Created Successfully!</h3>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  Your inquiry has been logged and assigned to our active engineering team.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider font-bold block mb-1.5">
                      Category
                    </label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 text-xs text-foreground dark:text-white focus:outline-none focus:border-amber-500 font-sans"
                    >
                      <option value="Technical Support">Technical Support</option>
                      <option value="Custom Development">Custom Development</option>
                      <option value="Deployment & Hosting">Deployment & Hosting</option>
                      <option value="Billing & Invoicing">Billing & Invoicing</option>
                      <option value="Certificate Verification">Certificate Verification</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider font-bold block mb-1.5">
                      Priority
                    </label>
                    <select
                      value={ticketPriority}
                      onChange={(e) => setTicketPriority(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 text-xs text-foreground dark:text-white focus:outline-none focus:border-amber-500 font-sans"
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider font-bold block mb-1.5">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Brief summary of your inquiry..."
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 text-xs text-foreground dark:text-white focus:outline-none focus:border-amber-500 font-sans"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider font-bold block mb-1.5">
                    Detailed Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Explain the issue or requirement in detail..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 text-xs text-foreground dark:text-white focus:outline-none focus:border-amber-500 font-sans resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setNewTicketModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-black/5 dark:bg-zinc-900 text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 hover:text-foreground cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs font-mono uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Sending..." : "Submit Ticket"}
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
