"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext';
import type { AuthContextValue } from '../context/AuthContext';
import type { AuthUser } from '../types/auth';
import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from '../lib/auth-storage';
import { login as loginApi, logout as logoutApi, me as meApi, refresh as refreshApi } from '../services/authService';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | undefined>(undefined);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [refreshToken, setRefreshToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const syncUser = useCallback(async () => {
    const access = getAccessToken();
    const refresh = getRefreshToken();

    if (!access && refresh) {
      const refreshed = await refreshApi({ refreshToken: refresh });
      setAuthTokens({
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken ?? refresh
      });
    }

    const nextAccess = getAccessToken();
    if (!nextAccess) {
      setUser(undefined);
      setToken(undefined);
      return;
    }

    setToken(nextAccess);
    const currentUser = await meApi<AuthUser>();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setToken(getAccessToken() ?? undefined);
        setRefreshToken(getRefreshToken() ?? undefined);
        await syncUser();
      } catch {
        clearAuthTokens();
        setUser(undefined);
        setToken(undefined);
        setRefreshToken(undefined);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [syncUser]);

  const login = useCallback<AuthContextValue['login']>(async (credentials) => {
    setLoading(true);
    try {
      const resp = await loginApi(credentials);
      if (!resp.accessToken) {
        throw new Error('Missing access token in login response');
      }

      setAuthTokens({
        accessToken: resp.accessToken,
        refreshToken: resp.refreshToken ?? null
      });
      setToken(resp.accessToken);
      setRefreshToken(resp.refreshToken);
      setUser(resp.user ?? resp.admin ?? (await meApi<AuthUser>()));
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const refreshSession = useCallback<AuthContextValue['refreshSession']>(async () => {
    const refresh = getRefreshToken();
    if (!refresh) return;

    const resp = await refreshApi({ refreshToken: refresh });
    setAuthTokens({
      accessToken: resp.accessToken,
      refreshToken: resp.refreshToken ?? refresh
    });
    setToken(resp.accessToken);
    setRefreshToken(resp.refreshToken ?? refresh);
    setUser(await meApi<AuthUser>());
  }, []);

  const logout = useCallback<AuthContextValue['logout']>(async () => {
    setLoading(true);
    try {
      if (getRefreshToken()) {
        await logoutApi();
      }
    } catch {
      // best effort logout
    } finally {
      clearAuthTokens();
      setToken(undefined);
      setRefreshToken(undefined);
      setUser(undefined);
      router.push('/login');
      setLoading(false);
    }
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      refreshToken,
      loading,
      isAuthenticated: !!token,
      login,
      logout,
      refreshSession
    }),
    [loading, login, logout, refreshSession, refreshToken, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

