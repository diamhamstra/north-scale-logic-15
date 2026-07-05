import React from "react";

const SERVICE_LABELS = {
  database: "Database",
  auth: "Authentication",
  email: "Email Service",
  metacopier: "MetaCopier API",
  background_jobs: "Background Jobs",
  notifications: "Notifications",
};

const dotColor = (s) => (s === "healthy" ? "bg-emerald-500" : s === "offline" ? "bg-rose-500" : "bg-amber-500");
const txtColor = (s) => (s === "healthy" ? "text-emerald-600" : s === "offline" ? "text-rose-600" : "text-amber-600");

export default function SecuritySection({ health, auditLogs = [], profiles = [], tasks = [], onNavigate }) {
  const services = health?.services ? Object.entries(health.services) : [];

  // Security log status — events in last 24h
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const events24h = auditLogs.filter((l) => new Date(l.created_date).getTime() > dayAgo).length;
  const lastEvent = auditLogs[0];

  // Multi-sig / Safe style signature queue: each item is a proposal awaiting a founder action
  const signatureQueue = [
    ...profiles.filter((p) => p.access_status === "pending").map((p) => ({ id: `appr_${p.id}`, label: `Approve access · ${p.full_name || p.email}`, type: "ACCESS" })),
    ...profiles.filter((p) => p.passport_url && p.passport_status !== "approved").map((p) => ({ id: `kyc_${p.id}`, label: `Sign off KYC · ${p.full_name || p.email}`, type: "KYC" })),
    ...tasks.filter((t) => t.priority === "high" && t.status !== "completed").map((t) => ({ id: `task_${t.id}`, label: t.title, type: "OPS" })),
  ];

  return (
    <section className="border border-border bg-card">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/50">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">tech &amp; security matrix</p>
        <span className={`font-mono text-[9px] uppercase tracking-[0.2em] ${health?.overall === "healthy" ? "text-emerald-600" : health?.overall === "offline" ? "text-rose-600" : "text-amber-600"}`}>
          {health?.overall || "checking"}
        </span>
      </div>

      {/* Infrastructure status grid */}
      <div className="grid grid-cols-2 border-b border-border">
        {services.length === 0 && (
          <div className="col-span-2 px-5 py-5 font-mono text-[11px] text-muted-foreground/60">Running health check…</div>
        )}
        {services.map(([key, svc], i) => (
          <div key={key} className={`px-5 py-3 ${i % 2 === 0 ? "border-r border-border" : ""} border-b border-border/40`}>
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] text-foreground">{SERVICE_LABELS[key] || key}</p>
              <span className={`w-2 h-2 rounded-full ${dotColor(svc.status)}`} />
            </div>
            <p className={`font-mono text-[9px] uppercase tracking-[0.16em] mt-1 ${txtColor(svc.status)}`}>
              {svc.status}{svc.latency_ms !== undefined ? ` · ${svc.latency_ms}ms` : ""}
            </p>
          </div>
        ))}
      </div>

      {/* Security log */}
      <div className="flex items-stretch border-b border-border">
        <div className="flex-1 px-5 py-3 border-r border-border">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground mb-1">audit events · 24h</p>
          <p className="font-heading text-2xl text-foreground leading-none">{events24h}</p>
        </div>
        <div className="flex-1 px-5 py-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground mb-1">last logged event</p>
          <p className="font-mono text-[10px] text-foreground truncate">{lastEvent ? (lastEvent.action || "").replace(/_/g, " ").toLowerCase() : "—"}</p>
          <p className="font-mono text-[9px] text-muted-foreground/60 mt-0.5">
            {lastEvent ? new Date(lastEvent.created_date).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
          </p>
        </div>
      </div>

      {/* Multi-sig / Safe signature queue */}
      <div>
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-border/50">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">signature queue · awaiting founders</p>
          <span className={`font-mono text-[9px] ${signatureQueue.length > 0 ? "text-amber-600" : "text-emerald-600"}`}>{signatureQueue.length} pending</span>
        </div>
        <div className="divide-y divide-border/40 max-h-44 overflow-y-auto">
          {signatureQueue.length === 0 && <p className="px-5 py-4 font-mono text-[11px] text-muted-foreground/50">No proposals awaiting signature.</p>}
          {signatureQueue.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-5 py-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground border border-border px-1.5 py-0.5 flex-shrink-0">{p.type}</span>
                <span className="font-mono text-[11px] text-foreground truncate">{p.label}</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 ml-3" />
            </div>
          ))}
        </div>
        <button
          onClick={() => onNavigate?.("system", "health")}
          className="w-full px-5 py-3 border-t border-border font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors text-left"
        >
          open full system health →
        </button>
      </div>
    </section>
  );
}