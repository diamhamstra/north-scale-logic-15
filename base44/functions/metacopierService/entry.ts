/**
 * MetaCopier Performance Service
 *
 * Authentication: resolveUser (Base44 native auth OR custom session token).
 * Project-level API key: METACOPIER_API_KEY secret.
 * Account IDs stored on InvestorProfile per engine.
 *
 * Base URL: https://api.metacopier.io/rest/api/v1
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const BASE_URL = "https://api.metacopier.io/rest/api/v1";

function extractSessionToken(body) {
  if (!body) return null;
  const token = body.session_token != null ? body.session_token : body.token;
  return typeof token === "string" && token.length > 0 ? token : null;
}

async function resolveUserFromSession(base44, sessionToken) {
  const sessions = await base44.asServiceRole.entities.UserSession.filter({
    token: sessionToken,
    is_active: true,
  });

  if (sessions.length === 0) return null;

  const session = sessions[0];
  if (new Date(session.expires_at) < new Date()) {
    await base44.asServiceRole.entities.UserSession.update(session.id, { is_active: false });
    return null;
  }

  const users = await base44.asServiceRole.entities.User.filter({ id: session.user_id });
  if (users.length === 0) return null;

  const u = users[0];
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    role: u.role || "user",
  };
}

async function resolveUser(base44, sessionToken) {
  if (sessionToken) {
    const fromToken = await resolveUserFromSession(base44, sessionToken);
    if (fromToken) return fromToken;
  }

  try {
    const user = await base44.auth.me();
    if (user && user.id) {
      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role || "user",
      };
    }
  } catch {
    // Fall through
  }

  return null;
}

async function requireUser(base44, sessionToken) {
  const user = await resolveUser(base44, sessionToken);
  if (!user) {
    return { user: null, error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user, error: null };
}

function placeholderOverview(accountId, engine) {
  const brokers = { commodities: "VT Markets", digital: "VT Markets", equities: "TBA" };
  return {
    accountId,
    balance: engine === "digital" ? 24500.0 : 12800.0,
    equity: engine === "digital" ? 24820.0 : 12965.0,
    currency: "USD",
    broker: brokers[engine] || "VT Markets",
    platform: "MT5",
    environment: "LIVE",
    isPlaceholder: true,
  };
}

function placeholderMetrics(engine) {
  const base = engine === "digital"
    ? { totalReturn: 42.0, monthlyReturn: 3.6, ytdReturn: 42.0, maxDrawdown: -4.2 }
    : { totalReturn: 28.0, monthlyReturn: 2.8, ytdReturn: 28.0, maxDrawdown: -2.5 };
  return {
    ...base,
    winRate: 61.4,
    profitFactor: 1.82,
    totalTrades: 148,
    avgWin: 142.5,
    avgLoss: -78.3,
    sharpeRatio: 1.64,
    isPlaceholder: true,
  };
}

function placeholderEquityCurve(engine) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const values = engine === "digital"
    ? [18000, 18650, 18200, 19100, 19800, 19450, 20100, 20800, 20500, 21400, 22100, 22800]
    : [10000, 10420, 10180, 10850, 11200, 10950, 11480, 11750, 11600, 12100, 12450, 12800];
  return {
    data: months.map((month, i) => ({ month, date: month, value: values[i], balance: values[i], equity: values[i] + (i % 3) * 55 })),
    isPlaceholder: true,
  };
}

function placeholderMonthlyReturns(engine) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const returns = engine === "digital"
    ? [3.6, 5.1, -2.4, 4.9, 3.7, -1.8, 3.3, 3.5, -1.4, 4.4, 3.3, 3.2]
    : [2.1, 4.2, -2.3, 6.6, 3.3, -2.3, 4.8, 2.4, -1.3, 4.3, 2.9, 2.8];
  return {
    data: months.map((month, i) => ({ month, return: returns[i] })),
    isPlaceholder: true,
  };
}

function placeholderDrawdownHistory(engine) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dd = engine === "digital"
    ? [0, -1.1, -3.8, -0.6, -0.2, -4.2, -1.0, -0.4, -2.2, -0.5, -0.2, 0]
    : [0, -0.8, -2.3, -0.4, -0.1, -2.5, -0.6, -0.2, -1.8, -0.3, -0.1, 0];
  return {
    data: months.map((month, i) => ({ month, date: month, drawdown: dd[i], dd: dd[i] })),
    isPlaceholder: true,
  };
}

async function apiFetch(path, apiKey) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`MetaCopier API error ${res.status}: ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function isRecoverableMetaCopierError(err) {
  const status = err && err.status;
  return status === 404 || status === 400 || status === 403;
}

async function getAccountOverview(accountId, apiKey) {
  const data = await apiFetch(`/accounts/${accountId}`, apiKey);
  return {
    accountId,
    balance: data.balance,
    equity: data.equity,
    currency: data.currency,
    broker: data.brokerName || data.broker,
    platform: data.platform,
    environment: data.environment,
    isPlaceholder: false,
  };
}

function metricsFromPerformanceData(data, overview) {
  return {
    balance: overview?.balance ?? data.balance,
    equity: overview?.equity ?? data.equity,
    openPL: data.openFloatingPnL ?? data.floatingPnL ?? data.openProfit ?? null,
    totalReturnPct: data.gain,
    monthlyReturnPct: data.monthly,
    ytdReturnPct: data.ytdGain,
    maxDrawdownPct: data.maxDrawdown,
    winRate: data.winRate,
    profitFactor: data.profitFactor,
    totalTrades: data.trades,
    avgWin: data.avgWin,
    avgLoss: data.avgLoss,
    sharpeRatio: data.sharpeRatio,
    isPlaceholder: false,
  };
}

function equityCurveFromPerformanceData(data) {
  const rawCurve = data.balanceEquityDivergencePerDay || data.floatingPnlPerDay || [];
  return {
    data: rawCurve.map((point) => ({
      date: point.date,
      month: point.date,
      balance: point.balance,
      equity: point.equity,
      value: point.equity ?? point.balance,
    })),
    isPlaceholder: false,
  };
}

function monthlyReturnsFromPerformanceData(data) {
  const monthly = data.byMonth || [];
  return {
    data: monthly.map((m) => ({ month: m.label || m.month, return: m.gain ?? m.netProfit })),
    isPlaceholder: false,
  };
}

function drawdownHistoryFromPerformanceData(data) {
  const dd = data.equityDrawdownPerDay || [];
  return {
    data: dd.map((point) => ({
      month: point.date,
      date: point.date,
      drawdown: point.drawdown,
      dd: point.drawdown,
    })),
    isPlaceholder: false,
  };
}

async function fetchPerformanceMetrics(accountId, apiKey) {
  return apiFetch(`/accounts/${accountId}/performanceMetrics`, apiKey);
}

async function getPerformanceMetrics(accountId, apiKey, overview) {
  const data = await fetchPerformanceMetrics(accountId, apiKey);
  return metricsFromPerformanceData(data, overview);
}

async function getEquityCurve(accountId, apiKey) {
  const data = await fetchPerformanceMetrics(accountId, apiKey);
  return equityCurveFromPerformanceData(data);
}

async function getMonthlyReturns(accountId, apiKey) {
  const data = await fetchPerformanceMetrics(accountId, apiKey);
  return monthlyReturnsFromPerformanceData(data);
}

async function getDrawdownHistory(accountId, apiKey) {
  const data = await fetchPerformanceMetrics(accountId, apiKey);
  return drawdownHistoryFromPerformanceData(data);
}

function getAccountId(profile, engine) {
  if (engine === "commodities") return profile.commodities_metacopier_id || null;
  if (engine === "digital") return profile.digital_metacopier_id || null;
  if (engine === "equities") return profile.equities_metacopier_id || null;
  return null;
}

async function loadFullPerformance(accountId, apiKey, engine) {
  const [overview, perfData] = await Promise.all([
    getAccountOverview(accountId, apiKey),
    fetchPerformanceMetrics(accountId, apiKey),
  ]);
  return {
    overview,
    metrics: metricsFromPerformanceData(perfData, overview),
    equity: equityCurveFromPerformanceData(perfData),
    monthly: monthlyReturnsFromPerformanceData(perfData),
    drawdown: drawdownHistoryFromPerformanceData(perfData),
    isPlaceholder: false,
  };
}

function loadPlaceholderPerformance(accountId, engine, apiWarning) {
  const overview = placeholderOverview(accountId, engine);
  const metrics = placeholderMetrics(engine);
  return {
    overview,
    metrics: {
      ...metrics,
      balance: overview.balance,
      equity: overview.equity,
      openPL: 165,
      totalReturnPct: metrics.totalReturn,
      monthlyReturnPct: metrics.monthlyReturn,
      ytdReturnPct: metrics.ytdReturn,
      maxDrawdownPct: metrics.maxDrawdown,
    },
    equity: placeholderEquityCurve(engine),
    monthly: placeholderMonthlyReturns(engine),
    drawdown: placeholderDrawdownHistory(engine),
    isPlaceholder: true,
    ...(apiWarning ? { apiWarning, liveModeFailed: true } : {}),
  };
}

async function safeLoadFullPerformance(accountId, apiKey, engine) {
  try {
    return { result: await loadFullPerformance(accountId, apiKey, engine), liveMode: true };
  } catch (err) {
    if (isRecoverableMetaCopierError(err)) {
      return {
        result: loadPlaceholderPerformance(
          accountId,
          engine,
          `MetaCopier account unavailable (HTTP ${err.status}). Showing demo data until the account is linked.`,
        ),
        liveMode: false,
      };
    }
    throw err;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const sessionToken = extractSessionToken(body);
    const { user, error } = await requireUser(base44, sessionToken);
    if (error) return error;

    const { method, engine } = body;
    if (!method || !engine) {
      return Response.json({ error: "Missing required fields: method, engine" }, { status: 400 });
    }

    if (!["commodities", "digital", "equities"].includes(engine)) {
      return Response.json({ error: `Unknown engine: ${engine}` }, { status: 400 });
    }

    const profiles = await base44.asServiceRole.entities.InvestorProfile.filter({ user_id: user.id });
    const profile = profiles[0] || null;

    if (user.role !== "admin" && profile?.access_status !== "approved") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const accountId = profile ? getAccountId(profile, engine) : null;

    if (engine === "equities" && !accountId) {
      return Response.json({
        liveMode: false,
        accountId: null,
        engine,
        result: {
          unavailable: true,
          message: "Equity Indices performance will be available once the engine launches and your account is connected.",
        },
      });
    }

    const apiKey = Deno.env.get("METACOPIER_API_KEY");
    const liveMode = !!(apiKey && accountId);

    if (method === "getFullPerformance") {
      if (!accountId) {
        return Response.json({
          liveMode: false,
          accountId: null,
          engine,
          result: {
            unavailable: true,
            message: "No MetaCopier account linked for this engine. Complete engine setup to connect.",
          },
        });
      }

      if (liveMode) {
        const { result, liveMode: resolvedLiveMode } = await safeLoadFullPerformance(accountId, apiKey, engine);
        return Response.json({ liveMode: resolvedLiveMode, accountId, engine, result });
      }

      return Response.json({
        liveMode: false,
        accountId,
        engine,
        result: loadPlaceholderPerformance(accountId, engine),
      });
    }

    // Legacy single-method API (kept for backwards compatibility)
    let result;
    let responseLiveMode = liveMode;

    if (method === "getAccountOverview") {
      if (liveMode) {
        try {
          result = await getAccountOverview(accountId, apiKey);
        } catch (err) {
          if (isRecoverableMetaCopierError(err)) {
            result = placeholderOverview(accountId, engine);
            responseLiveMode = false;
          } else {
            throw err;
          }
        }
      } else {
        result = placeholderOverview(accountId, engine);
      }
    } else if (method === "getPerformanceMetrics") {
      const overview = liveMode
        ? await getAccountOverview(accountId, apiKey).catch((err) => {
          if (isRecoverableMetaCopierError(err)) return placeholderOverview(accountId, engine);
          throw err;
        })
        : placeholderOverview(accountId, engine);
      if (liveMode && !overview.isPlaceholder) {
        try {
          result = await getPerformanceMetrics(accountId, apiKey, overview);
        } catch (err) {
          if (isRecoverableMetaCopierError(err)) {
            result = { ...placeholderMetrics(engine), balance: overview.balance, equity: overview.equity };
            responseLiveMode = false;
          } else {
            throw err;
          }
        }
      } else {
        result = { ...placeholderMetrics(engine), balance: overview.balance, equity: overview.equity };
        responseLiveMode = false;
      }
    } else if (method === "getEquityCurve") {
      result = liveMode
        ? await getEquityCurve(accountId, apiKey).catch((err) => {
          if (isRecoverableMetaCopierError(err)) return placeholderEquityCurve(engine);
          throw err;
        })
        : placeholderEquityCurve(engine);
    } else if (method === "getMonthlyReturns") {
      result = liveMode
        ? await getMonthlyReturns(accountId, apiKey).catch((err) => {
          if (isRecoverableMetaCopierError(err)) return placeholderMonthlyReturns(engine);
          throw err;
        })
        : placeholderMonthlyReturns(engine);
    } else if (method === "getDrawdownHistory") {
      result = liveMode
        ? await getDrawdownHistory(accountId, apiKey).catch((err) => {
          if (isRecoverableMetaCopierError(err)) return placeholderDrawdownHistory(engine);
          throw err;
        })
        : placeholderDrawdownHistory(engine);
    } else {
      return Response.json({ error: `Unknown method: ${method}` }, { status: 400 });
    }

    return Response.json({ liveMode: responseLiveMode, accountId, engine, result });
  } catch (err) {
    if (isRecoverableMetaCopierError(err)) {
      return Response.json({
        liveMode: false,
        error: "metacopier_account_unavailable",
        httpStatus: err.status,
        message: err.message,
      }, { status: 422 });
    }
    return Response.json({ error: err.message }, { status: 500 });
  }
});
