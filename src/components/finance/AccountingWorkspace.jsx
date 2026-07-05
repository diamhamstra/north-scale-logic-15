import React, { useState } from "react";
import { Receipt, AlertTriangle, CheckCircle, Clock, Plus } from "lucide-react";

const fmtEur = (n) => `€${Math.round(n).toLocaleString("en-US")}`;
const fmtFull = (n) => `$${Math.round(n).toLocaleString("en-US")}`;

// ── INVOICES ───────────────────────────────────────────────────────────────────
const INVOICES = [
  { id: "INV-2026-041", client: "Broker Partners NL BV", amount: 42000, currency: "EUR", issued: "01 Jun 2026", due: "30 Jun 2026", status: "overdue", daysOverdue: 5 },
  { id: "INV-2026-042", client: "NS Technology Ltd", amount: 8400, currency: "EUR", issued: "01 Jun 2026", due: "30 Jun 2026", status: "open", daysOverdue: 0 },
  { id: "INV-2026-043", client: "Client — Digital Engine Q2", amount: 14800, currency: "USD", issued: "10 Jun 2026", due: "10 Jul 2026", status: "open", daysOverdue: 0 },
  { id: "INV-2026-044", client: "Client — Commodities Engine Q2", amount: 22600, currency: "USD", issued: "10 Jun 2026", due: "10 Jul 2026", status: "open", daysOverdue: 0 },
  { id: "INV-2026-040", client: "ZUIDAS Referral Partner", amount: 16200, currency: "EUR", issued: "01 May 2026", due: "31 May 2026", status: "paid", daysOverdue: 0 },
  { id: "INV-2026-039", client: "Dubai Bay Partners", amount: 9800, currency: "USD", issued: "01 May 2026", due: "31 May 2026", status: "paid", daysOverdue: 0 },
];

// ── EXPENSES ──────────────────────────────────────────────────────────────────
const EXPENSES = [
  { id: "EXP-426", description: "Bloomberg Terminal — Jun 2026", category: "Technology", amount: 2000, currency: "USD", date: "01 Jun 2026", approved: true },
  { id: "EXP-425", description: "AWS / Cloud Infrastructure", category: "Technology", amount: 1240, currency: "USD", date: "01 Jun 2026", approved: true },
  { id: "EXP-424", description: "Amsterdam Office Rent — Jun 2026", category: "Office", amount: 3800, currency: "EUR", date: "01 Jun 2026", approved: true },
  { id: "EXP-423", description: "Legal Review — Investor Agreement Update", category: "Legal", amount: 4200, currency: "EUR", date: "12 Jun 2026", approved: false },
  { id: "EXP-422", description: "Travel — Dubai BD Trip", category: "Travel", amount: 3100, currency: "EUR", date: "15 Jun 2026", approved: false },
  { id: "EXP-421", description: "Deloitte Audit Retainer Q2", category: "Audit", amount: 8500, currency: "EUR", date: "01 Jun 2026", approved: true },
];

// ── BOOKKEEPING TASKS ─────────────────────────────────────────────────────────
const TASKS_BK = [
  { id: "BK-001", label: "Reconcile broker MT5 statements — June", due: "30 Jun 2026", status: "open", priority: "high" },
  { id: "BK-002", label: "Post Q2 performance fee accruals", due: "30 Jun 2026", status: "open", priority: "high" },
  { id: "BK-003", label: "VAT return — Q2 2026 (NL)", due: "31 Jul 2026", status: "open", priority: "medium" },
  { id: "BK-004", label: "Submit management accounts to Deloitte", due: "15 Jul 2026", status: "open", priority: "medium" },
  { id: "BK-005", label: "Payroll processing — July 2026", due: "25 Jul 2026", status: "open", priority: "medium" },
  { id: "BK-006", label: "Annual financial statements 2025 — final sign-off", due: "01 Aug 2026", status: "in_progress", priority: "high" },
];

const INV_STATUS = {
  overdue: "text-rose-600 border-rose-600/30",
  open: "text-amber-600 border-amber-600/30",
  paid: "text-emerald-600 border-emerald-600/30",
};

const PRIORITY_COLOR = { high: "text-rose-600", medium: "text-amber-600", low: "text-muted-foreground" };

const CAT_COLOR = {
  Technology: "text-sky-600 border-sky-600/30",
  Office: "text-purple-600 border-purple-600/30",
  Legal: "text-amber-600 border-amber-600/30",
  Audit: "text-blue-600 border-blue-600/30",
  Travel: "text-orange-600 border-orange-600/30",
};

export default function AccountingWorkspace() {
  const [invoiceFilter, setInvoiceFilter] = useState("all");

  const filteredInvoices = invoiceFilter === "all" ? INVOICES
    : INVOICES.filter(i => i.status === invoiceFilter);

  const totalOpen = INVOICES.filter(i => i.status !== "paid").reduce((s, i) => s + i.amount, 0);
  const totalOverdue = INVOICES.filter(i => i.status === "overdue").reduce((s, i) => s + i.amount, 0);
  const pendingExpenses = EXPENSES.filter(e => !e.approved).length;

  return (
    <div className="space-y-6">

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Open Invoices", value: `${INVOICES.filter(i => i.status !== "paid").length}`, sub: `~€${(totalOpen).toLocaleString()} outstanding` },
          { label: "Overdue", value: `${INVOICES.filter(i => i.status === "overdue").length}`, sub: `€${totalOverdue.toLocaleString()} at risk`, alert: true },
          { label: "Pending Expenses", value: `${pendingExpenses}`, sub: "awaiting approval", alert: pendingExpenses > 0 },
          { label: "Next VAT Deadline", value: "31 Jul", sub: "Q2 2026 · Netherlands" },
        ].map((c) => (
          <div key={c.label} className={`border p-4 bg-card ${c.alert ? "border-amber-600/30" : "border-border"}`}>
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5">{c.label}</p>
            <p className={`font-mono text-2xl tabular-nums leading-none ${c.alert ? "text-amber-600" : "text-foreground"}`}>{c.value}</p>
            <p className="font-mono text-[9px] text-muted-foreground/60 mt-1.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Invoices */}
      <section className="border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/50">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">invoice ledger</p>
          <div className="flex gap-0">
            {["all", "open", "overdue", "paid"].map((f) => (
              <button key={f} onClick={() => setInvoiceFilter(f)}
                className={`px-3 py-1 font-mono text-[9px] uppercase tracking-[0.16em] border-b-2 transition-colors ${invoiceFilter === f ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-[11px] min-w-[700px]">
            <thead>
              <tr className="border-b border-border">
                {["Invoice #", "Client", "Amount", "Issued", "Due", "Status"].map((h, i) => (
                  <th key={h} className={`px-5 py-2.5 text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-normal ${i >= 2 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-secondary/20">
                  <td className="px-5 py-3 text-foreground">{inv.id}</td>
                  <td className="px-5 py-3 text-muted-foreground">{inv.client}</td>
                  <td className="px-5 py-3 text-right text-foreground tabular-nums">
                    {inv.currency === "EUR" ? fmtEur(inv.amount) : fmtFull(inv.amount)}
                  </td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{inv.issued}</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{inv.due}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`font-mono text-[9px] uppercase tracking-[0.14em] border px-2 py-0.5 ${INV_STATUS[inv.status]}`}>
                      {inv.status}{inv.status === "overdue" ? ` +${inv.daysOverdue}d` : ""}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Expenses + Bookkeeping tasks */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Expenses */}
        <section className="border border-border bg-card">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/50">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">expense approval queue</p>
            <span className="font-mono text-[9px] text-amber-600">{EXPENSES.filter(e => !e.approved).length} pending</span>
          </div>
          <div className="divide-y divide-border/50">
            {EXPENSES.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between px-5 py-3 gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-[9px] text-muted-foreground/50">{exp.id}</span>
                    <span className={`font-mono text-[9px] uppercase tracking-[0.12em] border px-1.5 py-0.5 ${CAT_COLOR[exp.category] || "text-muted-foreground border-border"}`}>{exp.category}</span>
                  </div>
                  <p className="font-mono text-[11px] text-foreground truncate">{exp.description}</p>
                  <p className="font-mono text-[9px] text-muted-foreground/50">{exp.date}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono text-[11px] text-foreground tabular-nums">
                    {exp.currency === "EUR" ? fmtEur(exp.amount) : fmtFull(exp.amount)}
                  </p>
                  {exp.approved
                    ? <span className="font-mono text-[9px] text-emerald-600 flex items-center gap-1 justify-end"><CheckCircle className="w-3 h-3" /> approved</span>
                    : <span className="font-mono text-[9px] text-amber-600 flex items-center gap-1 justify-end"><Clock className="w-3 h-3" /> pending</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bookkeeping tasks */}
        <section className="border border-border bg-card">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/50">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">bookkeeping &amp; deadlines</p>
            <span className="font-mono text-[9px] text-rose-600">{TASKS_BK.filter(t => t.priority === "high").length} high priority</span>
          </div>
          <div className="divide-y divide-border/50">
            {TASKS_BK.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3 gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`font-mono text-[9px] ${PRIORITY_COLOR[t.priority]}`}>●</span>
                    <span className="font-mono text-[9px] text-muted-foreground/50">{t.id}</span>
                  </div>
                  <p className="font-mono text-[11px] text-foreground leading-5">{t.label}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono text-[9px] text-muted-foreground">Due: {t.due}</p>
                  <span className={`font-mono text-[9px] uppercase tracking-[0.12em] ${t.status === "in_progress" ? "text-sky-600" : "text-muted-foreground/50"}`}>{t.status.replace("_", " ")}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}