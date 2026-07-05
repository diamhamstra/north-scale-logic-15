import React, { useEffect, useState } from "react";
import { engines } from "@/lib/engineConfig";
import { invokeFunction } from "@/lib/invokeFunction";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const ENGINE_CONFIG = {
  commodities: {
    label: "Commodities Engine",
    idKey: "commodities_metacopier_id",
    emailKey: "commodities_metacopier_email",
  },
  digital: {
    label: "Digital Assets Engine",
    idKey: "digital_metacopier_id",
    emailKey: "digital_metacopier_email",
  },
  equities: {
    label: "Equity Indices Engine",
    idKey: "equities_metacopier_id",
    emailKey: "equities_metacopier_email",
  },
};

async function fetchEnginePerformance(engineKey) {
  const res = await invokeFunction("metacopierService", { method: "getFullPerformance", engine: engineKey });
  return res.data;
}

const Stat = ({ label, value, positive }) => (
  <div className="border-b border-border pb-5">
    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1">{label}</p>
    <p className={`font-mono text-sm ${positive === true ? "text-green-400" : positive === false ? "text-red-400" : "text-foreground"}`}>
      {value ?? "—"}
    </p>
  </div>
);

const SectionHeader = ({ label }) => (
  <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground border-b border-border pb-4 mb-6">{label}</p>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border px-4 py-3">
      <p className="font-mono text-[10px] text-muted-foreground mb-1">{label}</p>
      <p className="font-mono text-xs text-foreground">{payload[0].value}</p>
    </div>
  );
};

const fmt = (n, decimals = 2) => (n == null ? "—" : Number(n).toFixed(decimals));
const fmtPct = (n) => (n == null ? "—" : `${n >= 0 ? "+" : ""}${Number(n).toFixed(2)}%`);
const fmtUSD = (n) => (n == null ? "—" : `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`);

function EnginePerformanceCard({ engineKey, engineLabel, metacopierId, metacopierEmail, algorithm }) {
  const [data, setData] = useState(null);
  const [liveMode, setLiveMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchEnginePerformance(engineKey);
        if (cancelled) return;
        if (res?.result?.unavailable) {
          setData(res.result);
        } else {
          setData(res?.result ?? null);
          setLiveMode(!!res?.liveMode);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load performance data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [engineKey]);

  if (loading) {
    return (
      <div className="border border-border p-10 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-border border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-border p-8">
        <p className="font-mono text-xs text-red-400">Failed to load data: {error}</p>
      </div>
    );
  }

  if (data?.unavailable) {
    return (
      <div className="border border-border p-10 max-w-2xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">{engineLabel}</p>
        <p className="font-mono text-xs leading-7 text-muted-foreground">{data.message}</p>
      </div>
    );
  }

  const { overview, metrics, equity, monthly, drawdown } = data || {};
  const isPlaceholder = data?.isPlaceholder || metrics?.isPlaceholder;
  const equityChart = (equity?.data || []).map((p) => ({
    month: p.month || p.date,
    value: p.value ?? p.equity ?? p.balance,
  }));
  const monthlyChart = monthly?.data || [];
  const drawdownChart = (drawdown?.data || []).map((p) => ({
    month: p.month || p.date,
    dd: p.dd ?? p.drawdown,
  }));

  return (
    <div className="border border-border">
      <div className="px-8 py-6 border-b border-border flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-1">{engineLabel}</p>
          {algorithm && (
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/60">{algorithm}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            {liveMode ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-green-400">Live — MetaCopier</span>
              </>
            ) : isPlaceholder ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-yellow-400">Illustrative Data</span>
              </>
            ) : null}
          </div>
        </div>
        {metacopierId && (
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">MetaCopier ID</p>
            <p className="font-mono text-xs text-foreground">{metacopierId}</p>
          </div>
        )}
      </div>

      <div className="p-8 space-y-10">
        <div>
          <SectionHeader label="Account Overview" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <Stat label="Engine" value={engineLabel} />
            <Stat label="Broker" value={overview?.broker} />
            <Stat label="Platform" value={overview?.platform} />
            <Stat label="Environment" value={overview?.environment} />
          </div>
          {(metacopierEmail || metacopierId) && (
            <div className="grid grid-cols-2 gap-6 mt-6">
              {metacopierEmail && <Stat label="MetaCopier Email" value={metacopierEmail} />}
              {metacopierId && <Stat label="MetaCopier ID" value={metacopierId} />}
            </div>
          )}
        </div>

        <div>
          <SectionHeader label="Performance" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <Stat label="Balance" value={fmtUSD(metrics?.balance ?? overview?.balance)} />
            <Stat label="Equity" value={fmtUSD(metrics?.equity ?? overview?.equity)} />
            <Stat label="Open P/L" value={fmtUSD(metrics?.openPL)} positive={metrics?.openPL >= 0} />
            <Stat label="Total Return" value={fmtPct(metrics?.totalReturnPct)} positive={(metrics?.totalReturnPct ?? 0) >= 0} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-6">
            <Stat label="Monthly Return" value={fmtPct(metrics?.monthlyReturnPct)} positive={(metrics?.monthlyReturnPct ?? 0) >= 0} />
            <Stat label="YTD Return" value={fmtPct(metrics?.ytdReturnPct)} positive={(metrics?.ytdReturnPct ?? 0) >= 0} />
            <Stat label="Max Drawdown" value={fmtPct(metrics?.maxDrawdownPct)} positive={false} />
            <Stat label="Sharpe Ratio" value={fmt(metrics?.sharpeRatio)} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mt-6">
            <Stat label="Win Rate" value={metrics?.winRate != null ? `${fmt(metrics.winRate)}%` : "—"} />
            <Stat label="Total Trades" value={metrics?.totalTrades ?? "—"} />
            <Stat label="Profit Factor" value={fmt(metrics?.profitFactor)} />
          </div>
        </div>

        <div>
          <SectionHeader label="Charts" />
          <div className="space-y-10">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-4">Equity Curve</p>
              <div className="h-48 border border-border p-4">
                {equityChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={equityChart}>
                      <XAxis dataKey="month" tick={{ fontFamily: "IBM Plex Mono", fontSize: 9, fill: "hsl(215 20% 65%)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontFamily: "IBM Plex Mono", fontSize: 9, fill: "hsl(215 20% 65%)" }} axisLine={false} tickLine={false} width={60} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="value" stroke="hsl(210 40% 98%)" strokeWidth={1} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="font-mono text-xs text-muted-foreground">No equity data available.</p>
                )}
              </div>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-4">Monthly Performance (%)</p>
              <div className="h-40 border border-border p-4">
                {monthlyChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChart}>
                      <XAxis dataKey="month" tick={{ fontFamily: "IBM Plex Mono", fontSize: 9, fill: "hsl(215 20% 65%)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontFamily: "IBM Plex Mono", fontSize: 9, fill: "hsl(215 20% 65%)" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={0} stroke="hsl(217 33% 17%)" />
                      <Bar dataKey="return" fill="hsl(210 40% 98%)" opacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="font-mono text-xs text-muted-foreground">No monthly return data available.</p>
                )}
              </div>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-4">Drawdown History (%)</p>
              <div className="h-36 border border-border p-4">
                {drawdownChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={drawdownChart}>
                      <XAxis dataKey="month" tick={{ fontFamily: "IBM Plex Mono", fontSize: 9, fill: "hsl(215 20% 65%)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontFamily: "IBM Plex Mono", fontSize: 9, fill: "hsl(215 20% 65%)" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={0} stroke="hsl(217 33% 17%)" />
                      <Line type="monotone" dataKey="dd" stroke="hsl(0 72% 51%)" strokeWidth={1} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="font-mono text-xs text-muted-foreground">No drawdown data available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewSummary({ profile, connectedEngines }) {
  if (connectedEngines.length === 0) {
    return (
      <div className="border border-border p-12 max-w-lg mb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-4">Performance</p>
        <p className="font-mono text-xs leading-7 text-muted-foreground">
          No connected MetaCopier accounts yet. Complete engine setup to link your brokerage account and view live performance.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-10">
      {connectedEngines.map(({ key, label, id }) => (
        <div key={key} className="border border-border p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">{label}</p>
          <p className="font-mono text-xs text-green-400 mb-1">● connected</p>
          <p className="font-mono text-[10px] text-muted-foreground/60 truncate">ID: {id}</p>
        </div>
      ))}
    </div>
  );
}

export default function PerformanceDashboard({ profile, engineFilter = "overview" }) {
  const connectedEngines = ["commodities", "digital"]
    .map((key) => {
      const cfg = ENGINE_CONFIG[key];
      const id = profile?.[cfg.idKey];
      if (!id) return null;
      return { key, label: cfg.label, id, email: profile?.[cfg.emailKey] };
    })
    .filter(Boolean);

  const enginesToShow = engineFilter === "overview"
    ? connectedEngines
    : engineFilter === "equities"
      ? [{ key: "equities", label: ENGINE_CONFIG.equities.label, id: profile?.equities_metacopier_id, email: profile?.equities_metacopier_email }]
      : connectedEngines.filter((e) => e.key === engineFilter);

  if (engineFilter === "overview") {
    return (
      <div className="space-y-10">
        <OverviewSummary profile={profile} connectedEngines={connectedEngines} />
        {connectedEngines.map(({ key, label, id, email }) => (
          <EnginePerformanceCard
            key={key}
            engineKey={key}
            engineLabel={label}
            metacopierId={id}
            metacopierEmail={email}
            algorithm={engines[key]?.algorithm}
          />
        ))}
        <div className="border-t border-border pt-6">
          <p className="font-mono text-[10px] leading-6 text-muted-foreground/40">
            Performance information is provided for informational purposes only. Broker statements remain the official record of account activity. Historical performance does not guarantee future results.
          </p>
        </div>
      </div>
    );
  }

  if (enginesToShow.length === 0 && engineFilter !== "equities") {
    const cfg = ENGINE_CONFIG[engineFilter];
    return (
      <div className="border border-border p-10 max-w-2xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">{cfg?.label || engineFilter}</p>
        <p className="font-mono text-xs leading-7 text-muted-foreground">
          No MetaCopier account connected for this engine. Complete the onboarding setup to link your account and view performance charts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {enginesToShow.map(({ key, label, id, email }) => (
        <EnginePerformanceCard
          key={key}
          engineKey={key}
          engineLabel={label}
          metacopierId={id}
          metacopierEmail={email}
          algorithm={engines[key]?.algorithm}
        />
      ))}
      <div className="border-t border-border pt-6">
        <p className="font-mono text-[10px] leading-6 text-muted-foreground/40">
          Performance information is provided for informational purposes only. Broker statements remain the official record of account activity. Historical performance does not guarantee future results.
        </p>
      </div>
    </div>
  );
}
