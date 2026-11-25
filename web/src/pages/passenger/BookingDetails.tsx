import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarClock,
  CarFront,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  MapPin,
  Share2,
  ShieldAlert,
  Star,
  Users,
  XCircle,
} from 'lucide-react';
import {
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
  Textarea,
  useToast,
} from '@/components/ui';
import { bookingsApi, reviewsApi, safetyApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { cn, formatCurrency, formatSmartDateTime } from '@/lib/utils';
import type { AlternativeOption, CancelResponse } from '@/types';

export function BookingDetailsPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const justBooked = Boolean((location.state as { justBooked?: boolean } | null)?.justBooked);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [alternatives, setAlternatives] = useState<AlternativeOption[]>([]);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const bookingQuery = useQuery({ queryKey: ['booking', id], queryFn: () => bookingsApi.get(id), enabled: Boolean(id) });
  const historyQuery = useQuery({ queryKey: ['booking', id, 'history'], queryFn: () => bookingsApi.history(id), enabled: Boolean(id) });
  const reviewQuery = useQuery({
    queryKey: ['review', id],
    queryFn: async () => {
      try {
        return await reviewsApi.forBooking(id);
      } catch {
        return null;
      }
    },
    enabled: Boolean(id),
    retry: false,
  });

  const cancel = useMutation({
    mutationFn: () => bookingsApi.cancel(id, cancelReason || undefined),
    onSuccess: async (response: CancelResponse) => {
      setAlternatives(response.alternatives ?? []);
      setCancelOpen(false);
      toast.success('Booking cancelled', 'The cancellation was recorded by the backend.');
      await queryClient.invalidateQueries({ queryKey: ['booking', id] });
      await queryClient.invalidateQueries({ queryKey: ['booking', id, 'history'] });
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error) => toast.error('Could not cancel booking', getApiErrorMessage(error)),
  });

  const share = useMutation({
    mutationFn: () => safetyApi.share(id),
    onSuccess: async (response) => {
      const url = response.publicPath.startsWith('http') ? response.publicPath : `${window.location.origin}${response.publicPath}`;
      setShareUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Tracking link copied', 'Anyone with this link can follow the trip basics.');
      } catch {
        toast.info('Tracking link ready', 'Copy the link shown below to share it.');
      }
    },
    onError: (error) => toast.error('Could not create tracking link', getApiErrorMessage(error)),
  });

  const review = useMutation({
    mutationFn: () => reviewsApi.create(id, rating, comment || undefined),
    onSuccess: async () => {
      setReviewOpen(false);
      toast.success('Thanks for your review');
      await queryClient.invalidateQueries({ queryKey: ['review', id] });
    },
    onError: (error) => toast.error('Could not submit review', getApiErrorMessage(error)),
  });

  if (bookingQuery.isLoading) return <LoadingBlock label="Loading bookingâ€¦" />;
  if (bookingQuery.isError) {
    return <ErrorState title="Could not load booking" description={getApiErrorMessage(bookingQuery.error)} onRetry={() => bookingQuery.refetch()} />;
  }
  const booking = bookingQuery.data;
  if (!booking) return null;

  const canCancel = booking.status === 'CONFIRMED' || booking.status === 'REQUESTED';
  const canShare = booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED';
  const canReview = booking.status === 'COMPLETED' && !reviewQuery.data;

  return (
    <div className="space-y-6">
      <Link to="/app/bookings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-4 w-4" /> Back to bookings
      </Link>

      {justBooked && (
        <div className="flex items-start gap-2 rounded-xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm text-mint-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Your seat is confirmed. The booking below shows the backend-recorded payment status. Share the trip or review cancellation terms below.</p>
        </div>
      )}

      <PageHeader
        title={booking.ride ? `${booking.ride.originAddress} â†’ ${booking.ride.destAddress}` : 'Booking details'}
        description={booking.ride ? `${formatSmartDateTime(booking.ride.departureTime)} Â· ${booking.seats} seat${booking.seats > 1 ? 's' : ''} Â· Booking ${booking.id.slice(0, 8)}` : booking.id}
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={booking.status} />
            <StatusBadge status={booking.paymentStatus} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <Card>
            <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
              <Detail label="Driver" value={booking.ride?.driverName} icon={<CarFront className="h-4 w-4" />} />
              <Detail label="Vehicle" value={booking.ride?.vehiclePlate} icon={<CarFront className="h-4 w-4" />} />
              <Detail label="Passenger" value={booking.passengerName} icon={<Users className="h-4 w-4" />} />
              <Detail label="Booked" value={formatSmartDateTime(booking.createdAt)} icon={<CalendarClock className="h-4 w-4" />} />
              <Detail label="Pickup" value={booking.ride?.originAddress} icon={<MapPin className="h-4 w-4" />} />
              <Detail label="Drop-off" value={booking.ride?.destAddress} icon={<MapPin className="h-4 w-4" />} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment record</CardTitle>
              <StatusBadge status={booking.paymentStatus} />
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex justify-between text-ink-600"><span>Fare</span><span>{formatCurrency(booking.fareAmount, true)}</span></p>
              <p className="flex justify-between text-ink-600"><span>Platform fee</span><span>{formatCurrency(booking.platformFee, true)}</span></p>
              <p className="flex justify-between border-t border-ink-100 pt-2 text-base font-extrabold text-ink-950"><span>Total</span><span>{formatCurrency(booking.totalAmount, true)}</span></p>
              <p className="flex items-center gap-1.5 pt-1 text-xs text-ink-400"><CreditCard className="h-3.5 w-3.5" /> Payment status is recorded by the backend. This build uses a mock payment provider.</p>
            </CardContent>
          </Card>

          {booking.status === 'CANCELLED' && (
            <Card className="border-red-100 bg-red-50/40">
              <CardContent className="space-y-1 p-5 text-sm">
                <p className="flex items-center gap-2 font-bold text-red-800"><XCircle className="h-4 w-4" /> Booking cancelled</p>
                {booking.cancellationReason && <p className="text-red-700">Reason: {booking.cancellationReason}</p>}
                {booking.cancelledAt && <p className="text-xs text-red-600">Cancelled {formatSmartDateTime(booking.cancelledAt)}</p>}
                <p className="text-xs text-red-600">
                  {booking.paymentStatus === 'REFUNDED' ? 'A refund was recorded by the backend.' : `Payment status: ${booking.paymentStatus}. Refunds follow the fare policy recorded by ZEVORA.`}
                </p>
              </CardContent>
            </Card>
          )}

          {alternatives.length > 0 && (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Alternative rides</CardTitle>
                  <p className="text-sm text-ink-500">Suggested by the backend after your cancellation.</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {alternatives.map((alternative) => (
                  <div key={alternative.rideId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 p-3">
                    <div>
                      <p className="text-sm font-semibold text-ink-800">{alternative.driverName}</p>
                      <p className="text-xs text-ink-500">{formatSmartDateTime(alternative.departureTime)} Â· {formatCurrency(alternative.pricePerSeat)} Â· {alternative.availableSeats} seats</p>
                    </div>
                    <Link to={`/app/rides/${alternative.rideId}`}><Button size="sm" variant="outline">View ride</Button></Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Booking timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {historyQuery.isLoading && <LoadingBlock label="Loading timelineâ€¦" className="min-h-20" />}
              {historyQuery.isError && <p className="text-sm text-red-600">{getApiErrorMessage(historyQuery.error)}</p>}
              {!historyQuery.isLoading && !historyQuery.isError && (historyQuery.data ?? []).length === 0 && (
                <p className="text-sm text-ink-500">No history entries recorded yet.</p>
              )}
              {(historyQuery.data ?? []).length > 0 && (
                <ol className="space-y-3">
                  {[...(historyQuery.data ?? [])].reverse().map((entry, index) => (
                    <li key={`${entry.at}-${index}`} className="flex gap-3">
                      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"><CheckCircle2 className="h-3.5 w-3.5" /></span>
                      <div>
                        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink-800"><StatusBadge status={entry.status} /> <span className="text-xs font-normal text-ink-400">{formatSmartDateTime(entry.at)}</span></p>
                        <p className="text-sm text-ink-600">{entry.note}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canShare && (
                <Button
                  fullWidth
                  variant="outline"
                  onClick={() => share.mutate()}
                  loading={share.isPending}
                  leftIcon={<Share2 className="h-4 w-4" />}
                >
                  Share live trip
                </Button>
              )}
              {shareUrl && (
                <div className="rounded-lg bg-ink-50 p-3 text-xs">
                  <p className="font-semibold text-ink-700">Public tracking link</p>
                  <a href={shareUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 break-all text-brand-700 hover:underline">
                    {shareUrl} <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>
              )}
              {booking.ride && (
                <Link to={`/app/rides/${booking.ride.id}`}>
                  <Button fullWidth variant="outline">View ride details</Button>
                </Link>
              )}
              <Link to="/app/safety">
                <Button fullWidth variant="outline" leftIcon={<ShieldAlert className="h-4 w-4" />}>Safety & SOS</Button>
              </Link>
              {canReview && (
                <Button fullWidth onClick={() => setReviewOpen(true)} leftIcon={<Star className="h-4 w-4" />}>Rate this trip</Button>
              )}
              {canCancel && (
                <Button fullWidth variant="danger" onClick={() => setCancelOpen(true)}>Cancel booking</Button>
              )}
              {!canCancel && !canReview && (
                <p className="pt-1 text-center text-xs text-ink-400">
                  {booking.status === 'COMPLETED' ? 'Trip completed. Thanks for travelling with ZEVORA.' : 'No actions available for this booking.'}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-ink-200 bg-ink-50/60">
            <CardContent className="space-y-2 p-5 text-sm text-ink-600">
              <p className="font-bold text-ink-900">Cancellation policy</p>
              <p>Cancellations are recorded by the backend with a reason. Refunds depend on the recorded payment status and ZEVORA fare rules.</p>
              <p className="text-xs text-ink-400">Driver-initiated changes affect all passengers on the ride and appear in your notifications.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => (cancel.isPending ? undefined : setCancelOpen(false))}
        title="Cancel this booking?"
        description="This is recorded against your account and may affect refund eligibility."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelOpen(false)} disabled={cancel.isPending}>Keep booking</Button>
            <Button variant="danger" onClick={() => cancel.mutate()} loading={cancel.isPending}>Cancel booking</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Reason (optional)"
            placeholder="e.g. Change of plans"
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
          />
          <p className="text-xs text-ink-500">After cancellation the backend returns alternative rides when available.</p>
        </div>
      </Modal>

      <Modal
        open={reviewOpen}
        onClose={() => (review.isPending ? undefined : setReviewOpen(false))}
        title="Rate your trip"
        description="Reviews help keep the ZEVORA community trustworthy."
        footer={
          <>
            <Button variant="ghost" onClick={() => setReviewOpen(false)} disabled={review.isPending}>Cancel</Button>
            <Button onClick={() => review.mutate()} loading={review.isPending}>Submit review</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-ink-800">Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  aria-label={`${value} star${value > 1 ? 's' : ''}`}
                  className="rounded p-1"
                >
                  <Star className={cn('h-7 w-7', value <= rating ? 'fill-amber-500 text-amber-500' : 'text-ink-300')} />
                </button>
              ))}
            </div>
          </div>
          <Textarea
            label="Comment (optional)"
            placeholder="How was the ride, driver and co-passengers?"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}

function Detail({ label, value, icon }: { label: string; value?: string | null; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-brand-600">{icon}</span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">{label}</p>
        <p className="text-sm font-semibold text-ink-800">{value ?? 'â€”'}</p>
      </div>
    </div>
  );
}


