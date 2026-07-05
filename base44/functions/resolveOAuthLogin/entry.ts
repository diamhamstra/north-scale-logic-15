import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

type InvestorProfileRecord = {
  id?: string;
  user_id?: string;
  email?: string;
  access_status?: string | null;
  onboarding_stage?: string | null;
  profile_complete?: boolean;
  created_date?: string;
  updated_date?: string;
};

type UserRecord = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  role?: string | null;
};

type Base44Client = {
  auth: { me: () => Promise<UserRecord | null> };
  asServiceRole: {
    entities: {
      InvestorProfile: {
        filter: (q: Record<string, unknown>) => Promise<InvestorProfileRecord[]>;
        list: (sort: string, limit: number) => Promise<InvestorProfileRecord[]>;
        update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
      };
      User: {
        filter: (q: Record<string, unknown>) => Promise<UserRecord[]>;
        list: (sort: string, limit: number) => Promise<UserRecord[]>;
      };
      UserSession: {
        create: (data: Record<string, unknown>) => Promise<unknown>;
      };
    };
  };
  functions: {
    invoke: (name: string, body: Record<string, unknown>) => Promise<{ data?: Record<string, unknown> }>;
  };
};

const ACCESS_STATUS_RANK: Record<string, number> = {
  approved: 0,
  pending: 1,
  rejected: 2,
};

function normalizeEmail(email?: string | null): string {
  return typeof email === 'string' ? email.toLowerCase().trim() : '';
}

function normalizeAccessStatus(status?: string | null): string | null {
  if (typeof status !== 'string') return null;
  const normalized = status.toLowerCase().trim();
  if (normalized === 'approved' || normalized === 'pending' || normalized === 'rejected') {
    return normalized;
  }
  return null;
}

function profileIndicatesApprovedAccess(profile: InvestorProfileRecord): boolean {
  if (normalizeAccessStatus(profile.access_status) === 'approved') return true;
  if (profile.onboarding_stage === 'complete') return true;
  if (profile.profile_complete === true) return true;
  return false;
}

function profileTimestamp(profile: InvestorProfileRecord, field: 'created_date' | 'updated_date') {
  const value = profile[field];
  return value ? new Date(value).getTime() : 0;
}

function sortProfiles<T extends InvestorProfileRecord>(profiles: T[]): T[] {
  return [...profiles].sort((a, b) => {
    const rankA = ACCESS_STATUS_RANK[a.access_status || 'pending'] ?? 1;
    const rankB = ACCESS_STATUS_RANK[b.access_status || 'pending'] ?? 1;
    if (rankA !== rankB) return rankA - rankB;
    const createdDiff = profileTimestamp(a, 'created_date') - profileTimestamp(b, 'created_date');
    if (createdDiff !== 0) return createdDiff;
    return profileTimestamp(a, 'updated_date') - profileTimestamp(b, 'updated_date');
  });
}

function pickPrimaryInvestorProfile<T extends InvestorProfileRecord>(profiles: T[] | null | undefined): T | null {
  if (!profiles?.length) return null;
  const approved = profiles.filter((profile) => normalizeAccessStatus(profile.access_status) === 'approved');
  if (approved.length > 0) return sortProfiles(approved)[0];
  if (profiles.length === 1) return profiles[0];
  return sortProfiles(profiles)[0];
}

function computeLoginAccessFromProfiles(
  profiles: InvestorProfileRecord[] | null | undefined,
): { access_status: string | null; onboarding_stage: string | null; profile_id: string | null } {
  if (!profiles?.length) {
    return { access_status: null, onboarding_stage: null, profile_id: null };
  }

  const approvedLike = profiles.filter((profile) => profileIndicatesApprovedAccess(profile));
  if (approvedLike.length > 0) {
    const primary = pickPrimaryInvestorProfile(approvedLike);
    return {
      access_status: 'approved',
      onboarding_stage: primary?.onboarding_stage || null,
      profile_id: primary?.id || null,
    };
  }

  if (profiles.every((profile) => normalizeAccessStatus(profile.access_status) === 'rejected')) {
    const primary = pickPrimaryInvestorProfile(profiles);
    return {
      access_status: 'rejected',
      onboarding_stage: primary?.onboarding_stage || null,
      profile_id: primary?.id || null,
    };
  }

  const primary = pickPrimaryInvestorProfile(profiles);
  return {
    access_status: normalizeAccessStatus(primary?.access_status) || null,
    onboarding_stage: primary?.onboarding_stage || null,
    profile_id: primary?.id || null,
  };
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

async function findUsersByEmail(base44: Base44Client, normalizedEmail: string): Promise<UserRecord[]> {
  const seen = new Set<string>();
  const users: UserRecord[] = [];

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
  base44: Base44Client,
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

async function loadInvestorProfilesForEmailLogin(
  base44: Base44Client,
  normalizedEmail: string,
): Promise<InvestorProfileRecord[]> {
  let profiles: InvestorProfileRecord[] = [];

  const users = await findUsersByEmail(base44, normalizedEmail);
  for (const user of users) {
    const byUser = await base44.asServiceRole.entities.InvestorProfile.filter({ user_id: user.id });
    profiles = mergeProfilesById(profiles, byUser);

    const approvedByUser = await base44.asServiceRole.entities.InvestorProfile.filter({
      user_id: user.id,
      access_status: 'approved',
    });
    profiles = mergeProfilesById(profiles, approvedByUser);
  }

  const emailMatches = await loadProfilesByEmail(base44, normalizedEmail);
  return mergeProfilesById(profiles, emailMatches);
}

async function linkProfilesToUser(
  base44: Base44Client,
  userId: string,
  profiles: InvestorProfileRecord[],
): Promise<void> {
  await Promise.all(
    profiles.map(async (profile) => {
      if (!profile.id) return;
      if (profile.user_id === userId) return;
      await base44.asServiceRole.entities.InvestorProfile.update(profile.id, { user_id: userId });
      profile.user_id = userId;
    }),
  );
}

async function syncAllProfileAccessForEmail(
  base44: Base44Client,
  profiles: InvestorProfileRecord[],
  access_status: string,
  extraFields: Record<string, unknown> = {},
): Promise<number> {
  if (!profiles.length || !access_status) return 0;

  const patch: Record<string, unknown> = { access_status, ...extraFields };
  let updated = 0;

  await Promise.all(
    profiles.map(async (profile) => {
      if (!profile.id) return;
      const current = normalizeAccessStatus(profile.access_status);
      const needsAccess = current !== access_status;
      const needsStage = extraFields.onboarding_stage && profile.onboarding_stage !== extraFields.onboarding_stage;
      if (!needsAccess && !needsStage) return;
      await base44.asServiceRole.entities.InvestorProfile.update(profile.id, patch);
      updated += 1;
    }),
  );

  return updated;
}

async function finalizeLoginAccessForEmail(
  base44: Base44Client,
  user: UserRecord,
  normalizedEmail: string,
): Promise<{
  access_status: string | null;
  onboarding_stage: string | null;
  profile_id: string | null;
  profiles_found: number;
  profiles_synced: number;
}> {
  if (user.role === 'admin') {
    return {
      access_status: 'approved',
      onboarding_stage: 'complete',
      profile_id: null,
      profiles_found: 0,
      profiles_synced: 0,
    };
  }

  const profiles = await loadInvestorProfilesForEmailLogin(base44, normalizedEmail);
  await linkProfilesToUser(base44, user.id, profiles);

  const access = computeLoginAccessFromProfiles(profiles);
  let profiles_synced = 0;

  if (access.access_status === 'approved') {
    profiles_synced = await syncAllProfileAccessForEmail(
      base44,
      profiles,
      'approved',
      access.onboarding_stage ? { onboarding_stage: access.onboarding_stage } : {},
    );
  }

  return {
    access_status: access.access_status,
    onboarding_stage: access.onboarding_stage,
    profile_id: access.profile_id,
    profiles_found: profiles.length,
    profiles_synced,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req) as Base44Client;

    let oauthUser: UserRecord | null = null;
    try {
      oauthUser = await base44.auth.me();
    } catch {
      return Response.json({ success: false, error: 'Not authenticated via OAuth' }, { status: 401 });
    }

    if (!oauthUser?.id || !oauthUser.email) {
      return Response.json({ success: false, error: 'OAuth session missing user email' }, { status: 400 });
    }

    if ((oauthUser.role || 'user') === 'admin') {
      const sessionToken = crypto.randomUUID();
      const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await base44.asServiceRole.entities.UserSession.create({
        user_id: oauthUser.id,
        token: sessionToken,
        expires_at: sessionExpiry,
        is_active: true,
      });
      return Response.json({
        success: true,
        token: sessionToken,
        user: {
          id: oauthUser.id,
          email: oauthUser.email,
          full_name: oauthUser.full_name,
          role: oauthUser.role,
        },
        access_status: 'approved',
        onboarding_stage: 'complete',
        merged_count: 0,
      });
    }

    const normalizedEmail = normalizeEmail(oauthUser.email);
    let unifyResult: { data?: Record<string, unknown> } = { data: {} };
    try {
      unifyResult = await base44.functions.invoke('unifyAccountByEmail', {
        email: normalizedEmail,
        prefer_user_id: oauthUser.id,
      });
    } catch (unifyErr) {
      console.warn('[resolveOAuthLogin] unifyAccountByEmail failed:', unifyErr.message);
    }

    const unifyData = unifyResult.data || {};
    const canonical = (unifyData.user as UserRecord) || oauthUser;
    const sessionToken = crypto.randomUUID();
    const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await base44.asServiceRole.entities.UserSession.create({
      user_id: canonical.id,
      token: sessionToken,
      expires_at: sessionExpiry,
      is_active: true,
    });

    const access = await finalizeLoginAccessForEmail(base44, canonical, normalizedEmail);

    return Response.json({
      success: true,
      token: sessionToken,
      user: {
        id: canonical.id,
        email: canonical.email,
        full_name: canonical.full_name,
        role: canonical.role || 'user',
      },
      access_status: access.access_status,
      onboarding_stage: access.onboarding_stage,
      merged_count: unifyData.merged_count ?? 0,
    });
  } catch (error) {
    console.error('[resolveOAuthLogin] Error:', error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});
