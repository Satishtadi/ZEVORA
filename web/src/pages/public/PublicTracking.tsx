import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CarFront, MapPin, ShieldCheck, UserRound } from 'lucide-react';
import { Badge, Button, Card, EmptyState, ErrorState, LoadingBlock, StatusBadge } from '@/components/ui';
import { safetyApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { formatRelative, formatSmartDateTime } from '@/lib/utils';
import type { TrackingPoint } from '@/types';

export function PublicTrackingPage() {
  const { token = '' } = useParams();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['public-tracking', token],
    queryFn: () => safetyApi.publicTracking(token),
    enabled: Boolean(token),
    retry: false,
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">Shared trip tracking</h1>
          <p className="mt-1 text-sm text-ink-500">Shared by a ZEVORA passenger for trip visibility.</p>
        </div>
        <Badge tone="success"><ShieldCheck className="h-3 w-3" /> Read-only link</Badge>
      </div>

      {isLoading && <div className="mt-8"><LoadingBlock label="Loading tripâ€¦" /></div>}

      {isError && (
        <div className="mt-8">
          <ErrorState
            title="Tracking link unavailable"
            description={`${getApiErrorMessage(error)} The link may have expired or been revoked.`}
            onRetry={() => refetch()}
          />
        </div>
      )}

      {data && (
        <div className="mt-8 space-y-5">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 p-5">
              <div>
                <p className="text-sm font-bold text-ink-900">{data.originAddress} â†’ {data.destAddress}</p>
                <p className="mt-1 text-xs text-ink-500">Departure {formatSmartDateTime(data.departureTime)}</p>
              </div>
              <StatusBadge status={data.status} />
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <div className="flex items-start gap-2">
                <UserRound className="mt-0.5 h-4 w-4 text-brand-600" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Passenger</p>
                  <p className="text-sm font-semibold text-ink-800">{data.passengerName}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CarFront className="mt-0.5 h-4 w-4 text-brand-600" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Driver</p>
                  <p className="text-sm font-semibold text-ink-800">{data.driverName}</p>
                  <p className="text-xs text-ink-500">{data.vehiclePlate}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-brand-600" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Last update</p>
                  <p className="text-sm font-semibold text-ink-800">
                    {data.points.length ? formatRelative(data.points[data.points.length - 1].recordedAt) : 'No pings yet'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="border-b border-ink-100 px-5 py-4">
              <h2 className="text-base font-bold text-ink-900">Trip progress</h2>
              <p className="text-xs text-ink-500">Location pings recorded by the ZEVORA backend.</p>
            </div>
            <div className="p-5">
              {data.points.length === 0 ? (
                <EmptyState title="No location pings yet" description="Progress will appear once the trip starts and the driver app records location." />
              ) : (
                <div className="space-y-5">
                  <TrackingSketch points={data.points} />
                  <ol className="space-y-2">
                    {[...data.points].reverse().slice(0, 8).map((point, index) => (
                      <li key={`${point.recordedAt}-${index}`} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-xs">
                        <span className="text-ink-600">{point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}</span>
                        <span className="text-ink-400">{formatRelative(point.recordedAt)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </Card>

          <p className="text-center text-xs text-ink-400">
            This page only exposes trip basics. Passenger contact details are never shown on shared links.
          </p>
        </div>
      )}

      {!isLoading && !isError && !data && (
        <div className="mt-8">
          <EmptyState title="Tracking link not found" description="Ask the passenger to share a fresh tracking link." />
        </div>
      )}

      <div className="mt-8 text-center">
        <Link to="/"><Button variant="outline">Explore ZEVORA</Button></Link>
      </div>
    </div>
  );
}

function TrackingSketch({ points }: { points: TrackingPoint[] }) {
  const width = 720;
  const height = 260;
  const padding = 28;
  const lats = points.map((point) => point.latitude);
  const lngs = points.map((point) => point.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = maxLat - minLat || 1;
  const lngSpan = maxLng - minLng || 1;
  const coords = points.map((point) => ({
    x: padding + ((point.longitude - minLng) / lngSpan) * (width - padding * 2),
    y: height - padding - ((point.latitude - minLat) / latSpan) * (height - padding * 2),
  }));
  const path = coords.map((coord, index) => `${index === 0 ? 'M' : 'L'} ${coord.x.toFixed(1)} ${coord.y.toFixed(1)}`).join(' ');
  const start = coords[0];
  const end = coords[coords.length - 1];

  return (
    <div className="overflow-hidden rounded-xl border border-ink-100 bg-gradient-to-br from-ink-50 to-white">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" role="img" aria-label="Sketch of recorded trip path">
        {[0.25, 0.5, 0.75].map((fraction) => (
          <g key={fraction}>
            <line x1={padding} x2={width - padding} y1={height * fraction} y2={height * fraction} stroke="#e2e8f0" strokeDasharray="4 6" />
            <line y1={padding} y2={height - padding} x1={width * fraction} x2={width * fraction} stroke="#e2e8f0" strokeDasharray="4 6" />
          </g>
        ))}
        <path d={path} fill="none" stroke="#6d5ef8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={start.x} cy={start.y} r="7" fill="#16c7b4" />
        <circle cx={end.x} cy={end.y} r="7" fill="#6d5ef8" />
        <text x={start.x + 10} y={start.y + 4} fontSize="11" fill="#334155">Start</text>
        <text x={end.x + 10} y={end.y + 4} fontSize="11" fill="#334155">Latest</text>
      </svg>
      <p className="border-t border-ink-100 bg-white/70 px-3 py-2 text-[11px] text-ink-400">
        Sketch only â€” not a map. Coordinates are positioned relative to this trip's recorded pings.
      </p>
    </div>
  );
}

