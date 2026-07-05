import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import SendNotification from "@/components/admin/SendNotification";

const fmtTime = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  const now = new Date();
  const diff = (now - dt) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—";

function KpiCard({ label, value, color, sub, onClick }) {
  return (
    <button onClick={onClick} className={`border border-border bg-card p-5 text-left transition-colors hover:bg-secondary/30 ${onClick ? "cursor-pointer" : "cursor-default"}`}>
      <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground mb-3">{label}</p>
      <p className={`font-heading text-3xl ${color || "text-foreground"}`}>{value}</p>
      {sub && <p className="font-mono text-[10px] text-muted-foreground/50 mt-1.5">{sub}</p>}
    </button>
  );
}

function SectionHeader({ label, action, actionLabel }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <p className="font-mono text-[9px] uppercase tracking-[0.36em] text-muted-foreground">{label}</p>
      {action && <button onClick={action} className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors">{actionLabel} →</button>}
    </div>
  );
}

export default function OpsHome({ profiles, crmRecords, inquiries, auditLogs, notifications, tasks, allUsers, user, health, updateStatus, refetch, setTasks, onNavigate, globalSearch }) {
  const [showNotifForm, setShowNotifForm] = useState(false);
  const [showQuickTask, setShowQuickTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState("normal");
  const [savingTask, setSavingTask] = useState(false);

  const pending = profiles.filter(p => p.access_status === "pending");
  const approved = profiles.filter(p => p.access_status === "approved");
  const active = crmRecords.filter(r => r.client_status === "active");
  const openTasks = tasks.filter(t => t.status === "open" || t.status === "in_progress");
  const passportsUploaded = profiles.filter(p => p.passport_url);
  const unreadNotifs = notifications.filter(n => !n.is_read);
  const todaysLogs = auditLogs.filter(l => {
    if (!l.created_date) return false;
    const d = new Date(l.created_date);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const connectedAccounts = profiles.filter(p => p.commodities_metacopier_id || p.digital_metacopier_id).length;
  const newInquiries = inquiries.filter(i => i.status === "under_review").length;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newThisWeek = profiles.filter(p => new Date(p.created_date) > weekAgo).length;

  const overallHealth = health?.overall || "unknown";
  const healthColor = overallHealth === "healthy" ? "text-green-400" : overallHealth === "offline" ? "text-red-400" : "text-yellow-400";

  const activityFeed = auditLogs.slice(0, 25).map(log => {
    const label = log.action?.replace(/_/g, " ") || "Event";
    const detail = log.object_label || "";
    return { date: log.created_date, label, detail };
  });

  const saveQuickTask = async () => {
    if (!taskTitle.trim()) return;
    setSavingTask(true);
    const t = await base44.entities.ClientTask.create({
      client_id: "ops",
      title: taskTitle,
      priority: taskPriority,
      status: "open",
      assigned_to: user?.id,
      assigned_name: user?.full_name || user?.email,
    });
    setTasks(prev => [t, ...prev]);
    setTaskTitle(""); setSavingTask(false); setShowQuickTask(false);
  };

  const quickActions = [
    { label: "Approval Queue", action: () => onNavigate("approvals"), badge: pending.length > 0 ? pending.length : null },
    { label: "Create Task", action: () => setShowQuickTask(true) },
    { label: "Send Notification", action: () => setShowNotifForm(true) },
    { label: "Active Clients", href: "/admin-portal?m=clients&s=active" },
    { label: "Leads", href: "/admin-portal?m=clients&s=leads" },
    { label: "Compliance", href: "/portal/admin/compliance" },
    { label: "System Health", href: "/portal/admin/system" },
    { label: "Analytics", action: () => onNavigate("reports") },
  ];

  return (
    <div className="px-6 sm:px-8 py-8">
      {/* Date line */}
      <div className="mb-8">
        <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-border mb-8">
        <KpiCard label="Total Clients" value={profiles.length} sub={`+${newThisWeek} this week`} onClick={() => onNavigate("approvals")} />
        <KpiCard label="Active Investors" value={approved.length} color="text-green-400" sub={`${active.length} fully active`} />
        <KpiCard label="Pending Approvals" value={pending.length} color={pending.length > 0 ? "text-yellow-400" : "text-foreground"} onClick={() => onNavigate("approvals")} />
        <KpiCard label="New Inquiries" value={newInquiries} color={newInquiries > 0 ? "text-blue-400" : "text-foreground"} />
        <KpiCard label="Connected Accounts" value={connectedAccounts} sub="MetaCopier active" />
        <KpiCard label="Open Tasks" value={openTasks.length} color={openTasks.length > 0 ? "text-yellow-400" : "text-foreground"} onClick={() => onNavigate("tasks")} />
        <KpiCard label="Passports Uploaded" value={passportsUploaded.length} />
        <KpiCard label="System Status" value={overallHealth.charAt(0).toUpperCase() + overallHealth.slice(1)} color={healthColor} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2 border border-border">
          <div className="px-5 py-4 border-b border-border bg-card flex items-center justify-between">
            <p className="font-mono text-[9px] uppercase tracking-[0.36em] text-muted-foreground">Live Activity</p>
            <span className="font-mono text-[9px] text-muted-foreground/40">{todaysLogs.length} events today</span>
          </div>
          <div className="divide-y divide-border/40 max-h-80 overflow-y-auto">
            {activityFeed.length === 0 && <p className="p-5 font-mono text-xs text-muted-foreground">No recent activity.</p>}
            {activityFeed.map((e, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-3 hover:bg-secondary/20 transition-colors">
                <span className="font-mono text-[9px] text-muted-foreground/40 whitespace-nowrap mt-0.5 w-14 flex-shrink-0">{fmtTime(e.date)}</span>
                <div>
                  <p className="font-mono text-[11px] text-foreground uppercase tracking-[0.1em]">{e.label}</p>
                  {e.detail && <p className="font-mono text-[10px] text-muted-foreground/60 mt-0.5">{e.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border border-border">
          <div className="px-5 py-4 border-b border-border bg-card">
            <p className="font-mono text-[9px] uppercase tracking-[0.36em] text-muted-foreground">Quick Actions</p>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {quickActions.map(qa => (
              qa.href ? (
                <Link key={qa.label} to={qa.href}
                  className="border border-border px-3 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground hover:border-foreground transition-colors text-center">
                  {qa.label}
                </Link>
              ) : (
                <button key={qa.label} onClick={qa.action}
                  className="border border-border px-3 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground hover:border-foreground transition-colors relative">
                  {qa.label}
                  {qa.badge > 0 && <span className="absolute top-1 right-1 font-mono text-[9px] bg-yellow-400/20 text-yellow-400 px-1">{qa.badge}</span>}
                </button>
              )
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Approval Queue Preview */}
        <div className="border border-border">
          <div className="px-5 py-4 border-b border-border bg-card flex items-center justify-between">
            <p className="font-mono text-[9px] uppercase tracking-[0.36em] text-muted-foreground">Approval Queue</p>
            {pending.length > 0 && <span className="font-mono text-[9px] bg-yellow-400/20 text-yellow-400 px-1.5 py-0.5">{pending.length}</span>}
          </div>
          {pending.length === 0 && <p className="p-5 font-mono text-xs text-muted-foreground">No pending approvals.</p>}
          {pending.slice(0, 5).map((p, i) => (
            <div key={p.id} className={`flex items-center justify-between px-5 py-3 ${i < Math.min(pending.length, 5) - 1 ? "border-b border-border/40" : ""}`}>
              <div>
                <p className="font-mono text-xs text-foreground">{p.full_name || p.email}</p>
                <p className="font-mono text-[10px] text-muted-foreground/60 mt-0.5">{fmtDate(p.created_date)} · {p.referred_by || "Direct"}</p>
              </div>
              <button onClick={() => updateStatus(p.id, "approved")}
                className="font-mono text-[9px] uppercase tracking-[0.16em] border border-green-400/30 px-2 py-1 text-green-400 hover:bg-green-400/10 transition-colors flex-shrink-0">
                Approve
              </button>
            </div>
          ))}
          {pending.length > 5 && (
            <button onClick={() => onNavigate("approvals")} className="w-full py-3 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors border-t border-border">
              View all {pending.length} →
            </button>
          )}
        </div>

        {/* Open Tasks */}
        <div className="border border-border">
          <div className="px-5 py-4 border-b border-border bg-card flex items-center justify-between">
            <p className="font-mono text-[9px] uppercase tracking-[0.36em] text-muted-foreground">Open Tasks</p>
            <button onClick={() => onNavigate("tasks")} className="font-mono text-[9px] text-muted-foreground hover:text-foreground">View all →</button>
          </div>
          {openTasks.length === 0 && <p className="p-5 font-mono text-xs text-muted-foreground">No open tasks.</p>}
          {openTasks.slice(0, 5).map((t, i) => (
            <div key={t.id} className={`flex items-center gap-3 px-5 py-3 ${i < Math.min(openTasks.length, 5) - 1 ? "border-b border-border/40" : ""}`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.priority === "high" ? "bg-red-400" : t.priority === "normal" ? "bg-yellow-400" : "bg-muted-foreground"}`} />
              <p className="font-mono text-xs text-foreground flex-1 truncate">{t.title}</p>
              <span className={`font-mono text-[9px] uppercase tracking-[0.14em] flex-shrink-0 ${t.status === "in_progress" ? "text-blue-400" : "text-muted-foreground/50"}`}>{t.status.replace("_", " ")}</span>
            </div>
          ))}
        </div>

        {/* Performance / Connections */}
        <div className="border border-border">
          <div className="px-5 py-4 border-b border-border bg-card">
            <p className="font-mono text-[9px] uppercase tracking-[0.36em] text-muted-foreground">Performance Overview</p>
          </div>
          <div className="divide-y divide-border/40">
            {[
              { label: "Connected Accounts", value: connectedAccounts },
              { label: "Digital Assets", value: profiles.filter(p => p.digital_metacopier_id).length },
              { label: "Commodities", value: profiles.filter(p => p.commodities_metacopier_id).length },
              { label: "Setup Complete", value: profiles.filter(p => p.onboarding_stage === "complete").length },
              { label: "Passports Uploaded", value: passportsUploaded.length },
              { label: "Admin Notifications", value: unreadNotifs.length, color: unreadNotifs.length > 0 ? "text-blue-400" : "" },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between px-5 py-3">
                <span className="font-mono text-[10px] text-muted-foreground">{row.label}</span>
                <span className={`font-mono text-xs ${row.color || "text-foreground"}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System health mini grid */}
      {health && (
        <div className="border border-border">
          <div className="px-5 py-4 border-b border-border bg-card">
            <p className="font-mono text-[9px] uppercase tracking-[0.36em] text-muted-foreground">System Health</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-border">
            {Object.entries(health.services || {}).map(([key, svc]) => {
              const dot = svc.status === "healthy" ? "bg-green-400" : svc.status === "offline" ? "bg-red-400" : "bg-yellow-400";
              const label = { database: "Database", auth: "Auth", email: "Email", metacopier: "MetaCopier", background_jobs: "Jobs", notifications: "Notifs" }[key] || key;
              return (
                <div key={key} className="flex flex-col items-center gap-2 py-4">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick task modal */}
      {showQuickTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowQuickTask(false)} />
          <div className="relative bg-background border border-border p-8 w-full max-w-md">
            <h3 className="font-heading text-xl text-foreground mb-5">Create Task</h3>
            <input type="text" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Task title..."
              className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground mb-3" />
            <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)}
              className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none focus:border-foreground mb-5">
              <option value="low">Low Priority</option>
              <option value="normal">Normal Priority</option>
              <option value="high">High Priority</option>
            </select>
            <div className="flex gap-3">
              <button onClick={saveQuickTask} disabled={savingTask || !taskTitle.trim()}
                className="flex-1 border border-foreground bg-foreground text-background font-mono text-[10px] uppercase tracking-[0.2em] py-3 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-40">
                {savingTask ? "..." : "Create"}
              </button>
              <button onClick={() => setShowQuickTask(false)} className="border border-border px-6 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Send notification modal */}
      {showNotifForm && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-background/70 backdrop-blur-sm" onClick={() => setShowNotifForm(false)} />
          <div className="w-full max-w-xl bg-background border-l border-border overflow-y-auto">
            <div className="flex items-center justify-between px-8 py-6 border-b border-border">
              <p className="font-heading text-xl text-foreground">Send Notification</p>
              <button onClick={() => setShowNotifForm(false)} className="font-mono text-xs text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="p-8">
              <SendNotification profiles={profiles} allUsers={allUsers} onSent={() => setShowNotifForm(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}