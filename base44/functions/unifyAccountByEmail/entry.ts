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
  password?: string | null;
  created_date?: string;
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
        update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
        delete: (id: string) => Promise<unknown>;
      };
      UserSession: {
        filter: (q: Record<string, unknown>) => Promise<Array<{ id: string }>>;
        delete: (id: string) => Promise<unknown>;
        update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
      };
      OtpCode: {
        filter: (q: Record<string, unknown>) => Promise<Array<{ id: string }>>;
        delete: (id: string) => Promise<unknown>;
        update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
      };
      SupportMessage: {
        filter: (q: Record<string, unknown>) => Promise<Array<{ id: string }>>;
        update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
      };
      SupportTicket: {
        filter: (q: Record<string, unknown>) => Promise<Array<{ id: string }>>;
        update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
      };
      Notification: {
        filter: (q: Record<string, unknown>) => Promise<Array<{ id: string }>>;
        update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
      };
      AuditLog: {
        filter: (q: Record<string, unknown>) => Promise<Array<{ id: string }>>;
        update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
      };
      PerformanceSnapshot: {
        filter: (q: Record<string, unknown>) => Promise<Array<{ id: string }>>;
        update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
      };
      ClientNote: {
        filter: (q: Record<string, unknown>) => Promise<Array<{ id: string }>>;
        update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
      };
      ClientTask: {
        filter: (q: Record<string, unknown>) => Promise<Array<{ id: string }>>;
        update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
      };
    };
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
  const approvedLike = profiles.filter((profile) => profileIndicatesApprovedAccess(profile));
  if (approvedLike.length > 0) return sortProfiles(approvedLike)[0];
  if (profiles.length === 1) return profiles[0];
  return sortProfiles(profiles)[0];
}

function profileIndicatesApprovedAccess(profile: InvestorProfileRecord): boolean {
  if (normalizeAccessStatus(profile.access_status) === 'approved') return true;
  if (profile.onboarding_stage === 'complete') return true;
  if (profile.profile_complete === true) return true;
  return false;
}

function computeLoginAccessFromProfiles(
  profiles: InvestorProfileRecord[] | null | undefined,
): { access_status: string | null; onboarding_stage: string | null } {
  if (!profiles?.length) return { access_status: null, onboarding_stage: null };

  const approvedLike = profiles.filter((profile) => profileIndicatesApprovedAccess(profile));
  if (approvedLike.length > 0) {
    const primary = pickPrimaryInvestorProfile(approvedLike);
    return { access_status: 'approved', onboarding_stage: primary?.onboarding_stage || null };
  }

  if (profiles.every((profile) => normalizeAccessStatus(profile.access_status) === 'rejected')) {
    const primary = pickPrimaryInvestorProfile(profiles);
    return { access_status: 'rejected', onboarding_stage: primary?.onboarding_stage || null };
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

function userHasPassword(user: UserRecord): boolean {
  return typeof user.password === 'string' && user.password.length > 0;
}

function userCreatedTime(user: UserRecord): number {
  return user.created_date ? new Date(user.created_date).getTime() : 0;
}

async function findUsersByEmail(base44: Base44ServiceRole, normalizedEmail: string): Promise<UserRecord[]> {
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

async function loadInvestorProfilesForEmailLogin(
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

async function linkProfilesToUser(
  base44: Base44ServiceRole,
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

async function syncProfileAccessForEmail(
  base44: Base44ServiceRole,
  normalizedEmail: string,
  profiles: InvestorProfileRecord[],
): Promise<void> {
  const access = computeLoginAccessFromProfiles(profiles);
  if (!access.access_status) return;

  // Never downgrade: if any profile is approved-like, promote all to approved.
  const hasApprovedLike = profiles.some((profile) => profileIndicatesApprovedAccess(profile));
  const targetStatus = hasApprovedLike ? 'approved' : access.access_status;
  const patch: Record<string, unknown> = { access_status: targetStatus };
  const onboardingStage = hasApprovedLike
    ? (access.onboarding_stage || profiles.find((p) => profileIndicatesApprovedAccess(p))?.onboarding_stage || null)
    : access.onboarding_stage;
  if (onboardingStage) patch.onboarding_stage = onboardingStage;

  await Promise.all(
    profiles.map(async (profile) => {
      if (!profile.id) return;
      const current = normalizeAccessStatus(profile.access_status);
      if (current === targetStatus && (!onboardingStage || profile.onboarding_stage === onboardingStage)) return;
      await base44.asServiceRole.entities.InvestorProfile.update(profile.id, patch);
    }),
  );
}

/** Pick one User row per email: approved profile > password account > oldest. */
async function findCanonicalUserByEmail(
  base44: Base44ServiceRole,
  normalizedEmail: string,
  preferUserId?: string | null,
): Promise<{ canonical: UserRecord | null; duplicates: UserRecord[]; profiles: InvestorProfileRecord[] }> {
  const users = await findUsersByEmail(base44, normalizedEmail);
  if (users.length === 0) {
    return { canonical: null, duplicates: [], profiles: [] };
  }

  const profiles = await loadInvestorProfilesForEmailLogin(base44, normalizedEmail);
  if (users.length === 1) {
    return { canonical: users[0], duplicates: [], profiles };
  }

  let bestUser = users[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const user of users) {
    let score = 0;
    if (preferUserId && user.id === preferUserId) score += 10000;

    const ownedProfiles = profiles.filter((profile) => profile.user_id === user.id);
    const primary = pickPrimaryInvestorProfile(ownedProfiles.length > 0 ? ownedProfiles : profiles);
    const rank = profileIndicatesApprovedAccess(primary || {})
      ? ACCESS_STATUS_RANK.approved
      : ACCESS_STATUS_RANK[normalizeAccessStatus(primary?.access_status) || 'pending'] ?? 1;
    score += (3 - rank) * 1000;

    if (profileIndicatesApprovedAccess(primary || {})) score += 500;
    if (userHasPassword(user)) score += 2500;
    score -= userCreatedTime(user) / 1e15;

    if (score > bestScore) {
      bestScore = score;
      bestUser = user;
    }
  }

  const duplicates = users.filter((user) => user.id !== bestUser.id);
  return { canonical: bestUser, duplicates, profiles };
}

async function reassignEntityUserIds(
  base44: Base44ServiceRole,
  entityName: keyof Base44ServiceRole['asServiceRole']['entities'],
  field: string,
  fromUserId: string,
  toUserId: string,
): Promise<void> {
  try {
    const entity = base44.asServiceRole.entities[entityName] as {
      filter: (q: Record<string, unknown>) => Promise<Array<{ id: string }>>;
      update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
    };
    const rows = await entity.filter({ [field]: fromUserId });
    await Promise.all(rows.map((row) => entity.update(row.id, { [field]: toUserId })));
  } catch (err) {
    console.warn(`[unifyAccountByEmail] Could not reassign ${String(entityName)}.${field}:`, err.message);
  }
}

async function purgeDuplicateUserData(base44: Base44ServiceRole, duplicateId: string): Promise<void> {
  const sessions = await base44.asServiceRole.entities.UserSession.filter({ user_id: duplicateId });
  await Promise.all(sessions.map((session) => base44.asServiceRole.entities.UserSession.delete(session.id)));

  const otps = await base44.asServiceRole.entities.OtpCode.filter({ user_id: duplicateId });
  await Promise.all(otps.map((otp) => base44.asServiceRole.entities.OtpCode.delete(otp.id)));
}

async function mergeDuplicateUsers(
  base44: Base44ServiceRole,
  canonical: UserRecord,
  duplicates: UserRecord[],
  normalizedEmail: string,
  profiles: InvestorProfileRecord[],
): Promise<number> {
  if (duplicates.length === 0) return 0;

  let merged = 0;
  const canonicalPatch: Record<string, unknown> = { email: normalizedEmail };

  for (const duplicate of duplicates) {
    if (!duplicate.id || duplicate.id === canonical.id) continue;

    const duplicateProfiles = await base44.asServiceRole.entities.InvestorProfile.filter({
      user_id: duplicate.id,
    });
    await linkProfilesToUser(base44, canonical.id, duplicateProfiles);

    await reassignEntityUserIds(base44, 'SupportMessage', 'sender_id', duplicate.id, canonical.id);
    await reassignEntityUserIds(base44, 'SupportTicket', 'user_id', duplicate.id, canonical.id);
    await reassignEntityUserIds(base44, 'Notification', 'user_id', duplicate.id, canonical.id);
    await reassignEntityUserIds(base44, 'AuditLog', 'user_id', duplicate.id, canonical.id);
    await reassignEntityUserIds(base44, 'PerformanceSnapshot', 'user_id', duplicate.id, canonical.id);
    await reassignEntityUserIds(base44, 'ClientNote', 'user_id', duplicate.id, canonical.id);
    await reassignEntityUserIds(base44, 'ClientTask', 'user_id', duplicate.id, canonical.id);

    const duplicateOtps = await base44.asServiceRole.entities.OtpCode.filter({ user_id: duplicate.id });
    await Promise.all(
      duplicateOtps.map((otp) =>
        base44.asServiceRole.entities.OtpCode.update(otp.id, { user_id: canonical.id }),
      ),
    );

    if (!userHasPassword(canonical) && userHasPassword(duplicate)) {
      canonicalPatch.password = duplicate.password;
      canonical.password = duplicate.password;
    }

    if (!canonical.full_name && duplicate.full_name) {
      canonicalPatch.full_name = duplicate.full_name;
      canonical.full_name = duplicate.full_name;
    }

    await purgeDuplicateUserData(base44, duplicate.id);

    try {
      await base44.asServiceRole.entities.User.delete(duplicate.id);
    } catch (err) {
      console.warn('[unifyAccountByEmail] Could not delete duplicate user', duplicate.id, err);
    }

    merged += 1;
  }

  if (Object.keys(canonicalPatch).length > 1 || canonicalPatch.email) {
    await base44.asServiceRole.entities.User.update(canonical.id, canonicalPatch);
  }

  const refreshedProfiles = await loadInvestorProfilesForEmailLogin(base44, normalizedEmail);
  await linkProfilesToUser(base44, canonical.id, refreshedProfiles);
  await syncProfileAccessForEmail(base44, normalizedEmail, refreshedProfiles);

  return merged;
}

export async function unifyAccountForEmail(
  base44: Base44ServiceRole,
  email: string,
  preferUserId?: string | null,
): Promise<{
  user: UserRecord | null;
  merged_count: number;
  access_status: string | null;
  onboarding_stage: string | null;
}> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return { user: null, merged_count: 0, access_status: null, onboarding_stage: null };
  }

  const { canonical, duplicates, profiles } = await findCanonicalUserByEmail(
    base44,
    normalizedEmail,
    preferUserId,
  );

  if (!canonical) {
    return { user: null, merged_count: 0, access_status: null, onboarding_stage: null };
  }

  const merged_count = await mergeDuplicateUsers(base44, canonical, duplicates, normalizedEmail, profiles);

  const finalProfiles = await loadInvestorProfilesForEmailLogin(base44, normalizedEmail);
  await linkProfilesToUser(base44, canonical.id, finalProfiles);

  let access_status: string | null = null;
  let onboarding_stage: string | null = null;

  if (canonical.role === 'admin') {
    access_status = 'approved';
    onboarding_stage = 'complete';
  } else {
    const access = computeLoginAccessFromProfiles(finalProfiles);
    access_status = access.access_status;
    onboarding_stage = access.onboarding_stage;
  }

  return { user: canonical, merged_count, access_status, onboarding_stage };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email : '';
    const preferUserId = typeof body.prefer_user_id === 'string' ? body.prefer_user_id : null;

    if (!email) {
      return Response.json({ success: false, error: 'email is required' }, { status: 400 });
    }

    const result = await unifyAccountForEmail(base44, email, preferUserId);

    if (!result.user) {
      return Response.json({ success: false, error: 'No user found for email' }, { status: 404 });
    }

    return Response.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        full_name: result.user.full_name,
        role: result.user.role || 'user',
      },
      merged_count: result.merged_count,
      access_status: result.access_status,
      onboarding_stage: result.onboarding_stage,
    });
  } catch (error) {
    console.error('[unifyAccountByEmail] Error:', error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});
