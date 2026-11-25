import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './config';
import { authStorage } from './auth-storage';
import type { ApiErrorBody, TokenResponse } from '@/types';

declare module 'axios' {
  export interface AxiosRequestConfig {
    _skipAuthRefresh?: boolean;
  }
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
    _skipAuthRefresh?: boolean;
  }
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const { accessToken } = authStorage.getTokens();
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const { refreshToken } = authStorage.getTokens();
  if (!refreshToken) throw new Error('No refresh token available');

  if (!refreshPromise) {
    refreshPromise = axios
      .post<TokenResponse>(
        `${API_BASE_URL}/auth/refresh-token`,
        { refreshToken },
        { timeout: 20000, headers: { 'Content-Type': 'application/json' } },
      )
      .then(({ data }) => {
        authStorage.setSession(data.accessToken, data.refreshToken, data.user);
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return /\/auth\/(login|register|refresh-token|request-otp|verify-otp)$/.test(url);
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as InternalAxiosRequestConfig | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry && !original._skipAuthRefresh && !isAuthEndpoint(original.url)) {
      original._retry = true;
      try {
        const token = await refreshAccessToken();
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        authStorage.clear();
        window.dispatchEvent(new CustomEvent('zevora:session-expired'));
        return Promise.reject(error);
      }
    }

    if (status === 401 && !isAuthEndpoint(original?.url)) {
      authStorage.clear();
      window.dispatchEvent(new CustomEvent('zevora:session-expired'));
    }

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
    if (!error.response) return 'Cannot reach ZEVORA servers. Check your connection and try again.';
    const body = error.response.data;
    if (body?.fieldErrors && Object.keys(body.fieldErrors).length > 0) {
      return Object.values(body.fieldErrors)[0] ?? body.message ?? 'Please check the form and try again.';
    }
    if (body?.message) return body.message;
    if (error.response.status === 403) return 'You do not have permission to perform this action.';
    if (error.response.status === 404) return 'The requested resource was not found.';
    if (error.response.status >= 500) return 'ZEVORA is having trouble right now. Please try again shortly.';
    return `Request failed (${error.response.status}).`;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

export function getApiFieldErrors(error: unknown): Record<string, string> {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.fieldErrors ?? {};
  }
  return {};
}

export function isApiErrorCode(error: unknown, code: string): boolean {
  return axios.isAxiosError<ApiErrorBody>(error) && error.response?.data?.code === code;
}
