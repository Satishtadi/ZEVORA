import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_URL } from './config';
import { clearTokens, getCachedTokens, loadTokens, saveTokens } from './storage';
import type { TokenResponse } from '../types';

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _skipAuthRefresh?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const tokens = getCachedTokens() ?? (await loadTokens());
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

async function refreshAccessToken(): Promise<string | null> {
  const tokens = await loadTokens();
  if (!tokens?.refreshToken) return null;
  try {
    const { data } = await axios.post<TokenResponse>(
      `${API_URL}/auth/refresh`,
      { refreshToken: tokens.refreshToken },
      { timeout: 20000 },
    );
    await saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    return data.accessToken;
  } catch {
    await clearTokens();
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    const status = error.response?.status;
    if (config && status === 401 && !config._retry && !config._skipAuthRefresh) {
      config._retry = true;
      refreshPromise = refreshPromise ?? refreshAccessToken();
      const token = await refreshPromise;
      refreshPromise = null;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        return api(config);
      }
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; fieldErrors?: Record<string, string> } | undefined;
    if (data?.fieldErrors) {
      const first = Object.values(data.fieldErrors)[0];
      if (first) return first;
    }
    if (data?.message) return data.message;
    if (error.code === 'ECONNABORTED') return 'The request timed out. Check your connection and try again.';
    if (!error.response) return 'Cannot reach the ZEVORA API. Check your network and EXPO_PUBLIC_API_URL.';
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
