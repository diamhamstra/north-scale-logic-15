import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token } = await req.json();

    if (token) {
      // Deactivate the session
      const sessions = await base44.asServiceRole.entities.UserSession.filter({ token, is_active: true });
      for (const session of sessions) {
        await base44.asServiceRole.entities.UserSession.update(session.id, { is_active: false });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('customLogout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});