import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token } = await req.json();

    if (!token) {
      return Response.json({ success: false, error: 'Token required' }, { status: 400 });
    }

    const links = await base44.asServiceRole.entities.MagicLinkToken.filter({ token, used: false });
    if (links.length === 0) {
      return Response.json(
        { success: false, error: 'This login link is invalid or has already been used.' },
        { status: 401 },
      );
    }

    const link = links[0];

    if (new Date(link.expires_at) < new Date()) {
      await base44.asServiceRole.entities.MagicLinkToken.update(link.id, { used: true });
      return Response.json({ success: false, error: 'This login link has expired.' }, { status: 401 });
    }

    // Consume token + fetch user in parallel
    const [user] = await Promise.all([
      base44.asServiceRole.entities.User.get(link.user_id),
      base44.asServiceRole.entities.MagicLinkToken.update(link.id, { used: true }),
    ]);

    if (!user) {
      return Response.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Create session + resolve investor profile in parallel
    const sessionToken = crypto.randomUUID();
    const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const [, profilesByUserId] = await Promise.all([
      base44.asServiceRole.entities.UserSession.create({
        user_id: user.id,
        token: sessionToken,
        expires_at: sessionExpiry,
        is_active: true,
      }),
      user.role !== 'admin'
        ? base44.asServiceRole.entities.InvestorProfile.filter({ user_id: user.id })
        : Promise.resolve([]),
    ]);

    let profiles = profilesByUserId;
    const normalizedEmail = typeof user.email === 'string' ? user.email.toLowerCase().trim() : '';
    if (user.role !== 'admin' && profiles.length === 0 && normalizedEmail) {
      const byEmail = await base44.asServiceRole.entities.InvestorProfile.filter({ email: normalizedEmail });
      profiles = byEmail.filter((p) => (p.email || '').toLowerCase().trim() === normalizedEmail);
    }

    let access_status = 'approved';
    let onboarding_stage = user.role === 'admin' ? 'complete' : null;
    if (user.role !== 'admin' && profiles.length > 0) {
      const primary =
        profiles.find((p) => (p.access_status || '').toLowerCase().trim() === 'approved') || profiles[0];
      if (primary) {
        access_status = primary.access_status || 'approved';
        onboarding_stage = primary.onboarding_stage || null;
      }
    }

    return Response.json({
      success: true,
      token: sessionToken,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      access_status,
      onboarding_stage,
    });
  } catch (error) {
    console.error('consumeMagicLink error:', error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});