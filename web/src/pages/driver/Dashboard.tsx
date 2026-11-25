import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CarFront,
  ClipboardList,
  PlusCircle,
  Star,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Checkbox,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  StatCard,
  StatusBadge,
  useToast,
} from '@/components/ui';
import { bookingsApi, driversApi, ridesApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatCurrency, formatSmartDateTime } from '@/lib/utils';

export function DriverDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const driverQuery = useQuery({ queryKey: ['driver', 'profile'], queryFn: driversApi.profile, retry: false });
  const ridesQuery = useQuery({ queryKey: ['rides', 'mine'], queryFn: ridesApi.mine });
  const bookingsQuery = useQuery({
    queryKey: ['driver', 'ride-bookings'],
    queryFn: async () => {
      const rides = await ridesApi.mine();
      const lists = await Promise.all(rides.slice(0, 50).map((ride) => bookingsApi.forRide(ride.id).catch(() => [])));
      return lists.flat();
    },
  });

  const availability = useMutation({
    mutationFn: (available: boolean) => driversApi.setAvailability(available),
    onSuccess: async () => {
      toast.success('Availability updated');
      await queryClient.invalidateQueries({ queryKey: ['driver', 'profile'] });
    },
    onError: (error) => toast.error('Could not update availability', getApiErrorMessage(error)),
  });

  if (driverQuery.isLoading) return <LoadingBlock label="Loading driver profileâ€¦" />;
  if (driverQuery.isError) {
    return (
      <EmptyState
        title="Driver profile not found"
        description="Create a driver profile to publish cost-sharing rides."
        action={<Link to="/app/become-driver"><Button>Become a driver</Button></Link>}
      />
    );
  }

  const driver = driverQuery.data!;
  const rides = ridesQuery.data ?? [];
  const bookings = bookingsQuery.data ?? [];
  const activeRides = rides.filter((ride) => ride.status === 'PUBLISHED' || ride.status === 'FULL' || ride.status === 'IN_PROGRESS');
  const upcoming = [...activeRides].sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()).slice(0, 3);
  const confirmedBookings = bookings.filter((booking) => booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS');
  const passengerSeats = confirmedBookings.reduce((total, booking) => total + booking.seats, 0);
  const sharedValue = bookings
    .filter((booking) => booking.status === 'COMPLETED')
    .reduce((total, booking) => total + booking.fareAmount, 0);
  const needsVerification = driver.status !== 'APPROVED' || !driver.licenseVerified || !driver.identityVerified;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Driver dashboard${user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}`}
        description="Publish cost-sharing rides, track passengers and manage verification."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={driver.status} />
            <Link to="/driver/rides/new"><Button leftIcon={<PlusCircle className="h-4 w-4" />}>Publish ride</Button></Link>
          </div>
        }
      />

      {needsVerification && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-start gap-3 p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-bold text-amber-900">Verification is not complete</p>
              <p className="mt-1 text-sm text-amber-800">
                {driver.status !== 'APPROVED'
                  ? 'Your driver profile must be approved by ZEVORA admin before you can publish rides.'
                  : 'Your licence or identity is not yet verified. Publishing may be blocked until admin completes verification.'}
              </p>
              <p className="mt-1 text-xs text-amber-700">Document uploads are not available in this build; support verifies profiles manually.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Driver rating" value={driver.rating.toFixed(1)} hint={`${driver.totalRides} completed rides`} icon={<Star className="h-5 w-5" />} tone="amber" />
        <StatCard label="Active rides" value={activeRides.length} hint={`${rides.length} rides in total`} icon={<CarFront className="h-5 w-5" />} tone="brand" />
        <StatCard label="Confirmed passengers" value={passengerSeats} hint={`${confirmedBookings.length} active bookings`} icon={<Users className="h-5 w-5" />} tone="mint" />
        <StatCard label="Cost-shared value" value={formatCurrency(sharedValue)} hint="From completed bookings" icon={<Wallet className="h-5 w-5" />} tone="ink" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Upcoming rides</CardTitle>
              <p className="text-sm text-ink-500">Published and in-progress trips.</p>
            </div>
            <Link to="/driver/rides" className="text-sm font-semibold text-brand-700 hover:underline">Manage rides</Link>
          </CardHeader>
          <CardContent>
            {ridesQuery.isLoading && <LoadingBlock label="Loading ridesâ€¦" className="min-h-24" />}
            {ridesQuery.isError && <ErrorState title="Could not load rides" description={getApiErrorMessage(ridesQuery.error)} onRetry={() => ridesQuery.refetch()} />}
            {!ridesQuery.isLoading && !ridesQuery.isError && upcoming.length === 0 && (
              <EmptyState
                title="No active rides"
                description="Publish a ride on your usual route and start sharing seats."
                action={<Link to="/driver/rides/new"><Button leftIcon={<PlusCircle className="h-4 w-4" />}>Publish a ride</Button></Link>}
                className="border-0"
              />
            )}
            <div className="space-y-2">
              {upcoming.map((ride) => (
                <Link
                  key={ride.id}
                  to={`/driver/rides/${ride.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 p-3 transition-colors hover:bg-ink-50"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink-800">{ride.originAddress} â†’ {ride.destAddress}</p>
                    <p className="text-xs text-ink-500">{formatSmartDateTime(ride.departureTime)} Â· {ride.availableSeats}/{ride.totalSeats} seats Â· {formatCurrency(ride.pricePerSeat)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={ride.status} />
                    <ArrowRight className="h-4 w-4 text-ink-300" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Checkbox
                label="Available for matching"
                description="Let passengers find you in matching results."
                checked={driver.available}
                onChange={(event) => availability.mutate(event.target.checked)}
              />
              <p className="rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-500">
                Availability is stored on your driver profile. Verification is separate and controlled by admin.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {[
                { to: '/driver/rides/new', label: 'Publish a new ride', icon: PlusCircle },
                { to: '/driver/requests', label: 'View passenger requests', icon: ClipboardList },
                { to: '/driver/vehicles', label: `Vehicles (${driver.vehicles.length})`, icon: Truck },
                { to: '/driver/earnings', label: 'Cost-sharing earnings', icon: Wallet },
              ].map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex items-center gap-2 rounded-xl border border-ink-100 px-3 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-200 hover:bg-brand-50/50"
                >
                  <action.icon className="h-4 w-4 text-brand-600" /> {action.label}
                  <ArrowRight className="ml-auto h-4 w-4 text-ink-300" />
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border-ink-100 bg-ink-50/60">
            <CardContent className="space-y-1 p-5 text-sm text-ink-600">
              <p className="flex items-center gap-2 font-bold text-ink-900"><BadgeCheck className="h-4 w-4 text-mint-600" /> Trust checklist</p>
              <p>â€¢ Approved driver profile</p>
              <p>â€¢ Verified licence and identity</p>
              <p>â€¢ At least one verified vehicle</p>
              <p className="text-xs text-ink-400">Badges on ride cards come from real verification fields returned by the backend.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent passenger bookings</CardTitle>
            <p className="text-sm text-ink-500">Seats are confirmed automatically by the backend.</p>
          </div>
          <Link to="/driver/requests" className="text-sm font-semibold text-brand-700 hover:underline">All requests</Link>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="rounded-lg bg-ink-50 px-3 py-4 text-sm text-ink-500">No passenger bookings on your rides yet.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {bookings.slice(0, 5).map((booking) => (
                <li key={booking.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <span className="font-semibold text-ink-800">{booking.passengerName}</span>
                  <span className="text-xs text-ink-500">{booking.seats} seat{booking.seats > 1 ? 's' : ''} Â· {formatCurrency(booking.totalAmount, true)}</span>
                  <div className="flex gap-2"><StatusBadge status={booking.status} /><StatusBadge status={booking.paymentStatus} /></div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

