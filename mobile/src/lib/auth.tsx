import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi, usersApi, type RegisterInput } from '../services/api';
import { clearSession, loadTokens, loadUser, saveTokens, saveUser } from './storage';
import { setUnauthorizedHandler } from './api';
import type { MeResponse } from '../types';

export type SessionUser = MeResponse;

interface AuthContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<SessionUser>;
  register: (input: RegisterInput) => Promise<SessionUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<SessionUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistUser = useCallback(async (next: SessionUser) => {
    setUser(next);
    await saveUser({
      id: next.id,
      fullName: next.fullName,
      email: next.email,
      phone: next.phone,
      role: next.role,
    });
  }, []);

  const refreshUser = useCallback(async () => {
    const tokens = await loadTokens();
    if (!tokens) {
      setUser(null);
      return null;
    }
    try {
      const me = await usersApi.me();
      await persistUser(me);
      return me;
    } catch {
      return null;
    }
  }, [persistUser]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tokens = await loadTokens();
        if (!tokens) return;
        const stored = await loadUser<SessionUser>();
        if (stored && !cancelled) setUser(stored);
        try {
          const me = await usersApi.me();
          if (!cancelled) await persistUser(me);
        } catch (err) {
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (!cancelled && (status === 401 || status === 403)) {
            setUser(null);
            await clearSession();
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [persistUser]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      queryClient.clear();
      void clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [queryClient]);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const tokens = await authApi.login(identifier.trim(), password);
      await saveTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      try {
        const me = await usersApi.me();
        await persistUser(me);
        queryClient.clear();
        return me;
      } catch (err) {
        await clearSession();
        throw err;
      }
    },
    [persistUser, queryClient],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const tokens = await authApi.register(input);
      await saveTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      try {
        const me = await usersApi.me();
        await persistUser(me);
        queryClient.clear();
        return me;
      } catch (err) {
        await clearSession();
        throw err;
      }
    },
    [persistUser, queryClient],
  );

  const logout = useCallback(async () => {
    const tokens = await loadTokens();
    try {
      await authApi.logout(tokens?.refreshToken);
    } catch {
      // Best-effort revocation; local session is cleared regardless.
    }
    await clearSession();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
