import React from "react";

const fmtCompact = (n) => {
  if (n == null) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
};
const fmtFull = (n) => (n == null ? "—" : `$${Math.round(n).toLocaleString("en-US")}`);
const plColor = (n) => (n > 0 ? "text-emerald-600" : n < 0 ? "text-rose-600" : "text-foreground");

const ENGINE_LABEL = { commodities: "Commodities", digital: "Digital Assets" };

export default function FinancialsSection({ financials, loading }) {
  const { aum, openPl, ledger = [], committed, hasData } = financials;
  const totalAum = hasData ? aum : committed;

  return (
    <section className="border border-border bg-card">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/50">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">core financials &amp; tracking</p>
        {hasData ? (
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-600 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> live
          </span>
        ) : (
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">no snapshots yet</span>
        )}
      </div>

      {/* PRIMARY FINANCE HEADER */}
      <div className="grid grid-cols-1 lg:grid-cols-5 border-b border-border">
        <div className="lg:col-span-3 p-6 border-b lg:border-b-0 lg:border-r border-border">
          <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-muted-foreground mb-3">total fund balance / aum</p>
          <p className="font-heading text-5xl sm:text-6xl leading-none text-foreground tracking-tight tabular-nums">
            {loading ? "…" : fmtFull(totalAum)}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground mt-3">
            {hasData ? "total capital under management · live" : "committed capital (no live account balances yet)"}
          </p>
        </div>

        <div className="lg:col-span-2 p-6 flex flex-col justify-center gap-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-muted-foreground">performance</p>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-1">open p&amp;l · unrealized</p>
            <div className="flex items-baseline gap-2.5">
              <span className={`font-mono text-2xl tabular-nums ${plColor(openPl)}`}>{hasData ? fmtFull(openPl) : "—"}</span>
            </div>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">closed p&amp;l · realized</p>
            <span className={`inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-sm tabular-nums ${hasData ? "border-emerald-600/30 bg-emerald-600/8 text-emerald-700" : "border-border text-muted-foreground"}`}>
              {hasData ? fmtFull(financials.closedPl) : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* ASSET & LIQUIDITY MATRIX */}
      <div className="border-b border-border">
        <div className="px-5 py-2.5 border-b border-border">
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground">engine ledger breakdown</p>
        </div>
        {ledger.length === 0 ? (
          <p className="px-5 py-6 font-mono text-[11px] text-muted-foreground">No performance snapshots recorded yet.</p>
        ) : (
          <table className="w-full font-mono text-[11px]">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                {["Engine", "Accounts", "Balance", "Equity", "Open P&L"].map((h, i) => (
                  <th key={h} className={`px-5 py-2 font-normal uppercase tracking-[0.14em] text-[9px] ${i >= 1 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ledger.map((e) => (
                <tr key={e.engine} className="border-b border-border/50 last:border-0">
                  <td className="px-5 py-3.5 text-foreground">{ENGINE_LABEL[e.engine] || e.engine}</td>
                  <td className="px-5 py-3.5 text-right text-muted-foreground tabular-nums">{e.accounts}</td>
                  <td className="px-5 py-3.5 text-right text-foreground tabular-nums">{fmtFull(e.balance)}</td>
                  <td className="px-5 py-3.5 text-right text-foreground tabular-nums">{fmtFull(e.equity)}</td>
                  <td className={`px-5 py-3.5 text-right tabular-nums ${plColor(e.open_pl)}`}>{fmtFull(e.open_pl)}</td>
                </tr>
              ))}
              <tr className="bg-secondary/30">
                <td className="px-5 py-3 text-[9px] uppercase tracking-[0.18em] text-muted-foreground" colSpan={2}>Total</td>
                <td className="px-5 py-3 text-right text-foreground tabular-nums">{fmtFull(ledger.reduce((s, e) => s + e.balance, 0))}</td>
                <td className="px-5 py-3 text-right text-foreground tabular-nums">{fmtFull(ledger.reduce((s, e) => s + e.equity, 0))}</td>
                <td className="px-5 py-3 text-right tabular-nums">{fmtCompact(ledger.reduce((s, e) => s + e.open_pl, 0))}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}