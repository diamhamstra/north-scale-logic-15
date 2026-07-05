import React from "react";

const features = [
  {
    title: "SYSTEMATIC",
    body: "Every investment decision follows predefined research and execution frameworks rather than emotion.",
  },
  {
    title: "RESEARCH",
    body: "Strategies are continuously developed, tested and refined using quantitative research methodologies.",
  },
  {
    title: "TECHNOLOGY",
    body: "Advanced infrastructure designed to support scalable systematic trading across global markets.",
  },
  {
    title: "RISK",
    body: "Risk management is integrated into every stage of the investment process to promote disciplined execution.",
  },
];

export default function FirmProfile() {
  return (
    <section className="border-b border-border bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Section label + heading + body */}
        <div className="max-w-3xl mb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground">
            our approach
          </p>
          <h2 className="mt-4 font-heading text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">
            designed for complexity.
          </h2>
          <p className="mt-6 font-mono text-xs leading-7 text-muted-foreground">
            Financial markets generate enormous amounts of information every second. Our approach focuses on separating signal from noise through quantitative models, systematic execution and disciplined risk management.
          </p>
        </div>

        {/* Four feature cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="border border-border p-6">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.32em] text-foreground">
                {feature.title}
              </h3>
              <p className="mt-3 font-mono text-xs leading-6 text-muted-foreground">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}