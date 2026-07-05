import React from "react";
import { Link } from "react-router-dom";

export default function PlatformSection() {
  return (
    <section className="border-b border-border bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-12 max-w-3xl">
          <p className="font-mono text-[10px] lowercase tracking-[0.36em] text-muted-foreground">scale platform</p>
          <h2 className="mt-4 font-heading text-4xl leading-tight text-foreground sm:text-5xl lowercase">
            institutional infrastructure for qualified investors.
          </h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: Description */}
          <div className="space-y-6">
            <p className="font-mono text-xs leading-7 text-muted-foreground">
              scale is a proprietary investment platform providing qualified investors with direct access to north scale's quantitative research engine. the platform combines institutional-grade infrastructure with a streamlined onboarding experience.
            </p>
            <p className="font-mono text-xs leading-7 text-muted-foreground">
              investors benefit from transparent performance reporting, real-time portfolio monitoring, and automated capital allocation across multiple systematic strategies.
            </p>
            <div className="pt-4">
              <Link
                to="/start"
                className="inline-block border border-border bg-transparent text-foreground font-mono text-xs lowercase tracking-[0.24em] px-8 py-4 hover:bg-border transition-colors"
              >
                request access →
              </Link>
            </div>
          </div>

          {/* Right: Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "streamlined onboarding", desc: "complete profile and agreements in minutes" },
              { label: "real-time reporting", desc: "live performance metrics and account analytics" },
              { label: "multi-strategy access", desc: "allocate across commodities, digital, and equity strategies" },
              { label: "institutional security", desc: "encrypted data, 2fa, and audit trails" },
            ].map((feature, idx) => (
              <div key={idx} className="border border-border/60 bg-secondary/10 p-5">
                <p className="font-mono text-xs lowercase text-foreground mb-2">{feature.label}</p>
                <p className="font-mono text-[10px] lowercase leading-5 text-muted-foreground/70">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}