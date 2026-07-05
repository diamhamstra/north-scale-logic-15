import React from "react";

const points = [
  { title: "research before allocation", body: "Every decision begins with evidence." },
  { title: "risk before return", body: "Capital preservation remains essential." },
  { title: "process before prediction", body: "Consistency over market opinion." },
];

export default function RiskStatement() {
  return (
    <section className="border-b border-border bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Section label + heading + body */}
        <div className="max-w-3xl mb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground">
            research principles
          </p>
          <h2 className="mt-4 font-heading text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">
            a framework built on evidence, discipline, and risk control.
          </h2>
          <p className="mt-6 font-mono text-xs leading-7 text-muted-foreground">
            Every model, allocation, and research initiative is evaluated through a consistent framework designed to prioritize long-term robustness over short-term outcomes.
          </p>
        </div>

        {/* Three principle cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {points.map((point, index) => (
            <div key={point.title} className="border border-border p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground/70">0{index + 1}</p>
              <h3 className="mt-3 font-heading text-2xl leading-tight text-foreground">{point.title}</h3>
              <p className="mt-3 font-mono text-xs leading-6 text-muted-foreground">{point.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}