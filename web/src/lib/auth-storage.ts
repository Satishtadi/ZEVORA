import type { UserSummary } from '@/types';

const ACCESS_KEY = 'zevora.accessToken';
const REFRESH_KEY = 'zevora.refreshToken';
const USER_KEY = 'zevora.user';

export interface StoredTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

export const authStorage = {
  getTokens(): StoredTokens {
    return {
      accessToken: localStorage.getItem(ACCESS_KEY),
      refreshToken: localStorage.getItem(REFRESH_KEY),
    };
  },
  getUser(): UserSummary | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserSummary;
    } catch {
      return null;
    }
  },
  setSession(accessToken: string, refreshToken: string, user: UserSummary) {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  setUser(user: UserSummary) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
