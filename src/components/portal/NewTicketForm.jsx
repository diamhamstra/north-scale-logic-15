import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, X } from "lucide-react";

const CATEGORIES = [
  "Platform Issue",
  "Account Access",
  "Verification",
  "Research Engines",
  "Performance Questions",
  "Funding",
  "Withdrawals",
  "Technical Issue",
  "Bug Report",
  "Feature Request",
  "General Question",
  "Other",
];

export default function NewTicketForm({ userId, onBack, onSuccess }) {
  const [form, setForm] = useState({ subject: "", category: "General Inquiry", message: "" });
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const reader = new FileReader();
        return new Promise((resolve) => {
          reader.onload = async (event) => {
            try {
              const result = await base44.integrations.Core.UploadFile({ file: event.target.result });
              resolve({ url: result.file_url, name: file.name });
            } catch (err) {
              resolve(null);
            }
          };
          reader.readAsDataURL(file);
        });
      });
      const results = await Promise.all(uploadPromises);
      const validUrls = results.filter(r => r !== null);
      setAttachments(prev => [...prev, ...validUrls]);
    } catch (err) {
      console.error("Upload failed:", err);
    }
    setUploading(false);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.message.trim() || !userId) return;
    setCreating(true);
    try {
      // Generate ticket ID
      const ticketNum = Math.floor(Math.random() * 900000) + 100000;
      const ticketId = `NS-${ticketNum}`;
      
      const ticket = await base44.entities.SupportTicket.create({
        ticket_id: ticketId,
        user_id: userId,
        investor_name: "",
        investor_email: "",
        subject: form.subject.trim(),
        category: form.category,
        status: "OPEN",
        priority: "Medium",
        message: form.message.trim(),
        attachment_urls: attachments.map(a => a.url),
      });
      
      // Add initial message
      await base44.entities.SupportMessage.create({
        ticket_id: ticket.id,
        sender_type: "investor",
        sender_id: userId,
        sender_name: "Investor",
        message: form.message.trim(),
        is_internal_note: false,
      });
      
      // Update ticket with last message timestamp
      await base44.entities.SupportTicket.update(ticket.id, {
        last_message_at: new Date().toISOString(),
      });
      
      // Trigger automation for notifications
      base44.functions.invoke("automationEngine", {
        event: "SUPPORT_TICKET_CREATED",
        data: {
          ticket_id: ticket.id,
          ticket_num: ticketId,
          investor_id: userId,
          subject: form.subject,
          category: form.category,
        },
      }).catch(() => {});
      
      onSuccess();
    } catch (e) {
      console.error("Failed to create ticket:", e);
    }
    setCreating(false);
  };

  return (
    <div className="border border-border p-8">
      <button
        onClick={onBack}
        className="font-mono text-[10px] lowercase tracking-[0.32em] text-muted-foreground hover:text-foreground transition-colors mb-6 flex items-center gap-2"
      >
        ← back
      </button>
      <h2 className="font-heading text-2xl text-foreground mb-6 lowercase">create support ticket</h2>
      <div className="space-y-5">
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">
            Subject <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.subject}
            onChange={e => setForm({ ...form, subject: e.target.value })}
            className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors"
            placeholder="Brief description of your issue"
          />
        </div>
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">
            Category
          </label>
          <select
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">
            Message <span className="text-red-400">*</span>
          </label>
          <textarea
            value={form.message}
            onChange={e => setForm({ ...form, message: e.target.value })}
            rows={6}
            className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors resize-none"
            placeholder="Describe your issue in detail..."
          />
        </div>
        
        {/* Attachments */}
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">
            Attachments
          </label>
          <div className="border border-border p-4">
            <label className="flex items-center justify-center gap-3 cursor-pointer font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground hover:text-foreground transition-colors">
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading..." : "Upload Files"}
              <input type="file" multiple onChange={handleFileUpload} className="hidden" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt" />
            </label>
          </div>
          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map((att, i) => (
                <div key={i} className="flex items-center justify-between border border-border px-4 py-2">
                  <span className="font-mono text-[10px] text-muted-foreground truncate">{att.name}</span>
                  <button onClick={() => removeAttachment(i)} className="font-mono text-[10px] text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button
            onClick={handleSubmit}
            disabled={creating || !form.subject.trim() || !form.message.trim()}
            className="border border-border bg-transparent text-foreground font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-border transition-colors disabled:opacity-50"
          >
            {creating ? "creating..." : "submit ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}