import { useState } from 'react';
import { ArrowRight, CalendarClock, MapPin, SlidersHorizontal, Users } from 'lucide-react';
import { Button, Card, CardContent, Checkbox, Input, Select } from '@/components/ui';
import { defaultDeparture } from '@/lib/utils';
import { findLocation, hyderabadLocations, preferenceOptions, providerLabels, sortOptions } from '@/lib/hyderabad';
import type { ComparisonQuery } from '@/services/api-services';

export function ComparisonForm({
  onSubmit,
  loading,
  showFilters = true,
  submitLabel = 'Compare travel options',
  initial,
}: {
  onSubmit: (query: ComparisonQuery) => void;
  loading?: boolean;
  showFilters?: boolean;
  submitLabel?: string;
  initial?: Partial<ComparisonQuery>;
}) {
  const [originName, setOriginName] = useState(initial?.originAddress ?? hyderabadLocations[0].name);
  const [destName, setDestName] = useState(initial?.destAddress ?? hyderabadLocations[2].name);
  const [departure, setDeparture] = useState(() =>
    initial?.departureTime ? initial.departureTime.slice(0, 16) : defaultDeparture(),
  );
  const [seats, setSeats] = useState(String(initial?.seats ?? 1));
  const [womenOnly, setWomenOnly] = useState(initial?.womenOnly ?? false);
  const [preference, setPreference] = useState(initial?.preference ?? 'BALANCED');
  const [sortBy, setSortBy] = useState(initial?.sortBy ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [maxFare, setMaxFare] = useState(initial?.maxFare != null ? String(initial.maxFare) : '');
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const origin = findLocation(originName);
    const dest = findLocation(destName);
    if (!origin || !dest) {
      setError('Choose a valid pickup and destination.');
      return;
    }
    if (origin.name === dest.name) {
      setError('Pickup and destination must be different.');
      return;
    }
    const parsed = new Date(departure);
    if (Number.isNaN(parsed.getTime())) {
      setError('Choose a valid departure date and time.');
      return;
    }
    onSubmit({
      originAddress: origin.name,
      originLat: origin.lat,
      originLng: origin.lng,
      destAddress: dest.name,
      destLat: dest.lat,
      destLng: dest.lng,
      departureTime: parsed.toISOString(),
      seats: Math.max(1, Math.min(4, Number(seats) || 1)),
      womenOnly,
      preference,
      sortBy: sortBy || undefined,
      category: category || undefined,
      maxFare: maxFare ? Number(maxFare) : undefined,
    });
  };

  return (
    <Card className="overflow-visible">
      <CardContent className="p-5 sm:p-6">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Pickup"
              value={originName}
              onChange={(event) => setOriginName(event.target.value)}
              required
            >
              {hyderabadLocations.map((location) => (
                <option key={location.name} value={location.name}>{location.name}</option>
              ))}
            </Select>
            <Select
              label="Destination"
              value={destName}
              onChange={(event) => setDestName(event.target.value)}
              required
            >
              {hyderabadLocations.map((location) => (
                <option key={location.name} value={location.name}>{location.name}</option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Departure"
              type="datetime-local"
              value={departure}
              onChange={(event) => setDeparture(event.target.value)}
              leftIcon={<CalendarClock className="h-4 w-4" />}
              required
            />
            <Select label="Seats" value={seats} onChange={(event) => setSeats(event.target.value)}>
              {[1, 2, 3, 4].map((value) => (
                <option key={value} value={value}>{value} seat{value > 1 ? 's' : ''}</option>
              ))}
            </Select>
            <Select label="Preference" value={preference} onChange={(event) => setPreference(event.target.value)}>
              {preferenceOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </div>

          <Checkbox
            label="Women-only commute"
            description="Only show women-only carpool rides and apply women-only filtering."
            checked={womenOnly}
            onChange={(event) => setWomenOnly(event.target.checked)}
          />

          {showFilters && (
            <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-3">
              <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-500">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Result filters
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Select label="Sort by" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
                <Select label="Mode" value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option value="">All modes</option>
                  {Object.entries(providerLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
                <Input
                  label="Max fare per seat (₹)"
                  type="number"
                  min={0}
                  placeholder="Any"
                  value={maxFare}
                  onChange={(event) => setMaxFare(event.target.value)}
                />
              </div>
            </div>
          )}

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="inline-flex items-center gap-1.5 text-xs text-ink-400">
              <MapPin className="h-3.5 w-3.5" /> Hyderabad pilot locations · <Users className="h-3.5 w-3.5" /> seats up to 4
            </p>
            <Button type="submit" size="lg" loading={loading} rightIcon={<ArrowRight className="h-4 w-4" />}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
