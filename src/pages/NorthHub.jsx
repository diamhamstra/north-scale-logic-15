import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

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

const PORTALS = [
  {
    key: "master",
    path: "/admin-portal",
    label: "master",
    description: "Full-access founder control panel. All modules, all data, all clients.",
    tag: "unrestricted",
    tagColor: "text-foreground border-foreground/30",
    available: true,
  },
  {
    key: "finance",
    path: "/north-finance",
    label: "finance",
    description: "Capital management, client financials, referral analytics, and CFO data sync.",
    tag: "live",
    tagColor: "text-emerald-700 border-emerald-600/30",
    available: true,
  },
  {
    key: "legal",
    path: null,
    label: "legal",
    description: "Agreement oversight, KYC/AML review queue, compliance controls and evidence vault.",
    tag: "in development",
    tagColor: "text-amber-600 border-amber-600/30",
    available: false,
  },
  {
    key: "tech",
    path: null,
    label: "tech",
    description: "Infrastructure health, audit logs, system automation and security matrix.",
    tag: "in development",
    tagColor: "text-amber-600 border-amber-600/30",
    available: false,
  },
];

export default function NorthHub() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!me || me?.role !== "admin") { window.location.href = "/admin-login"; return; }
        setUser(me);
      } catch {
        window.location.href = "/admin-login";
        return;
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={LIGHT_THEME}>
        <div className="w-6 h-6 border-2 border-[hsl(214_18%_80%)] border-t-[hsl(222_47%_11%)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" style={LIGHT_THEME}>
      {/* HEADER */}
      <header className="border-b border-border bg-background/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-[1400px] w-full px-5 sm:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[20px] font-light text-muted-foreground/50">/</span>
            <span className="font-heading text-[20px] tracking-[0.28em] text-foreground px-2">north</span>
            <span className="font-mono text-[20px] font-light text-muted-foreground/50">/</span>
          </div>
          <div className="flex items-center gap-5">
            <span className="hidden sm:block font-mono text-xs text-muted-foreground">
              {(() => { const n = user?.full_name?.trim(); if (!n) return ""; const parts = n.split(" "); return parts.length === 1 ? parts[0] : `${parts[0][0]}. ${parts[parts.length - 1]}`; })()}
            </span>
            <button onClick={() => base44.auth.logout("/admin-login")} className="font-mono text-[10px] lowercase tracking-[0.24em] text-muted-foreground hover:text-foreground transition-colors">sign out</button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 mx-auto max-w-[1400px] w-full px-5 sm:px-8 py-16">

        {/* Intro */}
        <div className="mb-14">
          <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-3">north scale internal platform</p>
          <h1 className="font-heading text-5xl sm:text-6xl text-foreground leading-none mb-4">
            {now.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </h1>
          <p className="font-mono text-xs text-muted-foreground mt-3">
            Select a workspace to continue. Each portal is scoped to its team's permissions and responsibilities.
          </p>
        </div>

        {/* Portal grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {PORTALS.map((portal) => {
            const inner = (
              <div className={`group h-full border border-border bg-card p-7 flex flex-col gap-5 transition-all ${portal.available ? "hover:border-foreground/40 hover:shadow-sm cursor-pointer" : "opacity-60 cursor-default"}`}>
                {/* Tag */}
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-[9px] uppercase tracking-[0.26em] border px-2 py-0.5 ${portal.tagColor}`}>
                    {portal.tag}
                  </span>
                  {portal.available && (
                    <span className="font-mono text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">→</span>
                  )}
                </div>

                {/* Label */}
                <div className="flex-1">
                  <h2 className="font-heading text-3xl text-foreground mb-3 leading-none">{portal.label}</h2>
                  <p className="font-mono text-[11px] leading-6 text-muted-foreground">{portal.description}</p>
                </div>

                {/* Path indicator */}
                <div className="border-t border-border/60 pt-4">
                  <p className="font-mono text-[9px] text-muted-foreground/50">
                    {portal.path ? portal.path : "/north/" + portal.key + " · coming soon"}
                  </p>
                </div>
              </div>
            );

            return portal.available && portal.path ? (
              <Link key={portal.key} to={portal.path} className="block h-full">
                {inner}
              </Link>
            ) : (
              <div key={portal.key}>{inner}</div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-16 border-t border-border pt-6 flex items-center justify-between">
          <p className="font-mono text-[10px] text-muted-foreground/50 lowercase">north scale · internal operations hub · restricted access</p>
          <p className="font-mono text-[9px] text-muted-foreground/40 tabular-nums">
            {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} utc
          </p>
        </div>
      </main>
    </div>
  );
}