import React from "react";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function CMDashboard({ profiles, crmRecords, inquiries, onNavigate }) {
  const clients = crmRecords.filter(r => ["approved", "active"].includes(r.client_status));
  const leads = crmRecords.filter(r => r.client_status === "lead" || r.client_status === "pending");
  const pending = profiles.filter(p => p.access_status === "pending");
  const active = crmRecords.filter(r => r.client_status === "active");

  const engineDist = { commodities: 0, digital: 0, equities: 0 };
  profiles.forEach(p => { if (p.selected_engine && engineDist[p.selected_engine] !== undefined) engineDist[p.selected_engine]++; });

  const recentActivity = crmRecords
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 8);

  const recentRegistrations = profiles
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 5);

  return (
    <div>
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-border mb-8">
        {[
          { label: "Total Clients", value: clients.length, color: "text-foreground", action: () => onNavigate("active") },
          { label: "Pending Approvals", value: pending.length, color: pending.length > 0 ? "text-yellow-400" : "text-foreground", action: () => onNavigate("applicants") },
          { label: "Active Leads", value: leads.length, color: "text-blue-400", action: () => onNavigate("leads") },
          { label: "Active Investors", value: active.length, color: "text-green-400", action: () => onNavigate("active") },
        ].map((s, i) => (
          <button key={s.label} onClick={s.action}
            className={`p-6 text-left transition-colors hover:bg-secondary/30 ${i < 3 ? "border-r border-border" : ""} ${i >= 2 ? "border-t border-border lg:border-t-0" : ""}`}>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">{s.label}</p>
            <p className={`font-heading text-4xl ${s.color}`}>{s.value}</p>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Engine Distribution */}
        <div className="border border-border">
          <div className="px-5 py-4 border-b border-border bg-secondary">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Engine Distribution</p>
          </div>
          <div className="p-5 space-y-4">
            {[
              { key: "commodities", label: "Commodities Engine" },
              { key: "digital", label: "Digital Assets Engine" },
              { key: "equities", label: "Equity Indices" },
            ].map(e => {
              const count = engineDist[e.key];
              const total = Object.values(engineDist).reduce((a, b) => a + b, 0) || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={e.key}>
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-[10px] text-muted-foreground">{e.label}</span>
                    <span className="font-mono text-[10px] text-foreground">{count}</span>
                  </div>
                  <div className="h-px bg-border relative overflow-hidden">
                    <div className="absolute left-0 top-0 h-px bg-foreground transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="border border-border lg:col-span-2">
          <div className="px-5 py-4 border-b border-border bg-secondary flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Recent Registrations</p>
            <button onClick={() => onNavigate("applicants")} className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors">View all →</button>
          </div>
          <div>
            {recentRegistrations.length === 0 && <p className="p-5 font-mono text-xs text-muted-foreground">No registrations yet.</p>}
            {recentRegistrations.map((p, i) => (
              <div key={p.id} className={`flex items-center justify-between px-5 py-3.5 ${i < recentRegistrations.length - 1 ? "border-b border-border/50" : ""}`}>
                <div>
                  <p className="font-mono text-xs text-foreground">{p.full_name || p.email}</p>
                  <p className="font-mono text-[10px] text-muted-foreground/60 mt-0.5">{p.email}</p>
                </div>
                <div className="text-right">
                  <span className={`font-mono text-[10px] uppercase tracking-[0.14em] ${
                    p.access_status === "approved" ? "text-green-400" : p.access_status === "rejected" ? "text-red-400" : "text-yellow-400"
                  }`}>{p.access_status}</span>
                  <p className="font-mono text-[10px] text-muted-foreground/50 mt-0.5">{fmtDate(p.created_date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent CRM Activity */}
      <div className="border border-border">
        <div className="px-5 py-4 border-b border-border bg-secondary">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Recent CRM Activity</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-xs">
            <thead>
              <tr className="border-b border-border/60">
                {["Name", "Email", "Source", "Status", "Engine", "Referred By", "Date"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-normal whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((r, i) => {
                const sc = { lead: "text-muted-foreground", pending: "text-yellow-400", approved: "text-blue-400", active: "text-green-400", rejected: "text-red-400" };
                return (
                  <tr key={r.id} className={`hover:bg-secondary/20 transition-colors ${i < recentActivity.length - 1 ? "border-b border-border/40" : ""}`}>
                    <td className="px-5 py-3 text-foreground whitespace-nowrap">{r.full_name || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{r.email}</td>
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{r.lead_source?.replace(/_/g, " ") || "—"}</td>
                    <td className={`px-5 py-3 whitespace-nowrap uppercase tracking-[0.14em] text-[10px] ${sc[r.client_status] || "text-muted-foreground"}`}>{r.client_status}</td>
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{r.engine || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{r.referred_by || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{fmtDate(r.created_date)}</td>
                  </tr>
                );
              })}
              {recentActivity.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">No records yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}