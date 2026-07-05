import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function extractSessionToken(body) {
  if (!body) return null;
  const token = body.session_token != null ? body.session_token : body.token;
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
        role: user.role || 'user',
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
    return { user: null, error: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { user, error: null };
}

const VALID_ACTIONS = new Set(['view', 'download']);
const VALID_TYPES = new Set(['agreement', 'passport', 'waiver', 'receipt']);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { user, error } = await requireUser(base44, extractSessionToken(body));
    if (error) return error;

    const {
      action = 'view',
      document_type,
      document_key,
      profile_id,
      target_user_id,
    } = body;

    if (!VALID_ACTIONS.has(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
    if (!document_type || !VALID_TYPES.has(document_type)) {
      return Response.json({ error: 'Invalid document_type' }, { status: 400 });
    }

    let profile = null;
    if (profile_id) {
      try {
        profile = await base44.asServiceRole.entities.InvestorProfile.get(profile_id);
      } catch {
        profile = null;
      }
    }

    const isAdmin = user.role === 'admin';
    const subjectUserId = target_user_id || profile?.user_id || user.id;

    if (profile && !isAdmin && profile.user_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!profile && !isAdmin && subjectUserId !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const auditAction = action === 'download' ? 'DOCUMENT_DOWNLOADED' : 'DOCUMENT_VIEWED';
    const label = document_key
      ? `${document_type}:${document_key}`
      : document_type;

    await base44.asServiceRole.entities.AuditLog.create({
      user_id: subjectUserId,
      actor_id: user.id,
      action: auditAction,
      object_type: 'Document',
      object_id: profile_id || '',
      object_label: label,
      metadata_json: JSON.stringify({
        document_type,
        document_key: document_key || null,
        action,
        actor_role: user.role || 'user',
      }),
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error('logDocumentAccess error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});
