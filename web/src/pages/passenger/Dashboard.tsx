import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  CarFront,
  Leaf,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Badge,
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
} from '@/components/ui';
import { BookingCard } from '@/components/travel/BookingCard';
import { bookingsApi, commuteApi, notificationsApi } from '@/services/api-services';
import { useAuth } from '@/lib/auth';
import { formatCurrency, formatRelative, formatSmartDateTime } from '@/lib/utils';

const quickActions = [
  { to: '/app/search', label: 'Compare & book', icon: Search, tone: 'bg-brand-50 text-brand-700' },
  { to: '/app/bookings', label: 'My bookings', icon: CalendarCheck, tone: 'bg-mint-50 text-mint-700' },
  { to: '/app/savings', label: 'Savings', icon: Wallet, tone: 'bg-amber-50 text-amber-700' },
  { to: '/app/recurring', label: 'Recurring', icon: TrendingUp, tone: 'bg-sky-50 text-sky-700' },
  { to: '/app/notifications', label: 'Notifications', icon: Bell, tone: 'bg-ink-100 text-ink-700' },
  { to: '/app/safety', label: 'Safety & SOS', icon: ShieldCheck, tone: 'bg-red-50 text-red-700' },
];

export function PassengerDashboard() {
  const { user } = useAuth();
  const savingsQuery = useQuery({ queryKey: ['commute', 'savings'], queryFn: commuteApi.monthlySavings });
  const bookingsQuery = useQuery({ queryKey: ['bookings', 'all'], queryFn: () => bookingsApi.mine(0, 200) });
  const notificationsQuery = useQuery({ queryKey: ['notifications'], queryFn: notificationsApi.list });

  const bookings = bookingsQuery.data?.items ?? [];
  const now = Date.now();
  const upcoming = bookings
    .filter((booking) => (booking.status === 'CONFIRMED' || booking.status === 'REQUESTED') && booking.ride && new Date(booking.ride.departureTime).getTime() >= now)
    .sort((a, b) => new Date(a.ride?.departureTime ?? a.createdAt).getTime() - new Date(b.ride?.departureTime ?? b.createdAt).getTime());
  const completed = bookings.filter((booking) => booking.status === 'COMPLETED').length;
  const upcomingSeats = upcoming.reduce((total, booking) => total + booking.seats, 0);
  const unread = (notificationsQuery.data ?? []).filter((item) => !item.read);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-ink-950 p-6 text-white shadow-lift sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-200">Passenger portal</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Good to see you, {user?.fullName?.split(' ')[0] ?? 'traveller'}.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-brand-100">
              Compare every way across Hyderabad, book a verified carpool seat and keep your commute
              budget in check.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/app/search"><Button variant="secondary" leftIcon={<Search className="h-4 w-4" />}>Plan a commute</Button></Link>
              <Link to="/app/bookings"><Button variant="ghost" className="text-white hover:bg-white/10">View bookings</Button></Link>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">Estimated savings</p>
            <p className="mt-1 text-3xl font-extrabold">{formatCurrency(savingsQuery.data?.savings ?? 0)}</p>
            <p className="mt-1 text-xs text-brand-100">Last {savingsQuery.data?.periodDays ?? 30} days · backend estimate</p>
          </div>
        </div>
      </div>

      <PageHeader
        title="Your commute overview"
        description="Live numbers from your bookings and savings records."
        actions={<Badge tone={unread.length ? 'brand' : 'neutral'}>{unread.length} unread</Badge>}
      />

      {savingsQuery.isError && <ErrorState title="Could not load savings" description="Savings estimates are temporarily unavailable." onRetry={() => savingsQuery.refetch()} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Estimated savings" value={formatCurrency(savingsQuery.data?.savings ?? 0)} hint={`vs solo travel · ${savingsQuery.data?.completedTrips ?? 0} completed trips`} icon={<Leaf className="h-5 w-5" />} tone="mint" />
        <StatCard label="Shared spend" value={formatCurrency(savingsQuery.data?.sharedSpend ?? 0)} hint={`Solo estimate ${formatCurrency(savingsQuery.data?.estimatedSoloSpend ?? 0)}`} icon={<Wallet className="h-5 w-5" />} tone="brand" />
        <StatCard label="Completed trips" value={completed} hint="Across all bookings" icon={<CalendarCheck className="h-5 w-5" />} tone="amber" />
        <StatCard label="Upcoming seats" value={upcomingSeats} hint={`${upcoming.length} upcoming booking${upcoming.length === 1 ? '' : 's'}`} icon={<CarFront className="h-5 w-5" />} tone="ink" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Next commute</CardTitle>
              <p className="text-sm text-ink-500">Your earliest confirmed booking.</p>
            </div>
            <Link to="/app/bookings" className="text-sm font-semibold text-brand-700 hover:underline">All bookings</Link>
          </CardHeader>
          <CardContent>
            {bookingsQuery.isLoading && <LoadingBlock label="Loading bookings…" className="min-h-24" />}
            {bookingsQuery.isError && <ErrorState title="Could not load bookings" description="Try refreshing the page." onRetry={() => bookingsQuery.refetch()} />}
            {!bookingsQuery.isLoading && !bookingsQuery.isError && upcoming.length === 0 && (
              <EmptyState
                title="No upcoming trips"
                description="Book a carpool seat and your next commute will appear here."
                action={<Link to="/app/search"><Button leftIcon={<Search className="h-4 w-4" />}>Find a ride</Button></Link>}
                className="border-0"
              />
            )}
            {upcoming[0] && <BookingCard booking={upcoming[0]} to={`/app/bookings/${upcoming[0].id}`} />}
            {upcoming.length > 1 && (
              <p className="mt-3 text-xs text-ink-400">
                Next after that: {formatSmartDateTime(upcoming[1].ride?.departureTime)} · {upcoming[1].ride?.originAddress} → {upcoming[1].ride?.destAddress}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent notifications</CardTitle>
              <p className="text-sm text-ink-500">Booking, payment and safety updates.</p>
            </div>
            <Link to="/app/notifications" className="text-sm font-semibold text-brand-700 hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {notificationsQuery.isLoading && <LoadingBlock label="Loading notifications…" className="min-h-24" />}
            {!notificationsQuery.isLoading && (notificationsQuery.data ?? []).length === 0 && (
              <p className="rounded-lg bg-ink-50 px-3 py-4 text-sm text-ink-500">No notifications yet.</p>
            )}
            <ul className="space-y-2">
              {(notificationsQuery.data ?? []).slice(0, 4).map((item) => (
                <li key={item.id} className="rounded-xl border border-ink-100 p-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink-800">
                    {!item.read && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />} {item.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-ink-500">{item.message}</p>
                  <p className="mt-1 text-[11px] text-ink-400">{formatRelative(item.createdAt)}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-500">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.tone}`}>
                <action.icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-ink-800">{action.label}</span>
              <ArrowRight className="ml-auto h-4 w-4 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
            </Link>
          ))}
        </div>
      </div>

      <Card className="border-brand-100 bg-gradient-to-r from-brand-50 to-mint-50">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-700 shadow-soft">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-ink-900">Drive and share your commute</p>
              <p className="text-sm text-ink-600">Publish cost-sharing seats on the route you already drive, or join a commercial fleet.</p>
            </div>
          </div>
          <Link to="/app/become-driver"><Button>Become a driver</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}
