import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function normalizeEmail(email?: string | null): string {
  return typeof email === 'string' ? email.toLowerCase().trim() : '';
}

/**
 * Allows an authenticated investor (via custom session token) to update
 * their own InvestorProfile using service role — bypassing RLS issues
 * that occur when native auth hasn't synced (e.g. magic link logins).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { token, profile_id, updates } = body;

    if (!token || !profile_id || !updates) {
      return Response.json({ error: 'token, profile_id, and updates are required' }, { status: 400 });
    }

    const sessions = await base44.asServiceRole.entities.UserSession.filter({ token, is_active: true });
    if (sessions.length === 0) {
      return Response.json({ error: 'Invalid or expired session' }, { status: 401 });
    }
    const session = sessions[0];
    if (new Date(session.expires_at) < new Date()) {
      await base44.asServiceRole.entities.UserSession.update(session.id, { is_active: false });
      return Response.json({ error: 'Session expired' }, { status: 401 });
    }

    const [profile, sessionUser] = await Promise.all([
      base44.asServiceRole.entities.InvestorProfile.get(profile_id),
      base44.asServiceRole.entities.User.get(session.user_id),
    ]);

    if (!profile || !sessionUser) {
      return Response.json({ error: 'Profile not found or access denied' }, { status: 403 });
    }

    const profileEmail = normalizeEmail(profile.email);
    const sessionEmail = normalizeEmail(sessionUser.email);
    const ownsProfile =
      profile.user_id === session.user_id ||
      (profileEmail && sessionEmail && profileEmail === sessionEmail);

    if (!ownsProfile) {
      return Response.json({ error: 'Profile not found or access denied' }, { status: 403 });
    }

    if (profile.user_id !== session.user_id) {
      await base44.asServiceRole.entities.InvestorProfile.update(profile_id, {
        user_id: session.user_id,
        ...(sessionEmail ? { email: sessionEmail } : {}),
      });
    }

    const updated = await base44.asServiceRole.entities.InvestorProfile.update(profile_id, updates);

    return Response.json({ success: true, profile: updated });
  } catch (error) {
    console.error('updateMyProfile error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
