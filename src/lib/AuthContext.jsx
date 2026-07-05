import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  AUTH_2FA_PENDING_KEY,
  clearCustomAuthStorage,
  getStoredAuthToken,
  migrateLegacyAuthStorage,
} from '@/lib/authSync';
import { clearNativeAuthSession } from '@/lib/customAuth';
import { getSessionUser } from '@/lib/sessionUser';

const AuthContext = createContext();

migrateLegacyAuthStorage();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoadingPublicSettings] = useState(false);

  const checkUserAuth = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      const me = await getSessionUser();
      if (me) {
        setUser(me);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => { checkUserAuth(); }, [checkUserAuth]);

  const navigateToLogin = useCallback(() => { window.location.href = '/start'; }, []);
  const logout = useCallback(async () => {
    const token = getStoredAuthToken();
    if (token) {
      try {
        await base44.functions.invoke('customLogout', { token });
      } catch {
        // Proceed with local cleanup even if server logout fails
      }
    }
    clearCustomAuthStorage();
    sessionStorage.removeItem(AUTH_2FA_PENDING_KEY);
    await clearNativeAuthSession();
    window.location.href = '/start';
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authChecked, navigateToLogin, logout, checkUserAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // During hot-reload, context may be momentarily unavailable — return a safe no-op default
    if (import.meta.env.DEV) {
      return { user: null, isAuthenticated: false, isLoadingAuth: true, isLoadingPublicSettings: false, authChecked: false, navigateToLogin: () => {}, logout: async () => {}, checkUserAuth: async () => {} };
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
