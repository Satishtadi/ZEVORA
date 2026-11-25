import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Info as InfoIcon, Repeat, Send, Users, XCircle } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  Input,
  LoadingBlock,
  Modal,
  PageHeader,
  StatusBadge,
  TBody,
  TD,
  TH,
  THead,
  TR,
  TableWrap,
  useToast,
} from '@/components/ui';
import { bookingsApi, ridesApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { cn, formatCurrency, formatDate, formatSmartDateTime } from '@/lib/utils';

const dayCodes = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export function DriverRideDetailsPage() {
  const { id = '' } = useParams();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [days, setDays] = useState<string[]>(['MON', 'TUE', 'WED', 'THU', 'FRI']);
  const [startDate, setStartDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');

  const rideQuery = useQuery({ queryKey: ['ride', id], queryFn: () => ridesApi.get(id), enabled: Boolean(id) });
  const bookingsQuery = useQuery({ queryKey: ['ride', id, 'bookings'], queryFn: () => bookingsApi.forRide(id), enabled: Boolean(id) });
  const recurrenceQuery = useQuery({
    queryKey: ['ride', id, 'recurrence'],
    queryFn: async () => {
      try {
        return await ridesApi.recurrence(id);
      } catch {
        return null;
      }
    },
    enabled: Boolean(id),
    retry: false,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['ride', id] });
    await queryClient.invalidateQueries({ queryKey: ['rides'] });
    await queryClient.invalidateQueries({ queryKey: ['ride', id, 'bookings'] });
    await queryClient.invalidateQueries({ queryKey: ['driver', 'ride-bookings'] });
  };

  const publish = useMutation({
    mutationFn: () => ridesApi.publish(id),
    onSuccess: async () => {
      toast.success('Ride published');
      await invalidate();
    },
    onError: (error) => toast.error('Could not publish ride', getApiErrorMessage(error)),
  });

  const complete = useMutation({
    mutationFn: () => ridesApi.complete(id),
    onSuccess: async () => {
      toast.success('Ride marked completed');
      await invalidate();
    },
    onError: (error) => toast.error('Could not complete ride', getApiErrorMessage(error)),
  });

  const cancel = useMutation({
    mutationFn: () => ridesApi.cancel(id, cancelReason || undefined),
    onSuccess: async () => {
      toast.success('Ride cancelled', 'Active bookings were cancelled by the backend.');
      setCancelOpen(false);
      setCancelReason('');
      await invalidate();
    },
    onError: (error) => toast.error('Could not cancel ride', getApiErrorMessage(error)),
  });

  const recurrence = useMutation({
    mutationFn: () => ridesApi.createRecurrence(id, days.join(','), startDate, endDate || undefined),
    onSuccess: async () => {
      toast.success('Recurrence saved');
      await queryClient.invalidateQueries({ queryKey: ['ride', id, 'recurrence'] });
    },
    onError: (error) => toast.error('Could not save recurrence', getApiErrorMessage(error)),
  });

  if (rideQuery.isLoading) return <LoadingBlock label="Loading rideâ€¦" />;
  if (rideQuery.isError) return <ErrorState title="Could not load ride" description={getApiErrorMessage(rideQuery.error)} onRetry={() => rideQuery.refetch()} />;
  const ride = rideQuery.data;
  if (!ride) return null;

  const bookings = bookingsQuery.data ?? [];
  const confirmedSeats = bookings.filter((booking) => booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS').reduce((total, booking) => total + booking.seats, 0);
  const canCancel = ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED';
  const canComplete = ride.status === 'PUBLISHED' || ride.status === 'FULL' || ride.status === 'IN_PROGRESS';

  return (
    <div className="space-y-6">
      <Link to="/driver/rides" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-4 w-4" /> Back to my rides
      </Link>

      <PageHeader
        title={`${ride.originAddress} â†’ ${ride.destAddress}`}
        description={`${formatSmartDateTime(ride.departureTime)} Â· ${ride.vehicleModel} Â· ${ride.vehiclePlate}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={ride.status} />
            {ride.recurring && <Badge tone="info">Recurring</Badge>}
            {ride.womenOnly && <Badge tone="brand">Women only</Badge>}
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <Card>
            <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
              <Info label="Seats" value={`${ride.availableSeats} of ${ride.totalSeats} available`} />
              <Info label="Confirmed seats" value={String(confirmedSeats)} />
              <Info label="Price per seat" value={formatCurrency(ride.pricePerSeat, true)} />
              <Info label="Created" value={formatDate(ride.createdAt)} />
              <Info label="Driver verified" value={ride.driverVerified ? 'Yes' : 'No'} />
              <Info label="Ride ID" value={ride.id.slice(0, 8)} />
            </CardContent>
          </Card>

          {ride.notes && (
            <Card>
              <CardContent className="p-5 text-sm text-ink-600">
                <p className="font-semibold text-ink-900">Notes</p>
                <p className="mt-1">{ride.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Passengers</CardTitle>
                <p className="text-sm text-ink-500">Seats are auto-confirmed by the backend; there is no accept/reject step.</p>
              </div>
              <Badge tone="neutral">{bookings.length} bookings</Badge>
            </CardHeader>
            <CardContent>
              {bookingsQuery.isLoading && <LoadingBlock label="Loading passengersâ€¦" className="min-h-20" />}
              {bookingsQuery.isError && <ErrorState title="Could not load passengers" description={getApiErrorMessage(bookingsQuery.error)} onRetry={() => bookingsQuery.refetch()} />}
              {!bookingsQuery.isLoading && !bookingsQuery.isError && bookings.length === 0 && (
                <p className="rounded-lg bg-ink-50 px-3 py-4 text-sm text-ink-500">No passengers have booked this ride yet.</p>
              )}
              {bookings.length > 0 && (
                <TableWrap>
                  <THead>
                    <TR>
                      <TH>Passenger</TH>
                      <TH>Seats</TH>
                      <TH>Total</TH>
                      <TH>Status</TH>
                      <TH>Payment</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {bookings.map((booking) => (
                      <TR key={booking.id}>
                        <TD className="font-semibold text-ink-800">{booking.passengerName}</TD>
                        <TD>{booking.seats}</TD>
                        <TD>{formatCurrency(booking.totalAmount, true)}</TD>
                        <TD><StatusBadge status={booking.status} /></TD>
                        <TD><StatusBadge status={booking.paymentStatus} /></TD>
                      </TR>
                    ))}
                  </TBody>
                </TableWrap>
              )}
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink-400">
                <Users className="h-3.5 w-3.5" /> Passenger contact details are not exposed on this driver screen.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recurring schedule</CardTitle>
                <p className="text-sm text-ink-500">Attach repeat weekdays to this ride.</p>
              </div>
              {recurrenceQuery.data && <Badge tone={recurrenceQuery.data.active ? 'success' : 'neutral'}>{recurrenceQuery.data.active ? 'Active' : 'Inactive'}</Badge>}
            </CardHeader>
            <CardContent className="space-y-3">
              {recurrenceQuery.data && (
                <div className="rounded-xl bg-ink-50 p-3 text-sm text-ink-700">
                  <p className="font-semibold">{recurrenceQuery.data.daysOfWeek}</p>
                  <p className="text-xs text-ink-500">From {formatDate(recurrenceQuery.data.startDate)}{recurrenceQuery.data.endDate ? ` to ${formatDate(recurrenceQuery.data.endDate)}` : ''}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {dayCodes.map((day) => {
                  const active = days.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setDays((current) => (active ? current.filter((value) => value !== day) : [...current, day]))}
                      className={cn(
                        'rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors',
                        active ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                <Input label="End date (optional)" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              </div>
              <Button
                onClick={() => recurrence.mutate()}
                loading={recurrence.isPending}
                disabled={days.length === 0 || !startDate}
                leftIcon={<Repeat className="h-4 w-4" />}
              >
                {recurrenceQuery.data ? 'Save recurrence' : 'Create recurrence'}
              </Button>
              <p className="text-xs text-ink-400">Day codes are validated by the backend. Use the ride's departure time for each recurring day.</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Ride actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ride.status === 'DRAFT' && (
                <Button fullWidth onClick={() => publish.mutate()} loading={publish.isPending} leftIcon={<Send className="h-4 w-4" />}>Publish ride</Button>
              )}
              {canComplete && (
                <Button fullWidth variant="secondary" onClick={() => complete.mutate()} loading={complete.isPending} leftIcon={<CheckCircle2 className="h-4 w-4" />}>Mark completed</Button>
              )}
              {canCancel && (
                <Button fullWidth variant="danger" onClick={() => setCancelOpen(true)} leftIcon={<XCircle className="h-4 w-4" />}>Cancel ride</Button>
              )}
              {!canCancel && !canComplete && !['DRAFT'].includes(ride.status) && (
                <p className="text-center text-xs text-ink-400">This ride is closed.</p>
              )}
              <Link to="/driver/rides/new"><Button fullWidth variant="outline">Publish another ride</Button></Link>
            </CardContent>
          </Card>

          <Card className="border-ink-100 bg-ink-50/60">
            <CardContent className="space-y-2 p-5 text-sm text-ink-600">
              <p className="flex items-center gap-2 font-bold text-ink-900"><InfoIcon className="h-4 w-4 text-brand-600" /> Passenger requests</p>
              <p>This backend confirms bookings automatically, so the passenger list is the authoritative request list. A manual accept/reject API is not available.</p>
              <p className="text-xs text-ink-400">If you cancel the ride, the backend cancels all active bookings and records the cancellation reason.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => (cancel.isPending ? undefined : setCancelOpen(false))}
        title="Cancel this ride?"
        description="All active bookings will be cancelled by the backend."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelOpen(false)} disabled={cancel.isPending}>Keep ride</Button>
            <Button variant="danger" onClick={() => cancel.mutate()} loading={cancel.isPending}>Cancel ride</Button>
          </>
        }
      >
        <Input label="Reason (optional)" placeholder="e.g. Vehicle breakdown" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} />
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">{label}</p>
      <p className="text-sm font-semibold text-ink-800">{value}</p>
    </div>
  );
}


