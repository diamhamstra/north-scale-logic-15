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

type Base44ServiceRole = {
  asServiceRole: {
    entities: {
      InvestorProfile: {
        filter: (q: Record<string, unknown>) => Promise<InvestorProfileRecord[]>;
        list: (sort: string, limit: number) => Promise<InvestorProfileRecord[]>;
        update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
      };
      User: {
        filter: (q: Record<string, unknown>) => Promise<{ id: string; email?: string | null }[]>;
        list: (sort: string, limit: number) => Promise<{ id: string; email?: string | null }[]>;
      };
    };
  };
};

const ACCESS_STATUS_RANK: Record<string, number> = {
  approved: 0,
  pending: 1,
  rejected: 2,
};

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

/** Prefer approved / complete profile; break ties with oldest registration record. */
function pickPrimaryInvestorProfile<T extends InvestorProfileRecord>(profiles: T[] | null | undefined): T | null {
  if (!profiles?.length) return null;

  const approvedLike = profiles.filter((profile) => profileIndicatesApprovedAccess(profile));
  if (approvedLike.length > 0) {
    return sortProfiles(approvedLike)[0];
  }

  if (profiles.length === 1) return profiles[0];
  return sortProfiles(profiles)[0];
}

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

function computeLoginAccessFromProfiles(
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

async function syncApprovedProfilesForEmail(
  base44: Base44ServiceRole,
  profiles: InvestorProfileRecord[],
  onboarding_stage: string | null,
): Promise<number> {
  const patch: Record<string, unknown> = { access_status: 'approved' };
  if (onboarding_stage) patch.onboarding_stage = onboarding_stage;

  let updated = 0;
  await Promise.all(
    profiles.map(async (profile) => {
      if (!profile.id) return;
      if (normalizeAccessStatus(profile.access_status) === 'approved') return;
      await base44.asServiceRole.entities.InvestorProfile.update(profile.id, patch);
      updated += 1;
    }),
  );
  return updated;
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
  const users = await findUsersByEmail(base44, normalizedEmail);
  const userIds = new Set(users.map((user) => user.id).filter(Boolean));

  const byEmail = await base44.asServiceRole.entities.InvestorProfile.filter({ email: normalizedEmail });
  let emailMatches = byEmail.filter((profile) => normalizeEmail(profile.email) === normalizedEmail);

  if (emailMatches.length === 0) {
    const recent = await base44.asServiceRole.entities.InvestorProfile.list('-created_date', 2000);
    emailMatches = recent.filter((profile) => {
      if (normalizeEmail(profile.email) === normalizedEmail) return true;
      return profile.user_id ? userIds.has(profile.user_id) : false;
    });
  }

  for (const user of users) {
    const byUser = await base44.asServiceRole.entities.InvestorProfile.filter({ user_id: user.id });
    emailMatches = mergeProfilesById(emailMatches, byUser);
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

async function loadInvestorProfilesForUser(
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

async function findUsersByEmail(
  base44: Base44ServiceRole,
  normalizedEmail: string,
): Promise<{ id: string; email?: string | null }[]> {
  const seen = new Set<string>();
  const users: { id: string; email?: string | null }[] = [];

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

async function loadPrimaryInvestorProfile(
  base44: Base44ServiceRole,
  user: { id: string; email?: string | null },
  normalizedEmail?: string,
): Promise<InvestorProfileRecord | null> {
  const profiles = await loadInvestorProfilesForUser(base44, user, normalizedEmail);
  return pickPrimaryInvestorProfile(profiles);
}

const MAX_OTP_ATTEMPTS = 5;

function timingSafeEqual(a, b) {
  const aStr = String(a);
  const bStr = String(b);
  if (aStr.length !== bStr.length) return false;
  let mismatch = 0;
  for (let i = 0; i < aStr.length; i++) {
    mismatch |= aStr.charCodeAt(i) ^ bStr.charCodeAt(i);
  }
  return mismatch === 0;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { challenge_token, code } = await req.json();

    if (!challenge_token || !code) {
      return Response.json({ error: 'challenge_token and code are required' }, { status: 400 });
    }

    const normalizedCode = String(code).trim();

    const sessions = await base44.asServiceRole.entities.UserSession.filter({
      token: challenge_token,
      is_active: false,
    });

    if (sessions.length === 0) {
      return Response.json({ error: 'Invalid or expired verification session' }, { status: 400 });
    }

    const session = sessions[0];

    if (new Date(session.expires_at) < new Date()) {
      await base44.asServiceRole.entities.UserSession.update(session.id, { is_active: false });
      return Response.json({ error: 'Verification session expired. Please login again.' }, { status: 400 });
    }

    const users = await base44.asServiceRole.entities.User.filter({ id: session.user_id });
    if (users.length === 0) {
      return Response.json({ error: 'Invalid or expired verification session' }, { status: 400 });
    }

    let user = users[0];

    const otps = await base44.asServiceRole.entities.OtpCode.filter({
      user_id: user.id,
      purpose: '2fa_login',
      used: false,
    });

    if (otps.length === 0) {
      return Response.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    const otp = otps.sort((a, b) => new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime())[0];

    if (new Date(otp.expires_at) < new Date()) {
      await base44.asServiceRole.entities.OtpCode.update(otp.id, { used: true });
      return Response.json({ error: 'Code has expired' }, { status: 400 });
    }

    const attempts = otp.attempt_count || 0;
    if (attempts >= MAX_OTP_ATTEMPTS) {
      await base44.asServiceRole.entities.OtpCode.update(otp.id, { used: true });
      await base44.asServiceRole.entities.UserSession.update(session.id, { is_active: false });
      return Response.json({ error: 'Too many failed attempts. Please login again.' }, { status: 429 });
    }

    if (!timingSafeEqual(otp.code, normalizedCode)) {
      const nextAttempts = attempts + 1;
      await base44.asServiceRole.entities.OtpCode.update(otp.id, { attempt_count: nextAttempts });
      if (nextAttempts >= MAX_OTP_ATTEMPTS) {
        await base44.asServiceRole.entities.OtpCode.update(otp.id, { used: true });
        await base44.asServiceRole.entities.UserSession.update(session.id, { is_active: false });
        return Response.json({ error: 'Too many failed attempts. Please login again.' }, { status: 429 });
      }
      return Response.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    await base44.asServiceRole.entities.OtpCode.update(otp.id, { used: true });

    const normalizedEmail = normalizeEmail(user.email);
    let unifyResult: { data?: Record<string, unknown> } = { data: {} };
    if (normalizedEmail) {
      try {
        unifyResult = await base44.functions.invoke('unifyAccountByEmail', {
          email: normalizedEmail,
          prefer_user_id: user.id,
        });
        if (unifyResult.data?.success && unifyResult.data?.user?.id) {
          user = unifyResult.data.user as typeof user;
          if (user.id !== session.user_id) {
            await base44.asServiceRole.entities.UserSession.update(session.id, { user_id: user.id });
          }
        }
      } catch (unifyErr) {
        console.warn('[verify2FA] unifyAccountByEmail failed (login continues):', unifyErr.message);
      }
    }

    const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await base44.asServiceRole.entities.UserSession.update(session.id, {
      is_active: true,
      expires_at: sessionExpiry,
    });

    let access_status = user.role === 'admin' ? 'approved' : null;
    let onboarding_stage = user.role === 'admin' ? 'complete' : null;
    if (user.role !== 'admin') {
      const profiles = await loadInvestorProfilesForEmailLogin(base44, normalizedEmail);
      await linkProfilesToUser(base44, user.id, profiles);
      const access = computeLoginAccessFromProfiles(profiles);
      access_status = access.access_status;
      onboarding_stage = access.onboarding_stage;
      if (
        unifyResult.data?.access_status === 'approved' &&
        access_status !== 'approved'
      ) {
        access_status = 'approved';
        onboarding_stage =
          (typeof unifyResult.data.onboarding_stage === 'string'
            ? unifyResult.data.onboarding_stage
            : null) ||
          onboarding_stage;
      }
      if (access_status === 'approved') {
        await syncApprovedProfilesForEmail(base44, profiles, onboarding_stage);
      }
    }

    return Response.json({
      success: true,
      token: challenge_token,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      access_status,
      onboarding_stage,
    });
  } catch (error) {
    console.error('[verify2FA] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
