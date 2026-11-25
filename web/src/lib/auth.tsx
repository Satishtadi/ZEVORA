import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { authStorage } from '@/lib/auth-storage';
import { authApi, usersApi, type RegisterInput } from '@/services/api-services';
import { portalForRole, portalHome } from '@/lib/roles';
import type { MeResponse, Profile, Role, TokenResponse, UserStatus, UserSummary } from '@/types';

export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  status?: UserStatus;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  profile?: Profile;
  createdAt?: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<SessionUser>;
  register: (input: RegisterInput) => Promise<SessionUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<SessionUser | null>;
  portalHome: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toSessionUser(me: MeResponse): SessionUser {
  return { ...me };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<SessionUser | null>(() => authStorage.getUser());
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const { accessToken } = authStorage.getTokens();
    if (!accessToken) {
      setUser(null);
      return null;
    }
    const me = await usersApi.me();
    const session = toSessionUser(me);
    authStorage.setUser({ id: me.id, fullName: me.fullName, email: me.email, phone: me.phone, role: me.role });
    setUser(session);
    return session;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (authStorage.getTokens().accessToken) {
          await refreshUser();
        }
      } catch {
        authStorage.clear();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      queryClient.clear();
      if (!window.location.pathname.startsWith('/login')) {
        navigate('/login?expired=1', { replace: true });
      }
    };
    window.addEventListener('zevora:session-expired', onExpired);
    return () => window.removeEventListener('zevora:session-expired', onExpired);
  }, [navigate, queryClient]);

  const applyToken = useCallback((token: TokenResponse): SessionUser => {
    authStorage.setSession(token.accessToken, token.refreshToken, token.user);
    const session: SessionUser = { ...token.user };
    setUser(session);
    return session;
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const token = await authApi.login(identifier, password);
      const session = applyToken(token);
      refreshUser().catch(() => undefined);
      return session;
    },
    [applyToken, refreshUser],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const token = await authApi.register(input);
      const session = applyToken(token);
      refreshUser().catch(() => undefined);
      return session;
    },
    [applyToken, refreshUser],
  );

  const logout = useCallback(async () => {
    const { refreshToken } = authStorage.getTokens();
    try {
      await authApi.logout(refreshToken);
    } catch {
      // The session is cleared locally even if the server is unreachable.
    }
    authStorage.clear();
    setUser(null);
    queryClient.clear();
    navigate('/login', { replace: true });
  }, [navigate, queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshUser,
      portalHome: portalHome[portalForRole(user?.role)],
    }),
    [user, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export type { UserSummary };
