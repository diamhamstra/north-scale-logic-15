import React, { useState } from "react";
import { AlertCircle, CheckCircle, Clock, TrendingUp, TrendingDown } from "lucide-react";

const fmtFull = (n) => `$${Math.round(n).toLocaleString("en-US")}`;
const fmtEur = (n) => `€${Math.round(n).toLocaleString("en-US")}`;
const pct = (a, b) => b ? `${((a / b - 1) * 100).toFixed(1)}%` : "—";
const pctColor = (a, b) => a >= b ? "text-emerald-600" : "text-rose-600";

// ── BUDGET VS ACTUAL ──────────────────────────────────────────────────────────
const BUDGET_LINES = [
  { category: "Salaries & Contractors", budget: 280000, actual: 140000, note: "H1 consumed" },
  { category: "Technology & Infra", budget: 60000, actual: 26200, note: "on track" },
  { category: "Legal & Compliance", budget: 72000, actual: 32000, note: "on track" },
  { category: "Office & Operations", budget: 26000, actual: 12400, note: "on track" },
  { category: "Marketing & BD", budget: 24000, actual: 10200, note: "underspend YTD" },
  { category: "Audit & Accounting", budget: 36000, actual: 17000, note: "on track" },
];

// ── INTERNAL CONTROLS CHECKLIST ───────────────────────────────────────────────
const CONTROLS = [
  { id: "IC-001", control: "Monthly bank reconciliation — EUR account", frequency: "Monthly", last: "31 May 2026", status: "completed", owner: "Controller" },
  { id: "IC-002", control: "Monthly bank reconciliation — USD account", frequency: "Monthly", last: "31 May 2026", status: "completed", owner: "Controller" },
  { id: "IC-003", control: "Broker statement reconciliation (MT5)", frequency: "Monthly", last: "31 May 2026", status: "due", owner: "Accountant" },
  { id: "IC-004", control: "Segregated client funds verification", frequency: "Weekly", last: "20 Jun 2026", status: "due", owner: "CFO" },
  { id: "IC-005", control: "Performance fee calculation review", frequency: "Quarterly", last: "31 Mar 2026", status: "due", owner: "Controller" },
  { id: "IC-006", control: "Expense approval threshold check", frequency: "Monthly", last: "31 May 2026", status: "completed", owner: "Controller" },
  { id: "IC-007", control: "FX hedge review", frequency: "Monthly", last: "31 May 2026", status: "completed", owner: "CFO" },
  { id: "IC-008", control: "Payroll accuracy sign-off", frequency: "Monthly", last: "31 May 2026", status: "completed", owner: "HR/Controller" },
];

// ── VARIANCE ALERTS ────────────────────────────────────────────────────────────
const VARIANCES = [
  { id: "VAR-001", item: "Performance fees Q2", expected: 122600, actual: 118400, severity: "low", note: "Lower AUM growth than forecast" },
  { id: "VAR-002", item: "Legal costs June", expected: 7000, actual: 14000, severity: "high", note: "Unplanned investor agreement revision" },
  { id: "VAR-003", item: "Technology costs June", expected: 6500, actual: 6200, severity: "low", note: "Minor positive variance" },
  { id: "VAR-004", item: "BD Travel — Dubai", expected: 0, actual: 3100, severity: "medium", note: "Unbudgeted trip, pre-approved verbally" },
];

const SEV_STYLE = {
  high: "text-rose-600 border-rose-600/30",
  medium: "text-amber-600 border-amber-600/30",
  low: "text-sky-600 border-sky-600/30",
};

const CTRL_STYLE = {
  completed: "text-emerald-600",
  due: "text-amber-600",
  overdue: "text-rose-600",
};

export default function ControllerWorkspace() {
  const totalBudget = BUDGET_LINES.reduce((s, l) => s + l.budget, 0);
  const totalActual = BUDGET_LINES.reduce((s, l) => s + l.actual, 0);

  return (
    <div className="space-y-6">

      {/* Budget vs Actual */}
      <section className="border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/50">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">budget vs actual · fy 2026</p>
          <span className="font-mono text-[9px] text-muted-foreground/60">H1 consumed · 50% of year elapsed</span>
        </div>
        <table className="w-full font-mono text-[11px]">
          <thead>
            <tr className="border-b border-border">
              {["Category", "Annual Budget", "YTD Actual", "YTD %", "Burn Rate", "Note"].map((h, i) => (
                <th key={h} className={`px-5 py-2.5 text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-normal ${i >= 1 && i <= 3 ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BUDGET_LINES.map((l) => {
              const ratio = l.actual / l.budget;
              const barWidth = Math.min(100, Math.round(ratio * 100));
              return (
                <tr key={l.category} className="border-b border-border/50 hover:bg-secondary/20">
                  <td className="px-5 py-3 text-foreground">{l.category}</td>
                  <td className="px-5 py-3 text-right text-muted-foreground tabular-nums">{fmtFull(l.budget)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{fmtFull(l.actual)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full ${ratio > 0.9 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${barWidth}%` }} />
                      </div>
                      <span className={`tabular-nums ${ratio > 1 ? "text-rose-600" : ratio > 0.9 ? "text-amber-600" : "text-muted-foreground"}`}>
                        {Math.round(ratio * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{fmtFull(Math.round(l.actual / 6))}/mo</td>
                  <td className="px-5 py-3 text-muted-foreground/60 text-[10px]">{l.note}</td>
                </tr>
              );
            })}
            <tr className="bg-secondary/30">
              <td className="px-5 py-3 text-foreground font-medium">Total</td>
              <td className="px-5 py-3 text-right text-foreground tabular-nums">{fmtFull(totalBudget)}</td>
              <td className="px-5 py-3 text-right text-foreground tabular-nums">{fmtFull(totalActual)}</td>
              <td className="px-5 py-3 text-right text-foreground tabular-nums">{Math.round(totalActual / totalBudget * 100)}%</td>
              <td className="px-5 py-3 text-muted-foreground">{fmtFull(Math.round(totalActual / 6))}/mo</td>
              <td />
            </tr>
          </tbody>
        </table>
      </section>

      {/* Controls + Variances */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Internal Controls */}
        <section className="border border-border bg-card">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/50">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">internal controls checklist</p>
            <span className="font-mono text-[9px] text-amber-600">{CONTROLS.filter(c => c.status === "due").length} due now</span>
          </div>
          <div className="divide-y divide-border/50">
            {CONTROLS.map((c) => (
              <div key={c.id} className="flex items-start justify-between px-5 py-3 gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-[9px] text-muted-foreground/40">{c.id}</span>
                    <span className="font-mono text-[9px] text-muted-foreground/50">{c.frequency}</span>
                  </div>
                  <p className="font-mono text-[11px] text-foreground leading-5">{c.control}</p>
                  <p className="font-mono text-[9px] text-muted-foreground/50 mt-0.5">Owner: {c.owner} · Last: {c.last}</p>
                </div>
                <span className={`font-mono text-[9px] uppercase tracking-[0.14em] flex-shrink-0 ${CTRL_STYLE[c.status]}`}>
                  {c.status === "completed" ? "✓ done" : c.status === "due" ? "● due" : "! overdue"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Variance Alerts */}
        <section className="border border-border bg-card">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/50">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">variance alerts</p>
            <span className="font-mono text-[9px] text-rose-600">{VARIANCES.filter(v => v.severity === "high").length} high severity</span>
          </div>
          <div className="divide-y divide-border/50">
            {VARIANCES.map((v) => (
              <div key={v.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[9px] text-muted-foreground/40">{v.id}</span>
                      <span className={`font-mono text-[9px] uppercase tracking-[0.12em] border px-1.5 py-0.5 ${SEV_STYLE[v.severity]}`}>{v.severity}</span>
                    </div>
                    <p className="font-mono text-[11px] text-foreground">{v.item}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[10px] font-mono mb-2">
                  <div>
                    <p className="text-muted-foreground/50 mb-0.5">Expected</p>
                    <p className="text-foreground tabular-nums">{fmtFull(v.expected)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground/50 mb-0.5">Actual</p>
                    <p className={`tabular-nums ${v.actual > v.expected ? "text-rose-600" : "text-emerald-600"}`}>{fmtFull(v.actual)}</p>
                  </div>
                </div>
                <p className="font-mono text-[9px] text-muted-foreground/60 leading-5">{v.note}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}