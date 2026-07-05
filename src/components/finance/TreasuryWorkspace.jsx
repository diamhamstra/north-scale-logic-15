import React from "react";
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Lock } from "lucide-react";

const fmtFull = (n) => `$${Math.round(Math.abs(n)).toLocaleString("en-US")}`;
const fmtEur = (n) => `€${Math.round(Math.abs(n)).toLocaleString("en-US")}`;

// ── BANK ACCOUNTS ─────────────────────────────────────────────────────────────
const ACCOUNTS = [
  { id: "NL-EUR-001", label: "Operations Account — EUR", bank: "ABN AMRO", iban: "NL44 ABNA 0617 ···· ··", balance: 284200, currency: "EUR", type: "operational" },
  { id: "NL-EUR-002", label: "Reserve Account — EUR", bank: "ABN AMRO", iban: "NL82 ABNA 0441 ···· ··", balance: 620000, currency: "EUR", type: "reserve" },
  { id: "US-USD-001", label: "Trading Float — USD", bank: "Interactive Brokers", iban: "IBKR ···· ····", balance: 1240000, currency: "USD", type: "trading" },
  { id: "AE-USD-001", label: "Dubai Entity — USD", bank: "Emirates NBD", iban: "AE57 0351 ···· ····", balance: 180400, currency: "USD", type: "entity" },
];

// ── CASH FLOW FORECAST ────────────────────────────────────────────────────────
const CASHFLOW_WEEKS = [
  { week: "W26 (23–27 Jun)", inflow: 184200, outflow: 42800, net: 141400, note: "Q2 fee collection" },
  { week: "W27 (30 Jun–4 Jul)", inflow: 22600, outflow: 89400, note: "Payroll + rent", net: -66800 },
  { week: "W28 (7–11 Jul)", inflow: 48000, outflow: 18200, net: 29800, note: "Partner commissions" },
  { week: "W29 (14–18 Jul)", inflow: 14800, outflow: 12400, net: 2400, note: "Regular ops" },
];

// ── FX POSITIONS ──────────────────────────────────────────────────────────────
const FX = [
  { pair: "EUR/USD", exposure: 284200, hedge: "Forward contract", rate: 1.0820, maturity: "31 Jul 2026", status: "hedged" },
  { pair: "USD/AED", exposure: 180400, hedge: "None", rate: 3.6725, maturity: "—", status: "unhedged" },
  { pair: "EUR/GBP", exposure: 42000, hedge: "Option", rate: 0.8410, maturity: "30 Sep 2026", status: "hedged" },
];

// ── RECENT TRANSACTIONS ───────────────────────────────────────────────────────
const TRANSACTIONS = [
  { id: "TXN-20260624-001", date: "24 Jun 2026", description: "Management fee collection — June", amount: 184200, currency: "USD", type: "in", account: "US-USD-001" },
  { id: "TXN-20260623-001", date: "23 Jun 2026", description: "Office rent — Amsterdam", amount: 3800, currency: "EUR", type: "out", account: "NL-EUR-001" },
  { id: "TXN-20260620-001", date: "20 Jun 2026", description: "AWS cloud services", amount: 1240, currency: "USD", type: "out", account: "US-USD-001" },
  { id: "TXN-20260615-002", date: "15 Jun 2026", description: "Dubai BD trip expenses", amount: 3100, currency: "EUR", type: "out", account: "NL-EUR-001" },
  { id: "TXN-20260615-001", date: "15 Jun 2026", description: "Partner commission — ZUIDAS", amount: 16200, currency: "EUR", type: "out", account: "NL-EUR-001" },
  { id: "TXN-20260601-001", date: "01 Jun 2026", description: "Bloomberg Terminal subscription", amount: 2000, currency: "USD", type: "out", account: "US-USD-001" },
  { id: "TXN-20260531-001", date: "31 May 2026", description: "Payroll June 2026", amount: 72000, currency: "EUR", type: "out", account: "NL-EUR-001" },
];

const TYPE_COLOR = { operational: "text-sky-600 border-sky-600/30", reserve: "text-purple-600 border-purple-600/30", trading: "text-amber-600 border-amber-600/30", entity: "text-emerald-600 border-emerald-600/30" };
const FX_STATUS = { hedged: "text-emerald-600", unhedged: "text-rose-600" };

export default function TreasuryWorkspace() {
  const totalEur = ACCOUNTS.filter(a => a.currency === "EUR").reduce((s, a) => s + a.balance, 0);
  const totalUsd = ACCOUNTS.filter(a => a.currency === "USD").reduce((s, a) => s + a.balance, 0);

  return (
    <div className="space-y-6">

      {/* Account summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total EUR Holdings", value: fmtEur(totalEur), sub: `${ACCOUNTS.filter(a => a.currency === "EUR").length} accounts` },
          { label: "Total USD Holdings", value: fmtFull(totalUsd), sub: `${ACCOUNTS.filter(a => a.currency === "USD").length} accounts` },
          { label: "Net Weekly CF Forecast", value: fmtFull(CASHFLOW_WEEKS.reduce((s, w) => s + w.net, 0)), sub: "next 4 weeks", up: CASHFLOW_WEEKS.reduce((s, w) => s + w.net, 0) > 0 },
          { label: "Unhedged FX Exposure", value: fmtFull(FX.filter(f => f.status === "unhedged").reduce((s, f) => s + f.exposure, 0)), sub: "review recommended", alert: true },
        ].map((c) => (
          <div key={c.label} className={`border p-4 bg-card ${c.alert ? "border-amber-600/30" : "border-border"}`}>
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5">{c.label}</p>
            <p className="font-mono text-xl tabular-nums leading-none text-foreground">{c.value}</p>
            <p className={`font-mono text-[9px] mt-1.5 ${c.alert ? "text-amber-600" : "text-muted-foreground/60"}`}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Bank Accounts */}
      <section className="border border-border bg-card">
        <div className="px-5 py-3 border-b border-border bg-secondary/50 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">bank accounts &amp; custody</p>
          <span className="font-mono text-[9px] text-muted-foreground/50 flex items-center gap-1.5"><Lock className="w-3 h-3" /> masked</span>
        </div>
        <table className="w-full font-mono text-[11px]">
          <thead>
            <tr className="border-b border-border">
              {["Account", "Bank", "IBAN", "Type", "Balance"].map((h, i) => (
                <th key={h} className={`px-5 py-2.5 text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-normal ${i === 4 ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ACCOUNTS.map((a) => (
              <tr key={a.id} className="border-b border-border/50 hover:bg-secondary/20">
                <td className="px-5 py-3.5 text-foreground">{a.label}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{a.bank}</td>
                <td className="px-5 py-3.5 text-muted-foreground font-mono text-[10px]">{a.iban}</td>
                <td className="px-5 py-3.5">
                  <span className={`font-mono text-[9px] uppercase tracking-[0.12em] border px-2 py-0.5 ${TYPE_COLOR[a.type]}`}>{a.type}</span>
                </td>
                <td className="px-5 py-3.5 text-right text-foreground tabular-nums">
                  {a.currency === "EUR" ? fmtEur(a.balance) : fmtFull(a.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Cash Flow Forecast + FX */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Cash flow */}
        <section className="border border-border bg-card">
          <div className="px-5 py-3 border-b border-border bg-secondary/50">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">4-week cash flow forecast</p>
          </div>
          <table className="w-full font-mono text-[11px]">
            <thead>
              <tr className="border-b border-border">
                {["Week", "Inflow", "Outflow", "Net", "Note"].map((h, i) => (
                  <th key={h} className={`px-5 py-2 text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-normal ${i >= 1 && i <= 3 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CASHFLOW_WEEKS.map((w) => (
                <tr key={w.week} className="border-b border-border/50 hover:bg-secondary/20">
                  <td className="px-5 py-3 text-muted-foreground">{w.week}</td>
                  <td className="px-5 py-3 text-right text-emerald-600 tabular-nums">{fmtFull(w.inflow)}</td>
                  <td className="px-5 py-3 text-right text-rose-600 tabular-nums">({fmtFull(w.outflow)})</td>
                  <td className={`px-5 py-3 text-right tabular-nums font-medium ${w.net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {w.net >= 0 ? fmtFull(w.net) : `(${fmtFull(w.net)})`}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground/60 text-[9px]">{w.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* FX Positions */}
        <section className="border border-border bg-card">
          <div className="px-5 py-3 border-b border-border bg-secondary/50">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">fx positions &amp; hedges</p>
          </div>
          <div className="divide-y divide-border/50">
            {FX.map((fx) => (
              <div key={fx.pair} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <p className="font-mono text-sm text-foreground">{fx.pair}</p>
                    <span className={`font-mono text-[9px] uppercase tracking-[0.14em] ${FX_STATUS[fx.status]}`}>● {fx.status}</span>
                  </div>
                  <p className="font-mono text-[11px] text-foreground tabular-nums">{fmtFull(fx.exposure)}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 font-mono text-[9px]">
                  <div>
                    <p className="text-muted-foreground/50 mb-0.5">Hedge</p>
                    <p className="text-foreground">{fx.hedge}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground/50 mb-0.5">Rate</p>
                    <p className="text-foreground tabular-nums">{fx.rate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground/50 mb-0.5">Maturity</p>
                    <p className="text-foreground">{fx.maturity}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Recent transactions */}
      <section className="border border-border bg-card">
        <div className="px-5 py-3 border-b border-border bg-secondary/50">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">recent transactions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-[11px] min-w-[700px]">
            <thead>
              <tr className="border-b border-border">
                {["Date", "Description", "Account", "Amount"].map((h, i) => (
                  <th key={h} className={`px-5 py-2.5 text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-normal ${i === 3 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TRANSACTIONS.map((t) => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/20">
                  <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{t.date}</td>
                  <td className="px-5 py-3 text-foreground">{t.description}</td>
                  <td className="px-5 py-3 text-muted-foreground/60 text-[10px]">{t.account}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`flex items-center justify-end gap-1.5 tabular-nums ${t.type === "in" ? "text-emerald-600" : "text-rose-600"}`}>
                      {t.type === "in" ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                      {t.type === "out" ? "(" : ""}{t.currency === "EUR" ? fmtEur(t.amount) : fmtFull(t.amount)}{t.type === "out" ? ")" : ""}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}