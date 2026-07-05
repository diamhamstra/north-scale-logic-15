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

type Base44ServiceRole = {
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
    };
  };
};

const ACCESS_STATUS_RANK: Record<string, number> = {
  approved: 0,
  pending: 1,
  rejected: 2,
};

const PROFILE_EMAIL_SCAN_LIMIT = 2000;

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

/** Prefer approved profile; break ties with oldest registration record. */
export function pickPrimaryInvestorProfile<T extends InvestorProfileRecord>(profiles: T[] | null | undefined): T | null {
  if (!profiles?.length) return null;

  const approved = profiles.filter((profile) => normalizeAccessStatus(profile.access_status) === 'approved');
  if (approved.length > 0) {
    return sortProfiles(approved)[0];
  }

  if (profiles.length === 1) return profiles[0];
  return sortProfiles(profiles)[0];
}

export function normalizeEmail(email?: string | null): string {
  return typeof email === 'string' ? email.toLowerCase().trim() : '';
}

export function normalizeAccessStatus(status?: string | null): string | null {
  if (typeof status !== 'string') return null;
  const normalized = status.toLowerCase().trim();
  if (normalized === 'approved' || normalized === 'pending' || normalized === 'rejected') {
    return normalized;
  }
  return null;
}

export function profileIndicatesApprovedAccess(profile: InvestorProfileRecord): boolean {
  if (normalizeAccessStatus(profile.access_status) === 'approved') return true;
  if (profile.onboarding_stage === 'complete') return true;
  if (profile.profile_complete === true) return true;
  return false;
}

export function computeLoginAccessFromProfiles(
  profiles: InvestorProfileRecord[] | null | undefined,
): { access_status: string | null; onboarding_stage: string | null } {
  if (!profiles?.length) {
    return { access_status: null, onboarding_stage: null };
  }

  const approvedLike = profiles.filter((profile) => profileIndicatesApprovedAccess(profile));
  if (approvedLike.length > 0) {
    const primary = pickPrimaryInvestorProfile(approvedLike);
    return {
      access_status: 'approved',
      onboarding_stage: primary?.onboarding_stage || null,
    };
  }

  if (profiles.every((profile) => normalizeAccessStatus(profile.access_status) === 'rejected')) {
    const primary = pickPrimaryInvestorProfile(profiles);
    return {
      access_status: 'rejected',
      onboarding_stage: primary?.onboarding_stage || null,
    };
  }

  const primary = pickPrimaryInvestorProfile(profiles);
  return {
    access_status: normalizeAccessStatus(primary?.access_status) || null,
    onboarding_stage: primary?.onboarding_stage || null,
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

async function loadProfilesByEmail(
  base44: Base44ServiceRole,
  normalizedEmail: string,
): Promise<InvestorProfileRecord[]> {
  const byEmail = await base44.asServiceRole.entities.InvestorProfile.filter({ email: normalizedEmail });
  let emailMatches = byEmail.filter((profile) => normalizeEmail(profile.email) === normalizedEmail);

  if (emailMatches.length === 0) {
    const recent = await base44.asServiceRole.entities.InvestorProfile.list(
      '-created_date',
      PROFILE_EMAIL_SCAN_LIMIT,
    );
    emailMatches = recent.filter((profile) => normalizeEmail(profile.email) === normalizedEmail);
  }

  // Catch approved rows where email casing/spacing differs from the indexed filter.
  const approvedRows = await base44.asServiceRole.entities.InvestorProfile.filter({
    access_status: 'approved',
  });
  emailMatches = mergeProfilesById(
    emailMatches,
    approvedRows.filter((profile) => normalizeEmail(profile.email) === normalizedEmail),
  );

  return emailMatches;
}

export async function linkProfilesToUser(
  base44: Base44ServiceRole & {
    asServiceRole: {
      entities: {
        InvestorProfile: {
          update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
        };
      };
    };
  },
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

/** Sync access_status (and optional fields) across every profile tied to an email/user group. */
export async function syncAllProfileAccessForEmail(
  base44: Base44ServiceRole & {
    asServiceRole: {
      entities: {
        InvestorProfile: {
          update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
        };
      };
    };
  },
  normalizedEmail: string,
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

export type LoginAccessResult = {
  access_status: string | null;
  onboarding_stage: string | null;
  profile_id: string | null;
  profiles_found: number;
  profiles_synced: number;
};

/**
 * Authoritative login access: load every profile for the email, never downgrade
 * approved, and sync duplicates when any profile is approved.
 */
export async function finalizeLoginAccessForEmail(
  base44: Base44ServiceRole & {
    asServiceRole: {
      entities: {
        InvestorProfile: {
          update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
        };
      };
    };
  },
  user: { id: string; email?: string | null; role?: string | null },
  normalizedEmail: string,
): Promise<LoginAccessResult> {
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
      normalizedEmail,
      profiles,
      'approved',
      access.onboarding_stage ? { onboarding_stage: access.onboarding_stage } : {},
    );
  }

  const primary = pickPrimaryInvestorProfile(profiles);

  return {
    access_status: access.access_status,
    onboarding_stage: access.onboarding_stage,
    profile_id: primary?.id || null,
    profiles_found: profiles.length,
    profiles_synced,
  };
}

export async function loadInvestorProfilesForUser(
  base44: Base44ServiceRole,
  user: { id: string; email?: string | null },
  normalizedEmail?: string,
): Promise<InvestorProfileRecord[]> {
  let profiles = await base44.asServiceRole.entities.InvestorProfile.filter({ user_id: user.id });

  const approvedByUser = await base44.asServiceRole.entities.InvestorProfile.filter({
    user_id: user.id,
    access_status: 'approved',
  });
  profiles = mergeProfilesById(profiles, approvedByUser);

  const email = normalizeEmail(normalizedEmail || user.email);
  if (email) {
    const emailMatches = await loadProfilesByEmail(base44, email);
    profiles = mergeProfilesById(profiles, emailMatches);
  }

  return profiles;
}

export async function loadPrimaryInvestorProfile(
  base44: Base44ServiceRole,
  user: { id: string; email?: string | null },
  normalizedEmail?: string,
): Promise<InvestorProfileRecord | null> {
  const profiles = await loadInvestorProfilesForUser(base44, user, normalizedEmail);
  return pickPrimaryInvestorProfile(profiles);
}

export async function findUsersByEmail(base44: Base44ServiceRole, normalizedEmail: string): Promise<UserRecord[]> {
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

export async function loadInvestorProfilesForEmailLogin(
  base44: Base44ServiceRole,
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

/** When duplicate User rows exist for one email, prefer the account with an approved profile. */
export async function resolveUserForLogin(
  base44: Base44ServiceRole,
  normalizedEmail: string,
): Promise<UserRecord | null> {
  const users = await findUsersByEmail(base44, normalizedEmail);
  if (users.length === 0) return null;
  if (users.length === 1) return users[0];

  let bestUser = users[0];
  let bestRank = Number.POSITIVE_INFINITY;

  for (const user of users) {
    const profile = await loadPrimaryInvestorProfile(base44, user, normalizedEmail);
    const rank = ACCESS_STATUS_RANK[profile?.access_status || 'pending'] ?? 1;
    if (rank < bestRank) {
      bestRank = rank;
      bestUser = user;
    }
  }

  return bestUser;
}

export async function syncDuplicateProfileAccess(
  base44: Base44ServiceRole & {
    asServiceRole: {
      entities: {
        InvestorProfile: {
          update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
        };
      };
    };
  },
  sourceProfile: InvestorProfileRecord,
  access_status: string,
  extraFields: Record<string, unknown> = {},
): Promise<void> {
  const normalizedEmail = normalizeEmail(sourceProfile.email);
  let candidates: InvestorProfileRecord[] = [sourceProfile];

  if (normalizedEmail) {
    candidates = mergeProfilesById(candidates, await loadInvestorProfilesForEmailLogin(base44, normalizedEmail));
  } else if (sourceProfile.user_id) {
    const byUser = await base44.asServiceRole.entities.InvestorProfile.filter({
      user_id: sourceProfile.user_id,
    });
    candidates = mergeProfilesById(candidates, byUser);
  }

  await syncAllProfileAccessForEmail(base44, normalizedEmail, candidates, access_status, extraFields);
}
