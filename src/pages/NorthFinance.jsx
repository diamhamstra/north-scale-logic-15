import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import FinanceDashboard from "@/components/finance/FinanceDashboard";
import CfoWorkspace from "@/components/finance/CfoWorkspace";
import AccountingWorkspace from "@/components/finance/AccountingWorkspace";
import ControllerWorkspace from "@/components/finance/ControllerWorkspace";
import TreasuryWorkspace from "@/components/finance/TreasuryWorkspace";
import NotificationBell from "@/components/portal/NotificationBell";

const LIGHT_THEME = {
  "--background": "40 33% 96%",
  "--foreground": "222 47% 11%",
  "--card": "0 0% 100%",
  "--card-foreground": "222 47% 11%",
  "--popover": "0 0% 100%",
  "--popover-foreground": "222 47% 11%",
  "--primary": "222 47% 11%",
  "--primary-foreground": "40 33% 96%",
  "--secondary": "40 22% 90%",
  "--secondary-foreground": "222 47% 11%",
  "--muted": "40 22% 90%",
  "--muted-foreground": "215 16% 42%",
  "--accent": "40 22% 90%",
  "--accent-foreground": "222 47% 11%",
  "--border": "214 18% 80%",
  "--input": "214 18% 80%",
  "--ring": "222 47% 11%",
};

const TOP_NAV = [
  { key: "overview", label: "Overview" },
  { key: "cfo", label: "CFO" },
  { key: "accounting", label: "Accounting" },
  { key: "controller", label: "Controller" },
  { key: "treasury", label: "Treasury" },
];

export default function NorthFinance() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("t") || "overview";
  const setTab = (t) => setSearchParams({ t });

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!me || me?.role !== "admin") { window.location.href = "/north"; return; }
        setUser(me);
      } catch {
        window.location.href = "/north";
        return;
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={LIGHT_THEME}>
      <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" style={LIGHT_THEME}>
      {/* HEADER */}
      <header className="border-b border-border bg-background/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-[1400px] w-full px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Link to="/north" className="font-mono text-[13px] text-muted-foreground hover:text-foreground transition-colors tracking-[0.18em]">north</Link>
            <span className="font-mono text-[13px] text-muted-foreground/40">/</span>
            <span className="font-mono text-[13px] text-foreground tracking-[0.18em]">finance</span>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell userId={user?.id} />
            <span className="hidden sm:block font-mono text-[11px] text-muted-foreground">
              {(() => { const n = user?.full_name?.trim(); if (!n) return ""; const parts = n.split(" "); return parts.length === 1 ? parts[0] : `${parts[0][0]}. ${parts[parts.length - 1]}`; })()}
            </span>
            <button onClick={() => base44.auth.logout("/north")} className="font-mono text-[10px] lowercase tracking-[0.24em] text-muted-foreground hover:text-foreground transition-colors">sign out</button>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8 flex gap-0 overflow-x-auto">
            {TOP_NAV.map(item => (
              <button key={item.key} onClick={() => setTab(item.key)}
                className={`px-5 py-3 font-mono text-[10px] lowercase tracking-[0.22em] whitespace-nowrap border-b-2 -mb-px transition-colors ${tab === item.key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {item.label.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-[1400px] w-full px-5 sm:px-8 py-10">
        {tab === "overview" && (
          <FinanceDashboard
            financials={{ aum: 0, committed: 0, hasData: false, openPl: 0, closedPl: 0, ledger: [], volatile: 0, stable: 0 }}
            loading={false}
          />
        )}
        {tab === "cfo" && <CfoWorkspace />}
        {tab === "accounting" && <AccountingWorkspace />}
        {tab === "controller" && <ControllerWorkspace />}
        {tab === "treasury" && <TreasuryWorkspace />}
      </main>
    </div>
  );
}