import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import bcrypt from 'npm:bcryptjs@2.4.3';

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

async function loadPrimaryInvestorProfile(
  base44: Base44ServiceRole,
  user: { id: string; email?: string | null },
  normalizedEmail?: string,
): Promise<InvestorProfileRecord | null> {
  const profiles = await loadInvestorProfilesForUser(base44, user, normalizedEmail);
  return pickPrimaryInvestorProfile(profiles);
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

/** Merge profiles from every User row and email match for one login address. */
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

async function userStoredPasswordMatches(
  user: UserRecord & { password?: string | null },
  password: string,
): Promise<boolean> {
  const storedPassword = user.password || '';
  if (!storedPassword) return false;

  const isHashed = storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2a$');
  if (isHashed) {
    return bcrypt.compare(password, storedPassword);
  }
  return storedPassword === password;
}

/** When duplicate User rows exist for one email, prefer password match then best access profile. */
async function resolveUserForLogin(
  base44: Base44ServiceRole,
  normalizedEmail: string,
  password?: string,
): Promise<UserRecord | null> {
  const users = await findUsersByEmail(base44, normalizedEmail);
  if (users.length === 0) return null;

  if (password && users.length > 1) {
    for (const user of users) {
      if (await userStoredPasswordMatches(user, password)) {
        return user;
      }
    }
    // Wrong password for every duplicate row — do not fall back to profile-ranked user.
    return null;
  }

  if (users.length === 1) return users[0];

  const allProfiles = await loadInvestorProfilesForEmailLogin(base44, normalizedEmail);
  let bestUser = users[0];
  let bestRank = Number.POSITIVE_INFINITY;

  for (const user of users) {
    const ownedProfiles = allProfiles.filter((profile) => profile.user_id === user.id);
    const profile = pickPrimaryInvestorProfile(ownedProfiles.length > 0 ? ownedProfiles : allProfiles);
    const rank = profileIndicatesApprovedAccess(profile || {})
      ? ACCESS_STATUS_RANK.approved
      : ACCESS_STATUS_RANK[normalizeAccessStatus(profile?.access_status) || 'pending'] ?? 1;
    if (rank < bestRank) {
      bestRank = rank;
      bestUser = user;
    }
  }

  return bestUser;
}

function getPostmarkConfig() {
  return {
    apiKey: Deno.env.get('POSTMARK_API_KEY') || '',
    fromEmail: Deno.env.get('POSTMARK_FROM_EMAIL') || 'portal@northscale.capital',
    fromName: Deno.env.get('POSTMARK_FROM_NAME') || 'North Scale',
  };
}

async function sendPostmarkEmail(opts) {
  const { to, subject, textBody, htmlBody } = opts;
  const { apiKey, fromEmail, fromName } = getPostmarkConfig();
  if (!apiKey) throw new Error('POSTMARK_API_KEY not configured');
  if (!to || !subject) throw new Error('to and subject are required');
  const payload = { From: `${fromName} <${fromEmail}>`, To: to, Subject: subject };
  if (textBody) payload.TextBody = textBody;
  if (htmlBody) payload.HtmlBody = htmlBody;
  const res = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': apiKey,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(function () { return {}; });
  if (!res.ok) throw new Error(data.Message || data.message || 'Postmark error');
  return data;
}

function generateOtpCode() {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const num = (bytes[0] << 16 | bytes[1] << 8 | bytes[2]) % 900000;
  return String(num + 100000);
}

function renderBrandedEmail({ preheader = '', eyebrow, heading, intro, code = '', ctaLabel = '', ctaUrl = '', note = '' }) {
  const codeBlock = code
    ? `<tr><td style="padding:4px 40px 10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border:1px solid #26324d;background-color:#070b14;padding:24px 16px;text-align:center;"><div style="font-family:'Courier New',Courier,monospace;font-size:34px;line-height:1;letter-spacing:14px;color:#f2f5fa;font-weight:700;padding-left:14px;">${code}</div></td></tr></table></td></tr>`
    : '';
  const ctaBlock = ctaLabel && ctaUrl
    ? `<tr><td style="padding:6px 40px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="background-color:#f2f5fa;"><a href="${ctaUrl}" style="display:block;text-align:center;color:#05070d;text-decoration:none;font-family:'Courier New',Courier,monospace;font-size:12px;letter-spacing:3px;padding:16px 12px;">${ctaLabel}</a></td></tr></table></td></tr>`
    : '';
  const noteBlock = note
    ? `<tr><td style="padding:8px 40px 0;"><p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:11px;line-height:20px;color:#6f7d94;">${note}</p></td></tr>`
    : '';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="x-apple-disable-message-reformatting"><title>North Scale</title></head><body style="margin:0;padding:0;background-color:#05070d;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#05070d;">${preheader}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#05070d;"><tr><td align="center" style="padding:44px 16px;"><table role="presentation" cellpadding="0" cellspacing="0" width="520" style="width:520px;max-width:520px;background-color:#0a0f1a;border:1px solid #1c2740;"><tr><td align="center" style="padding:30px 40px 26px;border-bottom:1px solid #1c2740;"><span style="font-family:'Courier New',Courier,monospace;font-size:20px;color:#5c6b85;">/</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;letter-spacing:6px;color:#f2f5fa;padding:0 12px;">scale</span><span style="font-family:'Courier New',Courier,monospace;font-size:20px;color:#5c6b85;">/</span></td></tr><tr><td style="padding:34px 40px 8px;"><p style="margin:0 0 14px;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#6f7d94;">${eyebrow}</p><h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.1;font-weight:400;color:#f2f5fa;">${heading}</h1><p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:13px;line-height:24px;color:#aeb9cc;">${intro}</p></td></tr>${codeBlock}${ctaBlock}${noteBlock}<tr><td style="padding:30px 40px 34px;"><p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:12px;line-height:22px;color:#8a97ac;">north scale</p></td></tr><tr><td style="padding:22px 40px 26px;border-top:1px solid #1c2740;background-color:#070b14;"><p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;line-height:18px;color:#5c6b85;">this is an automated security message. if you did not initiate this request, no action is required and you may disregard this email.</p><p style="margin:12px 0 0;font-family:'Courier New',Courier,monospace;font-size:10px;line-height:18px;color:#465266;">© ${new Date().getFullYear()} north scale · systematic investment strategies</p></td></tr></table></td></tr></table></body></html>`;
}

async function send2FACode(to, code) {
  await sendPostmarkEmail({
    to,
    subject: 'Your North Scale verification code',
    textBody: `Your two-factor authentication code is:\n\n${code}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\nNorth Scale`,
    htmlBody: renderBrandedEmail({
      preheader: `Your north scale two-factor authentication code is ${code}`,
      eyebrow: 'TWO-FACTOR AUTHENTICATION',
      heading: 'verification code',
      intro: 'a sign-in to your north scale account was requested. enter the code below to complete two-factor authentication. this code expires in 10 minutes.',
      code,
      note: 'if you did not attempt to sign in, change your password immediately and contact support.',
    }),
  });
}

async function invalidatePending2FASessions(base44, userId) {
  const pending = await base44.asServiceRole.entities.UserSession.filter({
    user_id: userId,
    is_active: false,
  });
  await Promise.all(
    pending.map((s) => base44.asServiceRole.entities.UserSession.delete(s.id))
  );
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await resolveUserForLogin(base44, normalizedEmail, password);
    if (!user) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Re-fetch by id so the password field is present (list/filter scans may omit it).
    const fullUsers = await base44.asServiceRole.entities.User.filter({ id: user.id });
    if (fullUsers.length > 0) {
      user = fullUsers[0];
    }

    const storedPassword = user.password || '';

    const isHashed = storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2a$');

    let passwordMatch = false;
    if (isHashed) {
      passwordMatch = await bcrypt.compare(password, storedPassword);
    } else {
      passwordMatch = storedPassword === password;
      if (passwordMatch) {
        const hashed = await bcrypt.hash(password, 10);
        await base44.asServiceRole.entities.User.update(user.id, { password: hashed });
      }
    }

    // Fallback: verify against Base44 native auth when custom password field is empty or out of sync
    if (!passwordMatch) {
      try {
        await base44.auth.loginViaEmailPassword(normalizedEmail, password);
        const hashed = await bcrypt.hash(password, 10);
        await base44.asServiceRole.entities.User.update(user.id, { password: hashed });
        passwordMatch = true;
      } catch {
        return Response.json({ error: 'Invalid email or password' }, { status: 401 });
      }
    }

    let unifyResult: { data?: Record<string, unknown> } = { data: {} };
    let unify_error: string | null = null;
    try {
      unifyResult = await base44.functions.invoke('unifyAccountByEmail', {
        email: normalizedEmail,
        prefer_user_id: user.id,
      });
      if (unifyResult.data?.success && unifyResult.data?.user?.id) {
        user = unifyResult.data.user as typeof user;
      } else if (unifyResult.data?.error) {
        unify_error = String(unifyResult.data.error);
        console.warn('[customLogin] unifyAccountByEmail returned error:', unify_error);
      }
    } catch (unifyErr) {
      unify_error = unifyErr.message;
      console.warn('[customLogin] unifyAccountByEmail failed (login continues):', unify_error);
    }

    let twoFaEnabled = false;
    if (user.role === 'admin') {
      twoFaEnabled = !!user.two_fa_enabled;
    } else {
      const profile = await loadPrimaryInvestorProfile(base44, user, normalizedEmail);
      twoFaEnabled = !!profile?.two_fa_enabled;
    }

    if (twoFaEnabled) {
      const code = generateOtpCode();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const challengeToken = crypto.randomUUID();
      const challengeExpiry = otpExpiry;

      const oldOtps = await base44.asServiceRole.entities.OtpCode.filter({
        user_id: user.id,
        purpose: '2fa_login',
        used: false,
      });
      await Promise.all(oldOtps.map((o) => base44.asServiceRole.entities.OtpCode.update(o.id, { used: true })));

      await invalidatePending2FASessions(base44, user.id);

      await base44.asServiceRole.entities.OtpCode.create({
        user_id: user.id,
        email: user.email,
        code,
        purpose: '2fa_login',
        expires_at: otpExpiry,
        used: false,
        attempt_count: 0,
      });

      await base44.asServiceRole.entities.UserSession.create({
        user_id: user.id,
        token: challengeToken,
        expires_at: challengeExpiry,
        is_active: false,
      });

      await send2FACode(user.email, code);

      return Response.json({
        success: true,
        requires_2fa: true,
        email: user.email,
        challenge_token: challengeToken,
      });
    }

    const sessionToken = crypto.randomUUID();
    const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await base44.asServiceRole.entities.UserSession.create({
      user_id: user.id,
      token: sessionToken,
      expires_at: sessionExpiry,
      is_active: true,
    });

    let access_status = user.role === 'admin' ? 'approved' : null;
    let onboarding_stage = user.role === 'admin' ? 'complete' : null;
    let profiles_found = 0;
    let profiles_synced = 0;
    if (user.role !== 'admin') {
      const profiles = await loadInvestorProfilesForEmailLogin(base44, normalizedEmail);
      profiles_found = profiles.length;
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
        profiles_synced = await syncApprovedProfilesForEmail(base44, profiles, onboarding_stage);
      }
    }

    return Response.json({
      success: true,
      token: sessionToken,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      access_status,
      onboarding_stage,
      merged_count: unifyResult.data?.merged_count ?? 0,
      profiles_found,
      profiles_synced,
      unify_error,
    });
  } catch (error) {
    console.error('customLogin error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});