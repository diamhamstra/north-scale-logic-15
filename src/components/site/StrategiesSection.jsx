import React from "react";
import StrategyPanel from "./StrategyPanel";

export default function StrategiesSection() {
  return (
    <section id="strategies-breakdown" className="border-b border-border bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground">ALGORITHMS</p>
          <h2 className="mt-4 font-heading text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl lowercase">
            Where our deepest market knowledge lives.
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
          <div id="commodities" className="h-full">
          <StrategyPanel
            title="commodities"
            objective="risk-adjusted absolute returns from systematic commodity futures using trend persistence, carry and macro dislocations."
            markets="exchange-traded energy, metals and agricultural futures with institutional liquidity and execution."
            risk="volatility targeting, dynamic sizing, correlation budgeting and systematic drawdown controls."
            variant="cube"
          />
          </div>
          <div id="digital-assets" className="h-full">
          <StrategyPanel
            title="digital assets"
            objective="systematic returns across digital assets via quantitative directional and relative-value strategies on liquid spot and derivatives."
            markets="liquid spot and perpetual futures in bitcoin, ethereum and large-cap digital assets with verifiable depth."
            risk="adaptive volatility target, leverage constraints, liquidity monitoring and automated portfolio controls."
            variant="orbit"
          />
          </div>
          <div id="equity-indices" className="h-full">
          <StrategyPanel
            title="equity indices"
            objective="diversified alpha from systematic models across global equity index futures using trend, mean-reversion and cross-market relative strength."
            markets="liquid index futures: s&p 500, nasdaq-100, euro stoxx 50, dax, ftse 100, nikkei 225 and developed benchmarks."
            risk="risk-balanced construction with dynamic volatility scaling, correlation optimisation and downside protection."
            variant="pyramid"
          />
          </div>
          <div id="fx" className="h-full">
          <StrategyPanel
            title="fx"
            objective="systematic alpha from global fx markets via trend-following, carry and mean-reversion across major and cross pairs."
            markets="major and cross pairs: eur/usd, gbp/usd, usd/jpy, aud/usd, usd/chf and emerging market fx."
            risk="dynamic sizing, correlation controls, volatility-adjusted exposure and systematic stop-loss protocols."
            variant="fx"
          />
          </div>
        </div>
      </div>
    </section>
  );
}