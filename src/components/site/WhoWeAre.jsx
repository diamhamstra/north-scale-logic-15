import React from "react";
import { Link } from "react-router-dom";

const stats = [
{ value: "10+", label: "battle-tested algorithms" },
{ value: "$1B+", label: "capital legacy managed by team" }];


export default function WhoWeAre() {
  return (
    <section className="border-b border-border bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground">ABOUT US</p>
          <h2 className="mt-4 font-heading text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">we are north scale.</h2>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left: Story */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-4">
              <p className="font-mono text-xs leading-7 text-muted-foreground">North Scale is a quantitative investment firm powered by a growing team of quant traders managing battle-tested algorithms.</p>
              <p className="font-mono text-xs leading-7 text-muted-foreground">Our leadership spans young tech founders who raised tens of millions early on, alongside veterans from firms like Goldman Sachs, Deloitte, and leading private equity funds.</p>
              <p className="font-mono text-xs leading-7 text-muted-foreground">North scale combines institutional-grade rigour with the speed and conviction of a modern technology firm.</p>
            </div>

            <div className="pt-2">
              <Link
                to="/careers"
                className="inline-flex items-center gap-3 border border-foreground bg-foreground text-background font-mono text-xs lowercase tracking-[0.24em] px-6 py-3 hover:bg-transparent hover:text-foreground transition-colors duration-200">
                
                we're hiring →
              </Link>
            </div>
          </div>

          {/* Right: Stats Grid */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4 content-start">
            {stats.map((stat, idx) =>
            <div key={idx} className="border border-border p-6">
                <p className="font-heading text-3xl sm:text-4xl text-foreground mb-2">{stat.value}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{stat.label}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>);

}