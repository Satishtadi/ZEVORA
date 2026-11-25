import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ticket } from 'lucide-react';
import {
  Badge,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  Pagination,
  Select,
  StatusBadge,
  TBody,
  TD,
  TH,
  THead,
  TR,
  TableWrap,
} from '@/components/ui';
import { adminApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { formatCurrency, formatSmartDateTime } from '@/lib/utils';

const statuses = ['', 'CONFIRMED', 'REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export function AdminBookingsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);

  const bookingsQuery = useQuery({
    queryKey: ['admin', 'bookings', status, page],
    queryFn: () => adminApi.bookings(status || undefined, page, 20),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="All bookings"
        description="Platform-wide booking records with payment status. Admin cancellation is not exposed by this backend."
        actions={<Badge tone="neutral">{bookingsQuery.data?.totalElements ?? 0} bookings</Badge>}
      />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <Select
            label="Booking status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(0);
            }}
            wrapperClassName="w-56"
          >
            {statuses.map((value) => <option key={value} value={value}>{value || 'All statuses'}</option>)}
          </Select>
        </CardContent>
      </Card>

      {bookingsQuery.isLoading && <LoadingBlock label="Loading bookings…" />}
      {bookingsQuery.isError && <ErrorState title="Could not load bookings" description={getApiErrorMessage(bookingsQuery.error)} onRetry={() => bookingsQuery.refetch()} />}

      {!bookingsQuery.isLoading && !bookingsQuery.isError && (bookingsQuery.data?.items ?? []).length === 0 && (
        <EmptyState icon={<Ticket className="h-6 w-6" />} title="No bookings in this view" description="Try a different booking status." />
      )}

      {(bookingsQuery.data?.items ?? []).length > 0 && (
        <>
          <TableWrap>
            <THead>
              <TR>
                <TH>Booking</TH>
                <TH>Passenger</TH>
                <TH>Ride</TH>
                <TH>Seats</TH>
                <TH>Amount</TH>
                <TH>Status</TH>
                <TH>Payment</TH>
                <TH>Created</TH>
              </TR>
            </THead>
            <TBody>
              {(bookingsQuery.data?.items ?? []).map((booking) => (
                <TR key={booking.id}>
                  <TD className="font-mono text-xs text-ink-500">{booking.id.slice(0, 8)}</TD>
                  <TD>
                    <p className="font-semibold text-ink-800">{booking.passengerName}</p>
                    <p className="text-xs text-ink-400">{booking.passengerId.slice(0, 8)}</p>
                  </TD>
                  <TD>
                    <p className="text-sm text-ink-700">{booking.ride ? `${booking.ride.originAddress} → ${booking.ride.destAddress}` : '—'}</p>
                    <p className="text-xs text-ink-400">{booking.ride ? formatSmartDateTime(booking.ride.departureTime) : ''}</p>
                  </TD>
                  <TD>{booking.seats}</TD>
                  <TD>{formatCurrency(booking.totalAmount, true)}</TD>
                  <TD><StatusBadge status={booking.status} /></TD>
                  <TD><StatusBadge status={booking.paymentStatus} /></TD>
                  <TD className="text-xs text-ink-500">{formatSmartDateTime(booking.createdAt)}</TD>
                </TR>
              ))}
            </TBody>
          </TableWrap>
          <Pagination page={bookingsQuery.data?.page ?? 0} totalPages={bookingsQuery.data?.totalPages ?? 0} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
