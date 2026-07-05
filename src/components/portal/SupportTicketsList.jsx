import React from "react";
import { MessageSquare } from "lucide-react";

const STATUS_LABELS = {
  OPEN: "Open",
  "IN REVIEW": "In Review",
  "WAITING FOR CLIENT": "Waiting for Client",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const STATUS_COLORS = {
  OPEN: "border-blue-400/30 text-blue-400 bg-blue-400/5",
  "IN REVIEW": "border-yellow-400/30 text-yellow-400 bg-yellow-400/5",
  "WAITING FOR CLIENT": "border-orange-400/30 text-orange-400 bg-orange-400/5",
  RESOLVED: "border-green-400/30 text-green-400 bg-green-400/5",
  CLOSED: "border-muted-foreground/30 text-muted-foreground bg-muted-foreground/5",
};

export default function SupportTicketsList({ tickets, onSelect, onCreateNew }) {
  if (tickets.length === 0) {
    return (
      <div className="border border-border p-12 text-center">
        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
        <p className="font-mono text-xs text-muted-foreground mb-4">No support tickets yet.</p>
        <button
          onClick={onCreateNew}
          className="border border-border bg-transparent text-foreground font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-border transition-colors"
        >
          create your first ticket
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tickets.map(ticket => (
        <div
          key={ticket.id}
          onClick={() => onSelect(ticket)}
          className="border border-border p-5 cursor-pointer hover:bg-secondary/10 transition-colors"
        >
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className={`font-mono text-[9px] uppercase tracking-[0.22em] px-2 py-0.5 border ${STATUS_COLORS[ticket.status]}`}>
                  {STATUS_LABELS[ticket.status]}
                </span>
                <span className="font-mono text-[9px] text-muted-foreground/60">#{ticket.ticket_id}</span>
              </div>
              <p className="font-mono text-xs text-foreground">{ticket.subject}</p>
            </div>
            <span className="font-mono text-[9px] text-muted-foreground/50 whitespace-nowrap">
              {new Date(ticket.last_message_at || ticket.created_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground/70">
            {ticket.category} · {ticket.message_count || 0} message{(ticket.message_count || 0) !== 1 ? "s" : ""}
          </p>
        </div>
      ))}
    </div>
  );
}