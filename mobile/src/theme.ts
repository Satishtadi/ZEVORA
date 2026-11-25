import { Platform } from 'react-native';

export const colors = {
  brand: '#6d5ef8',
  brandDark: '#5546e8',
  brandSoft: '#eeebff',
  ink: '#0b1020',
  ink800: '#1d2438',
  ink600: '#46506a',
  ink500: '#64708a',
  ink400: '#8a94aa',
  ink200: '#dde2ee',
  ink100: '#edf0f7',
  ink50: '#f6f7fb',
  mint: '#16c7b4',
  mintSoft: '#e6fbf7',
  amber: '#f59e0b',
  amberSoft: '#fff7e6',
  danger: '#e24a4a',
  dangerSoft: '#fdecec',
  white: '#ffffff',
  background: '#f6f7fb',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 30, fontWeight: '800' as const, color: colors.ink, letterSpacing: -0.6 },
  h2: { fontSize: 22, fontWeight: '800' as const, color: colors.ink, letterSpacing: -0.3 },
  h3: { fontSize: 17, fontWeight: '700' as const, color: colors.ink },
  body: { fontSize: 15, color: colors.ink600, lineHeight: 22 },
  label: { fontSize: 13, fontWeight: '700' as const, color: colors.ink800 },
  caption: { fontSize: 12, color: colors.ink500 },
};

export const shadow = Platform.select({
  ios: {
    shadowColor: '#0b1020',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  android: { elevation: 2 },
  default: {},
});

export const statusTone: Record<string, { bg: string; text: string }> = {
  PUBLISHED: { bg: colors.mintSoft, text: '#0d8f80' },
  CONFIRMED: { bg: colors.mintSoft, text: '#0d8f80' },
  ACTIVE: { bg: colors.mintSoft, text: '#0d8f80' },
  COMPLETED: { bg: colors.ink100, text: colors.ink600 },
  APPROVED: { bg: colors.mintSoft, text: '#0d8f80' },
  PAID: { bg: colors.mintSoft, text: '#0d8f80' },
  REQUESTED: { bg: colors.amberSoft, text: '#a16207' },
  PENDING: { bg: colors.amberSoft, text: '#a16207' },
  IN_PROGRESS: { bg: colors.brandSoft, text: colors.brandDark },
  FULL: { bg: colors.brandSoft, text: colors.brandDark },
  OPEN: { bg: colors.dangerSoft, text: '#b42323' },
  SOS: { bg: colors.dangerSoft, text: '#b42323' },
  CANCELLED: { bg: colors.dangerSoft, text: '#b42323' },
  REJECTED: { bg: colors.dangerSoft, text: '#b42323' },
  SUSPENDED: { bg: colors.dangerSoft, text: '#b42323' },
  FAILED: { bg: colors.dangerSoft, text: '#b42323' },
  REFUNDED: { bg: colors.brandSoft, text: colors.brandDark },
  ACKNOWLEDGED: { bg: colors.brandSoft, text: colors.brandDark },
  RESOLVED: { bg: colors.ink100, text: colors.ink600 },
};
