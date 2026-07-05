import React from "react";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const MONTHLY_LABELS = {
  "50k_100k": "$50k–$100k", "100k_250k": "$100k–$250k",
  "250k_500k": "$250k–$500k", "500k_1m": "$500k–$1M", "1m_plus": "$1M+"
};
const MONTHLY_MIDPOINTS = {
  "50k_100k": 75000, "100k_250k": 175000,
  "250k_500k": 375000, "500k_1m": 750000, "1m_plus": 1000000
};

function StatCard({ label, value, sub, color }) {
  return (
    <div className="border border-border p-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground mb-2">{label}</p>
      <p className={`font-heading text-3xl ${color || "text-foreground"}`}>{value}</p>
      {sub && <p className="font-mono text-[10px] text-muted-foreground/50 mt-1.5">{sub}</p>}
    </div>
  );
}

function BarRow({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border/40 last:border-0">
      <span className="font-mono text-[10px] text-muted-foreground w-36 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-px bg-border relative overflow-hidden">
        <div className={`absolute left-0 top-0 h-px ${color || "bg-foreground"}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-[10px] text-foreground w-10 text-right flex-shrink-0">{value}</span>
    </div>
  );
}

export default function OpsAnalytics({ profiles, crmRecords, inquiries }) {
  const approved = profiles.filter(p => p.access_status === "approved");
  const active = crmRecords.filter(r => r.client_status === "active");
  const converted = crmRecords.filter(r => r.client_status === "approved" || r.client_status === "active");

  const fmtAUM = (n) => n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${(n / 1e3).toFixed(0)}K`;

  // Demo figures
  const DEMO_PIPELINE_AUM = 2400000;
  const DEMO_APPROVED = 13;
  const DEMO_AVG_ALLOCATION = 184615; // ~2.4M / 13


  // Referral sources
  const referralCounts = {};
  profiles.forEach(p => {
    const key = p.referred_by?.trim() || "Direct";
    referralCounts[key] = (referralCounts[key] || 0) + 1;
  });
  const topReferrals = Object.entries(referralCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxReferral = topReferrals[0]?.[1] || 1;

  // Engine distribution
  const engines = { commodities: 0, digital: 0, equities: 0 };
  profiles.forEach(p => { if (p.selected_engine) engines[p.selected_engine] = (engines[p.selected_engine] || 0) + 1; });
  const maxEngine = Math.max(...Object.values(engines), 1);

  // Monthly investment distribution
  const invDist = {};
  profiles.forEach(p => { if (p.monthly_investment) invDist[p.monthly_investment] = (invDist[p.monthly_investment] || 0) + 1; });
  const maxInv = Math.max(...Object.values(invDist), 1);

  // Conversion rate
  const conversionRate = inquiries.length > 0 ? Math.round((converted.length / inquiries.length) * 100) : 0;

  // Weekly growth
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const newThisWeek = profiles.filter(p => new Date(p.created_date) > weekAgo).length;
  const newThisMonth = profiles.filter(p => new Date(p.created_date) > monthAgo).length;

  return (
    <div className="px-6 sm:px-8 py-8">
      <div className="mb-6"></div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-border mb-8">
        <StatCard label="Total Registrations" value={profiles.length} sub={`+${newThisWeek} this week`} />
        <StatCard label="Approved Clients" value={DEMO_APPROVED} color="text-green-400" sub={`${active.length} active`} />
        <StatCard label="Pipeline AUM" value={fmtAUM(DEMO_PIPELINE_AUM)} color="text-blue-400" sub="Estimated total" />
        <StatCard label="Avg. Allocation" value={fmtAUM(DEMO_AVG_ALLOCATION)} sub="Per client estimate" />
        <StatCard label="Conversion Rate" value={`${conversionRate}%`} sub="Inquiry → Client" />
        <StatCard label="New This Month" value={newThisMonth} color={newThisMonth > 0 ? "text-foreground" : "text-muted-foreground"} />
        <StatCard label="New Inquiries" value={inquiries.filter(i => i.status === "under_review").length} color="text-yellow-400" />
        <StatCard label="Connected Accounts" value={profiles.filter(p => p.commodities_metacopier_id || p.digital_metacopier_id).length} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Top Referral Sources */}
        <div className="border border-border">
          <div className="px-5 py-4 border-b border-border bg-card">
            <p className="font-mono text-[9px] uppercase tracking-[0.36em] text-muted-foreground">Top Referral Sources</p>
          </div>
          <div className="px-5 py-4">
            {topReferrals.length === 0 && <p className="font-mono text-xs text-muted-foreground">No referral data yet.</p>}
            {topReferrals.map(([name, count]) => (
              <BarRow key={name} label={name} value={count} max={maxReferral} />
            ))}
          </div>
        </div>

        {/* Engine Distribution */}
        <div className="border border-border">
          <div className="px-5 py-4 border-b border-border bg-card">
            <p className="font-mono text-[9px] uppercase tracking-[0.36em] text-muted-foreground">Engine Distribution</p>
          </div>
          <div className="px-5 py-4">
            <BarRow label="Commodities Engine" value={engines.commodities} max={maxEngine} />
            <BarRow label="Digital Assets Engine" value={engines.digital} max={maxEngine} />
            <BarRow label="Equity Indices" value={engines.equities} max={maxEngine} color="bg-muted-foreground/30" />
          </div>
          <div className="px-5 py-4 border-t border-border">
            <p className="font-mono text-[9px] uppercase tracking-[0.36em] text-muted-foreground mb-3">Monthly Investment Ranges</p>
            {Object.entries(invDist).sort((a, b) => b[1] - a[1]).map(([key, count]) => (
              <BarRow key={key} label={MONTHLY_LABELS[key] || key} value={count} max={maxInv} />
            ))}
          </div>
        </div>
      </div>

      {/* Onboarding funnel */}
      <div className="border border-border">
        <div className="px-5 py-4 border-b border-border bg-card">
          <p className="font-mono text-[9px] uppercase tracking-[0.36em] text-muted-foreground">Onboarding Funnel</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-border">
          {[
            { label: "Registered", value: profiles.length },
            { label: "Approved", value: approved.length },
            { label: "Profile Done", value: profiles.filter(p => p.profile_complete).length },
            { label: "Agreements Signed", value: profiles.filter(p => p.onboarding_stage === "complete" || p.onboarding_stage === "passport").length },
            { label: "Fully Active", value: profiles.filter(p => p.onboarding_stage === "complete").length, color: "text-green-400" },
          ].map((s, i) => (
            <div key={s.label} className="p-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground mb-2">{s.label}</p>
              <p className={`font-heading text-2xl ${s.color || "text-foreground"}`}>{s.value}</p>
              {i > 0 && profiles.length > 0 && (
                <p className="font-mono text-[9px] text-muted-foreground/50 mt-1">{Math.round((s.value / profiles.length) * 100)}% of total</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}