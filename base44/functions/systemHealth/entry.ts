/**
 * System Health Check — North Scale Platform
 * Returns status of all platform services.
 * Admin-only endpoint.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
function extractSessionToken(body) {
  if (!body) return null;
  const token = body.session_token ?? body.token;
  return typeof token === 'string' && token.length > 0 ? token : null;
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
    role: u.role || 'user',
  };
}

async function resolveAdminUser(base44, sessionToken) {
  if (sessionToken) {
    const fromToken = await resolveUserFromSession(base44, sessionToken);
    if (fromToken?.role === 'admin') return fromToken;
  }

  try {
    const user = await base44.auth.me();
    if (user?.id && (user.role || 'user') === 'admin') {
      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role || 'admin',
      };
    }
  } catch {
    // Fall through
  }

  return null;
}

async function requireAdmin(base44, sessionToken) {
  const user = await resolveAdminUser(base44, sessionToken);
  if (!user) {
    return { user: null, error: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { user, error: null };
}


function getPostmarkConfig() {
  return {
    apiKey: Deno.env.get("POSTMARK_API_KEY") || "",
    fromEmail: Deno.env.get("POSTMARK_FROM_EMAIL") || "portal@northscale.capital",
    fromName: Deno.env.get("POSTMARK_FROM_NAME") || "North Scale",
  };
}

function isPostmarkConfigured() {
  const cfg = getPostmarkConfig();
  return !!(cfg.apiKey && cfg.fromEmail);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { error } = await requireAdmin(base44, extractSessionToken(body));
    if (error) return error;

    const results = {};
    const start = Date.now();

    // Database
    try {
      await base44.asServiceRole.entities.AuditLog.list("created_date", 1);
      results.database = { status: "healthy", latency_ms: Date.now() - start };
    } catch (e) {
      results.database = { status: "offline", error: e.message };
    }

    // Auth — portal uses custom UserSession tokens, not native auth cookies in function context
    try {
      const t = Date.now();
      await base44.asServiceRole.entities.UserSession.list("created_date", 1);
      await base44.asServiceRole.entities.User.list("created_date", 1);
      results.auth = {
        status: "healthy",
        mode: "custom_session",
        latency_ms: Date.now() - t,
      };
    } catch (e) {
      results.auth = { status: "offline", error: e.message };
    }

    // MetaCopier API
    const apiKey = Deno.env.get("METACOPIER_API_KEY");
    if (!apiKey) {
      results.metacopier = { status: "warning", reason: "API key not configured" };
    } else {
      try {
        const t = Date.now();
        const res = await fetch("https://api.metacopier.io/rest/api/v1/accounts", {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(5000),
        });
        results.metacopier = {
          status: res.ok ? "healthy" : "warning",
          http_status: res.status,
          latency_ms: Date.now() - t,
        };
      } catch (e) {
        results.metacopier = { status: "offline", error: e.message };
      }
    }

    // Email service (Postmark)
    const postmarkCfg = getPostmarkConfig();
    results.email = {
      status: isPostmarkConfigured() ? "healthy" : "warning",
      provider: isPostmarkConfigured() ? "Postmark" : "Not configured",
      from_email: postmarkCfg.fromEmail || null,
    };

    // Background jobs — check last run from audit log
    try {
      const logs = await base44.asServiceRole.entities.AuditLog.filter({ action: "PERFORMANCE_SYNC_RUN" });
      if (logs.length === 0) {
        results.background_jobs = { status: "warning", reason: "No sync runs recorded" };
      } else {
        const last = logs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
        const ageMs = Date.now() - new Date(last.created_date).getTime();
        const ageHrs = ageMs / (1000 * 60 * 60);
        results.background_jobs = {
          status: ageHrs < 2 ? "healthy" : ageHrs < 6 ? "warning" : "offline",
          last_run: last.created_date,
          age_hours: Math.round(ageHrs * 10) / 10,
        };
      }
    } catch (e) {
      results.background_jobs = { status: "warning", error: e.message };
    }

    // Notifications
    try {
      const t = Date.now();
      await base44.asServiceRole.entities.Notification.list("created_date", 1);
      results.notifications = { status: "healthy", latency_ms: Date.now() - t };
    } catch (e) {
      results.notifications = { status: "offline", error: e.message };
    }

    // Overall
    const statuses = Object.values(results).map(r => r.status);
    const overall = statuses.every(s => s === "healthy") ? "healthy"
      : statuses.some(s => s === "offline") ? "offline" : "warning";

    return Response.json({
      overall,
      checked_at: new Date().toISOString(),
      services: results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});