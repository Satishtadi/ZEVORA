import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const ACCESS_KEY = 'zevora.accessToken';
const REFRESH_KEY = 'zevora.refreshToken';
const USER_KEY = 'zevora.user';

let tokenCache: AuthTokens | null = null;

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Ignore persistence failures; session stays in memory.
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // Ignore persistence failures; session stays in memory.
  }
}

async function removeItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore.
    }
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Ignore.
  }
}

export async function loadTokens(): Promise<AuthTokens | null> {
  if (tokenCache) return tokenCache;
  const [accessToken, refreshToken] = await Promise.all([getItem(ACCESS_KEY), getItem(REFRESH_KEY)]);
  if (!accessToken || !refreshToken) return null;
  tokenCache = { accessToken, refreshToken };
  return tokenCache;
}

export function getCachedTokens() {
  return tokenCache;
}

export async function saveTokens(tokens: AuthTokens) {
  tokenCache = tokens;
  await Promise.all([setItem(ACCESS_KEY, tokens.accessToken), setItem(REFRESH_KEY, tokens.refreshToken)]);
}

export async function clearTokens() {
  tokenCache = null;
  await Promise.all([removeItem(ACCESS_KEY), removeItem(REFRESH_KEY)]);
}

export async function loadUser<T>(): Promise<T | null> {
  const raw = await getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function saveUser(user: unknown) {
  await setItem(USER_KEY, JSON.stringify(user));
}

export async function clearUser() {
  await removeItem(USER_KEY);
}

export async function clearSession() {
  await Promise.all([clearTokens(), clearUser()]);
}
