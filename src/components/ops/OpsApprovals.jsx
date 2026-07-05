import React, { useState } from "react";
import InvestorDrawer from "@/components/admin/InvestorDrawer";
import { AGREEMENTS } from "@/lib/agreements";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const STAGE_LABELS = { profile: "1 Profile", agreements: "2 Agreements", passport: "3 Passport", complete: "✓ Complete" };
const STAGE_COLORS = { profile: "text-muted-foreground", agreements: "text-yellow-400", passport: "text-blue-400", complete: "text-green-400" };

function onboardingPct(p) {
  const stage = p.onboarding_stage || "profile";
  const map = { profile: 0, agreements: 33, passport: 66, complete: 100 };
  return map[stage] ?? 0;
}

export default function OpsApprovals({ profiles, updateStatus, user, refetch }) {
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = profiles.filter(p => {
    if (filter !== "all" && p.access_status !== filter) return false;
    if (search && !p.full_name?.toLowerCase().includes(search.toLowerCase()) && !p.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pending = profiles.filter(p => p.access_status === "pending");

  return (
    <div className="px-6 sm:px-8 py-8">
      <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground mb-1">Operations</p>
          <h1 className="font-heading text-3xl text-foreground">Client Approvals</h1>
        </div>
        {pending.length > 0 && (
          <div className="border border-yellow-400/20 bg-yellow-400/5 px-4 py-2">
            <span className="font-mono text-[10px] text-yellow-400">{pending.length} pending approval{pending.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 border border-border mb-6">
        {[
          { label: "Pending", value: profiles.filter(p => p.access_status === "pending").length, color: "text-yellow-400" },
          { label: "Approved", value: profiles.filter(p => p.access_status === "approved").length, color: "text-green-400" },
          { label: "Rejected", value: profiles.filter(p => p.access_status === "rejected").length, color: "text-red-400" },
          { label: "Total", value: profiles.length },
        ].map((s, i) => (
          <div key={s.label} className={`p-4 ${i < 3 ? "border-r border-border" : ""}`}>
            <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-1">{s.label}</p>
            <p className={`font-heading text-2xl ${s.color || "text-foreground"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email..."
          className="border border-border bg-background px-4 py-2 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground flex-1 max-w-xs" />
        <div className="flex gap-0 border border-border font-mono text-[10px] uppercase tracking-[0.18em]">
          {["pending", "approved", "rejected", "all"].map((f, i) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 transition-colors ${i > 0 ? "border-l border-border" : ""} ${filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-border overflow-x-auto">
        <table className="w-full font-mono text-xs min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-secondary">
              {["Name", "Email", "Referral", "Registered", "Stage", "Progress", "Status", "Actions"].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-normal whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">No records found.</td></tr>}
            {filtered.map((p, i) => {
              const pct = onboardingPct(p);
              const stage = p.onboarding_stage || "profile";
              return (
                <tr key={p.id} onClick={() => setSelected(p)}
                  className={`transition-colors hover:bg-secondary/30 cursor-pointer ${i < filtered.length - 1 ? "border-b border-border/50" : ""}`}>
                  <td className="px-4 py-3.5 text-foreground whitespace-nowrap">{p.full_name || "—"}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">{p.email}</td>
                  <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">{p.referred_by || "—"}</td>
                  <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">{fmtDate(p.created_date)}</td>
                  <td className={`px-4 py-3.5 whitespace-nowrap text-[10px] ${STAGE_COLORS[stage] || "text-muted-foreground"}`}>{STAGE_LABELS[stage] || stage}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-px bg-border relative overflow-hidden">
                        <div className="absolute left-0 top-0 h-px bg-foreground" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{pct}%</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3.5 whitespace-nowrap text-[10px] uppercase tracking-[0.14em] ${p.access_status === "approved" ? "text-green-400" : p.access_status === "rejected" ? "text-red-400" : "text-yellow-400"}`}>
                    {p.access_status}
                  </td>
                  <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2">
                      {p.access_status !== "approved" && (
                        <button onClick={() => updateStatus(p.id, "approved")}
                          className="border border-green-400/30 px-2 py-1 text-green-400 hover:bg-green-400/10 transition-colors text-[9px] uppercase tracking-[0.14em] whitespace-nowrap">
                          Approve
                        </button>
                      )}
                      {p.access_status !== "rejected" && (
                        <button onClick={() => updateStatus(p.id, "rejected")}
                          className="border border-red-400/30 px-2 py-1 text-red-400 hover:bg-red-400/10 transition-colors text-[9px] uppercase tracking-[0.14em] whitespace-nowrap">
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <InvestorDrawer
          profile={selected}
          onClose={() => setSelected(null)}
          onStatusChange={(id, status) => { updateStatus(id, status); setSelected(null); }}
          onDeleted={() => { setSelected(null); refetch?.(); }}
        />
      )}
    </div>
  );
}