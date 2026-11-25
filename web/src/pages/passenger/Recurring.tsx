import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarRange, Repeat, Search } from 'lucide-react';
import { Button, Card, CardContent, EmptyState, ErrorState, LoadingBlock, PageHeader } from '@/components/ui';
import { RideCard } from '@/components/travel/RideCard';
import { bookingsApi, ridesApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import type { Ride } from '@/types';

export function RecurringPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['recurring', 'booked'],
    queryFn: async () => {
      const page = await bookingsApi.mine(0, 200);
      const active = page.items.filter((booking) => booking.status === 'CONFIRMED' || booking.status === 'REQUESTED');
      const uniqueRideIds = [...new Set(active.map((booking) => booking.rideId))].slice(0, 40);
      const rides = await Promise.all(uniqueRideIds.map((rideId) => ridesApi.get(rideId).catch(() => null)));
      const recurringRides = rides.filter((ride): ride is Ride => Boolean(ride?.recurring));
      return {
        recurring: recurringRides,
        upcoming: recurringRides.filter((ride) => new Date(ride.departureTime).getTime() >= Date.now()),
      };
    },
    retry: 1,
  });

  const rides = data?.upcoming.length ? data.upcoming : data?.recurring ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recurring commute"
        description="Recurring rides are published by drivers for repeat weekdays. Here are the recurring carpools you have booked."
        actions={<Link to="/app/search"><Button leftIcon={<Search className="h-4 w-4" />}>Find recurring rides</Button></Link>}
      />

      <Card className="border-brand-100 bg-brand-50/50">
        <CardContent className="flex items-start gap-3 p-5 text-sm text-ink-600">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 shadow-soft">
            <Repeat className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold text-ink-900">How recurring works</p>
            <p className="mt-1">
              A driver publishes one ride and attaches a weekday recurrence. When you book that ride,
              your seat is tied to the scheduled departure. Search results mark recurring rides with a
              badge, and new departure instances appear as the backend generates them.
            </p>
            <p className="mt-1 text-xs text-ink-400">
              Passenger-side automation for creating a recurring schedule is not exposed by this backend. Use the driver portal to publish recurring rides.
            </p>
          </div>
        </CardContent>
      </Card>

      {isLoading && <LoadingBlock label="Checking your recurring carpools…" />}
      {isError && <ErrorState title="Could not load recurring rides" description={getApiErrorMessage(error)} onRetry={() => refetch()} />}

      {!isLoading && !isError && rides.length === 0 && (
        <EmptyState
          icon={<CalendarRange className="h-6 w-6" />}
          title="No recurring carpools booked yet"
          description="Search your home-to-work route and look for rides marked recurring. They are usually published by regular commuters."
          action={<Link to="/app/search"><Button>Search your commute</Button></Link>}
        />
      )}

      {rides.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-ink-600">{rides.length} recurring carpool{rides.length === 1 ? '' : 's'} in your bookings</p>
          {rides.map((ride) => (
            <RideCard key={ride.id} ride={ride} to={`/app/rides/${ride.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
