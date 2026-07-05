import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

type UserRecord = {
  id: string;
  email?: string | null;
};

type Base44Client = {
  auth: { me: () => Promise<{ id: string; role?: string | null; email?: string; full_name?: string } | null> };
  asServiceRole: {
    entities: {
      User: {
        list: (sort: string, limit: number) => Promise<UserRecord[]>;
        filter: (query: Record<string, unknown>) => Promise<Array<{ id: string; email?: string; full_name?: string; role?: string }>>;
      };
      UserSession: {
        filter: (query: Record<string, unknown>) => Promise<Array<{ id: string; user_id: string; expires_at: string }>>;
        update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
      };
    };
  };
  functions: {
    invoke: (name: string, body: Record<string, unknown>) => Promise<{ data?: Record<string, unknown> }>;
  };
};

function extractSessionToken(body: Record<string, unknown> | null): string | null {
  if (!body) return null;
  const token = body.session_token ?? body.token;
  return typeof token === 'string' && token.length > 0 ? token : null;
}

async function resolveUserFromSession(base44: Base44Client, sessionToken: string) {
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

async function resolveAdminUser(base44: Base44Client, sessionToken: string | null) {
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

function normalizeEmail(email?: string | null): string {
  return typeof email === 'string' ? email.toLowerCase().trim() : '';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req) as Base44Client;
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;

    const adminSecret = Deno.env.get('DEDUPE_ADMIN_SECRET');
    const providedSecret = typeof body.admin_secret === 'string' ? body.admin_secret : '';
    const adminUser = await resolveAdminUser(base44, extractSessionToken(body));
    const isAuthorized = !!adminUser || (adminSecret && providedSecret === adminSecret);

    if (!isAuthorized) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetEmail = typeof body.email === 'string' ? normalizeEmail(body.email) : '';
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 2000);

    const byEmail = new Map<string, UserRecord[]>();
    for (const user of allUsers) {
      const email = normalizeEmail(user.email);
      if (!email) continue;
      if (targetEmail && email !== targetEmail) continue;
      const group = byEmail.get(email) || [];
      group.push(user);
      byEmail.set(email, group);
    }

    const results: Array<{ email: string; merged_count: number; canonical_user_id: string }> = [];

    for (const [email, group] of byEmail.entries()) {
      if (group.length < 2) continue;

      const unifyResult = await base44.functions.invoke('unifyAccountByEmail', { email });
      const data = unifyResult.data || {};
      if (data.success && data.user) {
        results.push({
          email,
          merged_count: (data.merged_count as number) || 0,
          canonical_user_id: (data.user as { id: string }).id,
        });
      }
    }

    return Response.json({
      success: true,
      processed: results.length,
      results,
      message: results.length === 0
        ? (targetEmail ? 'No duplicate accounts found for that email.' : 'No duplicate accounts found.')
        : undefined,
    });
  } catch (error) {
    console.error('[dedupeDuplicateUsers] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
