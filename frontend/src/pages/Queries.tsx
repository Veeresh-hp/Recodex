import React, { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import {
  getQueriesApi,
  getQueryDetailsApi,
  createQueryApi,
  sendQueryMessageApi,
  updateQueryStatusApi,
  deleteInquiry,
  clearAllInquiriesApi,
  QueryItem,
  QueryMessageItem,
} from "../services/api";
import { subscribeToQuery, RealtimeMessage, RealtimeStatusChange } from "../services/realtime";
import {
  MessageSquare, ShieldCheck, Clock, CheckCircle2, ArrowLeft,
  Search, Filter, Plus, Send, AlertCircle, ChevronRight,
  User, Check, Sparkles, RefreshCw, HelpCircle, FileText, Trash2,
  Share2, ExternalLink, Copy, Lock, MessageCircle
} from "lucide-react";

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
  const [inquiries, setInquiries] = useState<QueryItem[]>([]);
  const [messagesMap, setMessagesMap] = useState<Record<string, QueryMessageItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(queryParamId || "");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Pending" | "Resolved">("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Per-ticket customer reply text state
  const [customerReplies, setCustomerReplies] = useState<Record<string, string>>({});
  const [sendingReplies, setSendingReplies] = useState<Record<string, boolean>>({});
  const [reopeningTickets, setReopeningTickets] = useState<Record<string, boolean>>({});

  // New ticket modal state
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("Technical Support");
  const [ticketPriority, setTicketPriority] = useState<"Normal" | "High" | "Critical">("Normal");
  const [ticketMessage, setTicketMessage] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const userEmail = (user?.primaryEmailAddress?.emailAddress || "").toLowerCase().trim();
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.fullName || user?.username || "RecodeX Member";

  const fetchUserInquiries = async () => {
    try {
      const token = await getToken();
      const queries = await getQueriesApi(token || undefined);
      if (Array.isArray(queries)) {
        setInquiries(queries);
        if (queries.length === 0) {
          try {
            localStorage.removeItem("recodex_submitted_inquiries");
            localStorage.removeItem("recodex_inquiry_replies");
            localStorage.removeItem("recodex_inquiry_statuses");
            localStorage.removeItem("recodex_deleted_inquiries");
          } catch (e) {}
          setMessagesMap({});
        }
      }

      // Eagerly pre-load conversation messages for each query
      queries.forEach(async (q) => {
        const qId = q.ticketId || q.id;
        try {
          const details = await getQueryDetailsApi(qId, token || undefined);
          if (details && details.messages) {
            setMessagesMap((prev) => ({
              ...prev,
              [qId]: details.messages,
            }));
          }
        } catch (e) {}
      });
    } catch (e) {
      console.warn("[QUERIES] Failed to load queries:", e);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and periodic safety polling
  useEffect(() => {
    if (isLoaded) {
      fetchUserInquiries();
      // Periodic background polling fallback (every 8s) to ensure absolute sync with database
      const pollInterval = setInterval(() => {
        fetchUserInquiries();
      }, 8000);
      return () => clearInterval(pollInterval);
    }
  }, [isLoaded, userEmail, queryParamId]);

  // Realtime subscription for all active inquiries
  useEffect(() => {
    if (inquiries.length === 0) return;

    const unsubscribers: (() => void)[] = [];

    inquiries.forEach((inq) => {
      const qKey = inq.ticketId || inq.id;
      const unsub = subscribeToQuery(qKey, {
        onMessage: (newMsg: RealtimeMessage) => {
          console.log(`[REALTIME CUSTOMER] Received new message for ${qKey}:`, newMsg);

          // Update messages thread for this ticket
          setMessagesMap((prev) => {
            const existing = prev[qKey] || [];
            if (existing.some((m) => m.id === newMsg.id || (m.createdAt === newMsg.createdAt && m.message === newMsg.message))) {
              return prev;
            }
            return {
              ...prev,
              [qKey]: [...existing, newMsg],
            };
          });

          // Also update parent inquiry reply preview and status
          setInquiries((prev) =>
            prev.map((item) => {
              if (item.ticketId === qKey || item.id === qKey) {
                return {
                  ...item,
                  reply: newMsg.senderRole === "ADMIN" ? newMsg.message : item.reply,
                  updatedAt: newMsg.createdAt,
                };
              }
              return item;
            })
          );
        },
        onStatusChange: (statusData: RealtimeStatusChange) => {
          console.log(`[REALTIME CUSTOMER] Received status change for ${qKey}:`, statusData);
          if (statusData.status === "CLEARED") {
            setInquiries([]);
            setMessagesMap({});
            return;
          }
          if (statusData.status === "DELETED") {
            setInquiries((prev) => prev.filter((item) => item.ticketId !== qKey && item.id !== qKey));
            return;
          }
          setInquiries((prev) =>
            prev.map((item) => {
              if (item.ticketId === qKey || item.id === qKey) {
                return {
                  ...item,
                  status: statusData.status,
                  resolvedAt: statusData.resolvedAt || item.resolvedAt,
                };
              }
              return item;
            })
          );
        },
      });

      unsubscribers.push(unsub);
    });

    return () => {
      unsubscribers.forEach((fn) => fn());
    };
  }, [inquiries]);

  // Handle customer sending reply to administrator
  const handleSendCustomerReply = async (inq: QueryItem) => {
    const qKey = inq.ticketId || inq.id;
    const text = (customerReplies[qKey] || "").trim();
    if (!text) return;

    setSendingReplies((prev) => ({ ...prev, [qKey]: true }));
    try {
      const token = await getToken();
      const userEmail = user?.primaryEmailAddress?.emailAddress || inq.email;
      const res = await sendQueryMessageApi(qKey, text, false, token || undefined, userEmail);

      // Optimistically append customer message
      if (res && res.message) {
        setMessagesMap((prev) => {
          const current = prev[qKey] || [];
          if (current.some((m) => m.id === res.message.id)) return prev;
          return {
            ...prev,
            [qKey]: [...current, res.message],
          };
        });
      }

      // Clear input
      setCustomerReplies((prev) => ({ ...prev, [qKey]: "" }));
    } catch (err: any) {
      console.error("Failed to send customer message:", err);
      alert(err.message || "Failed to deliver message. Please try again.");
    } finally {
      setSendingReplies((prev) => ({ ...prev, [qKey]: false }));
    }
  };

  // Handle customer reopening a resolved ticket
  const handleCustomerReopen = async (inq: QueryItem) => {
    const qKey = inq.ticketId || inq.id;
    setReopeningTickets((prev) => ({ ...prev, [qKey]: true }));
    try {
      const token = await getToken();
      await updateQueryStatusApi(qKey, "OPEN", token || undefined);

      setInquiries((prev) =>
        prev.map((item) => {
          if (item.ticketId === qKey || item.id === qKey) {
            return { ...item, status: "OPEN" };
          }
          return item;
        })
      );
    } catch (err: any) {
      console.error("Failed to reopen ticket:", err);
      alert(err.message || "Failed to reopen ticket. Please try again.");
    } finally {
      setReopeningTickets((prev) => ({ ...prev, [qKey]: false }));
    }
  };

  // Handle deleting a ticket
  const handleDeleteTicket = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this query?")) return;
    try {
      const token = await getToken();
      await deleteInquiry(id, token || "");
      setInquiries((prev) => prev.filter((i) => i.id !== id && i.ticketId !== id));
    } catch (e) {
      console.warn("Delete ticket error:", e);
      setInquiries((prev) => prev.filter((i) => i.id !== id && i.ticketId !== id));
    }
  };

  // Handle clearing all queries
  const handleClearAllQueries = async () => {
    if (!window.confirm("Are you sure you want to clear all your queries? This will permanently delete your inquiry records.")) return;
    try {
      const token = await getToken();
      await clearAllInquiriesApi(token || undefined);
      setInquiries([]);
      setMessagesMap({});
      try {
        localStorage.removeItem("recodex_submitted_inquiries");
        localStorage.removeItem("recodex_inquiry_replies");
        localStorage.removeItem("recodex_inquiry_statuses");
      } catch (e) {}
    } catch (e) {
      console.warn("Clear all queries error:", e);
      setInquiries([]);
      setMessagesMap({});
    }
  };

  // Handle creating a new support ticket via POST /api/queries
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const token = await getToken();
      const result = await createQueryApi(
        {
          subject: ticketSubject.trim(),
          category: ticketCategory,
          priority: ticketPriority,
          message: ticketMessage.trim(),
          name: fullName,
          email: userEmail,
        },
        token || undefined
      );

      if (result && result.query) {
        setInquiries((prev) => [result.query, ...prev]);
        if (result.message) {
          const qId = result.query.ticketId || result.query.id;
          setMessagesMap((prev) => ({
            ...prev,
            [qId]: [result.message],
          }));
        }
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setNewTicketModalOpen(false);
        setTicketSubject("");
        setTicketMessage("");
        fetchUserInquiries();
      }, 1500);
    } catch (err: any) {
      console.error("Failed to submit new ticket:", err);
      setSubmitError(err.message || "Failed to submit ticket. Please check your network.");
    } finally {
      setSubmitting(false);
    }
  };

  const isResolvedStatus = (status?: string) => {
    const s = (status || "").toLowerCase();
    return s === "resolved" || s === "closed";
  };

  const filteredInquiries = inquiries.filter((inq) => {
    const matchesSearch =
      (inq.subject && inq.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inq.message && inq.message.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inq.id && inq.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inq.ticketId && inq.ticketId.toLowerCase().includes(searchQuery.toLowerCase()));

    if (statusFilter === "ALL") return matchesSearch;
    const resolved = isResolvedStatus(inq.status);
    if (statusFilter === "Resolved") return matchesSearch && resolved;
    if (statusFilter === "Pending") return matchesSearch && !resolved;
    return matchesSearch;
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
              24/7 Realtime SLA Support Desk
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
              Track your service requests, certificate approvals, and communicate directly with the verified engineering administrative desk in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchUserInquiries()}
              disabled={loading}
              className="p-2.5 rounded-xl border border-black/10 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 hover:bg-black/5 dark:hover:bg-zinc-800 text-zinc-500 hover:text-foreground transition-all cursor-pointer"
              title="Refresh Queries"
            >
              <RefreshCw size={16} className={loading ? "animate-spin text-amber-500" : ""} />
            </button>
            {inquiries.length > 0 && (
              <button
                onClick={handleClearAllQueries}
                className="px-3.5 py-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Clear all your queries"
              >
                <Trash2 size={14} />
                <span>Clear All</span>
              </button>
            )}
            <button
              onClick={() => setNewTicketModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg hover:shadow-amber-500/20 cursor-pointer"
            >
              <Plus size={16} />
              <span>Open Support Ticket</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tickets by ID, message, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/5 dark:bg-zinc-900/60 border border-black/10 dark:border-zinc-800 text-xs text-foreground dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-colors font-sans"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={14} className="text-zinc-500" />
            <div className="flex items-center p-1 rounded-xl bg-black/5 dark:bg-zinc-900/60 border border-black/10 dark:border-zinc-800 text-xs font-mono">
              {(["ALL", "Pending", "Resolved"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                    statusFilter === tab
                      ? "bg-amber-500 text-black shadow-sm"
                      : "text-zinc-500 hover:text-foreground dark:hover:text-white"
                  }`}
                >
                  {tab === "ALL" ? "All Tickets" : tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Body */}
        {loading && inquiries.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest animate-pulse">
              Retrieving Authenticated Telemetry...
            </span>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-black/10 dark:border-zinc-800 rounded-2xl p-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <MessageSquare size={20} />
            </div>
            <h3 className="text-sm font-bold text-foreground dark:text-white font-sans">No Support Inquiries Found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {statusFilter !== "ALL"
                ? `You have no ${statusFilter.toLowerCase()} queries matching your filter.`
                : "Need technical guidance or certificate issuance? Click Open Support Ticket above."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredInquiries.map((inq) => {
              const qKey = inq.ticketId || inq.id;
              const resolved = isResolvedStatus(inq.status);
              const threadMessages = messagesMap[qKey] || [];
              const replyText = customerReplies[qKey] || "";
              const isSending = sendingReplies[qKey] || false;
              const isReopening = reopeningTickets[qKey] || false;

              return (
                <div
                  key={qKey}
                  className="rounded-2xl border border-black/10 dark:border-zinc-800/80 bg-white dark:bg-[#07090e] shadow-sm hover:border-black/20 dark:hover:border-zinc-700 transition-all overflow-hidden"
                >
                  {/* Card Header Bar */}
                  <div className="px-6 py-4 bg-black/[0.02] dark:bg-zinc-900/40 border-b border-black/5 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                          resolved
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 animate-pulse"
                        }`}
                      >
                        {resolved ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                        {resolved ? "RESOLVED & CLOSED" : "ACTIVE / OPEN"}
                      </span>

                      <span className="px-2.5 py-1 rounded-md bg-black/5 dark:bg-zinc-800/80 border border-black/5 dark:border-zinc-700 text-[11px] font-mono font-semibold text-zinc-600 dark:text-zinc-300">
                        {inq.type || "Support Inquiry"}
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-zinc-500 font-semibold">
                          ID: <span className="text-foreground dark:text-zinc-200 font-bold">{qKey}</span>
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const directUrl = `${window.location.origin}/queries/${qKey}`;
                            navigator.clipboard.writeText(directUrl);
                            setCopiedId(qKey);
                            setTimeout(() => setCopiedId(null), 2500);
                          }}
                          className="p-1 rounded text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                          title="Copy direct ticket URL"
                        >
                          {copiedId === qKey ? (
                            <Check size={13} className="text-emerald-400" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-500">
                        <Clock size={13} />
                        <span>
                          {inq.createdAt && !isNaN(new Date(inq.createdAt).getTime())
                            ? new Date(inq.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
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

                  {/* Body: Two-Way Conversation Message Stream */}
                  <div className="p-6 space-y-6">
                    {/* Inquiry Subject */}
                    {inq.subject && (
                      <div className="pb-3 border-b border-black/5 dark:border-zinc-800/80 flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground dark:text-zinc-100 font-sans">
                          Subject: {inq.subject}
                        </span>
                      </div>
                    )}

                    {/* Chronological Conversation Thread */}
                    <div className="space-y-4">
                      {/* Initial Ticket Submission Message */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-1.5">
                            <User size={13} className="text-cyan-500" />
                            {inq.name || "You"} (Client Inquiry)
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {new Date(inq.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-zinc-900/40 border border-black/5 dark:border-zinc-800/80">
                          {renderFormattedInquiryMessage(inq.message)}
                        </div>
                      </div>

                      {/* Follow-up Messages from the Thread */}
                      {threadMessages
                        .filter((m) => m.message !== inq.message) // Don't duplicate initial message
                        .map((msg, idx) => {
                          const isAdmin = msg.senderRole === "ADMIN";

                          return (
                            <div
                              key={msg.id || idx}
                              className={`rounded-xl border overflow-hidden ${
                                isAdmin
                                  ? "border-emerald-500/30 bg-emerald-500/[0.03] dark:bg-emerald-950/10"
                                  : "border-black/10 dark:border-zinc-800 bg-black/[0.02] dark:bg-zinc-900/30"
                              }`}
                            >
                              <div
                                className={`px-4 py-2 border-b flex items-center justify-between ${
                                  isAdmin
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                    : "bg-black/5 dark:bg-zinc-800/60 border-black/5 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300"
                                }`}
                              >
                                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wide">
                                  {isAdmin ? (
                                    <>
                                      <ShieldCheck size={15} className="text-emerald-500" />
                                      <span>Official Admin Resolution</span>
                                    </>
                                  ) : (
                                    <>
                                      <User size={13} className="text-cyan-500" />
                                      <span>{msg.senderName || "You"} (Follow-up Message)</span>
                                    </>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-zinc-500">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              <div className="p-4 space-y-1">
                                <p className="text-xs md:text-sm text-foreground dark:text-zinc-100 font-sans leading-relaxed whitespace-pre-wrap">
                                  {msg.message}
                                </p>
                              </div>
                            </div>
                          );
                        })}

                      {/* If legacy query has reply not yet loaded in thread messages */}
                      {inq.reply && threadMessages.length <= 1 && (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.03] dark:bg-emerald-950/10 overflow-hidden">
                          <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold uppercase">
                            <div className="flex items-center gap-2">
                              <ShieldCheck size={15} className="text-emerald-500" />
                              <span>Official Admin Resolution</span>
                            </div>
                            <span className="text-[10px] text-zinc-500">Verified Desk Reply</span>
                          </div>
                          <div className="p-4">
                            <p className="text-xs md:text-sm text-foreground dark:text-zinc-100 font-sans leading-relaxed whitespace-pre-wrap">
                              {inq.reply}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Awaiting Response Banner if Still Pending */}
                      {!resolved && !inq.reply && threadMessages.length <= 1 && (
                        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3 text-xs">
                          <Clock size={16} className="text-amber-500 mt-0.5 shrink-0 animate-spin" />
                          <div className="space-y-1">
                            <p className="font-mono font-bold text-amber-500 uppercase tracking-wide text-[11px]">
                              Ticket In Active SLA Review
                            </p>
                            <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
                              Our team is reviewing your query. Replies will appear here automatically via live realtime synchronization.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Area: Reply Composer OR Reopen Banner */}
                    <div className="pt-4 border-t border-black/5 dark:border-zinc-800/80">
                      {resolved ? (
                        /* Resolved State: Reopen Option */
                        <div className="p-4 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-mono">
                            <CheckCircle2 size={16} className="shrink-0" />
                            <span>This conversation has been marked as <strong>Resolved & Closed</strong>.</span>
                          </div>
                          <button
                            onClick={() => handleCustomerReopen(inq)}
                            disabled={isReopening}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
                          >
                            <RefreshCw size={13} className={isReopening ? "animate-spin" : ""} />
                            <span>{isReopening ? "Reopening..." : "Reopen Query"}</span>
                          </button>
                        </div>
                      ) : (
                        /* Open State: Customer Live Reply Composer */
                        <div className="space-y-3">
                          <label className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider font-bold block flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <MessageCircle size={13} className="text-amber-500" />
                              Send Follow-up Message to Administrator:
                            </span>
                            <span className="text-emerald-500 text-[10px]">Realtime Active</span>
                          </label>
                          <div className="flex gap-2">
                            <textarea
                              rows={2}
                              value={replyText}
                              onChange={(e) =>
                                setCustomerReplies((prev) => ({
                                  ...prev,
                                  [qKey]: e.target.value,
                                }))
                              }
                              placeholder="Type your message or response to the administrator..."
                              className="flex-grow px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 text-xs text-foreground dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-colors font-sans resize-none"
                            />
                            <button
                              onClick={() => handleSendCustomerReply(inq)}
                              disabled={isSending || !replyText.trim()}
                              className="px-4 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs font-mono uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50 shrink-0"
                            >
                              {isSending ? (
                                <RefreshCw size={14} className="animate-spin" />
                              ) : (
                                <Send size={14} />
                              )}
                              <span className="hidden sm:inline">Send</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* NEW SUPPORT TICKET MODAL */}
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
                className="p-1 text-zinc-400 hover:text-foreground dark:hover:text-white cursor-pointer"
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
                  Your inquiry has been stored securely in the database and synchronized with the administrative desk in real-time.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateTicket} className="space-y-4">
                {submitError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

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
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs font-mono uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submitting && <RefreshCw size={13} className="animate-spin" />}
                    <span>{submitting ? "Submitting..." : "Submit Ticket"}</span>
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
