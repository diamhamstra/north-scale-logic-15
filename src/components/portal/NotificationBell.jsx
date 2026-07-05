import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const CATEGORY_DOT = {
  Account: "bg-blue-400",
  Documents: "bg-green-400",
  Performance: "bg-purple-400",
  "Research Engines": "bg-yellow-400",
  Security: "bg-red-400",
  System: "bg-muted-foreground",
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!userId) return;
    base44.entities.Notification.filter({ user_id: userId }, "-created_date", 20)
      .then(setNotifications);

    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.data?.user_id !== userId) return;
      if (event.type === "create") setNotifications(prev => [event.data, ...prev].slice(0, 20));
      if (event.type === "update") setNotifications(prev => prev.map(n => n.id === event.data.id ? event.data : n));
      if (event.type === "delete") setNotifications(prev => prev.filter(n => n.id !== event.id));
    });
    return unsubscribe;
  }, [userId]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifications.filter(n => !n.is_read);

  const markRead = async (id) => {
    await base44.entities.Notification.update(id, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const unreadOnes = notifications.filter(n => !n.is_read);
    await Promise.all(unreadOnes.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Notifications"
      >
        {/* Bell SVG */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 2.5-.5 4-1 4.5h11c-.5-.5-1-2-1-4.5A4.5 4.5 0 0 0 8 1.5z" />
          <path d="M6.5 10.5a1.5 1.5 0 0 0 3 0" />
        </svg>
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-foreground text-background font-mono text-[9px] flex items-center justify-center px-1">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-3 w-80 border border-border bg-background z-50 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground">Notifications</p>
              {unread.length > 0 && (
                <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{unread.length} unread</p>
              )}
            </div>
            {unread.length > 0 && (
              <button onClick={markAllRead} className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors">
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="font-mono text-[10px] text-muted-foreground/50">No notifications</p>
              </div>
            ) : (
              notifications.slice(0, 8).map(n => (
                <div
                  key={n.id}
                  onClick={() => { if (!n.is_read) markRead(n.id); }}
                  className={`px-5 py-4 border-b border-border/50 cursor-pointer hover:bg-secondary/30 transition-colors ${!n.is_read ? "bg-secondary/20" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? "bg-foreground" : "bg-transparent border border-border"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60">{n.category}</span>
                        {n.is_action_required && (
                          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-yellow-400 border border-yellow-400/20 px-1">Action Required</span>
                        )}
                      </div>
                      <p className={`font-mono text-xs leading-5 ${!n.is_read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                      <p className="font-mono text-[10px] leading-5 text-muted-foreground/60 mt-0.5 truncate">{n.message}</p>
                      <p className="font-mono text-[9px] text-muted-foreground/40 mt-1">{timeAgo(n.created_date)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-5 py-3">
            <Link
              to="/portal?m=notifications"
              onClick={() => setOpen(false)}
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
            >
              View All Notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}