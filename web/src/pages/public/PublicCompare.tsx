import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Info, Route, Sparkles, Users } from 'lucide-react';
import { Button, Card, EmptyState, ErrorState, LoadingBlock, Badge, PageHeader } from '@/components/ui';
import { ComparisonForm } from '@/components/travel/ComparisonForm';
import { TravelOptionCard } from '@/components/travel/TravelOptionCard';
import { commuteApi, type ComparisonQuery } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { formatDistanceKm, formatRelative } from '@/lib/utils';

export function PublicComparePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState<ComparisonQuery | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['public-compare', query],
    queryFn: () => commuteApi.options(query as ComparisonQuery),
    enabled: Boolean(query),
    retry: 1,
  });

  useEffect(() => {
    if (query) {
      window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  }, [query]);

  const options = data?.options ?? [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>
      <PageHeader
        className="mt-4"
        title="Compare every way across Hyderabad"
        description="Private carpools, shared cabs, metro feeders, company shuttles and public transport â€” ranked by value, time and reliability. Sign in to book a carpool seat."
        actions={<Badge tone="brand"><Sparkles className="h-3 w-3" /> No account needed to compare</Badge>}
      />

      <div className="mt-8">
        <ComparisonForm onSubmit={setQuery} loading={isLoading || isFetching} submitLabel="Compare options" />
      </div>

      <div ref={resultsRef} className="mt-10">
        {!query && (
          <Card className="border-dashed">
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <Route className="h-7 w-7" />
              </span>
              <h2 className="text-lg font-bold text-ink-900">Choose your route to see live options</h2>
              <p className="max-w-md text-sm text-ink-500">
                Pick a pickup and destination above. ZEVORA compares prices, duration, walking
                distance, reliability and seat availability in one view.
              </p>
            </div>
          </Card>
        )}

        {query && isLoading && <LoadingBlock label="Comparing travel optionsâ€¦" />}

        {query && isError && (
          <ErrorState
            title="Could not load travel options"
            description={getApiErrorMessage(error)}
            onRetry={() => refetch()}
          />
        )}

        {query && data && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-ink-950">
                  {data.originAddress} â†’ {data.destAddress}
                </h2>
                <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-500">
                  <span>{formatDistanceKm(data.distanceKm)}</span>
                  <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {data.seats} seat{data.seats > 1 ? 's' : ''}</span>
                  <span>Updated {formatRelative(data.generatedAt)}</span>
                </p>
              </div>
              <Badge tone="neutral">{options.length} options</Badge>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-sky-50 px-4 py-3 text-xs text-sky-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{data.disclaimer}</p>
            </div>

            {options.length === 0 ? (
              <EmptyState
                title="No travel options found"
                description="Try a different departure time, relax the fare filter or choose nearby locations."
              />
            ) : (
              <div className="grid gap-4">
                {options.map((option) => (
                  <TravelOptionCard
                    key={option.key}
                    option={option}
                    ctaLabel={option.rideId ? 'Sign in to book' : undefined}
                    onSelect={
                      option.rideId
                        ? () => navigate('/login', { state: { from: `/app/rides/${option.rideId}` } })
                        : undefined
                    }
                  />
                ))}
              </div>
            )}

            <Card className="bg-ink-950 text-white">
              <div className="flex flex-wrap items-center justify-between gap-4 p-6">
                <div>
                  <h3 className="text-lg font-bold">Ready to travel together?</h3>
                  <p className="mt-1 text-sm text-ink-300">
                    Create a free account to book a verified carpool seat and track your savings.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to="/register"><Button variant="secondary">Create account</Button></Link>
                  <Link to="/login"><Button>Sign in</Button></Link>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

