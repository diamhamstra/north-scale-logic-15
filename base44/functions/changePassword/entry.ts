import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import bcrypt from 'npm:bcryptjs@2.4.3';

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

async function verifyPassword(storedPassword, password) {
  if (!storedPassword) return false;
  const isHashed = storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2a$');
  if (isHashed) return await bcrypt.compare(password, storedPassword);
  return storedPassword === password;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const sessionToken = extractSessionToken(body);
    const { currentPassword, newPassword } = body;

    const { user, error } = await requireUser(base44, sessionToken);
    if (error) return error;

    if (!currentPassword || !newPassword) {
      return Response.json({ error: 'Current and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const users = await base44.asServiceRole.entities.User.filter({ id: user.id });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const fullUser = users[0];
    const passwordMatch = await verifyPassword(fullUser.password || '', currentPassword);
    if (!passwordMatch) {
      return Response.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await base44.asServiceRole.entities.User.update(fullUser.id, { password: hashed });

    // Invalidate other sessions; keep the current session active
    try {
      const sessions = await base44.asServiceRole.entities.UserSession.filter({
        user_id: fullUser.id,
        is_active: true,
      });
      await Promise.all(
        sessions.map((s) => {
          if (sessionToken && s.token === sessionToken) return Promise.resolve();
          return base44.asServiceRole.entities.UserSession.update(s.id, { is_active: false });
        })
      );
    } catch (sessionErr) {
      console.warn('Session invalidation skipped:', sessionErr.message);
    }

    console.log('Password changed for', fullUser.email);
    return Response.json({ success: true });
  } catch (error) {
    console.error('changePassword error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
