import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { email, role = 'user', session_token } = body;

    if (!email) return Response.json({ error: 'Email is required' }, { status: 400 });

    // Validate admin via session token (custom auth) or native auth
    let isAdmin = false;

    if (session_token) {
      const sessions = await base44.asServiceRole.entities.UserSession.filter({ token: session_token, is_active: true });
      if (sessions.length > 0 && new Date(sessions[0].expires_at) > new Date()) {
        const users = await base44.asServiceRole.entities.User.filter({ id: sessions[0].user_id });
        if (users.length > 0 && users[0].role === 'admin') isAdmin = true;
      }
    }

    if (!isAdmin) {
      try {
        const me = await base44.auth.me();
        if (me?.role === 'admin') isAdmin = true;
      } catch {}
    }

    if (!isAdmin) return Response.json({ error: 'Unauthorized — admin access required' }, { status: 403 });

    await base44.auth.inviteUser(email.trim().toLowerCase(), role);

    return Response.json({ success: true, message: `Invite sent to ${email}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});