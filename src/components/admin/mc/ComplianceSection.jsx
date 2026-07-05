import React from "react";

function QueueRow({ items, emptyLabel, onClick, accent }) {
  if (items.length === 0) {
    return <p className="px-5 py-4 font-mono text-[11px] text-muted-foreground/50">{emptyLabel}</p>;
  }
  return (
    <div className="divide-y divide-border/40">
      {items.slice(0, 5).map((it) => (
        <button
          key={it.id}
          onClick={() => onClick?.(it)}
          className="w-full flex items-center justify-between px-5 py-2.5 text-left hover:bg-secondary/40 transition-colors"
        >
          <div className="min-w-0">
            <p className="font-mono text-[11px] text-foreground truncate">{it.full_name || it.email}</p>
            <p className="font-mono text-[9px] text-muted-foreground/60 truncate">{it.email}</p>
          </div>
          <span className={`font-mono text-[9px] uppercase tracking-[0.16em] flex-shrink-0 ml-3 ${accent}`}>{it.tag}</span>
        </button>
      ))}
    </div>
  );
}

export default function ComplianceSection({ profiles = [], inquiries = [], onNavigate, onSelectProfile }) {
  const pendingApprovals = profiles.filter((p) => p.access_status === "pending").map((p) => ({ ...p, tag: "approve" }));
  const pendingKyc = profiles
    .filter((p) => p.passport_url && p.passport_status !== "approved")
    .map((p) => ({ ...p, tag: "verify id" }));
  const outstandingDocs = profiles
    .filter((p) => p.access_status === "approved" && p.onboarding_stage !== "complete")
    .map((p) => ({ ...p, tag: p.onboarding_stage || "profile" }));
  const openInquiries = inquiries.filter((i) => i.status === "under_review");

  const totalUrgent = pendingApprovals.length + pendingKyc.length + outstandingDocs.length;

  const groups = [
    { key: "approvals", title: "access approvals", items: pendingApprovals, empty: "No pending access requests.", accent: "text-amber-600", onClick: (it) => onSelectProfile?.(it) },
    { key: "kyc", title: "identity verification · kyc/aml", items: pendingKyc, empty: "No identity documents awaiting review.", accent: "text-blue-600", onClick: (it) => onSelectProfile?.(it) },
    { key: "docs", title: "document approvals", items: outstandingDocs, empty: "All approved clients have cleared documents.", accent: "text-purple-600", onClick: (it) => onSelectProfile?.(it) },
  ];

  return (
    <section className="border border-border bg-card">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/50">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">legal &amp; compliance corner</p>
        <span className={`font-mono text-[9px] uppercase tracking-[0.2em] ${totalUrgent > 0 ? "text-amber-600" : "text-emerald-600"}`}>
          {totalUrgent} to clear
        </span>
      </div>

      {groups.map((g) => (
        <div key={g.key} className="border-b border-border last:border-b-0">
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-border/50">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">{g.title}</p>
            <span className="font-mono text-[9px] text-muted-foreground/60">{g.items.length}</span>
          </div>
          <QueueRow items={g.items} emptyLabel={g.empty} onClick={g.onClick} accent={g.accent} />
        </div>
      ))}

      {/* Open inquiries */}
      <div className="border-t border-border">
        <button
          onClick={() => onNavigate?.("clients", "leads")}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-secondary/40 transition-colors"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">open inbound inquiries</span>
          <span className={`font-mono text-[11px] ${openInquiries.length > 0 ? "text-foreground" : "text-muted-foreground/60"}`}>{openInquiries.length} →</span>
        </button>
      </div>
    </section>
  );
}