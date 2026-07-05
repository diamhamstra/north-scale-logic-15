/**
 * Performance Sync — Scheduled hourly job
 * Fetches MetaCopier data for all active clients and stores PerformanceSnapshot records.
 * Called by the hourly scheduled automation.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const BASE_URL = "https://api.metacopier.io/rest/api/v1";

async function apiFetch(path, apiKey) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`MetaCopier ${res.status}: ${await res.text()}`);
  return res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Scheduled jobs call without user auth — allow service role
    const apiKey = Deno.env.get("METACOPIER_API_KEY");
    if (!apiKey) {
      return Response.json({ skipped: true, reason: "METACOPIER_API_KEY not configured" });
    }

    const today = new Date().toISOString().split("T")[0];

    // Get all approved profiles with metacopier IDs
    const profiles = await base44.asServiceRole.entities.InvestorProfile.filter({ access_status: "approved" });
    const synced = [];
    const errors = [];

    for (const profile of profiles) {
      const engines = [];
      if (profile.commodities_metacopier_id) engines.push({ engine: "commodities", id: profile.commodities_metacopier_id });
      if (profile.digital_metacopier_id) engines.push({ engine: "digital", id: profile.digital_metacopier_id });
      if (profile.equities_metacopier_id) engines.push({ engine: "equities", id: profile.equities_metacopier_id });

      for (const { engine, id } of engines) {
        try {
          const metrics = await apiFetch(`/accounts/${id}/performanceMetrics`, apiKey);

          const equityCurve = (metrics.balanceEquityDivergencePerDay || metrics.floatingPnlPerDay || []).map((p) => ({
            date: p.date,
            balance: p.balance,
            equity: p.equity,
          }));
          const monthlyReturns = (metrics.byMonth || []).map((m) => ({
            month: m.label || m.month,
            return: m.gain ?? m.netProfit ?? 0,
          }));

          // Check if snapshot for today already exists
          const existing = await base44.asServiceRole.entities.PerformanceSnapshot.filter({
            user_id: profile.user_id,
            engine,
            snapshot_date: today,
          });

          const snapshotData = {
            user_id: profile.user_id,
            engine,
            metacopier_id: id,
            balance: metrics.balance || 0,
            equity: metrics.equity || 0,
            open_pl: metrics.openFloatingPnL ?? metrics.floatingPnL ?? metrics.openProfit ?? 0,
            closed_pl: metrics.closedProfit || 0,
            total_return: metrics.gain || 0,
            monthly_return: metrics.monthly || 0,
            max_drawdown: metrics.maxDrawdown || 0,
            win_rate: metrics.winRate || 0,
            profit_factor: metrics.profitFactor || 0,
            equity_curve_json: JSON.stringify(equityCurve),
            monthly_returns_json: JSON.stringify(monthlyReturns),
            snapshot_date: today,
            is_placeholder: false,
          };

          let snapshotId;
          if (existing.length > 0) {
            await base44.asServiceRole.entities.PerformanceSnapshot.update(existing[0].id, snapshotData);
            snapshotId = existing[0].id;
          } else {
            const created = await base44.asServiceRole.entities.PerformanceSnapshot.create(snapshotData);
            snapshotId = created.id;
            base44.functions.invoke("automationEngine", {
              event: "PERFORMANCE_SYNCED",
              data: { user_id: profile.user_id, engine, snapshot_id: snapshotId },
            }).catch(function () {});
          }

          synced.push({ user_id: profile.user_id, engine, id });
        } catch (e) {
          errors.push({ user_id: profile.user_id, engine, error: e.message });
        }
      }
    }

    // Write audit log
    await base44.asServiceRole.entities.AuditLog.create({
      user_id: "system",
      actor_id: "system",
      action: "PERFORMANCE_SYNC_RUN",
      object_type: "PerformanceSnapshot",
      object_label: `Synced ${synced.length} accounts, ${errors.length} errors`,
      metadata_json: JSON.stringify({ synced: synced.length, errors }),
      ip_address: "system",
    });

    return Response.json({ success: true, synced: synced.length, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
