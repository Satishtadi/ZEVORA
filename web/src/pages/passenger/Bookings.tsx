import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, Plus, Search } from 'lucide-react';
import { Button, EmptyState, ErrorState, LoadingBlock, PageHeader, Pagination } from '@/components/ui';
import { BookingCard } from '@/components/travel/BookingCard';
import { bookingsApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

type Filter = 'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

const filters: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'All bookings' },
  { key: 'UPCOMING', label: 'Upcoming' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const pageSize = 10;

export function BookingsPage() {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['bookings', 'all'],
    queryFn: () => bookingsApi.mine(0, 200),
  });

  const bookings = useMemo(
    () => [...(data?.items ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [data],
  );

  const filtered = useMemo(() => {
    if (filter === 'UPCOMING') return bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'REQUESTED');
    if (filter === 'COMPLETED') return bookings.filter((b) => b.status === 'COMPLETED');
    if (filter === 'CANCELLED') return bookings.filter((b) => b.status === 'CANCELLED');
    return bookings;
  }, [bookings, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const visible = filtered.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  const changeFilter = (next: Filter) => {
    setFilter(next);
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your bookings"
        description="Track confirmed seats, completed trips, cancellations and payments."
        actions={<Link to="/app/search"><Button leftIcon={<Plus className="h-4 w-4" />}>Book a ride</Button></Link>}
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => {
          const count =
            item.key === 'ALL'
              ? bookings.length
              : bookings.filter((b) =>
                  item.key === 'UPCOMING'
                    ? b.status === 'CONFIRMED' || b.status === 'REQUESTED'
                    : b.status === item.key,
                ).length;
          return (
            <button
              key={item.key}
              onClick={() => changeFilter(item.key)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
                filter === item.key ? 'bg-ink-950 text-white' : 'bg-white text-ink-600 ring-1 ring-inset ring-ink-200 hover:bg-ink-50',
              )}
            >
              {item.label} <span className={filter === item.key ? 'text-ink-300' : 'text-ink-400'}>({count})</span>
            </button>
          );
        })}
      </div>

      {isLoading && <LoadingBlock label="Loading bookings…" />}
      {isError && <ErrorState title="Could not load bookings" description={getApiErrorMessage(error)} onRetry={() => refetch()} />}

      {!isLoading && !isError && visible.length === 0 && (
        <EmptyState
          icon={filter === 'ALL' ? <CalendarCheck className="h-6 w-6" /> : <Search className="h-6 w-6" />}
          title={filter === 'ALL' ? 'No bookings yet' : `No ${filter.toLowerCase()} bookings`}
          description="Find a carpool that matches your commute and your confirmed seats will appear here."
          action={<Link to="/app/search"><Button>Search rides</Button></Link>}
        />
      )}

      {visible.length > 0 && (
        <div className="space-y-3">
          {visible.map((booking) => (
            <BookingCard key={booking.id} booking={booking} to={`/app/bookings/${booking.id}`} />
          ))}
        </div>
      )}

      {filtered.length > pageSize && (
        <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
      )}

      {bookings.length >= 200 && (
        <p className="text-center text-xs text-ink-400">Showing the latest 200 bookings.</p>
      )}
    </div>
  );
}
