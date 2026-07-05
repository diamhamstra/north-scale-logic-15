import React from "react";

export default function StrategyPanel({ title, objective, markets, risk, variant }) {
  return (
    <article className="group h-full border border-border bg-card p-5 transition-all duration-200 hover:bg-secondary/40 sm:p-6">
      <div className="flex h-full flex-col justify-between gap-5">
        <div>
          <h3 className="font-heading text-2xl text-foreground lowercase sm:text-3xl">{title}</h3>
        </div>
        <div className="flex items-center justify-center" style={{ height: "5rem" }} aria-hidden="true">
          {variant === "pyramid" ? (
            <svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="48,9 84,78 12,78" stroke="hsl(var(--border))" strokeWidth="1" fill="none" />
              <polygon points="48,21 75,72 21,72" stroke="hsl(var(--muted-foreground) / 0.55)" strokeWidth="0.7" fill="none" />
              <line x1="48" y1="9" x2="48" y2="78" stroke="hsl(var(--border))" strokeWidth="0.7" strokeDasharray="3 4" />
              <line x1="12" y1="78" x2="84" y2="78" stroke="hsl(var(--border))" strokeWidth="1" />
              <line x1="48" y1="9" x2="60" y2="45" stroke="hsl(var(--muted-foreground) / 0.4)" strokeWidth="0.6" strokeDasharray="2 4" />
              <line x1="60" y1="45" x2="84" y2="78" stroke="hsl(var(--muted-foreground) / 0.4)" strokeWidth="0.6" />
              <line x1="60" y1="45" x2="48" y2="78" stroke="hsl(var(--muted-foreground) / 0.4)" strokeWidth="0.6" strokeDasharray="2 4" />
            </svg>
          ) : variant === "fx" ? (
            <svg width="96" height="80" viewBox="0 0 96 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 60 Q24 20 40 40 Q56 60 72 30 Q84 10 92 20" stroke="hsl(var(--border))" strokeWidth="1" fill="none" />
              <path d="M8 50 Q24 30 40 48 Q56 66 72 38 Q84 18 92 28" stroke="hsl(var(--muted-foreground) / 0.4)" strokeWidth="0.7" strokeDasharray="3 4" fill="none" />
              <line x1="8" y1="8" x2="8" y2="72" stroke="hsl(var(--border))" strokeWidth="0.8" />
              <line x1="8" y1="72" x2="92" y2="72" stroke="hsl(var(--border))" strokeWidth="0.8" />
              <circle cx="40" cy="40" r="2.5" fill="none" stroke="hsl(var(--muted-foreground) / 0.55)" strokeWidth="0.8" />
              <circle cx="72" cy="30" r="2.5" fill="none" stroke="hsl(var(--muted-foreground) / 0.55)" strokeWidth="0.8" />
            </svg>
          ) : (
            <div className={variant === "cube" ? "wire-cube" : "wire-orbit"} />
          )}
        </div>
        <dl className="grid gap-5 font-mono text-sm">
          <div>
            <dt className="mb-1 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">OBJECTIVE</dt>
            <dd className="text-xs leading-7 text-foreground lowercase">{objective}</dd>
          </div>
          <div>
            <dt className="mb-1 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">MARKET FOCUS</dt>
            <dd className="text-xs leading-7 text-muted-foreground lowercase">{markets}</dd>
          </div>
          <div>
            <dt className="mb-1 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">RISK CONTROL</dt>
            <dd className="text-xs leading-7 text-muted-foreground lowercase">{risk}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}