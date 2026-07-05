import React from "react";

const algorithms = [
{
  label: "commodities",
  title: "gold",
  badge: "Live",
  period: "Apr 2024 – present",
  result: "$100k → $708,644",
  drawdown: "Max drawdown 16.0%",
  risk: "Risk 6/10"
},
{
  label: "digital assets",
  title: "bitcoin",
  badge: "Backtest",
  period: "Jan 2023 – Jun 2026",
  result: "$100k → $353,763",
  drawdown: "Max drawdown 10.6%",
  risk: "Risk 3/10"
},
{
  label: "equity indices",
  title: "nasdaq100",
  badge: "Backtest",
  period: "Jan 2022 – Jun 2026",
  result: "$100k → $426,480",
  drawdown: "Max drawdown 17.37%",
  risk: "Risk 4/10"
}];

const terms = [
{ label: "minimum allocation", value: "$10,000" },
{ label: "lock-up period", value: "n/a" },
{ label: "capital custody", value: "investor-controlled" },
{ label: "strategy type", value: "systematic / algorithmic" },
{ label: "risk profile", value: "moderate" }];

const highlights = [
{ value: "11", label: "Independent Models" },
{ value: "Daily", label: "Withdrawals" },
{ value: "Zero", label: "Management Fees" }];


export default function NorthISection() {
  const scrollToBreakdown = () => {
    const el = document.getElementById("strategies-breakdown");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="border-b border-border bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">

        {/* Top label + available */}
        <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-2">
          our offer
        </p>
        <div className="flex items-center gap-3 mb-2">
          <span className="relative flex h-[9px] w-[9px]">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-[9px] w-[9px] bg-emerald-400" />
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-emerald-400">available</span>
        </div>

        {/* Two-column body — columns start together from here */}
        <div className="mt-6 grid gap-10 lg:grid-cols-2 items-end">

          {/* Left column */}
          <div className="flex flex-col">

            {/* Heading + subtitle */}
            <div>
              <h2 className="font-heading leading-[0.9] tracking-tight text-foreground lowercase text-6xl">north one.</h2>
              
            </div>

            {/* HOW IT WORKS */}
            <div className="mt-14">
              <p className="font-mono text-[10px] uppercase tracking-[0.36em] mb-3 text-foreground">HOW IT WORKS</p>
              <p className="font-mono text-xs leading-7 text-muted-foreground">
                Eleven quantitative models running in parallel under <span className="text-foreground">one unified allocation</span>. Capital stays in your account at all times.
              </p>
            </div>

            {/* FEES */}
            <div className="mt-10">
              <p className="font-mono text-[10px] uppercase tracking-[0.36em] mb-3 text-foreground">FEES</p>
              <p className="font-mono text-xs leading-7 text-muted-foreground">
                <span className="text-foreground">No management fees. No performance fees.</span> The only costs are standard VT Markets broker trading fees.
              </p>
            </div>

            {/* Key highlights strip */}
            <div className="mt-6 grid grid-cols-3 border border-border divide-x divide-border">
              {highlights.map((h) =>
              <div key={h.label} className="px-4 py-4 text-center">
                  <p className="font-heading text-xl text-foreground">{h.value}</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">{h.label}</p>
                </div>
              )}
            </div>

            {/* TERMS */}
            <div className="mt-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.36em] mb-3 text-foreground">TERMS</p>
              <div className="divide-y divide-border border border-border">
                {terms.map((term) =>
                <div key={term.label} className="flex items-center justify-between px-5 py-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{term.label}</span>
                    <span className="font-mono text-xs text-foreground lowercase text-right ml-4">{term.value}</span>
                  </div>
                )}
                <div className="py-5 flex justify-center">
                  <a
                    href="/start"
                    className="inline-flex items-center border border-foreground bg-foreground text-background font-mono text-[10px] tracking-[0.20em] px-5 py-2.5 hover:bg-transparent hover:text-foreground transition-colors duration-200">
                    invest with us
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right column — North One hybrid model */}
          <div className="flex flex-col">
            <p className="font-mono text-[10px] uppercase tracking-[0.36em] mb-2 text-foreground">NORTH ONE · HYBRID MODEL</p>
            <p className="mb-5 font-mono text-[10px] leading-5 text-muted-foreground/60">
              Live forward-testing performance (Jul 2025 – Jul 2026) on a $100k reference account. 10 active sleeves. Unaudited. Past performance is not indicative of future results.
            </p>

            <div className="border border-border bg-card flex flex-col flex-1">
              <article className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="space-y-1">
                    <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground/80">multi-sleeve · fx, gold, multi-asset</p>
                    <h3 className="font-heading text-3xl text-foreground lowercase">north one.</h3>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.24em] border border-emerald-400 text-emerald-400 bg-emerald-400/10">
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-x-8 gap-y-6 font-mono">
                  <div>
                    <dt className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-1">PERIOD</dt>
                    <dd className="text-xs text-foreground">Jul 2025 – Jul 2026</dd>
                  </div>
                  <div>
                    <dt className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-1">NET PROFIT</dt>
                    <dd className="text-xs text-foreground font-medium">$100k → $289,730 <span className="text-emerald-400">(+190%)</span></dd>
                  </div>
                  <div>
                    <dt className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-1">SHARPE RATIO</dt>
                    <dd className="text-xs text-foreground">9.9 <span className="text-muted-foreground/60 text-[10px]">daily, annualised</span></dd>
                  </div>
                  <div>
                    <dt className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-1">MAX DRAWDOWN</dt>
                    <dd className="text-xs text-foreground">−10.6% <span className="text-muted-foreground/60 text-[10px]">floating</span></dd>
                  </div>
                  <div>
                    <dt className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-1">RETURN / DD RATIO</dt>
                    <dd className="text-xs text-foreground">20.3×</dd>
                  </div>
                  <div>
                    <dt className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-1">AVG CORRELATION</dt>
                    <dd className="text-xs text-foreground">0.07 <span className="text-muted-foreground/60 text-[10px]">pairwise</span></dd>
                  </div>
                </dl>
              </article>

              <div className="py-5 flex justify-center mt-auto border-t border-border">
                <button
                  onClick={scrollToBreakdown}
                  className="inline-flex items-center border border-foreground bg-foreground text-background font-mono text-[10px] tracking-[0.20em] px-5 py-2.5 hover:bg-transparent hover:text-foreground transition-colors duration-200">
                  view detailed strategy breakdown
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);

}