import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CarFront, Info, TrendingUp, Users, Wallet } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  StatCard,
  TBody,
  TD,
  TH,
  THead,
  TR,
  TableWrap,
} from '@/components/ui';
import { bookingsApi, ridesApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { formatCurrency, formatSmartDateTime } from '@/lib/utils';
import type { Booking, Ride } from '@/types';

export function DriverEarningsPage() {
  const earningsQuery = useQuery({
    queryKey: ['driver', 'earnings'],
    queryFn: async () => {
      const rides = await ridesApi.mine();
      const lists = await Promise.all(
        rides.slice(0, 50).map(async (ride) => {
          const bookings = await bookingsApi.forRide(ride.id).catch(() => []);
          return bookings.map((booking) => ({ ride, booking }));
        }),
      );
      return lists.flat() as { ride: Ride; booking: Booking }[];
    },
  });

  const rows = useMemo(
    () =>
      (earningsQuery.data ?? []).sort(
        (a, b) => new Date(b.booking.createdAt).getTime() - new Date(a.booking.createdAt).getTime(),
      ),
    [earningsQuery.data],
  );

  const completed = rows.filter((row) => row.booking.status === 'COMPLETED');
  const fareEarned = completed.reduce((total, row) => total + row.booking.fareAmount, 0);
  const platformFees = completed.reduce((total, row) => total + row.booking.platformFee, 0);
  const gross = completed.reduce((total, row) => total + row.booking.totalAmount, 0);
  const seats = completed.reduce((total, row) => total + row.booking.seats, 0);
  const uniqueRides = new Set(completed.map((row) => row.ride.id)).size;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cost-sharing earnings"
        description="Derived from completed bookings recorded by the backend. There is no separate settlement API for private drivers."
        actions={<Link to="/driver/rides"><Button variant="outline">Manage rides</Button></Link>}
      />

      {earningsQuery.isLoading && <LoadingBlock label="Calculating earnings…" />}
      {earningsQuery.isError && <ErrorState title="Could not load earnings" description={getApiErrorMessage(earningsQuery.error)} onRetry={() => earningsQuery.refetch()} />}

      {!earningsQuery.isLoading && !earningsQuery.isError && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Fare earned" value={formatCurrency(fareEarned)} hint="Completed bookings, before platform fees" icon={<Wallet className="h-5 w-5" />} tone="mint" />
            <StatCard label="Platform fees" value={formatCurrency(platformFees)} hint="Retained by ZEVORA" icon={<Info className="h-5 w-5" />} tone="amber" />
            <StatCard label="Completed rides" value={uniqueRides} hint={`${completed.length} completed bookings`} icon={<CarFront className="h-5 w-5" />} tone="brand" />
            <StatCard label="Seats shared" value={seats} hint="Passengers on completed bookings" icon={<Users className="h-5 w-5" />} tone="ink" />
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-sky-50 px-4 py-3 text-xs text-sky-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Private carpool fares are cost sharing, not commercial income. Amounts here are derived
              from booking records: total charged {formatCurrency(gross)} includes platform fees of{' '}
              {formatCurrency(platformFees)}.
            </p>
          </div>
        </>
      )}

      <Card>
        <CardContent className="p-0">
          {!earningsQuery.isLoading && !earningsQuery.isError && completed.length === 0 ? (
            <EmptyState
              icon={<TrendingUp className="h-6 w-6" />}
              title="No completed bookings yet"
              description="Earnings appear after passengers complete trips on your rides."
              action={<Link to="/driver/rides"><Button>View rides</Button></Link>}
              className="border-0"
            />
          ) : (
            completed.length > 0 && (
              <TableWrap className="rounded-none border-0">
                <THead>
                  <TR>
                    <TH>Ride</TH>
                    <TH>Passenger</TH>
                    <TH>Seats</TH>
                    <TH>Fare</TH>
                    <TH>Platform fee</TH>
                    <TH>Total charged</TH>
                  </TR>
                </THead>
                <TBody>
                  {completed.map(({ ride, booking }) => (
                    <TR key={booking.id}>
                      <TD>
                        <p className="text-sm font-semibold text-ink-800">{ride.originAddress} → {ride.destAddress}</p>
                        <p className="text-xs text-ink-400">{formatSmartDateTime(ride.departureTime)}</p>
                      </TD>
                      <TD>{booking.passengerName}</TD>
                      <TD>{booking.seats}</TD>
                      <TD>{formatCurrency(booking.fareAmount, true)}</TD>
                      <TD>{formatCurrency(booking.platformFee, true)}</TD>
                      <TD><Badge tone="neutral">{formatCurrency(booking.totalAmount, true)}</Badge></TD>
                    </TR>
                  ))}
                </TBody>
              </TableWrap>
            )
          )}
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <p className="text-xs text-ink-400">
          Cancelled bookings and pending payments are excluded from earnings. Completed bookings are shown above.
        </p>
      )}
    </div>
  );
}
