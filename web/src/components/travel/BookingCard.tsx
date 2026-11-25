import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, CarFront, CreditCard, MapPin, Users } from 'lucide-react';
import { Button, StatusBadge } from '@/components/ui';
import { formatCurrency, formatSmartDateTime } from '@/lib/utils';
import type { Booking } from '@/types';

export function BookingCard({
  booking,
  to,
  action,
}: {
  booking: Booking;
  to?: string;
  action?: React.ReactNode;
}) {
  const ride = booking.ride;
  return (
    <article className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <CarFront className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-ink-900">
              {ride ? `${ride.originAddress} → ${ride.destAddress}` : 'Ride details unavailable'}
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-ink-500">
              {ride && <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {formatSmartDateTime(ride.departureTime)}</span>}
              {ride && <span className="inline-flex items-center gap-1"><CarFront className="h-3.5 w-3.5" /> {ride.driverName} · {ride.vehiclePlate}</span>}
              <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {booking.seats} seat{booking.seats > 1 ? 's' : ''}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={booking.status} />
          <StatusBadge status={booking.paymentStatus} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-3">
        <div className="flex flex-wrap gap-4 text-xs text-ink-500">
          <span className="inline-flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> {formatCurrency(booking.totalAmount, true)}</span>
          {booking.platformFee > 0 && <span>Includes {formatCurrency(booking.platformFee, true)} platform fee</span>}
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Booked {formatSmartDateTime(booking.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          {action}
          {to && (
            <Link to={to}>
              <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>Details</Button>
            </Link>
          )}
        </div>
      </div>
      {booking.status === 'CANCELLED' && booking.cancellationReason && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          Cancelled: {booking.cancellationReason}
          {booking.paymentStatus === 'REFUNDED' ? ' · Refund recorded by backend' : ''}
        </p>
      )}
    </article>
  );
}
