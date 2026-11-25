import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Info, Search } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  Input,
  LoadingBlock,
  PageHeader,
  Select,
  StatusBadge,
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

interface RequestRow {
  ride: Ride;
  booking: Booking;
}

export function DriverRequestsPage() {
  const [rideFilter, setRideFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [query, setQuery] = useState('');

  const requestsQuery = useQuery({
    queryKey: ['driver', 'requests'],
    queryFn: async () => {
      const rides = await ridesApi.mine();
      const lists = await Promise.all(
        rides.slice(0, 50).map(async (ride) => {
          const bookings = await bookingsApi.forRide(ride.id).catch(() => []);
          return bookings.map((booking) => ({ ride, booking }));
        }),
      );
      return lists.flat() as RequestRow[];
    },
  });

  const rows = useMemo(() => {
    return (requestsQuery.data ?? [])
      .filter((row) => (rideFilter === 'ALL' ? true : row.ride.id === rideFilter))
      .filter((row) => (statusFilter === 'ALL' ? true : row.booking.status === statusFilter))
      .filter((row) => (query ? row.booking.passengerName.toLowerCase().includes(query.toLowerCase()) : true))
      .sort((a, b) => new Date(b.booking.createdAt).getTime() - new Date(a.booking.createdAt).getTime());
  }, [requestsQuery.data, rideFilter, statusFilter, query]);

  const rides = useMemo(() => {
    const unique = new Map<string, Ride>();
    (requestsQuery.data ?? []).forEach((row) => unique.set(row.ride.id, row.ride));
    return [...unique.values()];
  }, [requestsQuery.data]);

  const confirmedSeats = (requestsQuery.data ?? [])
    .filter((row) => row.booking.status === 'CONFIRMED' || row.booking.status === 'IN_PROGRESS')
    .reduce((total, row) => total + row.booking.seats, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Passenger requests"
        description="Bookings on your rides. The backend confirms seats immediately, so this list is authoritative."
        actions={<Badge tone="brand">{confirmedSeats} confirmed seats</Badge>}
      />

      <div className="flex items-start gap-2 rounded-xl bg-sky-50 px-4 py-3 text-xs text-sky-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>There is no manual accept/reject API in this backend. Bookings are confirmed automatically and appear here as soon as payment status is recorded.</p>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-[1.3fr_1fr_1fr]">
          <Input
            label="Search passenger"
            placeholder="Passenger name"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
          <Select label="Ride" value={rideFilter} onChange={(event) => setRideFilter(event.target.value)}>
            <option value="ALL">All rides</option>
            {rides.map((ride) => (
              <option key={ride.id} value={ride.id}>
                {ride.originAddress} → {ride.destAddress} · {formatSmartDateTime(ride.departureTime)}
              </option>
            ))}
          </Select>
          <Select label="Booking status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">All statuses</option>
            {['CONFIRMED', 'REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {requestsQuery.isLoading && <LoadingBlock label="Loading requests…" />}
      {requestsQuery.isError && <ErrorState title="Could not load requests" description={getApiErrorMessage(requestsQuery.error)} onRetry={() => requestsQuery.refetch()} />}

      {!requestsQuery.isLoading && !requestsQuery.isError && rows.length === 0 && (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title="No matching passenger requests"
          description="Once passengers book your rides, their confirmed seats appear here."
          action={<Link to="/driver/rides/new"><Button>Publish a ride</Button></Link>}
        />
      )}

      {rows.length > 0 && (
        <TableWrap>
          <THead>
            <TR>
              <TH>Passenger</TH>
              <TH>Ride</TH>
              <TH>Seats</TH>
              <TH>Amount</TH>
              <TH>Status</TH>
              <TH>Booked</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {rows.map(({ ride, booking }) => (
              <TR key={booking.id}>
                <TD>
                  <p className="font-semibold text-ink-800">{booking.passengerName}</p>
                  <p className="text-xs text-ink-400">{booking.id.slice(0, 8)}</p>
                </TD>
                <TD>
                  <p className="text-sm text-ink-700">{ride.originAddress} → {ride.destAddress}</p>
                  <p className="text-xs text-ink-400">{formatSmartDateTime(ride.departureTime)}</p>
                </TD>
                <TD>{booking.seats}</TD>
                <TD>{formatCurrency(booking.totalAmount, true)}</TD>
                <TD>
                  <div className="flex flex-wrap gap-1.5">
                    <StatusBadge status={booking.status} />
                    <StatusBadge status={booking.paymentStatus} />
                  </div>
                </TD>
                <TD className="text-xs text-ink-500">{formatSmartDateTime(booking.createdAt)}</TD>
                <TD>
                  <Link to={`/driver/rides/${ride.id}`}><Button variant="outline" size="sm">Ride</Button></Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}
    </div>
  );
}
