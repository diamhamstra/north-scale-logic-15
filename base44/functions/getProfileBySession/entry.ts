import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Service-role fallback for loading an InvestorProfile when native auth
 * is not available (e.g. after a magic-link login that bypassed the password flow).
 * Validates the custom session token and returns the user's primary profile.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token } = await req.json();

    if (!token) {
      return Response.json({ success: false, error: 'token required' }, { status: 400 });
    }

    // Validate session
    const sessions = await base44.asServiceRole.entities.UserSession.filter({ token, is_active: true });
    if (sessions.length === 0) {
      return Response.json({ success: false, error: 'Invalid or expired session' }, { status: 401 });
    }

    const session = sessions[0];
    if (new Date(session.expires_at) < new Date()) {
      await base44.asServiceRole.entities.UserSession.update(session.id, { is_active: false });
      return Response.json({ success: false, error: 'Session expired' }, { status: 401 });
    }

    const userId = session.user_id;

    // Fetch all profiles for this user via service role (bypasses native auth RLS)
    const profiles = await base44.asServiceRole.entities.InvestorProfile.filter({ user_id: userId });

    if (profiles.length === 0) {
      return Response.json({ success: true, profile: null });
    }

    // Prefer approved profile
    const profile =
      profiles.find((p) => (p.access_status || '').toLowerCase().trim() === 'approved') ||
      profiles[0];

    return Response.json({ success: true, profile });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});