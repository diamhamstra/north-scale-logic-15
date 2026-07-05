import React from "react";

const stages = [
  {
    number: "01",
    title: "RESEARCH",
    body: "Market behaviour is analysed using quantitative methodologies.",
  },
  {
    number: "02",
    title: "MODEL & SYSTEM DEVELOPMENT",
    body: "Research ideas are transformed into systematic trading models.",
  },
  {
    number: "03",
    title: "VALIDATION",
    body: "Models undergo extensive historical testing and robustness analysis, followed by rigorous live testing before deployment.",
  },
  {
    number: "04",
    title: "RISK CONTROLS",
    body: "Every strategy operates within predefined portfolio and execution risk parameters.",
  },
  {
    number: "05",
    title: "EXECUTION",
    body: "Validated models execute systematically across supported global markets.",
  },
  {
    number: "06",
    title: "CONTINUOUS MONITORING",
    body: "Models are continuously monitored, evaluated and refined as market conditions evolve.",
  },
];

export default function ResearchFramework() {
  return (
    <section className="border-b border-border bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Section label + heading + intro */}
        <div className="max-w-3xl mb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground">
            research framework
          </p>
          <h2 className="mt-4 font-heading text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">
            from research to execution.
          </h2>
          <p className="mt-6 font-mono text-xs leading-7 text-muted-foreground">
            Every strategy follows the same disciplined research lifecycle before becoming part of a live execution environment.
          </p>
        </div>

        {/* Timeline - vertical on mobile, horizontal on desktop */}
        <div className="relative">
          {/* Desktop horizontal line */}
          <div className="hidden lg:block absolute top-8 left-0 right-0 h-px bg-border" aria-hidden="true" />

          {/* Stages */}
          <div className="grid gap-8 lg:grid-cols-6">
            {stages.map((stage, index) => (
              <div
                key={stage.number}
                className="group relative lg:pt-16"
              >
                {/* Number - large serif */}
                <div className="mb-4 lg:mb-6">
                  <span className="font-heading text-5xl lg:text-6xl text-foreground group-hover:text-muted-foreground/70 transition-colors duration-200">
                    {stage.number}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground mb-3">
                  {stage.title}
                </h3>

                {/* Body */}
                <p className="font-mono text-xs leading-6 text-muted-foreground/80">
                  {stage.body}
                </p>

                {/* Desktop connecting line - right side */}
                {index < stages.length - 1 && (
                  <div className="hidden lg:block absolute top-9 right-0 w-px h-px bg-transparent group-hover:bg-border transition-colors duration-200" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}