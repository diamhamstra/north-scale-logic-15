export const AUTH_TOKEN_KEY = 'ns_auth_token';
export const AUTH_USER_KEY = 'ns_user';
export const AUTH_2FA_PENDING_KEY = 'ns_2fa_pending';
/** Server-resolved access from resolveLoginAccess (survives RLS-blocked profile reads). */
export const LOGIN_ACCESS_KEY = 'ns_login_access';
/** Timestamp (ms) when the current tab stored a custom session — used for post-login grace. */
export const AUTH_SESSION_SET_AT_KEY = 'ns_auth_set_at';
/** 'investor' = /start user portal; 'admin' = /admin-login */
export const LOGIN_SURFACE_KEY = 'ns_login_surface';

/** Tab-scoped custom session keys (each tab can hold a different account). */
export const AUTH_STORAGE_KEYS = [
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  AUTH_2FA_PENDING_KEY,
  AUTH_SESSION_SET_AT_KEY,
  LOGIN_ACCESS_KEY,
];

/** Base44 SDK tokens in localStorage (shared across tabs). */
export const NATIVE_AUTH_TOKEN_KEYS = ['base44_access_token', 'token'];

/** localStorage key broadcast when another tab changes native auth (not custom session). */
export const NATIVE_AUTH_SYNC_KEY = 'ns_native_auth_sync';

/** Do not clear a freshly stored session while backend reads may lag. */
export const LOGIN_GRACE_MS = 8_000;

const customAuthStorage = () => sessionStorage;
const nativeAuthStorage = () => localStorage;

/** Remove Base44 SDK tokens from localStorage (shared across tabs). */
export function clearNativeAuthStorage() {
  NATIVE_AUTH_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function getStoredAuthToken() {
  return customAuthStorage().getItem(AUTH_TOKEN_KEY);
}

export function getStoredAuthUser() {
  try {
    const raw = customAuthStorage().getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getSessionStoredAt() {
  const raw = customAuthStorage().getItem(AUTH_SESSION_SET_AT_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isWithinLoginGracePeriod(now = Date.now()) {
  const storedAt = getSessionStoredAt();
  return storedAt > 0 && now - storedAt < LOGIN_GRACE_MS;
}

/** One-time migration: legacy localStorage custom tokens → tab-scoped sessionStorage. */
export function migrateLegacyAuthStorage() {
  if (typeof window === 'undefined') return;
  const tabStore = customAuthStorage();
  if (tabStore.getItem(AUTH_TOKEN_KEY)) return;

  const legacyToken = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!legacyToken) return;

  tabStore.setItem(AUTH_TOKEN_KEY, legacyToken);
  const legacyUser = localStorage.getItem(AUTH_USER_KEY);
  if (legacyUser) tabStore.setItem(AUTH_USER_KEY, legacyUser);

  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function clearCustomAuthStorage() {
  AUTH_STORAGE_KEYS.forEach((key) => customAuthStorage().removeItem(key));
}

export function storeCustomAuthSession(token, user) {
  customAuthStorage().setItem(AUTH_TOKEN_KEY, token);
  if (user) {
    customAuthStorage().setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
  customAuthStorage().setItem(AUTH_SESSION_SET_AT_KEY, String(Date.now()));
}

export function storeLoginAccess({ access_status, onboarding_stage, profile_id = null, source = 'resolve' }) {
  customAuthStorage().setItem(
    LOGIN_ACCESS_KEY,
    JSON.stringify({
      access_status: access_status ?? null,
      onboarding_stage: onboarding_stage ?? null,
      profile_id,
      source,
      resolved_at: Date.now(),
    }),
  );
}

export function getStoredLoginAccess() {
  try {
    const raw = customAuthStorage().getItem(LOGIN_ACCESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearStoredLoginAccess() {
  customAuthStorage().removeItem(LOGIN_ACCESS_KEY);
}

export function getLoginSurface() {
  return customAuthStorage().getItem(LOGIN_SURFACE_KEY) || 'investor';
}

export function setLoginSurface(surface) {
  customAuthStorage().setItem(LOGIN_SURFACE_KEY, surface);
}

export function getStoredAuthFingerprint() {
  const token = getStoredAuthToken();
  if (!token) return null;
  const user = getStoredAuthUser();
  return { token, userId: user?.id ?? null, email: user?.email ?? null };
}

/**
 * Listen for native auth key changes from other tabs (storage event does not fire in the writing tab).
 * Custom auth lives in sessionStorage and is intentionally tab-scoped.
 */
export function subscribeToNativeAuthStorageChanges(onChange) {
  const handler = (event) => {
    if (event.storageArea !== localStorage) return;
    if (event.key === NATIVE_AUTH_SYNC_KEY || NATIVE_AUTH_TOKEN_KEYS.includes(event.key)) {
      onChange({
        key: event.key,
        oldValue: event.oldValue,
        newValue: event.newValue,
      });
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}