import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import FinancialsSection from "./mc/FinancialsSection";
import ComplianceSection from "./mc/ComplianceSection";
import SecuritySection from "./mc/SecuritySection";
import CfoSyncHub from "./mc/CfoSyncHub";

const MONTHLY_MID = {
  "25k_50k": 37500,
  "50k_100k": 75000,
  "100k_250k": 175000,
  "250k_500k": 375000,
  "500k_plus": 750000,
};

export default function MissionControl({ profiles = [], auditLogs = [], tasks = [], inquiries = [], health, onNavigate, onSelectProfile }) {
  const [snapshots, setSnapshots] = useState([]);
  const [loadingFin, setLoadingFin] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snaps = await base44.entities.PerformanceSnapshot.list("-snapshot_date", 300);
        setSnapshots(snaps || []);
      } catch {
        setSnapshots([]);
      }
      setLoadingFin(false);
    })();
  }, []);

  const financials = useMemo(() => {
    // Latest snapshot per user+engine (list is already sorted desc by date)
    const latest = {};
    for (const s of snapshots) {
      const key = `${s.user_id}_${s.engine}`;
      if (!latest[key]) latest[key] = s;
    }
    const rows = Object.values(latest);
    const aum = rows.reduce((a, s) => a + (s.balance || 0), 0);
    const openPl = rows.reduce((a, s) => a + (s.open_pl || 0), 0);
    const closedPl = rows.reduce((a, s) => a + (s.closed_pl || 0), 0);

    const byEngine = {};
    for (const s of rows) {
      if (!byEngine[s.engine]) byEngine[s.engine] = { engine: s.engine, balance: 0, equity: 0, open_pl: 0, accounts: 0 };
      byEngine[s.engine].balance += s.balance || 0;
      byEngine[s.engine].equity += s.equity || 0;
      byEngine[s.engine].open_pl += s.open_pl || 0;
      byEngine[s.engine].accounts += 1;
    }
    const ledger = Object.values(byEngine);
    const volatile = ledger.filter((e) => e.engine === "digital").reduce((a, e) => a + e.balance, 0);
    const stable = aum - volatile;
    const committed = profiles
      .filter((p) => p.access_status === "approved")
      .reduce((a, p) => a + (MONTHLY_MID[p.monthly_investment] || 0), 0);

    return { aum, openPl, closedPl, ledger, volatile, stable, committed, hasData: rows.length > 0 };
  }, [snapshots, profiles]);

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Command bar */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-1.5">founder mission control</p>
          <h2 className="font-heading text-3xl sm:text-4xl text-foreground leading-none">
            {now.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </h2>
        </div>
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          full access · unrestricted founder view
        </div>
      </div>

      {/* Three functional sections */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7">
          <FinancialsSection financials={financials} loading={loadingFin} />
        </div>
        <div className="xl:col-span-5 space-y-6">
          <ComplianceSection profiles={profiles} inquiries={inquiries} onNavigate={onNavigate} onSelectProfile={onSelectProfile} />
          <SecuritySection health={health} auditLogs={auditLogs} profiles={profiles} tasks={tasks} onNavigate={onNavigate} />
        </div>
      </div>

      {/* Operational — CFO data sync & automation */}
      <CfoSyncHub />
    </div>
  );
}