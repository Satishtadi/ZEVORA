import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Compass, MapPinned, Route, ShieldCheck } from 'lucide-react';
import { Badge, Card, CardContent, PageHeader } from '@/components/ui';
import { ComparisonForm } from '@/components/travel/ComparisonForm';
import { usersApi, type ComparisonQuery } from '@/services/api-services';
import { compareQueryToSearch } from '@/lib/compare-params';
import { findLocation } from '@/lib/hyderabad';
import { defaultDeparture } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

const popularRoutes = [
  { origin: 'Kukatpally Metro Station', dest: 'HITEC City (Cyber Towers)', label: 'Kukatpally → HITEC City' },
  { origin: 'Miyapur Metro Station', dest: 'Financial District (Wave Rock)', label: 'Miyapur → Financial District' },
  { origin: 'Gachibowli (DLF Cyber City)', dest: 'Ameerpet Metro Station', label: 'Gachibowli → Ameerpet' },
  { origin: 'Secunderabad Railway Station', dest: 'Madhapur (Raheja Mindspace)', label: 'Secunderabad → Madhapur' },
];

export function SearchPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: usersApi.me });
  const home = me?.profile.homeAddress ?? '';
  const work = me?.profile.workAddress ?? '';

  const run = (query: ComparisonQuery) => {
    navigate(`/app/compare${compareQueryToSearch(query)}`);
  };

  const presetRoute = (originName: string, destName: string) => {
    const origin = findLocation(originName);
    const dest = findLocation(destName);
    if (!origin || !dest) return;
    const departure = defaultDeparture();
    run({
      originAddress: origin.name,
      originLat: origin.lat,
      originLng: origin.lng,
      destAddress: dest.name,
      destLat: dest.lat,
      destLng: dest.lng,
      departureTime: new Date(departure).toISOString(),
      seats: 1,
      womenOnly: me?.profile.womenOnly ?? false,
      preference: 'BALANCED',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Where are you going${user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}?`}
        description="Compare carpools, shared cabs, metro feeders and shuttles — then book a verified seat."
        actions={<Badge tone="brand"><ShieldCheck className="h-3 w-3" /> Verified drivers</Badge>}
      />

      <ComparisonForm
        onSubmit={run}
        showFilters={false}
        submitLabel="Search & compare"
        initial={{
          originAddress: home || undefined,
          destAddress: work || undefined,
          womenOnly: me?.profile.womenOnly,
        }}
      />

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardContent className="space-y-3 p-5">
            <p className="flex items-center gap-2 text-sm font-bold text-ink-900"><Compass className="h-4 w-4 text-brand-600" /> Popular Hyderabad routes</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {popularRoutes.map((route) => (
                <button
                  key={route.label}
                  onClick={() => presetRoute(route.origin, route.dest)}
                  className="flex items-center justify-between gap-2 rounded-xl border border-ink-100 bg-white px-3 py-2.5 text-left text-sm font-semibold text-ink-700 transition-colors hover:border-brand-200 hover:bg-brand-50/50"
                >
                  <span className="inline-flex items-center gap-2"><MapPinned className="h-4 w-4 text-brand-600" /> {route.label}</span>
                  <Route className="h-4 w-4 text-ink-300" />
                </button>
              ))}
            </div>
            <p className="text-xs text-ink-400">Locations come from the curated Hyderabad pilot list. Custom map pinning is not enabled in this build.</p>
          </CardContent>
        </Card>

        <Card className="bg-ink-950 text-white">
          <CardContent className="space-y-3 p-5">
            <p className="flex items-center gap-2 text-sm font-bold"><CalendarDays className="h-4 w-4 text-mint-400" /> How ZEVORA searches</p>
            <ul className="space-y-2 text-sm text-ink-300">
              <li>• Live carpool seats from verified drivers.</li>
              <li>• Estimated public transport, auto and cab options.</li>
              <li>• Value, duration, walking distance and reliability ranking.</li>
              <li>• Women-only filtering when enabled in your profile.</li>
            </ul>
            <p className="text-xs text-ink-400">
              Estimated options are clearly labelled. Booking is available for live carpool rides only.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
