import { getLoginSurface, getStoredAuthToken, getStoredLoginAccess, storeLoginAccess } from '@/lib/authSync';

const ACCESS_STATUS_RANK = {
  approved: 0,
  pending: 1,
  rejected: 2,
};

const RESOLVE_RETRIES = 3;
const RESOLVE_RETRY_DELAY_MS = 250;

function normalizeEmail(email) {
  return typeof email === 'string' ? email.toLowerCase().trim() : '';
}

function normalizeAccessStatus(status) {
  if (typeof status !== 'string') return null;
  const normalized = status.toLowerCase().trim();
  if (normalized === 'approved' || normalized === 'pending' || normalized === 'rejected') {
    return normalized;
  }
  return null;
}

function profileTimestamp(profile, field) {
  const value = profile?.[field];
  return value ? new Date(value).getTime() : 0;
}

function mergeProfilesById(primary, additional) {
  const seen = new Set(primary.map((profile) => profile.id));
  const merged = [...primary];
  for (const profile of additional) {
    if (!profile?.id || seen.has(profile.id)) continue;
    merged.push(profile);
    seen.add(profile.id);
  }
  return merged;
}

function sortProfiles(profiles) {
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
export function pickPrimaryInvestorProfile(profiles) {
  if (!profiles?.length) return null;

  const approvedLike = profiles.filter((profile) => profileIndicatesApprovedAccess(profile));
  if (approvedLike.length > 0) {
    return sortProfiles(approvedLike)[0];
  }

  if (profiles.length === 1) return profiles[0];
  return sortProfiles(profiles)[0];
}

export function profileIndicatesApprovedAccess(profile) {
  if (!profile) return false;
  if (normalizeAccessStatus(profile.access_status) === 'approved') return true;
  if (profile.onboarding_stage === 'complete') return true;
  if (profile.profile_complete === true) return true;
  return false;
}

/** True when a stored/server access decision grants portal entry. */
export function accessDecisionIndicatesApproved(decision) {
  if (!decision) return false;
  if (normalizeAccessStatus(decision.access_status) === 'approved') return true;
  if (decision.onboarding_stage === 'complete') return true;
  return profileIndicatesApprovedAccess(decision);
}

function deriveAccessFromProfiles(profiles, serverOnboardingStage) {
  if (!profiles?.length) return null;

  const approvedLike = profiles.filter((profile) => profileIndicatesApprovedAccess(profile));
  if (approvedLike.length > 0) {
    const primary = pickPrimaryInvestorProfile(approvedLike);
    return {
      access_status: 'approved',
      onboarding_stage: primary?.onboarding_stage || serverOnboardingStage,
    };
  }

  const primary = pickPrimaryInvestorProfile(profiles);
  if (!primary) return null;

  return {
    access_status: normalizeAccessStatus(primary.access_status) || null,
    onboarding_stage: primary.onboarding_stage || serverOnboardingStage,
  };
}

async function loadProfilesByEmail(base44, normalizedEmail) {
  const byEmail = await base44.entities.InvestorProfile.filter({ email: normalizedEmail });
  let emailMatches = byEmail.filter(
    (profile) => normalizeEmail(profile.email) === normalizedEmail,
  );

  if (emailMatches.length === 0) {
    const recent = await base44.entities.InvestorProfile.list('-created_date', 2000);
    emailMatches = recent.filter(
      (profile) => normalizeEmail(profile.email) === normalizedEmail,
    );
  }

  const approvedRows = await base44.entities.InvestorProfile.filter({ access_status: 'approved' });
  emailMatches = mergeProfilesById(
    emailMatches,
    approvedRows.filter((profile) => normalizeEmail(profile.email) === normalizedEmail),
  );

  return emailMatches;
}

async function loadAllProfilesForUserClient(base44, userId) {
  const byUser = await base44.entities.InvestorProfile.filter({ user_id: userId });
  const approvedByUser = await base44.entities.InvestorProfile.filter({
    user_id: userId,
    access_status: 'approved',
  });
  return mergeProfilesById(byUser, approvedByUser);
}

/** Load every investor profile visible for a user/email (not just the primary). */
export async function loadAllInvestorProfilesForUser(base44, userId, email) {
  let profiles = await loadAllProfilesForUserClient(base44, userId);

  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail) {
    const emailMatches = await loadProfilesByEmail(base44, normalizedEmail);
    profiles = mergeProfilesById(profiles, emailMatches);
  }

  return profiles;
}

/** Load the canonical investor profile for a user, merging user_id and email matches. */
export async function loadInvestorProfileForUser(base44, userId, email) {
  const profiles = await loadAllInvestorProfilesForUser(base44, userId, email);
  return pickPrimaryInvestorProfile(profiles);
}

async function invokeResolveLoginAccess(base44, token, nativeUserId = null) {
  const body = { token };
  if (nativeUserId) body.native_user_id = nativeUserId;
  const result = await base44.functions.invoke('resolveLoginAccess', body);
  return result.data;
}

export async function resolveNativeAuthUserId(base44) {
  try {
    const nativeUser = await base44.auth.me();
    return nativeUser?.id || null;
  } catch {
    return null;
  }
}

/** RLS keys off native auth user.id — prefer it over custom session user id. */
export async function getEffectiveLinkUserId(base44, sessionUser) {
  const nativeUserId = await resolveNativeAuthUserId(base44);
  return nativeUserId || sessionUser?.id || null;
}

function persistServerResolve(serverResolve, source = 'onboarding_link') {
  if (
    !serverResolve ||
    (!serverResolve.success &&
      serverResolve.access_status == null &&
      (serverResolve.profiles_found ?? 0) === 0 &&
      !serverResolve.profile_id)
  ) {
    return;
  }
  storeLoginAccess({
    access_status: serverResolve.access_status ?? null,
    onboarding_stage: serverResolve.onboarding_stage ?? null,
    profile_id: serverResolve.profile_id ?? null,
    source,
  });
}

async function loadProfileForSession(base44, sessionUser, linkUserId) {
  let profile = linkUserId
    ? await loadInvestorProfileForUser(base44, linkUserId, sessionUser?.email)
    : null;

  if (!profile && sessionUser?.id && sessionUser.id !== linkUserId) {
    profile = await loadInvestorProfileForUser(base44, sessionUser.id, sessionUser.email);
  }

  return profile;
}

async function runResolveLoginAccess(base44, token, sessionUser) {
  const nativeUserId = await resolveNativeAuthUserId(base44);
  try {
    const data = await invokeResolveLoginAccess(base44, token, nativeUserId);
    return { data, nativeUserId };
  } catch (err) {
    console.warn('[ensureProfileLinkedForSession] resolveLoginAccess failed', {
      email: sessionUser?.email,
      session_user_id: sessionUser?.id,
      native_user_id: nativeUserId,
      error: err?.message || err,
    });
    return { data: null, nativeUserId };
  }
}

/**
 * Heal profile user_id linkage via service role, then load the canonical row
 * visible under RLS. Used by CompleteProfile before reads/updates.
 */
export async function ensureProfileLinkedForSession(base44, sessionUser) {
  const token = getStoredAuthToken();
  let linkUserId = await getEffectiveLinkUserId(base44, sessionUser);
  let serverResolve = null;
  let profile = null;

  const tryLoad = async () => {
    linkUserId = (await getEffectiveLinkUserId(base44, sessionUser)) || linkUserId;
    profile = await loadProfileForSession(base44, sessionUser, linkUserId);
    return profile;
  };

  if (token) {
    for (let attempt = 0; attempt < RESOLVE_RETRIES; attempt++) {
      const { data, nativeUserId } = await runResolveLoginAccess(base44, token, sessionUser);
      if (nativeUserId) linkUserId = nativeUserId;
      serverResolve = data;
      persistServerResolve(serverResolve, attempt === 0 ? 'onboarding_link' : 'onboarding_link_retry');

      profile = await tryLoad();
      if (profile) break;

      if (attempt < RESOLVE_RETRIES - 1) {
        await delay(RESOLVE_RETRY_DELAY_MS);
      }
    }
  } else {
    profile = await tryLoad();
  }

  const storedAccess = getStoredLoginAccess();
  const approvedButUnreadable =
    !profile &&
    (accessDecisionIndicatesApproved(storedAccess) || accessDecisionIndicatesApproved(serverResolve));

  if (approvedButUnreadable && token) {
    console.warn('[ensureProfileLinkedForSession] approved but profile not visible — auto-retry resolveLoginAccess', {
      email: sessionUser?.email,
      session_user_id: sessionUser?.id,
      link_user_id: linkUserId,
      server_profile_id: serverResolve?.profile_id ?? storedAccess?.profile_id ?? null,
      profiles_found: serverResolve?.profiles_found ?? null,
      has_token: true,
    });

    await delay(RESOLVE_RETRY_DELAY_MS * 2);
    const { data, nativeUserId } = await runResolveLoginAccess(base44, token, sessionUser);
    if (nativeUserId) linkUserId = nativeUserId;
    serverResolve = data || serverResolve;
    persistServerResolve(serverResolve, 'onboarding_link_recovery');

    for (let attempt = 0; attempt < RESOLVE_RETRIES && !profile; attempt++) {
      profile = await tryLoad();
      if (profile) break;
      await delay(RESOLVE_RETRY_DELAY_MS);
    }
  }

  if (
    !profile &&
    approvedButUnreadable &&
    (serverResolve?.profiles_found ?? 0) === 0 &&
    !serverResolve?.profile_id &&
    !storedAccess?.profile_id
  ) {
    linkUserId = (await getEffectiveLinkUserId(base44, sessionUser)) || sessionUser?.id;
    const onboardingStage =
      serverResolve?.onboarding_stage || storedAccess?.onboarding_stage || 'profile';
    try {
      profile = await base44.entities.InvestorProfile.create({
        user_id: linkUserId,
        full_name: sessionUser?.full_name || '',
        email: sessionUser?.email,
        access_status: 'approved',
        onboarding_stage: onboardingStage,
        profile_complete: false,
      });
      console.warn('[ensureProfileLinkedForSession] created approved profile for onboarding', {
        email: sessionUser?.email,
        profile_id: profile?.id,
        link_user_id: linkUserId,
      });
    } catch (err) {
      console.warn('[ensureProfileLinkedForSession] approved profile create failed — reloading', {
        email: sessionUser?.email,
        link_user_id: linkUserId,
        error: err?.message || err,
      });
      profile = await tryLoad();
    }
  }

  if (profile && linkUserId && !profile.user_id) {
    try {
      await base44.entities.InvestorProfile.update(profile.id, { user_id: linkUserId });
      profile = { ...profile, user_id: linkUserId };
    } catch (err) {
      console.warn('[ensureProfileLinkedForSession] client user_id relink failed', {
        profile_id: profile.id,
        link_user_id: linkUserId,
        error: err?.message || err,
      });
    }
  }

  if (!profile && approvedButUnreadable) {
    console.error('[ensureProfileLinkedForSession] approved user still has no readable profile after recovery', {
      email: sessionUser?.email,
      session_user_id: sessionUser?.id,
      link_user_id: linkUserId,
      server_profile_id: serverResolve?.profile_id ?? storedAccess?.profile_id ?? null,
      profiles_found: serverResolve?.profiles_found ?? null,
      access_status: serverResolve?.access_status ?? storedAccess?.access_status ?? null,
    });
  }

  return { profile, linkUserId, serverResolve };
}

/** Gate onboarding pages — mirrors Portal isApproved checks. */
export function sessionMayCompleteOnboarding(sessionUser, profile, serverResolve = null) {
  if (sessionUser?.role === 'admin' && getLoginSurface() === 'admin') return true;
  const storedAccess = getStoredLoginAccess();
  return (
    profileIndicatesApprovedAccess(profile) ||
    accessDecisionIndicatesApproved(storedAccess) ||
    accessDecisionIndicatesApproved(serverResolve)
  );
}

/** Call before client-side InvestorProfile.update during onboarding (RLS requires linked user_id). */
export async function ensureProfileLinkedBeforeUpdate(base44, sessionUser) {
  const { profile, linkUserId } = await ensureProfileLinkedForSession(base44, sessionUser);
  return { profile, linkUserId };
}

/** Save profile updates via service role when a session token exists (magic link + RLS-safe). */
export async function updateInvestorProfileSecure(base44, profileId, updates) {
  const token = getStoredAuthToken();
  if (token) {
    const result = await base44.functions.invoke('updateMyProfile', {
      token,
      profile_id: profileId,
      updates,
    });
    if (result.data?.success && result.data?.profile) {
      return result.data.profile;
    }
    throw new Error(result.data?.error || 'Could not save your profile. Please try again.');
  }
  return base44.entities.InvestorProfile.update(profileId, updates);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sourceIndicatesApproved(source) {
  if (!source) return false;
  if (normalizeAccessStatus(source.access_status) === 'approved') return true;
  if (source.onboarding_stage === 'complete') return true;
  return profileIndicatesApprovedAccess(source);
}

/**
 * Merge login + resolveLoginAccess (authoritative) with optional client upgrade.
 * Client entity reads are RLS-scoped to user_id and may see a stray pending shadow
 * profile while missing the admin-approved row — never let client pending downgrade.
 */
function coalesceAccessDecisions(loginSource, resolveSource, clientSource) {
  const serverSources = [loginSource, resolveSource].filter(Boolean);
  const allSources = [...serverSources, clientSource].filter(Boolean);
  let onboardingStage = null;

  for (const source of allSources) {
    if (sourceIndicatesApproved(source)) {
      return {
        access_status: 'approved',
        onboarding_stage: source.onboarding_stage || onboardingStage,
        decision_reason: 'approved_signal',
      };
    }
    if (source.onboarding_stage) {
      onboardingStage = onboardingStage || source.onboarding_stage;
    }
  }

  let sawRejected = false;
  let sawPending = false;

  for (const source of serverSources) {
    const status = normalizeAccessStatus(source.access_status);
    if (status === 'rejected') sawRejected = true;
    if (status === 'pending') sawPending = true;
  }

  if (sawRejected && !sawPending) {
    return { access_status: 'rejected', onboarding_stage: onboardingStage, decision_reason: 'rejected_only' };
  }
  if (sawPending) {
    return { access_status: 'pending', onboarding_stage: onboardingStage, decision_reason: 'server_pending' };
  }

  return { access_status: null, onboarding_stage: onboardingStage, decision_reason: 'unknown_or_no_profile' };
}

/**
 * Authoritative post-login access resolution. Merges customLogin response,
 * resolveLoginAccess (service role), and client profile reads — never downgrades
 * approved to pending when any source says approved.
 */
export async function resolveLoginAccessStatus(base44, user, serverAccessStatus, serverOnboardingStage) {
  const loginSource = {
    access_status: serverAccessStatus,
    onboarding_stage: serverOnboardingStage,
  };
  let resolveSource = null;
  let clientSource = null;
  let serverResolveProfileId = null;
  let profilesFound = 0;

  const token = getStoredAuthToken();
  const nativeUserId = await resolveNativeAuthUserId(base44);

  if (token) {
    for (let attempt = 0; attempt < RESOLVE_RETRIES; attempt++) {
      try {
        const data = await invokeResolveLoginAccess(base44, token, nativeUserId);
        if (data && (data.success || data.access_status != null || (data.profiles_found ?? 0) > 0)) {
          profilesFound = data.profiles_found ?? profilesFound;
          serverResolveProfileId = data.profile_id ?? serverResolveProfileId;
          resolveSource = {
            access_status: data.access_status ?? null,
            onboarding_stage: data.onboarding_stage ?? null,
          };
          if (sourceIndicatesApproved(resolveSource)) break;
        }
      } catch (err) {
        console.warn('[resolveLoginAccessStatus] server resolve failed', attempt, err?.message || err);
      }
      if (attempt < RESOLVE_RETRIES - 1) {
        await delay(RESOLVE_RETRY_DELAY_MS);
      }
    }
  }

  // Client reads only serve to UPGRADE to approved when the server didn't already
  // say approved. If server sources are authoritative, skip the expensive entity-read
  // retry loop (which includes a 2000-record fallback list + retry delays).
  const serverApproved = sourceIndicatesApproved(loginSource) || sourceIndicatesApproved(resolveSource);

  if (!serverApproved && user?.id) {
    for (let attempt = 0; attempt < RESOLVE_RETRIES; attempt++) {
      const profiles = await loadAllInvestorProfilesForUser(base44, user.id, user.email);
      const derived = deriveAccessFromProfiles(profiles, serverOnboardingStage);
      if (derived?.access_status === 'approved') {
        clientSource = derived;
        break;
      }
      if (attempt < RESOLVE_RETRIES - 1) {
        await delay(RESOLVE_RETRY_DELAY_MS);
      }
    }
  }

  const result = coalesceAccessDecisions(loginSource, resolveSource, clientSource);

  if (result.access_status === 'pending') {
    console.warn('[resolveLoginAccessStatus] pending decision', {
      reason: result.decision_reason,
      email: user?.email,
      user_id: user?.id,
      native_user_id: nativeUserId,
      login: loginSource.access_status,
      resolve: resolveSource?.access_status,
      profiles_found: profilesFound,
      client_upgrade: clientSource?.access_status ?? null,
    });
  }

  storeLoginAccess({
    access_status: result.access_status,
    onboarding_stage: result.onboarding_stage,
    profile_id: serverResolveProfileId,
    source: result.decision_reason,
  });

  return result;
}