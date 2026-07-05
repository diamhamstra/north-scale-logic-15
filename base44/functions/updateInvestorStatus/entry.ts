import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

type InvestorProfileRecord = {
  id?: string;
  user_id?: string;
  email?: string;
  access_status?: string | null;
  onboarding_stage?: string | null;
  created_date?: string;
  updated_date?: string;
};

type Base44ServiceRole = {
  asServiceRole: {
    entities: {
      InvestorProfile: {
        filter: (q: Record<string, unknown>) => Promise<InvestorProfileRecord[]>;
        list: (sort: string, limit: number) => Promise<InvestorProfileRecord[]>;
        update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
        get: (id: string) => Promise<InvestorProfileRecord>;
      };
      User: {
        filter: (q: Record<string, unknown>) => Promise<Array<{ id: string; email?: string | null }>>;
        list: (sort: string, limit: number) => Promise<Array<{ id: string; email?: string | null }>>;
      };
    };
  };
  functions: {
    invoke: (name: string, body: Record<string, unknown>) => Promise<{ data?: Record<string, unknown> }>;
  };
};

function normalizeEmail(email?: string | null): string {
  return typeof email === 'string' ? email.toLowerCase().trim() : '';
}

function mergeProfilesById(
  primary: InvestorProfileRecord[],
  additional: InvestorProfileRecord[],
): InvestorProfileRecord[] {
  const seen = new Set(primary.map((profile) => profile.id));
  const merged = [...primary];
  for (const profile of additional) {
    if (!profile.id || seen.has(profile.id)) continue;
    merged.push(profile);
    seen.add(profile.id);
  }
  return merged;
}

async function findUsersByEmail(
  base44: Base44ServiceRole,
  normalizedEmail: string,
): Promise<Array<{ id: string; email?: string | null }>> {
  const seen = new Set<string>();
  const users: Array<{ id: string; email?: string | null }> = [];

  const byFilter = await base44.asServiceRole.entities.User.filter({ email: normalizedEmail });
  for (const user of byFilter) {
    if (!user.id || seen.has(user.id)) continue;
    seen.add(user.id);
    users.push(user);
  }

  const recentUsers = await base44.asServiceRole.entities.User.list('-created_date', 500);
  for (const user of recentUsers) {
    if (typeof user.email !== 'string') continue;
    if (normalizeEmail(user.email) !== normalizedEmail) continue;
    if (!user.id || seen.has(user.id)) continue;
    seen.add(user.id);
    users.push(user);
  }

  return users;
}

async function loadProfilesByEmail(
  base44: Base44ServiceRole,
  normalizedEmail: string,
): Promise<InvestorProfileRecord[]> {
  const byEmail = await base44.asServiceRole.entities.InvestorProfile.filter({ email: normalizedEmail });
  let emailMatches = byEmail.filter((profile) => normalizeEmail(profile.email) === normalizedEmail);

  if (emailMatches.length === 0) {
    const recent = await base44.asServiceRole.entities.InvestorProfile.list('-created_date', 2000);
    emailMatches = recent.filter((profile) => normalizeEmail(profile.email) === normalizedEmail);
  }

  const approvedRows = await base44.asServiceRole.entities.InvestorProfile.filter({
    access_status: 'approved',
  });
  emailMatches = mergeProfilesById(
    emailMatches,
    approvedRows.filter((profile) => normalizeEmail(profile.email) === normalizedEmail),
  );

  return emailMatches;
}

/** Load every profile tied to user_id OR email (case-insensitive). */
async function loadAllMatchingProfiles(
  base44: Base44ServiceRole,
  sourceProfile: InvestorProfileRecord,
): Promise<InvestorProfileRecord[]> {
  let profiles: InvestorProfileRecord[] = [sourceProfile];
  const normalizedEmail = normalizeEmail(sourceProfile.email);

  if (sourceProfile.user_id) {
    const byUser = await base44.asServiceRole.entities.InvestorProfile.filter({
      user_id: sourceProfile.user_id,
    });
    profiles = mergeProfilesById(profiles, byUser);
  }

  if (normalizedEmail) {
    const users = await findUsersByEmail(base44, normalizedEmail);
    for (const user of users) {
      const byUser = await base44.asServiceRole.entities.InvestorProfile.filter({ user_id: user.id });
      profiles = mergeProfilesById(profiles, byUser);
    }
    profiles = mergeProfilesById(profiles, await loadProfilesByEmail(base44, normalizedEmail));
  }

  return profiles;
}

async function syncAllMatchingProfileAccess(
  base44: Base44ServiceRole,
  sourceProfile: InvestorProfileRecord,
  access_status: string,
  extraFields: Record<string, unknown> = {},
): Promise<number> {
  const candidates = await loadAllMatchingProfiles(base44, sourceProfile);
  const patch: Record<string, unknown> = { access_status, ...extraFields };
  let updated = 0;

  await Promise.all(
    candidates.map(async (profile) => {
      if (!profile.id) return;
      const needsAccess = profile.access_status !== access_status;
      const needsStage = extraFields.onboarding_stage && profile.onboarding_stage !== extraFields.onboarding_stage;
      if (!needsAccess && !needsStage) return;
      await base44.asServiceRole.entities.InvestorProfile.update(profile.id, patch);
      updated += 1;
    }),
  );

  return updated;
}

function extractSessionToken(body: Record<string, unknown> | null | undefined): string | null {
  if (!body) return null;
  const token = body.session_token ?? body.token;
  return typeof token === 'string' && token.length > 0 ? token : null;
}

async function resolveUserFromSession(base44: Base44ServiceRole, sessionToken: string) {
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

async function resolveAdminUser(base44: Base44ServiceRole, sessionToken: string | null) {
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

async function requireAdmin(base44: Base44ServiceRole, sessionToken: string | null) {
  const user = await resolveAdminUser(base44, sessionToken);
  if (!user) {
    return { user: null, error: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { user, error: null };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req) as Base44ServiceRole & {
      auth: { me: () => Promise<{ id: string; role?: string | null; email?: string; full_name?: string } | null> };
      asServiceRole: Base44ServiceRole['asServiceRole'] & {
        entities: Base44ServiceRole['asServiceRole']['entities'] & {
          UserSession: {
            filter: (q: Record<string, unknown>) => Promise<Array<{ id: string; user_id: string; expires_at: string }>>;
            update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
          };
        };
      };
    };
    const body = await req.json();
    const { user, error } = await requireAdmin(base44, extractSessionToken(body));
    if (error) return error;
    const { profile_id, access_status } = body;

    if (!profile_id || !access_status) {
      return Response.json({ error: 'profile_id and access_status are required' }, { status: 400 });
    }

    const profile = await base44.asServiceRole.entities.InvestorProfile.get(profile_id);
    const normalizedEmail = normalizeEmail(profile.email);
    let users = normalizedEmail ? await findUsersByEmail(base44, normalizedEmail) : [];

    if (users.length === 0 && profile.user_id) {
      const linkedUsers = await base44.asServiceRole.entities.User.filter({ id: profile.user_id });
      const linkedEmail = normalizeEmail(linkedUsers[0]?.email);
      if (linkedEmail) {
        users = await findUsersByEmail(base44, linkedEmail);
      }
    }

    const canonicalUser = users[0];
    const canonicalEmail = normalizedEmail || normalizeEmail(canonicalUser?.email);

    const updateFields: Record<string, unknown> = { access_status };
    if (canonicalEmail) updateFields.email = canonicalEmail;
    if (canonicalUser?.id) updateFields.user_id = canonicalUser.id;

    if (access_status === 'approved' && !profile.onboarding_stage) {
      updateFields.onboarding_stage = 'profile';
    }

    await base44.asServiceRole.entities.InvestorProfile.update(profile_id, updateFields);
    const profiles_synced = await syncAllMatchingProfileAccess(
      base44,
      { ...profile, email: canonicalEmail || profile.email, user_id: canonicalUser?.id || profile.user_id },
      access_status,
      updateFields,
    );

    if (canonicalEmail) {
      try {
        await base44.functions.invoke('unifyAccountByEmail', {
          email: canonicalEmail,
          prefer_user_id: canonicalUser?.id || profile.user_id,
        });
      } catch (syncErr) {
        console.warn('[updateInvestorStatus] post-approval unify failed:', syncErr.message);
      }
    }

    if (access_status === 'approved') {
      try {
        await base44.functions.invoke('automationEngine', {
          event: 'ACCOUNT_APPROVED',
          data: {
            profile_id,
            user_id: canonicalUser?.id || profile.user_id || null,
            email: canonicalEmail || profile.email || null,
            full_name: profile.full_name || canonicalUser?.full_name || '',
            organization: profile.organization || '',
            referred_by: profile.referred_by || '',
            actor_id: user.id,
          },
        });
      } catch (automationErr) {
        console.error('[updateInvestorStatus] automationEngine failed:', automationErr.message);
      }
    }

    return Response.json({ success: true, profiles_synced });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});