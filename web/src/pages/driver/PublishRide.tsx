import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, CarFront, Info, MapPin, PlusCircle } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  EmptyState,
  ErrorState,
  Input,
  LoadingBlock,
  PageHeader,
  Select,
  Textarea,
  useToast,
} from '@/components/ui';
import { driversApi, ridesApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { findLocation, hyderabadLocations } from '@/lib/hyderabad';
import { defaultDeparture, formatDateTime } from '@/lib/utils';

export function PublishRidePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [vehicleId, setVehicleId] = useState('');
  const [originName, setOriginName] = useState(hyderabadLocations[0].name);
  const [destName, setDestName] = useState(hyderabadLocations[2].name);
  const [departure, setDeparture] = useState(defaultDeparture());
  const [seats, setSeats] = useState('3');
  const [price, setPrice] = useState('80');
  const [womenOnly, setWomenOnly] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const driverQuery = useQuery({ queryKey: ['driver', 'profile'], queryFn: driversApi.profile, retry: false });
  const vehiclesQuery = useQuery({ queryKey: ['driver', 'vehicles'], queryFn: driversApi.vehicles });

  const vehicles = vehiclesQuery.data ?? [];
  const selectedVehicleId = vehicleId || vehicles[0]?.id || '';
  const approved = driverQuery.data?.status === 'APPROVED';

  const create = useMutation({
    mutationFn: () => {
      const origin = findLocation(originName)!;
      const dest = findLocation(destName)!;
      return ridesApi.create({
        vehicleId: selectedVehicleId,
        originAddress: origin.name,
        originLat: origin.lat,
        originLng: origin.lng,
        destAddress: dest.name,
        destLat: dest.lat,
        destLng: dest.lng,
        departureTime: new Date(departure).toISOString(),
        totalSeats: Number(seats),
        pricePerSeat: Number(price),
        womenOnly,
        recurring,
        notes: notes || undefined,
      });
    },
    onSuccess: async (ride) => {
      toast.success('Ride published', 'Passengers can now find and book seats.');
      await queryClient.invalidateQueries({ queryKey: ['rides'] });
      await queryClient.invalidateQueries({ queryKey: ['driver', 'ride-bookings'] });
      navigate(`/driver/rides/${ride.id}`);
    },
    onError: (err) => toast.error('Could not publish ride', getApiErrorMessage(err)),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!selectedVehicleId) {
      setError('Add a vehicle before publishing a ride.');
      return;
    }
    if (originName === destName) {
      setError('Pickup and destination must be different.');
      return;
    }
    const departureDate = new Date(departure);
    if (Number.isNaN(departureDate.getTime()) || departureDate.getTime() <= Date.now()) {
      setError('Choose a future departure date and time.');
      return;
    }
    const seatCount = Number(seats);
    const priceValue = Number(price);
    if (!Number.isFinite(seatCount) || seatCount < 1 || seatCount > 12) {
      setError('Seat capacity must be between 1 and 12.');
      return;
    }
    if (!Number.isFinite(priceValue) || priceValue < 0 || priceValue > 10000) {
      setError('Price per seat must be between ₹0 and ₹10,000.');
      return;
    }
    create.mutate();
  };

  if (driverQuery.isLoading) return <LoadingBlock label="Checking driver verification…" />;
  if (driverQuery.isError) {
    return (
      <EmptyState
        title="Driver profile required"
        description="Create a driver profile before publishing rides."
        action={<Link to="/app/become-driver"><Button>Become a driver</Button></Link>}
      />
    );
  }
  if (vehiclesQuery.isLoading) return <LoadingBlock label="Loading vehicles…" />;
  if (vehiclesQuery.isError) return <ErrorState title="Could not load vehicles" description={getApiErrorMessage(vehiclesQuery.error)} onRetry={() => vehiclesQuery.refetch()} />;

  if (vehicles.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Publish a ride" description="Add a vehicle first so the ride can be tied to a registered car." />
        <EmptyState
          icon={<CarFront className="h-6 w-6" />}
          title="No vehicle on your profile"
          description="Rides must reference one of your vehicles. Add a vehicle, then publish your route."
          action={<Link to="/driver/vehicles"><Button leftIcon={<PlusCircle className="h-4 w-4" />}>Add a vehicle</Button></Link>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Publish a ride"
        description="Share seats on a route you are already driving. Your ride goes live immediately after publishing."
        actions={<Badge tone={approved ? 'success' : 'warning'}>{approved ? 'Approved driver' : 'Verification pending'}</Badge>}
      />

      {!approved && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>The backend blocks ride creation until your driver profile is APPROVED. You can prepare the form, but publishing will fail until admin verifies you.</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ride details</CardTitle>
            <p className="text-sm text-ink-500">Times are local to Hyderabad. Departure must be in the future.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4" noValidate>
              <Select label="Vehicle" value={selectedVehicleId} onChange={(event) => setVehicleId(event.target.value)}>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {`${vehicle.make ?? ''} ${vehicle.model ?? ''}`.trim() || 'Vehicle'} · {vehicle.plateNumber} · {vehicle.seatCapacity} seats{vehicle.verified ? ' · verified' : ' · unverified'}
                  </option>
                ))}
              </Select>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Pickup" value={originName} onChange={(event) => setOriginName(event.target.value)}>
                  {hyderabadLocations.map((location) => <option key={location.name} value={location.name}>{location.name}</option>)}
                </Select>
                <Select label="Destination" value={destName} onChange={(event) => setDestName(event.target.value)}>
                  {hyderabadLocations.map((location) => <option key={location.name} value={location.name}>{location.name}</option>)}
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Input label="Departure" type="datetime-local" value={departure} onChange={(event) => setDeparture(event.target.value)} required />
                <Input label="Seats for passengers" type="number" min={1} max={12} value={seats} onChange={(event) => setSeats(event.target.value)} hint="Excludes the driver." />
                <Input label="Price per seat (₹)" type="number" min={0} max={10000} value={price} onChange={(event) => setPrice(event.target.value)} />
              </div>
              <div className="space-y-3 rounded-xl border border-ink-100 bg-ink-50/50 p-3">
                <Checkbox label="Women-only ride" description="Only show this ride to women-only searches." checked={womenOnly} onChange={(event) => setWomenOnly(event.target.checked)} />
                <Checkbox label="Recurring ride" description="Mark this as a repeat weekday commute. Add the recurrence from ride details after publishing." checked={recurring} onChange={(event) => setRecurring(event.target.checked)} />
              </div>
              <Textarea label="Notes for passengers (optional)" placeholder="Pickup landmark, luggage space, music preference…" maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} />
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <p className="inline-flex items-center gap-1.5 text-xs text-ink-400"><MapPin className="h-3.5 w-3.5" /> {originName} → {destName}</p>
                <Button type="submit" size="lg" loading={create.isPending} disabled={!approved} rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Publish ride
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-ink-950 text-white">
            <CardContent className="space-y-3 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-200">Live summary</p>
              <p className="text-lg font-extrabold">{originName} → {destName}</p>
              <p className="text-sm text-ink-300">{departure ? formatDateTime(new Date(departure).toISOString()) : 'Choose a departure'}</p>
              <div className="space-y-2 border-t border-white/10 pt-3 text-sm">
                <p className="flex justify-between"><span className="text-ink-300">Passenger seats</span><span className="font-semibold">{seats || 0}</span></p>
                <p className="flex justify-between"><span className="text-ink-300">Price per seat</span><span className="font-semibold">₹{price || 0}</span></p>
                <p className="flex justify-between"><span className="text-ink-300">Potential full-ride value</span><span className="font-semibold">₹{(Number(seats) || 0) * (Number(price) || 0)}</span></p>
                <p className="flex justify-between"><span className="text-ink-300">Women only</span><span className="font-semibold">{womenOnly ? 'Yes' : 'No'}</span></p>
                <p className="flex justify-between"><span className="text-ink-300">Recurring</span><span className="font-semibold">{recurring ? 'Yes' : 'No'}</span></p>
              </div>
              <p className="text-xs text-ink-400">Potential value is shown for planning only. Actual earnings depend on seats booked; platform fees are recorded by the backend.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 p-5 text-sm text-ink-600">
              <p className="flex items-center gap-2 font-bold text-ink-900"><Info className="h-4 w-4 text-brand-600" /> Good to know</p>
              <p>Private carpool rides are cost sharing and must not be used as an unlicensed taxi service.</p>
              <p>Rides are published immediately by the backend after creation — there is no separate draft step.</p>
              <p className="text-xs text-ink-400">Passengers book instantly; you can cancel the ride, which cancels all active bookings.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
