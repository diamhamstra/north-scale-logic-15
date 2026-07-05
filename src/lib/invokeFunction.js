import { base44 } from '@/api/base44Client';
import { getStoredAuthToken } from '@/lib/authSync';

/**
 * Invoke a Base44 function with optional custom session token attached.
 * Investors using customLogin store ns_auth_token in sessionStorage (tab-scoped).
 */
export async function invokeFunction(name, payload = {}) {
  const sessionToken = typeof window !== 'undefined' ? getStoredAuthToken() : null;
  const body = sessionToken ? { ...payload, session_token: sessionToken } : payload;
  return base44.functions.invoke(name, body);
}
