export type ResolvedUser = {
  id: string;
  email: string;
  full_name?: string;
  role: string;
};

type Base44Client = {
  auth: { me: () => Promise<ResolvedUser | null> };
  asServiceRole: {
    entities: {
      UserSession: {
        filter: (q: Record<string, unknown>) => Promise<Array<{ id: string; user_id: string; expires_at: string }>>;
        update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
      };
      User: {
        filter: (q: Record<string, unknown>) => Promise<Array<ResolvedUser & { full_name?: string }>>;
      };
    };
  };
};

export function extractSessionToken(body: Record<string, unknown> | null | undefined): string | null {
  if (!body) return null;
  const token = body.session_token ?? body.token;
  return typeof token === 'string' && token.length > 0 ? token : null;
}

async function resolveUserFromSession(
  base44: Base44Client,
  sessionToken: string,
): Promise<ResolvedUser | null> {
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

export async function resolveUser(
  base44: Base44Client,
  sessionToken?: string | null,
): Promise<ResolvedUser | null> {
  // Prefer explicit tab-scoped custom session token when provided (matches AdminPortal auth order)
  if (sessionToken) {
    const fromToken = await resolveUserFromSession(base44, sessionToken);
    if (fromToken) return fromToken;
  }

  try {
    const user = await base44.auth.me();
    if (user?.id) {
      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role || 'user',
      };
    }
  } catch {
    // Fall through
  }

  return null;
}

export async function requireUser(base44: Base44Client, sessionToken?: string | null) {
  const user = await resolveUser(base44, sessionToken);
  if (!user) {
    return { user: null, error: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { user, error: null };
}

/** Admin endpoints: ignore non-admin custom session tokens so OAuth admin login still works. */
export async function resolveAdminUser(
  base44: Base44Client,
  sessionToken?: string | null,
): Promise<ResolvedUser | null> {
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

export async function requireAdmin(base44: Base44Client, sessionToken?: string | null) {
  const user = await resolveAdminUser(base44, sessionToken);
  if (!user) {
    return { user: null, error: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { user, error: null };
}
