import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { invokeFunction } from "@/lib/invokeFunction";

const STATUS_CONFIG = {
  healthy: { label: "Healthy", color: "text-green-400", dot: "bg-green-400", border: "border-green-400/20" },
  warning: { label: "Warning", color: "text-yellow-400", dot: "bg-yellow-400", border: "border-yellow-400/20" },
  offline: { label: "Offline", color: "text-red-400", dot: "bg-red-400", border: "border-red-400/20" },
};

const SERVICE_LABELS = {
  database: "Database",
  auth: "Authentication",
  email: "Email Service",
  metacopier: "MetaCopier API",
  background_jobs: "Background Jobs",
  notifications: "Notification Service",
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.warning;
  return (
    <div className={`flex items-center gap-2 border ${cfg.border} px-3 py-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${cfg.color}`}>{cfg.label}</span>
    </div>
  );
}

export default function SystemHealth() {
  const [user, setUser] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [tab, setTab] = useState("health");
  const [crmRecords, setCrmRecords] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!me || me.role !== "admin") { window.location.href = "/admin-login"; return; }
        setUser(me);
        await Promise.all([
          runHealthCheck(false),
          loadAuditLogs(),
          loadCRM(),
        ]);
      } catch { window.location.href = "/admin-login"; }
      setLoading(false);
    })();
  }, []);

  const runHealthCheck = async (showChecking = true) => {
    if (showChecking) setChecking(true);
    try {
      const res = await invokeFunction("systemHealth", {});
      setHealth(res.data);
    } catch (e) {
      setHealth({ overall: "offline", error: e.message, services: {} });
    }
    if (showChecking) setChecking(false);
  };

  const loadAuditLogs = async () => {
    const logs = await base44.entities.AuditLog.list("-created_date", 100);
    setAuditLogs(logs);
  };

  const loadCRM = async () => {
    const records = await base44.entities.CRMRecord.list("-created_date", 200);
    setCrmRecords(records);
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  const overallCfg = STATUS_CONFIG[health?.overall] || STATUS_CONFIG.warning;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-7xl w-full px-5 sm:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-heading text-xl tracking-[0.22em] text-foreground">north scale_</Link>
            <span className="hidden sm:block font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground/50">/ Admin / System</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-yellow-400/80 border border-yellow-400/20 px-2 py-0.5">Admin</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/admin-portal" className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
            <button onClick={() => base44.auth.logout("/admin-login")} className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors">Sign Out</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl w-full px-5 sm:px-8 py-12">
        <div className="mb-10 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-3">Operations</p>
            <h1 className="font-heading text-4xl text-foreground">System Status</h1>
          </div>
          <button
            onClick={() => runHealthCheck(true)}
            disabled={checking}
            className="border border-foreground bg-foreground text-background font-mono text-[10px] uppercase tracking-[0.24em] px-6 py-3 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-50"
          >
            {checking ? "Checking..." : "Run Health Check"}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border border-border font-mono text-xs uppercase tracking-[0.2em] w-fit mb-10">
          {["health", "audit", "crm"].map((t, i) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-2.5 transition-colors ${i > 0 ? "border-l border-border" : ""} ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "health" ? "System Health" : t === "audit" ? "Audit Log" : "CRM"}
            </button>
          ))}
        </div>

        {/* ── HEALTH TAB ── */}
        {tab === "health" && (
          <>
            {/* Overall status banner */}
            {health && (
              <div className={`border ${overallCfg.border} p-6 mb-8 flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                  <span className={`w-2.5 h-2.5 rounded-full ${overallCfg.dot}`} />
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-0.5">Overall Status</p>
                    <p className={`font-mono text-lg ${overallCfg.color}`}>{overallCfg.label}</p>
                  </div>
                </div>
                {health.checked_at && (
                  <p className="font-mono text-[10px] text-muted-foreground/50">
                    Last checked: {formatDate(health.checked_at)}
                  </p>
                )}
              </div>
            )}

            {/* Service grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {health && Object.entries(health.services || {}).map(([key, svc]) => {
                const cfg = STATUS_CONFIG[svc.status] || STATUS_CONFIG.warning;
                return (
                  <div key={key} className={`border ${cfg.border} p-5`}>
                    <div className="flex items-start justify-between mb-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{SERVICE_LABELS[key] || key}</p>
                      <StatusBadge status={svc.status} />
                    </div>
                    {svc.latency_ms !== undefined && (
                      <p className="font-mono text-[10px] text-muted-foreground/60">Latency: {svc.latency_ms}ms</p>
                    )}
                    {svc.provider && (
                      <p className="font-mono text-[10px] text-muted-foreground/60">Provider: {svc.provider}</p>
                    )}
                    {svc.last_run && (
                      <p className="font-mono text-[10px] text-muted-foreground/60">Last run: {formatDate(svc.last_run)}</p>
                    )}
                    {svc.age_hours !== undefined && (
                      <p className="font-mono text-[10px] text-muted-foreground/60">{svc.age_hours}h ago</p>
                    )}
                    {svc.reason && (
                      <p className="font-mono text-[10px] text-yellow-400/70 mt-1">{svc.reason}</p>
                    )}
                    {svc.error && (
                      <p className="font-mono text-[10px] text-red-400/70 mt-1 truncate">{svc.error}</p>
                    )}
                  </div>
                );
              })}

              {!health && (
                <div className="border border-border p-5 col-span-3 text-center">
                  <p className="font-mono text-xs text-muted-foreground">Run a health check to view service status.</p>
                </div>
              )}
            </div>

            {/* Scheduled Jobs */}
            <div className="border border-border">
              <div className="px-6 py-4 border-b border-border bg-secondary">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Scheduled Jobs</p>
              </div>
              {[
                { name: "MetaCopier Performance Sync", schedule: "Every hour", action: "PERFORMANCE_SYNC_RUN" },
                { name: "Daily Maintenance", schedule: "Daily at 03:00 UTC", action: "DAILY_MAINTENANCE_RUN" },
              ].map(job => {
                const lastRun = auditLogs.find(l => l.action === job.action);
                return (
                  <div key={job.name} className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                    <div>
                      <p className="font-mono text-xs text-foreground">{job.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{job.schedule}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[10px] text-muted-foreground/60">Last run</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{lastRun ? formatDate(lastRun.created_date) : "No runs recorded"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── AUDIT LOG TAB ── */}
        {tab === "audit" && (
          <div className="border border-border overflow-x-auto">
            <table className="w-full font-mono text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  {["Timestamp", "Action", "Object", "User", "Actor"].map(h => (
                    <th key={h} className="px-4 py-4 text-left uppercase tracking-[0.18em] text-muted-foreground font-normal whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No audit events recorded.</td></tr>
                )}
                {auditLogs.map(log => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(log.created_date)}</td>
                    <td className="px-4 py-3 text-foreground whitespace-nowrap">
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] border border-border px-2 py-0.5">
                        {log.action?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span>{log.object_type && <span className="text-muted-foreground/50">{log.object_type} · </span>}</span>
                      {log.object_label || log.object_id || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{log.user_id === "system" ? <span className="text-muted-foreground/40">system</span> : log.user_id?.slice(0, 8) + "..."}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.actor_id === "system" ? <span className="text-muted-foreground/40">system</span> : log.actor_id?.slice(0, 8) + "..."}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-border">
              <p className="font-mono text-[10px] text-muted-foreground/40">Showing {auditLogs.length} most recent events</p>
            </div>
          </div>
        )}

        {/* ── CRM TAB ── */}
        {tab === "crm" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 border border-border mb-8">
              {[
                { label: "Total Records", value: crmRecords.length },
                { label: "Leads", value: crmRecords.filter(r => r.client_status === "lead").length },
                { label: "Pending", value: crmRecords.filter(r => r.client_status === "pending").length, color: "text-yellow-400" },
                { label: "Approved", value: crmRecords.filter(r => r.client_status === "approved").length, color: "text-blue-400" },
                { label: "Active", value: crmRecords.filter(r => r.client_status === "active").length, color: "text-green-400" },
              ].map((s, i) => (
                <div key={s.label} className={`p-5 ${i < 4 ? "border-r border-border" : ""}`}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-2">{s.label}</p>
                  <p className={`font-heading text-3xl ${s.color || "text-foreground"}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="border border-border overflow-x-auto">
              <table className="w-full font-mono text-xs min-w-[800px]">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    {["Name", "Email", "Source", "Status", "Engine", "Referred By", "Registration", "Approval"].map(h => (
                      <th key={h} className="px-4 py-4 text-left uppercase tracking-[0.18em] text-muted-foreground font-normal whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {crmRecords.length === 0 && (
                    <tr><td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">No CRM records.</td></tr>
                  )}
                  {crmRecords.map(r => {
                    const statusColors = { lead: "text-muted-foreground", pending: "text-yellow-400", approved: "text-blue-400", active: "text-green-400", rejected: "text-red-400", inactive: "text-muted-foreground/50" };
                    return (
                      <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3 text-foreground whitespace-nowrap">{r.full_name || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.email}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{r.lead_source?.replace(/_/g, " ") || "—"}</td>
                        <td className={`px-4 py-3 whitespace-nowrap uppercase tracking-[0.14em] text-[10px] ${statusColors[r.client_status] || "text-muted-foreground"}`}>
                          {r.client_status || "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{r.engine || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{r.referred_by || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{r.registration_date ? new Date(r.registration_date).toLocaleDateString("en-GB") : "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{r.approval_date ? new Date(r.approval_date).toLocaleDateString("en-GB") : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}