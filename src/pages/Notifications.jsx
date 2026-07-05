import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PortalHeader from "@/components/portal/PortalHeader";

const CATEGORIES = ["All", "Account", "Documents", "Performance", "Research Engines", "Security", "System"];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Notifications() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [filterRead, setFilterRead] = useState("all"); // "all" | "unread"
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) { window.location.href = "/start"; return; }
      const me = await base44.auth.me();
      setUser(me);
      const list = await base44.entities.Notification.filter({ user_id: me.id }, "-created_date", 100);
      setNotifications(list);
      setLoading(false);
    };
    init();
  }, []);

  const markRead = async (id) => {
    await base44.entities.Notification.update(id, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    await base44.entities.Notification.delete(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClick = async (n) => {
    if (!n.is_read) await markRead(n.id);
    if (n.action_url) navigate(n.action_url);
  };

  const filtered = notifications.filter(n => {
    if (filter !== "All" && n.category !== filter) return false;
    if (filterRead === "unread" && n.is_read) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PortalHeader user={user} />

      <main className="flex-1 mx-auto max-w-4xl w-full px-5 sm:px-8 py-16">
        {/* Breadcrumb */}
        <div className="mb-10 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
          <Link to="/portal" className="hover:text-foreground transition-colors">Portal</Link>
          <span>/</span>
          <span className="text-foreground">Notifications</span>
        </div>

        <div className="mb-10 border-b border-border pb-8 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-3">Investor Portal</p>
            <h1 className="font-heading text-4xl text-foreground">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-4 font-mono text-sm text-muted-foreground">{unreadCount} unread</span>
              )}
            </h1>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="font-mono text-[10px] uppercase tracking-[0.24em] border border-border px-5 py-2.5 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            >
              Mark All as Read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {/* Read filter */}
          <div className="flex border border-border mr-4">
            {["all", "unread"].map((f, i) => (
              <button key={f} onClick={() => setFilterRead(f)}
                className={`font-mono text-[10px] uppercase tracking-[0.18em] px-4 py-2 transition-colors ${i > 0 ? "border-l border-border" : ""} ${filterRead === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {f === "all" ? "All" : "Unread"}
              </button>
            ))}
          </div>
          {/* Category filter */}
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`font-mono text-[10px] uppercase tracking-[0.18em] px-4 py-2 border transition-colors ${filter === c ? "border-foreground text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Notifications list */}
        {filtered.length === 0 ? (
          <div className="border border-border p-16 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground/50">No notifications</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(n => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`border border-border p-5 flex items-start gap-5 cursor-pointer hover:bg-secondary/20 transition-colors group ${!n.is_read ? "border-l-2 border-l-foreground" : ""}`}
              >
                {/* Unread dot */}
                <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${!n.is_read ? "bg-foreground" : "bg-transparent"}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 border border-border/50 px-2 py-0.5">
                      {n.category}
                    </span>
                    {n.is_action_required && (
                      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-yellow-400 border border-yellow-400/20 px-2 py-0.5">
                        Action Required
                      </span>
                    )}
                    <span className="font-mono text-[9px] text-muted-foreground/40 ml-auto">{timeAgo(n.created_date)}</span>
                  </div>
                  <p className={`font-mono text-xs mb-1 ${!n.is_read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                  <p className="font-mono text-[11px] leading-6 text-muted-foreground/70">{n.message}</p>
                  {n.action_label && n.action_url && (
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/70 group-hover:text-foreground transition-colors">
                      {n.action_label} →
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!n.is_read && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                      className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={(e) => deleteNotification(n.id, e)}
                    className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50 hover:text-red-400 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-4 font-mono text-[10px] text-muted-foreground/40">
          Showing {filtered.length} of {notifications.length} notifications
        </p>
      </main>
    </div>
  );
}