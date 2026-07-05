import React from "react";

const rows = [
  { period: "2024", commodities: "Internal", digitalAssets: "Internal", equities: "Internal", note: "Manager review" },
  { period: "2023", commodities: "Internal", digitalAssets: "Internal", equities: "Internal", note: "Manager review" },
  { period: "2022", commodities: "Internal", digitalAssets: "Internal", equities: "Internal", note: "Manager review" },
  { period: "2021", commodities: "Internal", digitalAssets: "Internal", equities: "Internal", note: "Manager review" },
  { period: "2020", commodities: "Internal", digitalAssets: "Internal", equities: "Internal", note: "Manager review" },
];

export default function PerformanceLedger() {
  return (
    <section id="performance" className="border-b border-border bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-muted-foreground">Performance Ledger</p>
            <h2 className="mt-6 font-heading text-4xl leading-tight text-foreground sm:text-5xl">
              Returns presented as audited data, not marketing language.
            </h2>
          </div>
          <div className="lg:col-span-8">
            <div className="overflow-x-auto border border-border">
              <table className="w-full min-w-[680px] border-collapse font-mono text-sm" aria-label="North Scale performance disclosure table">
                <thead>
                  <tr className="bg-secondary text-left text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    <th className="border-b border-r border-border p-5 font-normal">Period</th>
                    <th className="border-b border-r border-border p-5 font-normal">Commodities</th>
                    <th className="border-b border-r border-border p-5 font-normal">Digital Assets</th>
                    <th className="border-b border-r border-border p-5 font-normal">Equities</th>
                    <th className="border-b border-border p-5 font-normal">Disclosure Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.period} className="transition-colors hover:bg-secondary/60">
                      <td className="border-r border-border p-5 text-foreground">{row.period}</td>
                      <td className="border-r border-border p-5 text-muted-foreground">{row.commodities}</td>
                      <td className="border-r border-border p-5 text-muted-foreground">{row.digitalAssets}</td>
                      <td className="border-r border-border p-5 text-muted-foreground">{row.equities}</td>
                      <td className="p-5 text-muted-foreground">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-5 max-w-3xl font-mono text-xs leading-6 text-muted-foreground">
              Final performance figures should be published only after internal verification, applicable audit review, and required investor disclosure controls.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}