import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { getInquiries, deleteInquiry } from "../services/api";
import {
  MessageSquare, ShieldCheck, Clock, CheckCircle2, ArrowLeft,
  Search, Filter, Plus, Send, AlertCircle, ChevronRight,
  User, Check, Sparkles, RefreshCw, HelpCircle, FileText, Trash2
} from "lucide-react";

interface Inquiry {
  id: string;
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

export default function Queries() {
  const { isLoaded, userId, getToken } = useAuth();
  const { user } = useUser();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Pending" | "Resolved">("ALL");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

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

      const all: any[] = await getInquiries("");
      const localRepliesRaw = localStorage.getItem("recodex_inquiry_replies");
      const repliesMap = localRepliesRaw ? JSON.parse(localRepliesRaw) : {};

      const localInquiriesRaw = localStorage.getItem("recodex_submitted_inquiries");
      const localInquiries: any[] = localInquiriesRaw ? JSON.parse(localInquiriesRaw) : [];

      // Merge and map
      const mergedMap = new Map<string, any>();
      [...all, ...localInquiries].forEach((inq) => {
        if (inq && inq.id) {
          // Filter out the requested test inquiry ID or test message
          if (inq.id === "inq-1787642424751" || (inq.message || "").trim() === "sdsadas") return;
          const r = repliesMap[inq.id] || inq.reply;
          const status = r ? "Resolved" : (inq.status || "Pending");
          mergedMap.set(inq.id, {
            ...inq,
            reply: r,
            status: status,
            category: inq.category || "Technical Query",
            priority: inq.priority || "Normal"
          });
        }
      });

      const allMerged = Array.from(mergedMap.values());

      // Filter for this user's queries
      const userList = allMerged.filter((inq: any) => {
        if (!inq) return false;
        if (inq.id === "inq-1787642424751" || (inq.message || "").trim() === "sdsadas") return false;
        if (inq.subject === "Account Onboarding & Security Clearance") return false;
        const inqEmail = (inq.email || "").toLowerCase().trim();
        return userEmail && inqEmail === userEmail;
      });

      setInquiries(userList);
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
      const updated = inquiries.filter((i) => i.id !== id);
      setInquiries(updated);
    } catch (e) {
      console.warn("Failed to delete ticket:", e);
      const updated = inquiries.filter((i) => i.id !== id);
      setInquiries(updated);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchUserInquiries();
    }
  }, [isLoaded, userEmail]);

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
    return matchesSearch && inq.status === statusFilter;
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
              <span>Direct Protocol Help Desk</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground dark:text-white tracking-tight">
              Support Queries & Tickets
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-2xl">
              Track submitted technical inquiries, project modifications, and direct answers from lead engineers and system administrators.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setNewTicketModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 hover:border-amber-500/60 font-semibold text-xs tracking-wide transition-all shadow-[0_0_15px_rgba(245,158,11,0.12)] hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer font-sans"
            >
              <Plus size={16} />
              Submit New Ticket
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by ticket ID, subject, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/70 dark:bg-zinc-900/70 border border-black/10 dark:border-zinc-800 rounded-xl text-xs text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-all font-sans"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-mono text-zinc-400 font-bold uppercase mr-1">Status:</span>
            <div className="flex items-center gap-1 p-1 bg-black/5 dark:bg-zinc-900/80 border border-black/10 dark:border-zinc-800 rounded-xl">
              {(["ALL", "Pending", "Resolved"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer font-sans ${
                    statusFilter === status
                      ? "bg-white dark:bg-zinc-800 text-foreground dark:text-white shadow-sm border border-black/5 dark:border-zinc-700 font-semibold"
                      : "text-zinc-500 hover:text-foreground dark:hover:text-zinc-200"
                  }`}
                >
                  {status === "ALL" ? "All Inquiries" : status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tickets Stream */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Syncing Support Desk Pipeline...</p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="text-center py-20 bg-white/40 dark:bg-zinc-900/40 rounded-2xl border border-dashed border-black/10 dark:border-zinc-800 p-8">
            <MessageSquare size={40} className="mx-auto text-zinc-400 dark:text-zinc-600 mb-3 opacity-60" />
            <h3 className="text-base font-bold text-foreground dark:text-white">No Tickets Found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              You haven't opened any support queries matching this filter. Need assistance? Submit a direct ticket to our team.
            </p>
            <button
              onClick={() => setNewTicketModalOpen(true)}
              className="mt-5 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Open New Query
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInquiries.map((inq) => {
              const isResolved = inq.status === "Resolved";
              const isSelected = selectedInquiry?.id === inq.id;

              return (
                <div
                  key={inq.id}
                  className={`bg-white/70 dark:bg-[#07090e]/80 backdrop-blur-xl border rounded-2xl p-6 transition-all duration-200 ${
                    isSelected
                      ? "border-amber-500/60 shadow-[0_10px_30px_rgba(245,158,11,0.12)]"
                      : "border-black/10 dark:border-zinc-800/90 hover:border-amber-500/30"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/5 dark:border-zinc-800/70">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 border ${
                        isResolved
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/25"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/25"
                      }`}>
                        {isResolved ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {inq.status}
                      </span>

                      <span className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-zinc-900 border border-black/5 dark:border-zinc-800 text-[10px] font-mono font-bold text-zinc-500">
                        {inq.category || "General"}
                      </span>

                      <span className="text-xs font-mono text-zinc-400 font-bold">
                        Ticket: {inq.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-zinc-500">
                        {inq.createdAt && !isNaN(new Date(inq.createdAt).getTime())
                          ? new Date(inq.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })
                          : "Recently"}
                      </span>
                      <button
                        onClick={() => handleDeleteTicket(inq.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Ticket"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Question / Message */}
                  <div className="pt-4 space-y-2">
                    {inq.subject && (
                      <h3 className="text-base font-bold text-foreground dark:text-white">
                        {inq.subject}
                      </h3>
                    )}
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans">
                      {inq.message}
                    </p>
                  </div>

                  {/* Admin Response Thread */}
                  {inq.reply ? (
                    <div className="mt-5 p-4 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={15} />
                          <span>Official Response from RecodeX Administration</span>
                        </div>
                        <span className="text-[10px] opacity-80">Verified Protocol Lead</span>
                      </div>
                      <p className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed font-sans">
                        {inq.reply}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 flex items-center gap-2 text-xs font-mono text-amber-500/80 bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                      <Clock size={14} className="animate-spin" />
                      <span>Ticket queued in SLA review. Estimated response within 2 hours.</span>
                    </div>
                  )}
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
