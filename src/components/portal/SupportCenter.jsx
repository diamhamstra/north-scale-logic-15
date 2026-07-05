import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import SupportTicketsList from "./SupportTicketsList";
import NewTicketForm from "./NewTicketForm";
import TicketDetail from "./TicketDetail";
import KnowledgeBase from "./KnowledgeBase";
import SystemStatus from "./SystemStatus";

export default function SupportCenter({ userId, userRole }) {
  const [view, setView] = useState("tickets"); // tickets | new | ticket-detail | kb | status
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, [userId]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const ticketsData = await base44.entities.SupportTicket.filter({ user_id: userId });
      // Load message counts for each ticket
      const ticketsWithCounts = await Promise.all(
        ticketsData.map(async ticket => {
          const messages = await base44.entities.SupportMessage.filter({ ticket_id: ticket.id });
          return {
            ...ticket,
            message_count: messages.length,
            last_message_at: messages.length > 0 ? messages[messages.length - 1].created_date : ticket.created_date,
          };
        })
      );
      setTickets(ticketsWithCounts.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at)));
    } catch (e) {
      console.error("Failed to load tickets:", e);
    }
    setLoading(false);
  };

  const openTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setView("ticket-detail");
  };

  const handleTicketCreated = () => {
    setView("tickets");
    loadTickets();
  };

  const handleSendMessage = async (ticketId, message) => {
    try {
      await base44.entities.SupportMessage.create({
        ticket_id: ticketId,
        sender_type: userRole === "admin" ? "admin" : "investor",
        sender_id: userId,
        sender_name: userRole === "admin" ? "Support Team" : "Investor",
        message,
        is_internal_note: false,
      });
      // Update ticket status
      const newStatus = userRole === "admin" ? "waiting_on_investor" : "in_progress";
      await base44.entities.SupportTicket.update(ticketId, { status: newStatus });
      // Reload
      loadTickets();
      // Reload messages for this ticket
      const msgs = await base44.entities.SupportMessage.filter({ ticket_id: ticketId });
      return msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    } catch (e) {
      console.error("Failed to send message:", e);
      throw e;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-12 border-b border-border pb-8">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-4xl text-foreground lowercase">support center</h1>
          {view !== "new" && view !== "ticket-detail" && (
            <button
              onClick={() => setView("new")}
              className="border border-border bg-transparent text-foreground font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-border transition-colors"
            >
              new ticket
            </button>
          )}
        </div>

        {/* Local Nav */}
        <div className="flex gap-0 border-b border-border">
          {[
            { key: "tickets", label: "My Tickets" },
            { key: "kb", label: "Knowledge Base" },
            { key: "status", label: "System Status" },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={`px-5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] border-b-2 -mb-px transition-colors ${
                view === item.key || (view === "new" && item.key === "tickets") || (view === "ticket-detail" && item.key === "tickets")
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {view === "new" && (
        <NewTicketForm userId={userId} onBack={() => setView("tickets")} onSuccess={handleTicketCreated} />
      )}

      {view === "tickets" && (
        <SupportTicketsList
          tickets={tickets}
          onSelect={openTicket}
          selectedTicket={selectedTicket}
          onCreateNew={() => setView("new")}
        />
      )}

      {view === "ticket-detail" && selectedTicket && (
        <TicketDetail
          ticket={selectedTicket}
          userId={userId}
          userRole={userRole}
          onBack={() => setView("tickets")}
          onSendMessage={handleSendMessage}
        />
      )}

      {view === "kb" && (
        <KnowledgeBase userId={userId} />
      )}

      {view === "status" && (
        <SystemStatus userId={userId} />
      )}
    </div>
  );
}