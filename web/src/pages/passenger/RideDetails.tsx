import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CarFront,
  ExternalLink,
  Info,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  ErrorState,
  LoadingBlock,
  Modal,
  StatusBadge,
  useToast,
} from '@/components/ui';
import { ridesApi, bookingsApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { formatCurrency, formatSmartDateTime, titleCase } from '@/lib/utils';

export function RideDetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [seats, setSeats] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: ride, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['ride', id],
    queryFn: () => ridesApi.get(id),
    enabled: Boolean(id),
  });

  const book = useMutation({
    mutationFn: () => bookingsApi.create(id, seats, crypto.randomUUID()),
    onSuccess: async (booking) => {
      setConfirmOpen(false);
      toast.success('Seat confirmed', `${booking.seats} seat${booking.seats > 1 ? 's' : ''} booked · ${formatCurrency(booking.totalAmount, true)}`);
      await queryClient.invalidateQueries({ queryKey: ['ride', id] });
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      navigate(`/app/bookings/${booking.id}`, { state: { justBooked: true } });
    },
    onError: (err) => toast.error('Could not complete booking', getApiErrorMessage(err)),
  });

  if (isLoading) return <LoadingBlock label="Loading ride…" />;
  if (isError) return <ErrorState title="Could not load this ride" description={getApiErrorMessage(error)} onRetry={() => refetch()} />;
  if (!ride) return null;

  const maxSeats = Math.max(1, Math.min(4, ride.availableSeats));
  const bookable = ride.status === 'PUBLISHED' && ride.availableSeats > 0;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${ride.originLat},${ride.originLng}&destination=${ride.destLat},${ride.destLng}`;

  return (
    <div className="space-y-6">
      <Link to="/app/search" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-4 w-4" /> Back to results
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-extrabold tracking-tight text-ink-950">
                      {ride.originAddress} → {ride.destAddress}
                    </h1>
                    <StatusBadge status={ride.status} />
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-ink-500">
                    <span className="inline-flex items-center gap-1"><CalendarClock className="h-4 w-4" /> {formatSmartDateTime(ride.departureTime)}</span>
                    <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" /> {ride.availableSeats} of {ride.totalSeats} seats left</span>
                    {ride.recurring && <Badge tone="info">Recurring</Badge>}
                    {ride.womenOnly && <Badge tone="brand">Women only</Badge>}
                  </p>
                </div>
                <a href={mapsUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>Open route</Button>
                </a>
              </div>

              <div className="rounded-2xl border border-ink-100 bg-ink-50/50 p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-mint-100 text-mint-700"><MapPin className="h-4 w-4" /></span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Pickup</p>
                    <p className="text-sm font-semibold text-ink-800">{ride.originAddress}</p>
                  </div>
                </div>
                <div className="my-2 ml-4 h-6 border-l-2 border-dashed border-ink-200" />
                <div className="flex items-start gap-3">
                  <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700"><MapPin className="h-4 w-4" /></span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Drop-off</p>
                    <p className="text-sm font-semibold text-ink-800">{ride.destAddress}</p>
                  </div>
                </div>
              </div>

              {ride.notes && (
                <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <p><span className="font-semibold">Driver note:</span> {ride.notes}</p>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <InfoTile label="Vehicle" value={`${ride.vehicleModel}`} hint={ride.vehiclePlate} icon={<CarFront className="h-4 w-4" />} />
                <InfoTile label="Driver type" value={titleCase(ride.driverType)} hint={ride.driverType === 'PRIVATE_CARPOOL' ? 'Cost sharing' : 'Commercial ride'} icon={<ShieldCheck className="h-4 w-4" />} />
                <InfoTile label="Price per seat" value={formatCurrency(ride.pricePerSeat)} hint="Platform fee added at booking" icon={<Star className="h-4 w-4" />} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-3">
                <Avatar name={ride.driverName} size="lg" />
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-ink-900">
                    {ride.driverName}
                    {ride.driverVerified && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-mint-700"><BadgeCheck className="h-3.5 w-3.5" /> Verified</span>}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink-500">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {ride.driverRating.toFixed(1)} rating · {titleCase(ride.driverType)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-ink-500">
                <Badge tone={ride.driverVerified ? 'success' : 'warning'}>{ride.driverVerified ? 'Identity verified' : 'Verification pending'}</Badge>
                <Badge tone="neutral">{ride.availableSeats > 0 ? 'Accepting passengers' : 'Full'}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-brand-100 bg-brand-50/40">
            <CardContent className="space-y-2 p-5 text-sm text-ink-600">
              <p className="flex items-center gap-2 font-bold text-ink-900"><ShieldCheck className="h-4 w-4 text-brand-700" /> Safety on every trip</p>
              <p>Bookings are recorded against a verified driver, and the backend exposes SOS, incident reporting and public trip tracking.</p>
              <p>Share your trip from the booking details page after confirming your seat.</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="lg:sticky lg:top-24">
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Your fare</p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight text-ink-950">{formatCurrency(ride.pricePerSeat)}</p>
                <p className="text-xs text-ink-500">per seat · {ride.driverType === 'PRIVATE_CARPOOL' ? 'cost sharing' : 'commercial fare'}</p>
              </div>

              <div className="rounded-xl border border-ink-100 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Seats</p>
                <div className="mt-2 flex items-center justify-between">
                  <Button variant="outline" size="icon" onClick={() => setSeats((value) => Math.max(1, value - 1))} disabled={seats <= 1} aria-label="Remove seat">
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-bold text-ink-900">{seats}</span>
                  <Button variant="outline" size="icon" onClick={() => setSeats((value) => Math.min(maxSeats, value + 1))} disabled={seats >= maxSeats} aria-label="Add seat">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-xs text-ink-400">Up to {maxSeats} seat{maxSeats > 1 ? 's' : ''} available for one booking.</p>
              </div>

              <div className="space-y-1.5 text-sm">
                <p className="flex justify-between text-ink-600"><span>{seats} × {formatCurrency(ride.pricePerSeat)}</span><span className="font-semibold">{formatCurrency(ride.pricePerSeat * seats)}</span></p>
                <p className="flex justify-between text-xs text-ink-400"><span>Platform fee</span><span>Calculated at booking</span></p>
                <p className="flex justify-between border-t border-ink-100 pt-2 text-base font-extrabold text-ink-950"><span>Estimated total</span><span>{formatCurrency(ride.pricePerSeat * seats)} + fee</span></p>
              </div>

              <Button fullWidth size="lg" onClick={() => setConfirmOpen(true)} disabled={!bookable}>
                {bookable ? `Book ${seats} seat${seats > 1 ? 's' : ''}` : 'Not bookable'}
              </Button>
              <p className="text-center text-xs text-ink-400">
                Payment is processed by the backend (mock provider in this build). Cancellation terms are shown in booking details.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => (book.isPending ? undefined : setConfirmOpen(false))}
        title="Confirm your carpool seat"
        description="The backend confirms seats immediately and records the payment status."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={book.isPending}>Back</Button>
            <Button onClick={() => book.mutate()} loading={book.isPending}>Confirm booking</Button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <div className="rounded-xl bg-ink-50 p-4">
            <p className="font-semibold text-ink-900">{ride.originAddress} → {ride.destAddress}</p>
            <p className="mt-1 text-ink-500">{formatSmartDateTime(ride.departureTime)} · {seats} seat{seats > 1 ? 's' : ''}</p>
            <p className="mt-1 text-ink-500">{ride.driverName} · {ride.vehicleModel} · {ride.vehiclePlate}</p>
            <p className="mt-2 font-bold text-ink-900">{formatCurrency(ride.pricePerSeat * seats)} + platform fee</p>
          </div>
          <p className="text-xs text-ink-500">
            You are booking a shared ride. Be ready at the pickup point on time and respect the
            driver's vehicle rules. Your emergency contact stays private.
          </p>
        </div>
      </Modal>
    </div>
  );
}

function InfoTile({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-ink-100 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-400">{icon} {label}</p>
      <p className="mt-1 text-sm font-semibold text-ink-800">{value || 'Not specified'}</p>
      {hint && <p className="text-xs text-ink-400">{hint}</p>}
    </div>
  );
}
