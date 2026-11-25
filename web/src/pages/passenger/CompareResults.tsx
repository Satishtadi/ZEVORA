import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Filter, Info, Search, SlidersHorizontal, Users } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  Select,
  Input,
} from '@/components/ui';
import { RideCard, RideCardSkeleton } from '@/components/travel/RideCard';
import { TravelOptionCard } from '@/components/travel/TravelOptionCard';
import { commuteApi, ridesApi } from '@/services/api-services';
import { compareQueryToSearch, searchToCompareQuery } from '@/lib/compare-params';
import { sortOptions, providerLabels } from '@/lib/hyderabad';
import { getApiErrorMessage } from '@/lib/api';
import { formatDistanceKm, formatSmartDateTime } from '@/lib/utils';

export function CompareResultsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<'carpools' | 'options'>('carpools');
  const query = useMemo(() => searchToCompareQuery(searchParams), [searchParams]);

  const optionsQuery = useQuery({
    queryKey: ['compare', query],
    queryFn: () => commuteApi.options(query!),
    enabled: Boolean(query),
    retry: 1,
  });
  const ridesQuery = useQuery({
    queryKey: ['rides', 'search', query],
    queryFn: () =>
      ridesApi.search({
        originLat: query!.originLat,
        originLng: query!.originLng,
        destLat: query!.destLat,
        destLng: query!.destLng,
        departureTime: query!.departureTime,
        seats: query!.seats,
        womenOnly: query!.womenOnly,
      }),
    enabled: Boolean(query),
    retry: 1,
  });

  const updateFilter = (key: string, value: string) => {
    if (!query) return;
    const next = { ...query, [key]: value === '' ? undefined : value };
    const params = new URLSearchParams(compareQueryToSearch(next).replace(/^\?/, ''));
    setSearchParams(params, { replace: true });
  };

  if (!query) {
    return (
      <div className="space-y-6">
        <PageHeader title="Search results" description="The search link is missing parameters." />
        <EmptyState
          title="Invalid search"
          description="Start a new comparison with a pickup, destination and departure time."
          action={<Link to="/app/search"><Button>New search</Button></Link>}
        />
      </div>
    );
  }

  const rides = [...(ridesQuery.data ?? [])].sort(
    (a, b) => new Date(a.ride.departureTime).getTime() - new Date(b.ride.departureTime).getTime(),
  );
  const options = [...(optionsQuery.data?.options ?? [])].sort(
    (a, b) => Number(b.recommended) - Number(a.recommended),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/app/search" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-800">
            <ArrowLeft className="h-4 w-4" /> Modify search
          </Link>
          <PageHeader
            className="mt-2"
            title={`${query.originAddress ?? 'Pickup'} → ${query.destAddress ?? 'Destination'}`}
            description={`${formatSmartDateTime(query.departureTime)} · ${query.seats} seat${query.seats > 1 ? 's' : ''}${query.womenOnly ? ' · women only' : ''}${optionsQuery.data ? ` · ${formatDistanceKm(optionsQuery.data.distanceKm)}` : ''}`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {query.womenOnly && <Badge tone="brand">Women only</Badge>}
          <Badge tone="neutral">{rides.length} carpools</Badge>
          <Badge tone="neutral">{options.length} total options</Badge>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 p-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-500">
            <Filter className="h-3.5 w-3.5" /> Refine
          </span>
          <Select
            aria-label="Sort by"
            value={query.sortBy ?? ''}
            onChange={(event) => updateFilter('sortBy', event.target.value)}
            wrapperClassName="w-44"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
          <Select
            aria-label="Mode"
            value={query.category ?? ''}
            onChange={(event) => updateFilter('category', event.target.value)}
            wrapperClassName="w-48"
          >
            <option value="">All modes</option>
            {Object.entries(providerLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <Input
            aria-label="Max fare"
            type="number"
            min={0}
            placeholder="Max fare ₹"
            value={query.maxFare ?? ''}
            onChange={(event) => updateFilter('maxFare', event.target.value)}
            wrapperClassName="w-36"
          />
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-ink-400">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters apply to all travel options
          </span>
        </div>
      </Card>

      <div className="flex gap-2">
        {([
          { key: 'carpools', label: 'Carpools you can book', count: rides.length },
          { key: 'options', label: 'All travel options', count: options.length },
        ] as const).map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === item.key ? 'bg-ink-950 text-white' : 'bg-white text-ink-600 ring-1 ring-inset ring-ink-200 hover:bg-ink-50'
            }`}
          >
            {item.label} <span className={tab === item.key ? 'text-ink-300' : 'text-ink-400'}>({item.count})</span>
          </button>
        ))}
      </div>

      {tab === 'carpools' && (
        <section className="space-y-4">
          {ridesQuery.isLoading && (
            <div className="grid gap-4">{[0, 1, 2].map((index) => <RideCardSkeleton key={index} />)}</div>
          )}
          {ridesQuery.isError && (
            <ErrorState
              title="Could not load carpool matches"
              description={getApiErrorMessage(ridesQuery.error)}
              onRetry={() => ridesQuery.refetch()}
            />
          )}
          {!ridesQuery.isLoading && !ridesQuery.isError && rides.length === 0 && (
            <EmptyState
              icon={<Search className="h-6 w-6" />}
              title="No carpool seats match this search"
              description="Try a different departure time, relax the women-only filter, or check all travel options below."
              action={<Button variant="outline" onClick={() => setTab('options')}>See all travel options</Button>}
            />
          )}
          {rides.map((result) => (
            <RideCard
              key={result.ride.id}
              ride={result.ride}
              searchResult={result}
              to={`/app/rides/${result.ride.id}`}
              onBook={() => navigate(`/app/rides/${result.ride.id}`)}
            />
          ))}
          {rides.length > 0 && (
            <p className="inline-flex items-center gap-1.5 text-xs text-ink-400">
              <Users className="h-3.5 w-3.5" /> Seats are confirmed immediately by the backend when you book.
            </p>
          )}
        </section>
      )}

      {tab === 'options' && (
        <section className="space-y-4">
          {optionsQuery.isLoading && <LoadingBlock label="Comparing travel options…" />}
          {optionsQuery.isError && (
            <ErrorState
              title="Could not load travel options"
              description={getApiErrorMessage(optionsQuery.error)}
              onRetry={() => optionsQuery.refetch()}
            />
          )}
          {optionsQuery.data && (
            <div className="flex items-start gap-2 rounded-xl bg-sky-50 px-4 py-3 text-xs text-sky-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{optionsQuery.data.disclaimer}</p>
            </div>
          )}
          {!optionsQuery.isLoading && !optionsQuery.isError && options.length === 0 && (
            <EmptyState title="No travel options found" description="Relax the filters or adjust your departure time." />
          )}
          {options.map((option) => (
            <TravelOptionCard
              key={option.key}
              option={option}
              ctaLabel={option.rideId ? 'Book carpool' : undefined}
              onSelect={option.rideId ? () => navigate(`/app/rides/${option.rideId}`) : undefined}
            />
          ))}
        </section>
      )}
    </div>
  );
}
