import React, { useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
} from "recharts";

/**
 * Hybrid Allocation Model — Config B
 * Live Forward-Testing / Unaudited Data
 * Source: Multi-Strategy Copy-Trading Fund Consolidated Analysis Report, 4 July 2026
 * $10,000 reference account · 10 active sleeves (A10 excluded)
 * Multipliers: A8×1.00 A9×1.00 A11×1.00 A12×1.00 A13×1.00
 *              A14×0.14 A15×1.00 A16×0.65 A17×1.00 A18×1.00
 */

// Equity curve — $100k reference account, 10 active sleeves
// Benchmarks rebased to $100k for apples-to-apples comparison
// Gold (XAUUSD): +26% Jul'25–Jun'26 · S&P 500: +14% Jul'25–Jun'26
const equityCurve = [
  { date: "Jul '25", equity: 100000, floating: 100000, gold: 100000, sp500: 100000 },
  { date: "Aug '25", equity: 108200, floating: 107500, gold: 102800, sp500: 101200 },
  { date: "Sep '25", equity: 117800, floating: 115200, gold: 105400, sp500: 100400 },
  { date: "Oct '25", equity: 131000, floating: 128000, gold: 108100, sp500: 102600 },
  { date: "Nov '25", equity: 146200, floating: 141000, gold: 110600, sp500: 104800 },
  { date: "Dec '25", equity: 162400, floating: 159000, gold: 112900, sp500: 106200 },
  { date: "Jan '26", equity: 183000, floating: 178000, gold: 115800, sp500: 107400 },
  { date: "Feb '26", equity: 209000, floating: 201000, gold: 118200, sp500: 105800 },
  { date: "Mar '26", equity: 228000, floating: 217400, gold: 121400, sp500: 104200 },
  { date: "Apr '26", equity: 252000, floating: 246000, gold: 123900, sp500: 108600 },
  { date: "May '26", equity: 271000, floating: 264000, gold: 125600, sp500: 111400 },
  { date: "Jun '26", equity: 289730, floating: 284500, gold: 126000, sp500: 114000 },
];

// Floating drawdown series ($ peak-to-trough at each point)
const drawdownSeries = [
  { date: "Jul '25", dd: 0 },
  { date: "Aug '25", dd: -720 },
  { date: "Sep '25", dd: -2600 },
  { date: "Oct '25", dd: -3000 },
  { date: "Nov '25", dd: -5200 },
  { date: "Dec '25", dd: -4100 },
  { date: "Jan '26", dd: -5000 },
  { date: "Feb '26", dd: -8000 },
  { date: "Mar '26", dd: -9350 },
  { date: "Apr '26", dd: -6000 },
  { date: "May '26", dd: -7000 },
  { date: "Jun '26", dd: -4620 },
];

// Sleeve allocation matrix
const sleeves = [
  { id: "A8",  symbol: "AUDNZD",         mult: 1.00, type: "clean",            floatingDd: "-$3",    live: "Mar 2026" },
  { id: "A9",  symbol: "USDJPY",          mult: 1.00, type: "avg-down grid",    floatingDd: "-$327",  live: "May 2025" },
  { id: "A11", symbol: "EURUSD",          mult: 1.00, type: "avg-down grid",    floatingDd: "-$122",  live: "Aug 2025" },
  { id: "A12", symbol: "Multi (29 sym)", mult: 1.00, type: "avg-down grid",    floatingDd: "-$1,283",live: "Jun 2021" },
  { id: "A13", symbol: "XAUUSD",          mult: 1.00, type: "cut-loss stacker", floatingDd: "-$464",  live: "May 2025" },
  { id: "A14", symbol: "Multi FX+metals", mult: 0.14, type: "avg-down grid",    floatingDd: "-$438",  live: "Mar 2025" },
  { id: "A15", symbol: "XAUUSD",          mult: 1.00, type: "cut-loss stacker", floatingDd: "-$1,110",live: "Oct 2024" },
  { id: "A16", symbol: "EURUSD",          mult: 0.65, type: "avg-down grid",    floatingDd: "-$865",  live: "Jul 2025" },
  { id: "A17", symbol: "XAUUSD",          mult: 1.00, type: "cut-loss stacker", floatingDd: "-$225",  live: "Apr 2024" },
  { id: "A18", symbol: "XAUUSD",          mult: 1.00, type: "cut-loss stacker", floatingDd: "-$810",  live: "Feb 2026" },
];

const keyMetrics = [
  { label: "Annualised Return",   value: "190.0%",  sub: "Jul 2025 – Jul 2026" },
  { label: "Sharpe Ratio",        value: "9.9",     sub: "daily, annualised" },
  { label: "Calmar Ratio",        value: "17.9×",   sub: "CAGR / max floating DD" },
  { label: "Max Drawdown",        value: "−10.6%",  sub: "peak-to-trough, floating (since 2025)" },
  { label: "Avg Correlation",     value: "0.07",    sub: "pairwise strategy overlap" },
  { label: "Profit Factor",       value: "2.31×",   sub: "gross gains / gross losses" },
];

const SERIES = [
  { key: "equity",   name: "Closed-Trade Equity", color: "hsl(210 40% 98%)" },
  { key: "floating", name: "Floating Equity",      color: "hsl(0 70% 60% / 0.75)" },
  { key: "gold",     name: "Spot Gold (XAUUSD)",   color: "hsl(45 60% 52% / 0.55)" },
  { key: "sp500",    name: "S&P 500",              color: "hsl(210 60% 55% / 0.55)" },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-border bg-card/95 backdrop-blur-sm p-4 font-mono text-xs min-w-[200px]">
      <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground border-b border-border pb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-6 leading-[1.8]">
          <span className="flex items-center gap-2" style={{ color: p.color }}>
            <span className="inline-block w-4 h-px" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="text-foreground tabular-nums">${p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

const DdTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-border bg-card p-4 font-mono text-xs">
      <p className="mb-2 uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-red-400 leading-6">Floating DD: ${payload[0].value.toLocaleString()}</p>
    </div>
  );
};

export default function PerformanceChart() {
  const [view, setView] = useState("curve");
  const [showGold, setShowGold] = useState(true);
  const [showSP500, setShowSP500] = useState(true);

  return (
    <section id="performance"       className="border-b border-border bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground">
                hybrid allocation model
              </p>
              <h2 className="mt-4 font-heading text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">
                live performance.
              </h2>
            </div>
            {/* Unaudited data badge */}
            <div className="flex flex-col gap-1.5 mt-1">
              <span className="inline-flex items-center gap-2 border border-yellow-400/30 bg-yellow-400/5 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.28em] text-yellow-400">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-400" />
                live forward-testing · unaudited data
              </span>
              <span className="inline-flex items-center gap-2 border border-green-400/20 bg-green-400/5 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.28em] text-green-400">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                10 active sleeves · $100k reference
              </span>
            </div>
          </div>
          <p className="max-w-2xl font-mono text-xs leading-7 text-muted-foreground">
            A unified multi-sleeve portfolio book running 10 algorithmic providers across FX, gold, and multi-asset markets — North One is the firm's flagship hybrid allocation model.
            Performance figures are based on live forward-testing data (Jul 2025 – Jul 2026) and remain unaudited.
            Past performance is not indicative of future results.
          </p>
        </div>

        {/* Key metrics strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border border-border mb-6">
          {keyMetrics.map((m, i) => (
            <div key={m.label} className={`p-5 border-border ${i < keyMetrics.length - 1 ? "border-r border-b lg:border-b-0" : ""}`}>
              <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground/60 mb-1">{m.label}</p>
              <p className="font-heading text-2xl text-foreground">{m.value}</p>
              <p className="font-mono text-[9px] text-muted-foreground/50 mt-0.5">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* View toggle */}
        <div className="mb-5 flex shrink-0 gap-0 border border-border font-mono text-xs uppercase tracking-[0.2em] w-fit">
          {[
            { key: "curve", label: "Equity Curve" },
            { key: "drawdown", label: "Drawdown" },
          ].map((v, i) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`min-h-[36px] px-5 py-2 transition-colors ${i > 0 ? "border-l border-border" : ""} ${
                view === v.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Equity curve */}
        {view === "curve" && (
          <>
            {/* Legend + benchmark toggles */}
            <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
              {/* Primary lines — always shown */}
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                <span className="inline-block h-px w-8 bg-foreground" /> closed-trade equity
              </span>
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                <span className="inline-block h-px w-8 bg-red-400/60" style={{ backgroundImage: "repeating-linear-gradient(90deg, hsl(0 70% 60% / 0.6) 0, hsl(0 70% 60% / 0.6) 6px, transparent 6px, transparent 10px)" }} /> floating equity
              </span>
              {/* Benchmark toggles */}
              <button
                onClick={() => setShowGold(v => !v)}
                className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] transition-opacity duration-150 ${showGold ? "opacity-100" : "opacity-40 hover:opacity-70"}`}
              >
                <span className="inline-block h-px w-8" style={{ backgroundImage: "repeating-linear-gradient(90deg, hsl(45 50% 52% / 0.7) 0, hsl(45 50% 52% / 0.7) 4px, transparent 4px, transparent 8px)" }} />
                <span style={{ color: "hsl(45 55% 55%)" }}>spot gold (xauusd)</span>
              </button>
              <button
                onClick={() => setShowSP500(v => !v)}
                className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] transition-opacity duration-150 ${showSP500 ? "opacity-100" : "opacity-40 hover:opacity-70"}`}
              >
                <span className="inline-block h-px w-8" style={{ backgroundImage: "repeating-linear-gradient(90deg, hsl(210 55% 55% / 0.7) 0, hsl(210 55% 55% / 0.7) 4px, transparent 4px, transparent 8px)" }} />
                <span style={{ color: "hsl(210 55% 60%)" }}>s&p 500</span>
              </button>
              {(showGold || showSP500) && (
                <span className="font-mono text-[9px] text-muted-foreground/40 uppercase tracking-[0.2em]">· benchmarks rebased to $100k</span>
              )}
            </div>

            <div className="border border-border p-1 sm:p-4">
              <ResponsiveContainer width="100%" height={420}>
                <LineChart data={equityCurve} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="hsl(217 33% 17%)" strokeDasharray="1 4" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "hsl(215 20% 65%)", fontFamily: "IBM Plex Mono", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(215 20% 65%)", fontFamily: "IBM Plex Mono", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} domain={[90000, 300000]} width={52} />
                  <ReferenceLine y={100000} stroke="hsl(215 20% 65%)" strokeDasharray="3 4" strokeWidth={0.8} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(210 40% 98% / 0.3)", strokeWidth: 1, strokeDasharray: "3 3" }} />
                  <Line type="monotone" dataKey="equity" name="Closed-Trade Equity" stroke="hsl(210 40% 98%)" strokeWidth={1.8} dot={false} activeDot={{ r: 3, fill: "hsl(210 40% 98%)", strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="floating" name="Floating Equity" stroke="hsl(0 70% 60% / 0.75)" strokeWidth={1} strokeDasharray="4 3" dot={false} activeDot={{ r: 3, fill: "hsl(0 70% 60%)", strokeWidth: 0 }} />
                  {showGold && (
                    <Line type="monotone" dataKey="gold" name="Spot Gold (XAUUSD)" stroke="hsl(45 50% 52% / 0.6)" strokeWidth={0.9} strokeDasharray="3 4" dot={false} activeDot={{ r: 2, fill: "hsl(45 50% 52%)", strokeWidth: 0 }} />
                  )}
                  {showSP500 && (
                    <Line type="monotone" dataKey="sp500" name="S&P 500" stroke="hsl(210 55% 55% / 0.6)" strokeWidth={0.9} strokeDasharray="3 4" dot={false} activeDot={{ r: 2, fill: "hsl(210 55% 55%)", strokeWidth: 0 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 font-mono text-[10px] leading-5 text-muted-foreground/50">
              Equity curves represent live forward-testing results on a $100,000 reference account (Jul 2025 – Jul 2026). Floating equity marked at grid rungs and close prices. Benchmark series rebased to $100k for comparison. Figures are unaudited. Past performance is not indicative of future results.
            </p>
          </>
        )}

        {/* Drawdown view */}
        {view === "drawdown" && (
          <>
            <div className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground flex items-center gap-2">
              <span className="inline-block h-px w-8 bg-red-400/60" /> floating drawdown ($ peak-to-trough)
            </div>
            <div className="border border-border p-1 sm:p-4">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={drawdownSeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="hsl(217 33% 17%)" strokeDasharray="1 4" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "hsl(215 20% 65%)", fontFamily: "IBM Plex Mono", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(215 20% 65%)", fontFamily: "IBM Plex Mono", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} domain={[-1100, 50]} width={56} />
                  <ReferenceLine y={-9350} stroke="hsl(0 70% 60% / 0.4)" strokeDasharray="3 4" strokeWidth={0.8} label={{ value: "−$9,350 trough", fill: "hsl(0 70% 60% / 0.6)", fontSize: 9, fontFamily: "IBM Plex Mono" }} />
                  <Tooltip content={<DdTooltip />} cursor={{ stroke: "hsl(210 40% 98%)", strokeWidth: 0.5 }} />
                  <Area type="monotone" dataKey="dd" name="Floating DD" stroke="hsl(0 70% 60% / 0.7)" fill="hsl(0 70% 60% / 0.08)" strokeWidth={1.2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              {[
                { label: "Max DD — floating (12m)", value: "−$9,350 (−9.3%)", sub: "3 Mar 2026" },
                { label: "Max DD — floating (since 2025)", value: "−$10,600 (−10.6%)", sub: "absolute historical trough" },
                { label: "Max DD — closed trades", value: "−$9,800 (−9.8%)", sub: "A15 gold Feb–Mar 2025" },
                { label: "Worst stacked close", value: "−$4,620", sub: "A18 basket · 2 Jun 2026" },
              ].map((s) => (
                <div key={s.label} className="border border-border p-4">
                  <p className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground/60 mb-1">{s.label}</p>
                  <p className="text-sm text-red-400">{s.value}</p>
                  <p className="text-[9px] text-muted-foreground/40 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 font-mono text-[10px] leading-5 text-muted-foreground/50">
              Floating drawdown is reconstructed from statement price marks using event-level methodology and represents a lower bound — troughs between the last grid rung and basket close are unobservable. Data is unaudited.
            </p>
          </>
        )}


      </div>
    </section>
  );
}