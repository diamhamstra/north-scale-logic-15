import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token } = await req.json();

    if (!token) {
      return Response.json({ valid: false, error: 'Token required' }, { status: 400 });
    }

    // Find active session
    const sessions = await base44.asServiceRole.entities.UserSession.filter({ 
      token, 
      is_active: true 
    });

    if (sessions.length === 0) {
      return Response.json({ valid: false, error: 'Invalid session' });
    }

    const session = sessions[0];

    // Check expiry
    if (new Date(session.expires_at) < new Date()) {
      await base44.asServiceRole.entities.UserSession.update(session.id, { is_active: false });
      return Response.json({ valid: false, error: 'Session expired' });
    }

    // Get user
    const users = await base44.asServiceRole.entities.User.filter({ id: session.user_id });
    if (users.length === 0) {
      return Response.json({ valid: false, error: 'User not found' });
    }

    const user = users[0];

    return Response.json({ 
      valid: true, 
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role }
    });
  } catch (error) {
    console.error('validateSession error:', error.message);
    return Response.json({ valid: false, error: error.message });
  }
});