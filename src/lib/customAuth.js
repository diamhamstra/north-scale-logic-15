import { base44 } from '@/api/base44Client';
import {
  AUTH_2FA_PENDING_KEY,
  clearCustomAuthStorage,
  clearNativeAuthStorage,
  getStoredAuthToken,
  migrateLegacyAuthStorage,
  NATIVE_AUTH_SYNC_KEY,
  setLoginSurface,
  storeCustomAuthSession,
  storeLoginAccess,
} from '@/lib/authSync';
import { waitForSessionReady } from '@/lib/sessionUser';
import { resolveLoginAccessStatus } from '@/lib/investorProfile';

export { AUTH_2FA_PENDING_KEY };

migrateLegacyAuthStorage();

export function clearAuthStorage() {
  clearCustomAuthStorage();
}

/** Clear native Base44 session cookies + localStorage SDK tokens. */
export async function clearNativeAuthSession() {
  clearNativeAuthStorage();
  try {
    const authed = await base44.auth.isAuthenticated();
    if (authed) {
      await base44.auth.logout(window.location.pathname + window.location.search);
    }
  } catch {
    // Continue — local artifacts are already cleared
  }
  localStorage.setItem(NATIVE_AUTH_SYNC_KEY, String(Date.now()));
}

/** Clear custom + native auth artifacts before establishing a new session in this tab. */
export async function prepareForNewSession() {
  clearCustomAuthStorage();
  clearNativeAuthStorage();
  // Do not call auth.logout() here — it can redirect to the current page and race with
  // the post-login navigation. Native cookies are re-established via loginViaEmailPassword.
  localStorage.setItem(NATIVE_AUTH_SYNC_KEY, String(Date.now()));
}

export function storeAuthSession(token, user) {
  storeCustomAuthSession(token, user);
}

/** Sign out from both custom session and Base44 native auth. */
export async function signOut(redirectUrl = '/start') {
  const token = getStoredAuthToken();
  if (token) {
    try {
      await base44.functions.invoke('customLogout', { token });
    } catch {
      // Continue with local cleanup
    }
  }

  clearCustomAuthStorage();
  await clearNativeAuthSession();

  window.location.href = redirectUrl;
}

export async function performOAuthLoginResolution() {
  const result = await base44.functions.invoke('resolveOAuthLogin', {});
  const data = result.data;

  if (!data?.success || !data?.token || !data?.user) {
    throw new Error(data?.error || 'OAuth sign-in failed');
  }

  await prepareForNewSession();
  setLoginSurface('investor');
  storeAuthSession(data.token, data.user);
  await waitForSessionReady(data.token);

  const resolved = await resolveLoginAccessStatus(
    base44,
    data.user,
    data.access_status || null,
    data.onboarding_stage || null,
  );

  return {
    success: true,
    user: data.user,
    access_status: resolved.access_status,
    onboarding_stage: resolved.onboarding_stage,
    merged_count: data.merged_count ?? 0,
  };
}

export async function performCustomLogin(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  const result = await base44.functions.invoke('customLogin', {
    email: normalizedEmail,
    password,
  });
  const data = result.data;

  if (data?.requires_2fa) {
    return {
      requires2FA: true,
      challenge_token: data.challenge_token,
      email: data.email,
    };
  }

  if (data?.token && data?.user) {
    await prepareForNewSession();
    setLoginSurface('investor');
    storeAuthSession(data.token, data.user);
    const nativeSync = data.user.role !== 'admin'
      ? base44.auth.loginViaEmailPassword(normalizedEmail, password).catch((nativeErr) => {
          console.warn('[performCustomLogin] native auth sync failed — profile RLS reads may fail until refresh', nativeErr?.message || nativeErr);
        })
      : Promise.resolve();
    await Promise.all([nativeSync, waitForSessionReady(data.token)]);
    const resolved = await resolveLoginAccessStatus(
      base44,
      data.user,
      data.access_status || null,
      data.onboarding_stage || null,
    );
    return {
      success: true,
      user: data.user,
      access_status: resolved.access_status,
      onboarding_stage: resolved.onboarding_stage,
    };
  }

  throw new Error(data?.error || 'Invalid email or password');
}

export async function performMagicLinkLogin(token) {
  const result = await base44.functions.invoke('consumeMagicLink', { token });
  const data = result.data;

  if (!data?.success || !data?.token || !data?.user) {
    throw new Error(data?.error || 'This login link is invalid or has expired.');
  }

  await prepareForNewSession();
  setLoginSurface('investor');
  storeAuthSession(data.token, data.user);
  storeLoginAccess({
    access_status: data.access_status || 'approved',
    onboarding_stage: data.onboarding_stage || null,
    source: 'magic_link',
  });

  return {
    success: true,
    user: data.user,
    access_status: data.access_status || 'approved',
    onboarding_stage: data.onboarding_stage || null,
  };
}

export function store2FAPending({ challenge_token, email, redirect = '/portal', password }) {
  sessionStorage.setItem(AUTH_2FA_PENDING_KEY, JSON.stringify({
    challenge_token,
    email,
    redirect,
    password,
  }));
}

export async function completeCustom2FA(code) {
  const pendingRaw = sessionStorage.getItem(AUTH_2FA_PENDING_KEY);
  if (!pendingRaw) {
    throw new Error('2FA session expired. Please login again.');
  }

  const { challenge_token, redirect = '/portal', password } = JSON.parse(pendingRaw);
  const result = await base44.functions.invoke('verify2FA', {
    challenge_token,
    code,
  });

  if (result.data?.success && result.data?.token) {
    await prepareForNewSession();
    setLoginSurface('investor');
    storeAuthSession(result.data.token, result.data.user);
    sessionStorage.removeItem(AUTH_2FA_PENDING_KEY);

    const normalizedEmail = (result.data.user?.email || '').toLowerCase().trim();
    const nativeSync = result.data.user?.role !== 'admin' && password && normalizedEmail
      ? base44.auth.loginViaEmailPassword(normalizedEmail, password).catch((nativeErr) => {
          console.warn('[completeCustom2FA] native auth sync failed — profile RLS reads may fail until refresh', nativeErr?.message || nativeErr);
        })
      : Promise.resolve();
    await Promise.all([nativeSync, waitForSessionReady(result.data.token)]);

    const resolved = await resolveLoginAccessStatus(
      base44,
      result.data.user,
      result.data.access_status || null,
      result.data.onboarding_stage || null,
    );

    return {
      user: result.data.user,
      access_status: resolved.access_status,
      onboarding_stage: resolved.onboarding_stage,
      redirect,
    };
  }

  throw new Error(result.data?.error || 'Invalid verification code');
}

export function getLoginRedirect(user, accessStatus, onboardingStage) {
  const normalized = normalizeAccessStatus(accessStatus) || accessStatus;
  const effectivelyApproved =
    normalized === 'approved' ||
    onboardingStage === 'complete' ||
    (typeof accessStatus === 'string' && accessStatus.toLowerCase().trim() === 'approved');

  if (normalized === 'rejected' && !effectivelyApproved) return null;
  if (normalized === 'pending' && !effectivelyApproved) return null;

  if (effectivelyApproved) {
    const stage = typeof onboardingStage === 'string' ? onboardingStage.toLowerCase().trim() : onboardingStage;
    if (stage && stage !== 'complete') {
      return '/complete-profile';
    }
    return '/portal';
  }
  return '/portal';
}

function normalizeAccessStatus(status) {
  if (typeof status !== 'string') return null;
  const normalized = status.toLowerCase().trim();
  if (normalized === 'approved' || normalized === 'pending' || normalized === 'rejected') {
    return normalized;
  }
  return null;
}