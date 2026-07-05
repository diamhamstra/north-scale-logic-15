import React from "react";

const MILESTONES = [
  {
    date: "Q3 2026",
    phase: "System Deployment",
    items: [
      { heading: "5 Core Models Live", body: "Full activation of systematic strategies across commodities, equity indices, and digital assets." },
      { heading: "Pre-Fund Capital Pooling", body: "Secure portal environments live for early-stage allocations and alpha-tracking." },
    ],
  },
  {
    date: "Q4 2026",
    phase: "Audit & Compliance",
    items: [
      { heading: "Track Record Validation", body: "3 months of continuous, live-verified performance and risk-matrix logging." },
      { heading: "Third-Party Custody", body: "Transitioning the pre-fund infrastructure to regulated, institutional custodians." },
      { heading: "Regulatory Sandbox Finalization", body: "Independent legal and compliance audits completed." },
    ],
  },
  {
    date: "Jan 2027",
    phase: "Fund Launch",
    items: [
      { heading: "AIFM License Approval", body: "Official granting of the AIFM license for regulated European asset management." },
      { heading: "Institutional Scale", body: "Full transition of the pre-launch pool into North Scale Fund I." },
    ],
  },
];

export default function RegulatoryRoadmap() {
  return (
    <section className="bg-background py-24 sm:py-32 border-b border-border">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">

        <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-4">
          regulatory &amp; system roadmap
        </p>
        <h2 className="mt-4 font-heading text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl lowercase mb-20">
          the path to institutional scale.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-border/40">
          {MILESTONES.map((m) => (
            <div key={m.date} className="pt-10 md:pt-0 md:px-8 first:pl-0 last:pr-0">
              <p className="font-heading text-4xl text-foreground lowercase mb-1">{m.date.toLowerCase()}</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground mb-8">{m.phase}</p>
              <div className="space-y-0">
                {m.items.map((item, i, arr) => (
                  <div key={item.heading} className={`py-6 ${i < arr.length - 1 ? "border-b border-border/30" : ""}`}>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground mb-2">{item.heading}</p>
                    <p className="font-mono text-xs leading-relaxed text-muted-foreground">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}