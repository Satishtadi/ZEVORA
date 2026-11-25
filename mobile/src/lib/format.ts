import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns';

export function formatCurrency(value: number | null | undefined, withDecimals = false) {
  const amount = Number(value ?? 0);
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0,
  })}`;
}

function toDate(value?: string | null) {
  if (!value) return null;
  const date = parseISO(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatTime(value?: string | null) {
  const date = toDate(value);
  return date ? format(date, 'h:mm a') : '—';
}

export function formatDate(value?: string | null) {
  const date = toDate(value);
  return date ? format(date, 'd MMM yyyy') : '—';
}

export function formatSmartDateTime(value?: string | null) {
  const date = toDate(value);
  if (!date) return '—';
  const day = isToday(date) ? 'Today' : isTomorrow(date) ? 'Tomorrow' : format(date, 'EEE d MMM');
  return `${day}, ${format(date, 'h:mm a')}`;
}

export function formatRelative(value?: string | null) {
  const date = toDate(value);
  return date ? `${formatDistanceToNow(date, { addSuffix: true })}` : '—';
}

export function formatDuration(minutes?: number | null) {
  const total = Math.round(Number(minutes ?? 0));
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatDistanceKm(km?: number | null) {
  if (km == null) return '—';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export function titleCase(value?: string | null) {
  if (!value) return '';
  return value
    .toLowerCase()
    .split(/[\s_]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function initials(name?: string | null) {
  if (!name) return 'Z';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function defaultDeparture() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(8, 45, 0, 0);
  return date.toISOString();
}

export function toDateTimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
