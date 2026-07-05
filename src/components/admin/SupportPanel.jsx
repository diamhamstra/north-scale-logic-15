import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, MessageSquare, CheckCircle, Clock, AlertCircle } from "lucide-react";

const STATUS_COLORS = {
  OPEN: "text-blue-400 border-blue-400/30 bg-blue-400/5",
  "IN REVIEW": "text-yellow-400 border-yellow-400/30 bg-yellow-400/5",
  "WAITING FOR CLIENT": "text-orange-400 border-orange-400/30 bg-orange-400/5",
  RESOLVED: "text-green-400 border-green-400/30 bg-green-400/5",
  CLOSED: "text-muted-foreground border-border bg-secondary/20",
};

export default function SupportPanel({ user }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const allTickets = await base44.entities.SupportTicket.list("-created_date", 200);
      setTickets(allTickets);
    } catch (e) {
      console.error("Failed to load tickets:", e);
    }
    setLoading(false);
  };

  const openTicket = async (ticket) => {
    setSelectedTicket(ticket);
    try {
      const msgs = await base44.entities.SupportMessage.filter({ ticket_id: ticket.id });
      setMessages(msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    } catch (e) {
      console.error("Failed to load messages:", e);
    }
  };

  const sendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;
    setSending(true);
    try {
      await base44.entities.SupportMessage.create({
        ticket_id: selectedTicket.id,
        sender_type: "admin",
        sender_id: user.id,
        sender_name: user.full_name || "Support Team",
        message: replyMessage.trim(),
        is_internal_note: false,
      });
      // Update status
      await base44.entities.SupportTicket.update(selectedTicket.id, { status: "WAITING FOR CLIENT" });
      setReplyMessage("");
      // Reload
      const msgs = await base44.entities.SupportMessage.filter({ ticket_id: selectedTicket.id });
      setMessages(msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
      loadTickets();
    } catch (e) {
      console.error("Failed to send reply:", e);
    }
    setSending(false);
  };

  const updateTicketStatus = async (ticketId, status) => {
    await base44.entities.SupportTicket.update(ticketId, { status });
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => ({ ...prev, status }));
    }
    loadTickets();
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.investor_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.ticket_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    open: tickets.filter(t => t.status === "OPEN").length,
    inReview: tickets.filter(t => t.status === "IN REVIEW").length,
    waiting: tickets.filter(t => t.status === "WAITING FOR CLIENT").length,
    resolved: tickets.filter(t => t.status === "RESOLVED").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 border border-border mb-8">
        {[
          { label: "Open", value: stats.open, icon: MessageSquare, color: "text-blue-400" },
          { label: "In Review", value: stats.inReview, icon: Clock, color: "text-yellow-400" },
          { label: "Waiting for Client", value: stats.waiting, icon: AlertCircle, color: "text-orange-400" },
          { label: "Resolved Today", value: stats.resolved, icon: CheckCircle, color: "text-green-400" },
        ].map(s => (
          <div key={s.label} className="p-6 border-r last:border-r-0 border-border">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{s.label}</p>
            </div>
            <p className={`font-heading text-2xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by ticket ID, subject, or investor email..."
            className="w-full border border-border bg-background pl-10 pr-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
        >
          <option value="all">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN REVIEW">In Review</option>
          <option value="WAITING FOR CLIENT">Waiting for Client</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* Ticket List */}
      {!selectedTicket ? (
        <div className="space-y-2">
          {filteredTickets.length === 0 ? (
            <div className="border border-border p-12 text-center">
              <p className="font-mono text-xs text-muted-foreground">No tickets found.</p>
            </div>
          ) : (
            filteredTickets.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => openTicket(ticket)}
                className="border border-border p-5 cursor-pointer hover:bg-secondary/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`font-mono text-[9px] uppercase tracking-[0.22em] px-2 py-0.5 border ${STATUS_COLORS[ticket.status]}`}>
                        {ticket.status}
                      </span>
                      <span className="font-mono text-[9px] text-muted-foreground/60">#{ticket.ticket_id}</span>
                    </div>
                    <p className="font-mono text-xs text-foreground">{ticket.subject}</p>
                    <p className="font-mono text-[10px] text-muted-foreground/70 mt-1">
                      {ticket.investor_name || ticket.investor_email} · {ticket.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[9px] text-muted-foreground/50">
                      {new Date(ticket.last_message_at || ticket.created_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                    {ticket.assigned_name && (
                      <p className="font-mono text-[10px] text-muted-foreground mt-1">Assigned: {ticket.assigned_name}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Ticket Detail */
        <div className="border border-border">
          {/* Header */}
          <div className="border-b border-border p-6">
            <button
              onClick={() => setSelectedTicket(null)}
              className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground hover:text-foreground transition-colors mb-4 flex items-center gap-2"
            >
              ← Back to Tickets
            </button>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`font-mono text-[9px] uppercase tracking-[0.22em] px-2 py-0.5 border ${STATUS_COLORS[selectedTicket.status]}`}>
                    {selectedTicket.status}
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground/60">#{selectedTicket.ticket_id}</span>
                </div>
                <h2 className="font-heading text-2xl text-foreground">{selectedTicket.subject}</h2>
                <p className="font-mono text-[10px] text-muted-foreground mt-2">
                  {selectedTicket.investor_name || selectedTicket.investor_email} · {selectedTicket.category}
                </p>
              </div>
              <div className="flex gap-2">
                {selectedTicket.status !== "RESOLVED" && (
                  <button
                    onClick={() => updateTicketStatus(selectedTicket.id, "RESOLVED")}
                    className="border border-green-400/30 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-green-400 hover:bg-green-400/10 transition-colors"
                  >
                    Resolve
                  </button>
                )}
                {selectedTicket.status !== "CLOSED" && (
                  <button
                    onClick={() => updateTicketStatus(selectedTicket.id, "CLOSED")}
                    className="border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`border p-4 ${
                  msg.sender_type === "admin" ? "border-foreground/30 bg-secondary/20" : "border-border"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-6 h-6 border flex items-center justify-center font-mono text-[9px] ${
                    msg.sender_type === "admin" ? "border-foreground text-foreground" : "border-border text-muted-foreground"
                  }`}>
                    {msg.sender_type === "admin" ? "S" : "I"}
                  </div>
                  <div>
                    <p className="font-mono text-xs text-foreground">{msg.sender_name}</p>
                    <p className="font-mono text-[9px] text-muted-foreground/50">
                      {new Date(msg.created_date).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <p className="font-mono text-xs leading-6 text-muted-foreground whitespace-pre-wrap">{msg.message}</p>
              </div>
            ))}
          </div>

          {/* Reply */}
          <div className="border-t border-border p-6">
            <div className="flex items-start gap-3">
              <textarea
                value={replyMessage}
                onChange={e => setReplyMessage(e.target.value)}
                rows={3}
                className="flex-1 border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors resize-none"
                placeholder="Type your reply..."
              />
              <button
                onClick={sendReply}
                disabled={sending || !replyMessage.trim()}
                className="border border-foreground bg-foreground text-background font-mono text-xs uppercase tracking-[0.24em] px-6 py-3 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}