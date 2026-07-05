import React, { useMemo } from "react";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function CMReferrals({ profiles, crmRecords, globalSearch }) {
  const referralMap = useMemo(() => {
    const map = {};
    profiles.forEach(p => {
      if (!p.referred_by) return;
      const key = p.referred_by.trim();
      if (!map[key]) map[key] = { referrer: key, total: 0, converted: 0, active: 0, clients: [] };
      map[key].total++;
      const crm = crmRecords.find(c => c.user_id === p.user_id || c.profile_id === p.id);
      if (p.access_status === "approved") map[key].converted++;
      if (crm?.client_status === "active") map[key].active++;
      map[key].clients.push(p);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [profiles, crmRecords]);

  const q = globalSearch.toLowerCase();
  const filtered = q ? referralMap.filter(r => r.referrer.toLowerCase().includes(q)) : referralMap;

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-2">Client Management</p>
        <h1 className="font-heading text-4xl text-foreground">Referrals</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 border border-border mb-8">
        {[
          { label: "Unique Referrers", value: referralMap.length },
          { label: "Total Referred", value: referralMap.reduce((a, r) => a + r.total, 0) },
          { label: "Converted", value: referralMap.reduce((a, r) => a + r.converted, 0), color: "text-green-400" },
        ].map((s, i) => (
          <div key={s.label} className={`p-5 ${i < 2 ? "border-r border-border" : ""}`}>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-2">{s.label}</p>
            <p className={`font-heading text-3xl ${s.color || "text-foreground"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Referral table */}
      <div className="border border-border overflow-x-auto mb-8">
        <table className="w-full font-mono text-xs min-w-[500px]">
          <thead>
            <tr className="border-b border-border bg-secondary">
              {["Referrer", "Total Referred", "Converted", "Active Clients", "Conversion Rate"].map(h => (
                <th key={h} className="px-5 py-4 text-left uppercase tracking-[0.16em] text-muted-foreground font-normal whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No referral data found.</td></tr>}
            {filtered.map((r, i) => {
              const rate = r.total > 0 ? Math.round((r.converted / r.total) * 100) : 0;
              return (
                <tr key={r.referrer} className={`hover:bg-secondary/20 transition-colors ${i < filtered.length - 1 ? "border-b border-border/50" : ""}`}>
                  <td className="px-5 py-4 text-foreground font-semibold">{r.referrer}</td>
                  <td className="px-5 py-4 text-foreground">{r.total}</td>
                  <td className="px-5 py-4 text-green-400">{r.converted}</td>
                  <td className="px-5 py-4 text-blue-400">{r.active}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-px bg-border relative overflow-hidden">
                        <div className="absolute left-0 top-0 h-px bg-foreground" style={{ width: `${rate}%` }} />
                      </div>
                      <span className="text-muted-foreground">{rate}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Referred clients breakdown */}
      {filtered.map(r => (
        <div key={r.referrer} className="border border-border mb-4">
          <div className="px-5 py-4 border-b border-border bg-secondary flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground">Referred by: {r.referrer}</p>
            <span className="font-mono text-[10px] text-muted-foreground">{r.total} client{r.total !== 1 ? "s" : ""}</span>
          </div>
          {r.clients.map((c, i) => (
            <div key={c.id} className={`flex items-center justify-between px-5 py-3.5 ${i < r.clients.length - 1 ? "border-b border-border/40" : ""}`}>
              <div>
                <p className="font-mono text-xs text-foreground">{c.full_name || "—"}</p>
                <p className="font-mono text-[10px] text-muted-foreground/60 mt-0.5">{c.email}</p>
              </div>
              <div className="text-right">
                <span className={`font-mono text-[10px] uppercase tracking-[0.14em] ${c.access_status === "approved" ? "text-green-400" : c.access_status === "rejected" ? "text-red-400" : "text-yellow-400"}`}>
                  {c.access_status}
                </span>
                <p className="font-mono text-[10px] text-muted-foreground/50 mt-0.5">{fmtDate(c.created_date)}</p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}