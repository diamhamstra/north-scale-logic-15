import React, { useState } from "react";
import { base44 } from "@/api/base44Client";

const CATEGORIES = ["Account", "Documents", "Performance", "Research Engines", "Security", "System"];

export default function SendNotification({ profiles, allUsers }) {
  const [form, setForm] = useState({
    recipient: "all", // "all" | "selected" | specific user_id
    selectedUsers: [],
    category: "System",
    title: "",
    message: "",
    action_label: "",
    action_url: "",
    is_action_required: false,
    expires_at: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleUser = (userId) => {
    setForm(prev => ({
      ...prev,
      selectedUsers: prev.selectedUsers.includes(userId)
        ? prev.selectedUsers.filter(id => id !== userId)
        : [...prev.selectedUsers, userId],
    }));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.message.trim()) { setError("Message is required."); return; }

    // Determine target user IDs
    let targetUserIds = [];
    if (form.recipient === "all") {
      targetUserIds = profiles.map(p => p.user_id).filter(Boolean);
    } else if (form.recipient === "selected") {
      targetUserIds = form.selectedUsers;
      if (targetUserIds.length === 0) { setError("Select at least one recipient."); return; }
    } else {
      targetUserIds = [form.recipient];
    }

    setSending(true);
    const payload = {
      category: form.category,
      title: form.title,
      message: form.message,
      is_read: false,
      sent_by_admin: true,
      is_action_required: form.is_action_required,
      ...(form.action_label ? { action_label: form.action_label } : {}),
      ...(form.action_url ? { action_url: form.action_url } : {}),
      ...(form.expires_at ? { expires_at: new Date(form.expires_at).toISOString() } : {}),
    };

    await Promise.all(
      targetUserIds.map(uid =>
        base44.entities.Notification.create({ ...payload, user_id: uid })
      )
    );

    setSending(false);
    setSent(true);
    setForm(prev => ({ ...prev, title: "", message: "", action_label: "", action_url: "", is_action_required: false, expires_at: "", selectedUsers: [] }));
    setTimeout(() => setSent(false), 4000);
  };

  const approvedProfiles = profiles.filter(p => p.access_status === "approved");

  return (
    <div className="max-w-2xl">
      <div className="mb-8 border-b border-border pb-6">
        <h2 className="font-heading text-2xl text-foreground">Send Notification</h2>
        <p className="font-mono text-xs leading-6 text-muted-foreground mt-1">
          Send a notification to individual investors or broadcast to all users.
        </p>
      </div>

      <form onSubmit={handleSend} className="space-y-5">
        {/* Recipients */}
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">
            Recipients
          </label>
          <select
            value={form.recipient}
            onChange={e => set("recipient", e.target.value)}
            className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
          >
            <option value="all">All Users ({approvedProfiles.length})</option>
            <option value="selected">Select specific users...</option>
            {approvedProfiles.map(p => (
              <option key={p.user_id} value={p.user_id}>{p.full_name || p.email}</option>
            ))}
          </select>
        </div>

        {/* Multi-select users */}
        {form.recipient === "selected" && (
          <div className="border border-border p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-3">Select Recipients</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {approvedProfiles.map(p => (
                <label key={p.user_id} className="flex items-center gap-3 cursor-pointer hover:bg-secondary/30 px-2 py-1.5 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.selectedUsers.includes(p.user_id)}
                    onChange={() => toggleUser(p.user_id)}
                    className="w-4 h-4 border border-border bg-background accent-foreground"
                  />
                  <span className="font-mono text-xs text-foreground">{p.full_name || "—"}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{p.email}</span>
                </label>
              ))}
            </div>
            {form.selectedUsers.length > 0 && (
              <p className="mt-2 font-mono text-[10px] text-muted-foreground/60">{form.selectedUsers.length} selected</p>
            )}
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">Category</label>
          <select
            value={form.category}
            onChange={e => set("category", e.target.value)}
            className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => set("title", e.target.value)}
            placeholder="Notification title"
            className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">
            Message <span className="text-red-400">*</span>
          </label>
          <textarea
            value={form.message}
            onChange={e => set("message", e.target.value)}
            rows={3}
            placeholder="Notification message..."
            className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors resize-none"
          />
        </div>

        {/* Action Required toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_action_required}
            onChange={e => set("is_action_required", e.target.checked)}
            className="w-4 h-4 border border-border bg-background accent-foreground"
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Mark as Action Required</span>
        </label>

        {/* Optional action button */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">
              Action Button Label <span className="text-muted-foreground/40">(optional)</span>
            </label>
            <input
              type="text"
              value={form.action_label}
              onChange={e => set("action_label", e.target.value)}
              placeholder="e.g. Open Data Room"
              className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">
              Destination URL <span className="text-muted-foreground/40">(optional)</span>
            </label>
            <input
              type="text"
              value={form.action_url}
              onChange={e => set("action_url", e.target.value)}
              placeholder="/portal/data-room"
              className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors"
            />
          </div>
        </div>

        {/* Expiry */}
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">
            Expiry Date <span className="text-muted-foreground/40">(optional)</span>
          </label>
          <input
            type="datetime-local"
            value={form.expires_at}
            onChange={e => set("expires_at", e.target.value)}
            className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
          />
        </div>

        {error && <p className="font-mono text-[10px] text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={sending}
          className="w-full border border-foreground bg-foreground text-background font-mono text-xs uppercase tracking-[0.24em] px-8 py-4 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-50"
        >
          {sending ? "Sending..." : sent ? "✓ Sent" : "Send Notification"}
        </button>
      </form>
    </div>
  );
}