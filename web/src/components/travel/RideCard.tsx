import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, CalendarClock, MapPin, ShieldCheck, Star, Users } from 'lucide-react';
import { Badge, Button, StatusBadge } from '@/components/ui';
import { formatCurrency, formatDistanceKm, formatDuration, formatSmartDateTime, titleCase } from '@/lib/utils';
import type { Ride, RideSearchResult } from '@/types';

export function RideCard({
  ride,
  searchResult,
  onBook,
  to,
}: {
  ride: Ride;
  searchResult?: RideSearchResult;
  onBook?: () => void;
  to?: string;
}) {
  return (
    <article className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft transition-shadow hover:shadow-lift">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <CarIcon />
          </span>
          <div>
            <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink-900">
              {ride.driverName}
              {ride.driverVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-mint-700">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified
                </span>
              )}
            </p>
            <p className="flex items-center gap-1 text-xs text-ink-500">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {ride.driverRating?.toFixed(1)} Â· {titleCase(ride.driverType)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ride.recurring && <Badge tone="info">Recurring</Badge>}
          {ride.womenOnly && <Badge tone="brand">Women only</Badge>}
          <StatusBadge status={ride.status} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="flex items-start gap-2">
          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-mint-500" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink-800">{ride.originAddress}</p>
            <p className="text-xs text-ink-400">Pickup</p>
          </div>
        </div>
        <ArrowRight className="hidden h-4 w-4 text-ink-300 sm:block" />
        <div className="flex items-start gap-2">
          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink-800">{ride.destAddress}</p>
            <p className="text-xs text-ink-400">Drop-off</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink-100 pt-3 text-xs text-ink-500">
        <span className="inline-flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" /> {formatSmartDateTime(ride.departureTime)}</span>
        <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {ride.availableSeats} of {ride.totalSeats} seats</span>
        <span className="inline-flex items-center gap-1.5"><CarIcon className="h-3.5 w-3.5" /> {ride.vehicleModel} Â· {ride.vehiclePlate}</span>
        {searchResult && (
          <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {formatDistanceKm(searchResult.pickupDistanceKm)} away Â· {formatDuration(searchResult.estimatedDurationMinutes)}</span>
        )}
      </div>

      {ride.notes && <p className="mt-3 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-600">{ride.notes}</p>}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xl font-extrabold text-ink-950">{formatCurrency(ride.pricePerSeat)}</p>
          <p className="text-[11px] text-ink-400">
            {ride.driverType === 'PRIVATE_CARPOOL' ? 'Cost sharing per seat' : 'Per seat + platform fee'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {to && (
            <Link to={to}>
              <Button variant="outline" size="sm">View details</Button>
            </Link>
          )}
          {onBook && (
            <Button size="sm" onClick={onBook} disabled={ride.availableSeats <= 0}>
              {ride.availableSeats > 0 ? 'Book seat' : 'Full'}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export function RideCardSkeleton() {
  return <div className="h-56 animate-pulse rounded-2xl bg-ink-100" />;
}

function CarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M5 16h14M6 16l-1.2-4.2A2 2 0 0 1 6.7 9h10.6a2 2 0 0 1 1.9 2.8L18 16M7 16v2m10-2v2" strokeLinecap="round" />
      <circle cx="8" cy="16" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SeatAvailability({ ride }: { ride: Ride }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-600">
      <Users className="h-4 w-4" /> {ride.availableSeats} seats left
    </span>
  );
}

export function VerifiedNote() {
  return (
    <p className="inline-flex items-center gap-1.5 text-xs text-mint-700">
      <ShieldCheck className="h-4 w-4" /> Verified driver and vehicle
    </p>
  );
}

