import { Platform } from 'react-native';

const fallbackBase = Platform.select({
  android: 'http://10.0.2.2:8080',
  default: 'http://localhost:8080',
});

function normalize(raw: string) {
  const trimmed = raw.replace(/\/+$/, '');
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
}

export const API_URL = normalize(process.env.EXPO_PUBLIC_API_URL ?? fallbackBase ?? 'http://localhost:8080');
export const SUPPORT_EMAIL = 'support@zevora.in';
export const APP_NAME = 'ZEVORA';
