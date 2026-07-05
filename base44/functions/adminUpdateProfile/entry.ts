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


Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { user, error } = await requireAdmin(base44, extractSessionToken(body));
    if (error) return error;
    const { profile_id, updates } = body;

    if (!profile_id || !updates) {
      return Response.json({ error: 'profile_id and updates are required' }, { status: 400 });
    }

    await base44.asServiceRole.entities.InvestorProfile.update(profile_id, updates);
    const updated = await base44.asServiceRole.entities.InvestorProfile.get(profile_id);

    return Response.json({ success: true, profile: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});