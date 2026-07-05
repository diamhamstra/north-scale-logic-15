import React from "react";
import FinancialsSection from "@/components/admin/mc/FinancialsSection";
import CfoSyncHub from "@/components/admin/mc/CfoSyncHub";

const fmtFull = (n) => (n == null ? "—" : `$${Math.round(n).toLocaleString("en-US")}`);

const KPI_CARDS = [
  { label: "Total AUM", value: "$5,141,500", delta: "+3.2%", deltaUp: true, sub: "live synced balances" },
  { label: "MTD Revenue", value: "$412,800", delta: "+18.4%", deltaUp: true, sub: "management + performance fees" },
  { label: "Pending Payouts", value: "$97,200", delta: null, sub: "next settlement: 30 Jun" },
  { label: "Operating Costs MTD", value: "$38,450", delta: "-4.1%", deltaUp: false, sub: "vs prior month" },
  { label: "Cash Runway", value: "14.2 months", delta: null, sub: "at current burn rate" },
  { label: "Open Invoices", value: "7", delta: null, sub: "€184,300 outstanding" },
];

export default function FinanceDashboard({ financials, loading }) {
  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {KPI_CARDS.map((k) => (
          <div key={k.label} className="border border-border bg-card p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground mb-2">{k.label}</p>
            <p className="font-mono text-xl text-foreground tabular-nums leading-none">{k.value}</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              {k.delta && (
                <span className={`font-mono text-[9px] ${k.deltaUp ? "text-emerald-600" : "text-rose-600"}`}>
                  {k.deltaUp ? "▲" : "▼"} {k.delta}
                </span>
              )}
              <span className="font-mono text-[9px] text-muted-foreground/50">{k.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main financials */}
      <FinancialsSection financials={financials} loading={loading} />

      {/* CFO sync */}
      <CfoSyncHub />
    </div>
  );
}