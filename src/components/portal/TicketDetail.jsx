import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Send } from "lucide-react";

const STATUS_COLORS = {
  OPEN: "border-blue-400/30 text-blue-400 bg-blue-400/5",
  "IN REVIEW": "border-yellow-400/30 text-yellow-400 bg-yellow-400/5",
  "WAITING FOR CLIENT": "border-orange-400/30 text-orange-400 bg-orange-400/5",
  RESOLVED: "border-green-400/30 text-green-400 bg-green-400/5",
  CLOSED: "border-muted-foreground/30 text-muted-foreground bg-muted-foreground/5",
};

const STATUS_LABELS = {
  OPEN: "Open",
  "IN REVIEW": "In Review",
  "WAITING FOR CLIENT": "Waiting for Client",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export default function TicketDetail({ ticket, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, [ticket.id]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const msgs = await base44.entities.SupportMessage.filter({ ticket_id: ticket.id });
      setMessages(msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    } catch (e) {
      console.error("Failed to load messages:", e);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await base44.entities.SupportMessage.create({
        ticket_id: ticket.id,
        sender_type: "investor",
        sender_id: ticket.investor_id,
        sender_name: "Investor",
        message: newMessage.trim(),
        is_internal_note: false,
      });
      
      // Update ticket status
      await base44.entities.SupportTicket.update(ticket.id, { status: "IN REVIEW" });
      
      setNewMessage("");
      loadMessages();
    } catch (e) {
      console.error("Failed to send message:", e);
    }
    setSending(false);
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
      <button
        onClick={onBack}
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground hover:text-foreground transition-colors mb-6 flex items-center gap-2"
      >
        ← Back to Tickets
      </button>

      {/* Ticket Header */}
      <div className="border border-border p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`font-mono text-[9px] uppercase tracking-[0.22em] px-2 py-0.5 border ${STATUS_COLORS[ticket.status]}`}>
                {STATUS_LABELS[ticket.status]}
              </span>
              <span className="font-mono text-[9px] text-muted-foreground/60">#{ticket.ticket_id}</span>
            </div>
            <h2 className="font-heading text-2xl text-foreground">{ticket.subject}</h2>
            <p className="font-mono text-[10px] text-muted-foreground mt-2">
              {ticket.category} · Created {new Date(ticket.created_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-4 mb-6">
        {messages.map((msg) => {
          const isInvestor = msg.sender_type === "investor";
          return (
            <div
              key={msg.id}
              className={`border p-5 ${isInvestor ? "border-border" : "border-foreground/30 bg-secondary/10"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 border flex items-center justify-center font-mono text-[10px] ${
                    !isInvestor ? "border-foreground text-foreground" : "border-border text-muted-foreground"
                  }`}>
                    {isInvestor ? "Y" : "S"}
                  </div>
                  <div>
                    <p className="font-mono text-xs text-foreground">{msg.sender_name}</p>
                    <p className="font-mono text-[9px] text-muted-foreground/50">
                      {new Date(msg.created_date).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>
              <p className="font-mono text-xs leading-6 text-muted-foreground whitespace-pre-wrap">{msg.message}</p>
            </div>
          );
        })}
      </div>

      {/* Reply Input */}
      <div className="border border-border p-5">
        <div className="flex items-start gap-3">
          <textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            rows={3}
            className="flex-1 border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors resize-none"
            placeholder="Type your reply..."
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            className="border border-foreground bg-foreground text-background font-mono text-xs uppercase tracking-[0.24em] px-6 py-3 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}