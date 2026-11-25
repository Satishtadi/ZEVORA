import type { ComparisonQuery } from '@/services/api-services';

export function compareQueryToSearch(query: ComparisonQuery): string {
  const params = new URLSearchParams();
  params.set('originAddress', query.originAddress ?? '');
  params.set('originLat', String(query.originLat));
  params.set('originLng', String(query.originLng));
  params.set('destAddress', query.destAddress ?? '');
  params.set('destLat', String(query.destLat));
  params.set('destLng', String(query.destLng));
  params.set('departureTime', query.departureTime);
  params.set('seats', String(query.seats));
  params.set('womenOnly', String(query.womenOnly));
  if (query.preference) params.set('preference', query.preference);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.category) params.set('category', query.category);
  if (query.maxFare != null) params.set('maxFare', String(query.maxFare));
  return `?${params.toString()}`;
}

export function searchToCompareQuery(params: URLSearchParams): ComparisonQuery | null {
  const originLat = Number(params.get('originLat'));
  const originLng = Number(params.get('originLng'));
  const destLat = Number(params.get('destLat'));
  const destLng = Number(params.get('destLng'));
  const departureTime = params.get('departureTime');
  if (!departureTime || [originLat, originLng, destLat, destLng].some((value) => Number.isNaN(value))) {
    return null;
  }
  return {
    originAddress: params.get('originAddress') ?? undefined,
    originLat,
    originLng,
    destAddress: params.get('destAddress') ?? undefined,
    destLat,
    destLng,
    departureTime,
    seats: Math.max(1, Number(params.get('seats') ?? 1)),
    womenOnly: params.get('womenOnly') === 'true',
    preference: params.get('preference') ?? undefined,
    sortBy: params.get('sortBy') ?? undefined,
    category: params.get('category') ?? undefined,
    maxFare: params.get('maxFare') ? Number(params.get('maxFare')) : undefined,
  };
}
