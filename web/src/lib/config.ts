function normalizeBaseUrl(value: string): string {
  const trimmed = value.replace(/\/+$/, '');
  return /\/api\/v1$/.test(trimmed) ? trimmed : `${trimmed}/api/v1`;
}

const configured = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export const API_BASE_URL = normalizeBaseUrl(configured);
export const APP_ENV = import.meta.env.VITE_APP_ENV ?? 'local';
export const SUPPORT_EMAIL = 'support@zevora.in';
export const CURRENT_CITY = 'Hyderabad';
