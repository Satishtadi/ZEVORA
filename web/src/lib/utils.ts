import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const currencyFormatterPrecise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value?: number | null, precise = false): string {
  if (value == null || Number.isNaN(value)) return '—';
  return precise ? currencyFormatterPrecise.format(value) : currencyFormatter.format(value);
}

export function formatDistanceKm(km?: number | null): string {
  if (km == null) return '—';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatDuration(minutes?: number | null): string {
  if (minutes == null) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

export function parseApiDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = parseISO(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value?: string | null): string {
  const date = parseApiDate(value);
  return date ? format(date, 'dd MMM yyyy') : '—';
}

export function formatTime(value?: string | null): string {
  const date = parseApiDate(value);
  return date ? format(date, 'h:mm a') : '—';
}

export function formatDateTime(value?: string | null): string {
  const date = parseApiDate(value);
  return date ? format(date, 'dd MMM yyyy, h:mm a') : '—';
}

export function formatSmartDateTime(value?: string | null): string {
  const date = parseApiDate(value);
  if (!date) return '—';
  if (isToday(date)) return `Today, ${format(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Tomorrow, ${format(date, 'h:mm a')}`;
  return format(date, 'dd MMM, h:mm a');
}

export function formatRelative(value?: string | null): string {
  const date = parseApiDate(value);
  return date ? formatDistanceToNow(date, { addSuffix: true }) : '—';
}

export function toDateTimeLocalValue(date: Date): string {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export function localDateTimeToIso(value: string): string {
  return new Date(value).toISOString();
}

export function defaultDeparture(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(8, 45, 0, 0);
  return toDateTimeLocalValue(date);
}

export function initials(name?: string | null): string {
  if (!name) return 'Z';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function titleCase(value?: string | null): string {
  if (!value) return '—';
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function percent(value?: number | null): string {
  if (value == null) return '—';
  return `${Math.round(value)}%`;
}

export function truncate(value: string, length = 80): string {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}
