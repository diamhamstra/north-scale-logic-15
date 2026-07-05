import { base44 } from '@/api/base44Client';
import {
  clearCustomAuthStorage,
  getStoredAuthToken,
  getStoredAuthUser,
  isWithinLoginGracePeriod,
  migrateLegacyAuthStorage,
} from '@/lib/authSync';

migrateLegacyAuthStorage();

const VALIDATE_RETRIES = 1;
const VALIDATE_RETRY_DELAY_MS = 100;
const POST_LOGIN_RETRIES = 2;
const POST_LOGIN_RETRY_DELAY_MS = 150;

/** Dedupe concurrent validateSession calls for the same token (AuthContext + React Query). */
const inFlightByToken = new Map();

function cacheKey(token, retries, retryDelayMs) {
  return `${token}:${retries}:${retryDelayMs}`;
}

async function invokeValidateSession(token) {
  const result = await base44.functions.invoke('validateSession', { token });
  return result.data;
}

async function validateTokenWithRetries(
  token,
  { retries = VALIDATE_RETRIES, retryDelayMs = VALIDATE_RETRY_DELAY_MS } = {},
) {
  let sawExplicitInvalid = false;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const data = await invokeValidateSession(token);
      if (data?.valid === true && data?.user) {
        return data.user;
      }
      if (data?.valid === false) {
        sawExplicitInvalid = true;
        if (attempt < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
          continue;
        }
      }
    } catch {
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        continue;
      }
      return null;
    }
  }

  if (sawExplicitInvalid && !isWithinLoginGracePeriod()) {
    clearCustomAuthStorage();
  }
  return null;
}

/**
 * Validate a custom session token with retries. Concurrent callers share one in-flight request.
 */
export async function resolveUserFromCustomToken(
  token,
  { retries = VALIDATE_RETRIES, retryDelayMs = VALIDATE_RETRY_DELAY_MS } = {},
) {
  if (!token) return null;

  const key = cacheKey(token, retries, retryDelayMs);
  const existing = inFlightByToken.get(key);
  if (existing) return existing;

  const promise = validateTokenWithRetries(token, { retries, retryDelayMs }).finally(() => {
    if (inFlightByToken.get(key) === promise) {
      inFlightByToken.delete(key);
    }
  });

  inFlightByToken.set(key, promise);
  return promise;
}

/**
 * Block until the backend accepts a token that was just issued at login.
 * Called before post-login navigation so destination pages never race an unread session row.
 */
export async function waitForSessionReady(token) {
  const user = await resolveUserFromCustomToken(token, {
    retries: POST_LOGIN_RETRIES,
    retryDelayMs: POST_LOGIN_RETRY_DELAY_MS,
  });
  if (user) return user;

  const storedUser = getStoredAuthUser();
  if (storedUser) return storedUser;

  throw new Error('Session could not be validated after login');
}

/**
 * Gets the current session user for this tab. Custom token in sessionStorage is authoritative;
 * never fall back to native auth when a custom token is present (stale cookies from another tab).
 */
export async function getSessionUser() {
  const token = getStoredAuthToken();
  if (token) {
    const validated = await resolveUserFromCustomToken(token);
    if (validated) return validated;

    const storedUser = getStoredAuthUser();
    if (storedUser && isWithinLoginGracePeriod()) {
      return storedUser;
    }
    return null;
  }

  try {
    const me = await base44.auth.me();
    if (me) return me;
  } catch {
    // Native auth unavailable
  }

  return null;
}