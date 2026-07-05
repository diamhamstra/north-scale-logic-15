import React, { useState, useMemo } from "react";
import ClientProfile from "@/components/crm/ClientProfile";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const STATUS_COLORS = {
  pending: "text-yellow-400", approved: "text-blue-400",
  active: "text-green-400", rejected: "text-red-400",
  lead: "text-muted-foreground", inactive: "text-muted-foreground/50",
};

const ENGINE_LABELS = { commodities: "Commodities", digital: "Digital Assets", equities: "Equities" };

function generateClientId(id) {
  if (!id) return "—";
  const num = parseInt(id.replace(/-/g, "").slice(0, 8), 16) % 900000 + 100000;
  return `NS-${num}`;
}

export default function CMClients({ profiles, crmRecords, allUsers, user, globalSearch, refetchCRM }) {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState(globalSearch || "");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEngine, setFilterEngine] = useState("all");
  const [filterReferral, setFilterReferral] = useState("");

  // Merge profiles with CRM records
  const clients = useMemo(() => {
    return profiles.map(p => {
      const crm = crmRecords.find(c => c.user_id === p.user_id || c.profile_id === p.id);
      return { ...p, crm };
    });
  }, [profiles, crmRecords]);

  const referrals = [...new Set(clients.map(c => c.referred_by).filter(Boolean))];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clients.filter(c => {
      if (filterStatus !== "all" && c.access_status !== filterStatus) return false;
      if (filterEngine !== "all" && c.selected_engine !== filterEngine) return false;
      if (filterReferral && c.referred_by !== filterReferral) return false;
      const clientId = c.account_id || generateClientId(c.id);
      if (q && !c.full_name?.toLowerCase().includes(q) && !c.email?.toLowerCase().includes(q) && !clientId.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [clients, search, filterStatus, filterEngine, filterReferral]);

  if (selected) {
    const profile = profiles.find(p => p.id === selected.id) || selected;
    const crm = crmRecords.find(c => c.user_id === profile.user_id || c.profile_id === profile.id);
    return (
      <ClientProfile
        profile={profile}
        crm={crm}
        allUsers={allUsers}
        currentUser={user}
        onBack={() => setSelected(null)}
        refetchCRM={refetchCRM}
      />
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-2">Client Management</p>
          <h1 className="font-heading text-4xl text-foreground">Clients</h1>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{filtered.length} records</span>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, email, NS-ID..."
          className="col-span-2 border border-border bg-background px-4 py-2.5 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors"
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-border bg-background px-3 py-2.5 font-mono text-xs text-foreground focus:outline-none focus:border-foreground">
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={filterEngine} onChange={e => setFilterEngine(e.target.value)}
          className="border border-border bg-background px-3 py-2.5 font-mono text-xs text-foreground focus:outline-none focus:border-foreground">
          <option value="all">All Engines</option>
          <option value="commodities">Commodities</option>
          <option value="digital">Digital Assets</option>
          <option value="equities">Equities</option>
        </select>
      </div>

      {/* Table */}
      <div className="border border-border overflow-x-auto">
        <table className="w-full font-mono text-xs min-w-[900px]">
          <thead>
            <tr className="border-b border-border bg-secondary">
              {["Client ID", "Full Name", "Email", "Status", "Engine", "Monthly Inv.", "Referred By", "Onboarding", "Created", ""].map(h => (
                <th key={h} className="px-4 py-4 text-left uppercase tracking-[0.16em] text-muted-foreground font-normal whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="px-5 py-12 text-center text-muted-foreground">No clients match the current filters.</td></tr>
            )}
            {filtered.map((c, i) => {
              const totalSteps = 5;
              const step = c.onboarding_step || 0;
              const pct = c.onboarding_stage === "complete" ? 100 : Math.round((Math.min(step, totalSteps) / totalSteps) * 80);
              return (
                <tr key={c.id} onClick={() => setSelected(c)}
                  className={`transition-colors hover:bg-secondary/30 cursor-pointer ${i < filtered.length - 1 ? "border-b border-border/50" : ""}`}>
                  <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">
                    <span className="font-mono text-[10px] border border-border px-2 py-0.5">{c.account_id || generateClientId(c.id)}</span>
                  </td>
                  <td className="px-4 py-4 text-foreground whitespace-nowrap">{c.full_name || "—"}</td>
                  <td className="px-4 py-4 text-muted-foreground">{c.email}</td>
                  <td className={`px-4 py-4 whitespace-nowrap uppercase tracking-[0.14em] text-[10px] ${STATUS_COLORS[c.access_status] || "text-muted-foreground"}`}>
                    {c.access_status}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{ENGINE_LABELS[c.selected_engine] || "—"}</td>
                  <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{c.monthly_investment?.replace(/_/g, "–").replace(/k/g, "K") || "—"}</td>
                  <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{c.referred_by || "—"}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-px bg-border relative overflow-hidden">
                        <div className="absolute left-0 top-0 h-px bg-foreground" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{fmtDate(c.created_date)}</td>
                  <td className="px-4 py-4">
                    <span className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors">View →</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}