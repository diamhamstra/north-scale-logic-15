import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import {
  getStoredAuthToken,
  subscribeToNativeAuthStorageChanges,
} from '@/lib/authSync';
import { getSessionUser } from '@/lib/sessionUser';

/**
 * Re-sync when another tab changes shared native Base44 auth (cookies/localStorage).
 * Custom sessions are tab-scoped in sessionStorage and are not synced across tabs.
 */
export function useAuthStorageSync({ onSessionChange, reloadOnChange = false } = {}) {
  const queryClient = useQueryClient();
  const { checkUserAuth } = useAuth();

  useEffect(() => {
    return subscribeToNativeAuthStorageChanges(({ key, oldValue, newValue }) => {
      // Custom-token tabs ignore native-only churn unless this tab has no custom session.
      if (getStoredAuthToken()) return;

      checkUserAuth();
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['investorProfile'] });
      onSessionChange?.();

      if (oldValue !== newValue || reloadOnChange) {
        window.location.reload();
      }
    });
  }, [checkUserAuth, queryClient, onSessionChange, reloadOnChange]);
}

/**
 * Guard a page against mid-flow session swaps within this tab.
 */
export function useSessionUserGuard(expectedUserId) {
  useEffect(() => {
    if (!expectedUserId) return undefined;

    return subscribeToNativeAuthStorageChanges(async () => {
      if (getStoredAuthToken()) return;
      const me = await getSessionUser();
      if (!me || me.id !== expectedUserId) {
        window.location.reload();
      }
    });
  }, [expectedUserId]);
}
