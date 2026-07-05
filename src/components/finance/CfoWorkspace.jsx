import React, { useState } from "react";
import { TrendingUp, TrendingDown, FileText, AlertCircle, CheckCircle, Clock } from "lucide-react";

const fmtFull = (n) => `$${Math.round(n).toLocaleString("en-US")}`;
const fmtEur = (n) => `€${Math.round(n).toLocaleString("en-US")}`;

// ── P&L STATEMENT ──────────────────────────────────────────────────────────────
const PNL = {
  revenue: [
    { label: "Management Fees (2%)", q1: 186400, q2: 204800, ytd: 391200 },
    { label: "Performance Fees (20%)", q1: 94200, q2: 122600, ytd: 216800 },
    { label: "Partnership Commissions", q1: 37200, q2: 51100, ytd: 88300 },
    { label: "Interest Income", q1: 4800, q2: 5200, ytd: 10000 },
  ],
  opex: [
    { label: "Salaries & Contractors", q1: 68000, q2: 72000, ytd: 140000 },
    { label: "Technology & Infrastructure", q1: 12400, q2: 13800, ytd: 26200 },
    { label: "Legal & Compliance", q1: 18000, q2: 14000, ytd: 32000 },
    { label: "Office & Operations", q1: 6200, q2: 6200, ytd: 12400 },
    { label: "Marketing & BD", q1: 4400, q2: 5800, ytd: 10200 },
    { label: "Audit & Accounting", q1: 8500, q2: 8500, ytd: 17000 },
  ],
};

const totalRevenue = (col) => PNL.revenue.reduce((s, r) => s + r[col], 0);
const totalOpex = (col) => PNL.opex.reduce((s, r) => s + r[col], 0);
const ebitda = (col) => totalRevenue(col) - totalOpex(col);

// ── BOARD REPORTS ──────────────────────────────────────────────────────────────
const BOARD_REPORTS = [
  { id: "BR-2026-Q1", title: "Q1 2026 Board Report", date: "15 Apr 2026", status: "approved", pages: 28 },
  { id: "BR-2026-Q2-DRAFT", title: "Q2 2026 Board Report (Draft)", date: "25 Jun 2026", status: "draft", pages: 31 },
  { id: "ANNUAL-2025", title: "Annual Report 2025", date: "20 Mar 2026", status: "approved", pages: 84 },
  { id: "INVESTOR-MAY", title: "Investor Letter — May 2026", date: "05 Jun 2026", status: "approved", pages: 6 },
];

// ── STRATEGIC DECISIONS ────────────────────────────────────────────────────────
const DECISIONS = [
  { id: "D-001", title: "Increase management fee to 2.5% for new clients", category: "Pricing", priority: "high", status: "pending_approval", raised: "18 Jun 2026" },
  { id: "D-002", title: "Expand to Dubai entity (ADGM registration)", category: "Expansion", priority: "high", status: "in_review", raised: "02 Jun 2026" },
  { id: "D-003", title: "Performance fee waterfall restructure", category: "Pricing", priority: "medium", status: "approved", raised: "15 May 2026" },
  { id: "D-004", title: "Hire FP&A analyst (Amsterdam)", category: "HR", priority: "medium", status: "pending_approval", raised: "10 Jun 2026" },
  { id: "D-005", title: "Bloomberg Terminal subscription renewal", category: "Technology", priority: "low", status: "approved", raised: "01 Jun 2026" },
];

const STATUS_STYLE = {
  draft: "text-amber-600 border-amber-600/30",
  pending_approval: "text-amber-600 border-amber-600/30",
  in_review: "text-sky-600 border-sky-600/30",
  approved: "text-emerald-600 border-emerald-600/30",
};
const STATUS_LABEL = { draft: "Draft", pending_approval: "Pending", in_review: "In Review", approved: "Approved" };

export default function CfoWorkspace() {
  const [pnlTab, setPnlTab] = useState("ytd");

  return (
    <div className="space-y-6">

      {/* P&L Statement */}
      <section className="border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/50">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">profit &amp; loss statement · 2026</p>
          <div className="flex gap-0">
            {["q1", "q2", "ytd"].map((t) => (
              <button key={t} onClick={() => setPnlTab(t)}
                className={`px-3 py-1 font-mono text-[9px] uppercase tracking-[0.2em] border-b-2 transition-colors ${pnlTab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <table className="w-full font-mono text-[11px]">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-5 py-2.5 text-left text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-normal">Line Item</th>
              <th className="px-5 py-2.5 text-right text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-normal">Amount (USD)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border"><td colSpan={2} className="px-5 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 bg-secondary/20">Revenue</td></tr>
            {PNL.revenue.map((r) => (
              <tr key={r.label} className="border-b border-border/40 hover:bg-secondary/20">
                <td className="px-5 py-2.5 text-foreground">{r.label}</td>
                <td className="px-5 py-2.5 text-right text-emerald-700 tabular-nums">{fmtFull(r[pnlTab])}</td>
              </tr>
            ))}
            <tr className="border-b border-border bg-secondary/30">
              <td className="px-5 py-2.5 text-foreground font-mono text-[11px] font-medium">Total Revenue</td>
              <td className="px-5 py-2.5 text-right text-emerald-700 tabular-nums">{fmtFull(totalRevenue(pnlTab))}</td>
            </tr>
            <tr className="border-b border-border"><td colSpan={2} className="px-5 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 bg-secondary/20">Operating Expenses</td></tr>
            {PNL.opex.map((r) => (
              <tr key={r.label} className="border-b border-border/40 hover:bg-secondary/20">
                <td className="px-5 py-2.5 text-foreground">{r.label}</td>
                <td className="px-5 py-2.5 text-right text-rose-700 tabular-nums">({fmtFull(r[pnlTab])})</td>
              </tr>
            ))}
            <tr className="border-b border-border bg-secondary/30">
              <td className="px-5 py-2.5 text-foreground font-mono text-[11px] font-medium">Total OpEx</td>
              <td className="px-5 py-2.5 text-right text-rose-700 tabular-nums">({fmtFull(totalOpex(pnlTab))})</td>
            </tr>
            <tr className="bg-foreground/5">
              <td className="px-5 py-3.5 text-foreground font-mono text-sm font-medium">EBITDA</td>
              <td className={`px-5 py-3.5 text-right font-mono text-sm tabular-nums ${ebitda(pnlTab) >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {ebitda(pnlTab) >= 0 ? fmtFull(ebitda(pnlTab)) : `(${fmtFull(Math.abs(ebitda(pnlTab)))})`}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Board Reports + Strategic Decisions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Board Reports */}
        <section className="border border-border bg-card">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/50">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">board reports &amp; investor letters</p>
            <span className="font-mono text-[9px] text-muted-foreground/60">{BOARD_REPORTS.length} documents</span>
          </div>
          <div className="divide-y divide-border/50">
            {BOARD_REPORTS.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] text-foreground truncate">{r.title}</p>
                    <p className="font-mono text-[9px] text-muted-foreground/60">{r.date} · {r.pages} pages</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <span className={`font-mono text-[9px] uppercase tracking-[0.14em] border px-2 py-0.5 ${STATUS_STYLE[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                  <button className="font-mono text-[9px] text-muted-foreground hover:text-foreground transition-colors">view →</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Strategic Decisions */}
        <section className="border border-border bg-card">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/50">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">strategic decisions &amp; proposals</p>
            <span className="font-mono text-[9px] text-amber-600">
              {DECISIONS.filter(d => d.status === "pending_approval").length} awaiting approval
            </span>
          </div>
          <div className="divide-y divide-border/50">
            {DECISIONS.map((d) => (
              <div key={d.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[9px] text-muted-foreground/50">{d.id}</span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground border border-border px-1.5 py-0.5">{d.category}</span>
                      {d.priority === "high" && <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-rose-600">● high</span>}
                    </div>
                    <p className="font-mono text-[11px] text-foreground leading-5">{d.title}</p>
                    <p className="font-mono text-[9px] text-muted-foreground/50 mt-0.5">Raised: {d.raised}</p>
                  </div>
                  <span className={`flex-shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] border px-2 py-0.5 ${STATUS_STYLE[d.status]}`}>
                    {STATUS_LABEL[d.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}