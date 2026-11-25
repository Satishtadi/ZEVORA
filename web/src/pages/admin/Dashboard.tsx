import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CarFront,
  FileBarChart,
  Gauge,
  ScrollText,
  Ticket,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  LoadingBlock,
  PageHeader,
  StatCard,
} from '@/components/ui';
import { adminApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { formatCurrency, formatDate, formatSmartDateTime } from '@/lib/utils';

export function AdminDashboard() {
  const dashboardQuery = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: adminApi.dashboard });
  const logsQuery = useQuery({ queryKey: ['admin', 'audit', 0], queryFn: () => adminApi.auditLogs(0, 6) });

  if (dashboardQuery.isLoading) return <LoadingBlock label="Loading platform overview…" />;
  if (dashboardQuery.isError) {
    return <ErrorState title="Could not load admin dashboard" description={getApiErrorMessage(dashboardQuery.error)} onRetry={() => dashboardQuery.refetch()} />;
  }
  const data = dashboardQuery.data!;
  const trend = data.bookingTrend.map((point) => ({ ...point, label: formatDate(point.date) }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform overview"
        description="Operational health across users, drivers, bookings, revenue and safety."
        actions={<Badge tone={data.openSafetyIncidents ? 'danger' : 'success'}>{data.openSafetyIncidents} open safety incidents</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={data.totalUsers} hint={`${data.totalDrivers} drivers · ${data.activeDrivers} active`} icon={<Users className="h-5 w-5" />} tone="brand" />
        <StatCard label="Active bookings" value={data.activeBookings} hint={`${data.completedRides} rides completed`} icon={<Ticket className="h-5 w-5" />} tone="mint" />
        <StatCard label="Revenue (30 days)" value={formatCurrency(data.revenueLast30Days)} hint="Recorded by backend" icon={<Wallet className="h-5 w-5" />} tone="amber" />
        <StatCard label="Pending verifications" value={data.pendingDriverVerifications} hint="Drivers awaiting review" icon={<BadgeCheck className="h-5 w-5" />} tone="ink" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Booking trend</CardTitle>
              <p className="text-sm text-ink-500">Bookings per day from the backend dashboard.</p>
            </div>
            <Badge tone="neutral">{data.cancelledRides} rides cancelled</Badge>
          </CardHeader>
          <CardContent>
            {trend.length === 0 ? (
              <p className="rounded-lg bg-ink-50 px-3 py-6 text-center text-sm text-ink-500">No booking trend data yet.</p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="bookingFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6d5ef8" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#6d5ef8" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 6" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }} />
                    <Area type="monotone" dataKey="count" name="Bookings" stroke="#6d5ef8" strokeWidth={2.5} fill="url(#bookingFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Operations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { to: '/admin/drivers', label: 'Review drivers', icon: BadgeCheck, count: data.pendingDriverVerifications },
                { to: '/admin/safety', label: 'Safety incidents', icon: AlertTriangle, count: data.openSafetyIncidents },
                { to: '/admin/bookings', label: 'All bookings', icon: Ticket },
                { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
                { to: '/admin/audit-logs', label: 'Audit logs', icon: ScrollText },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-2 rounded-xl border border-ink-100 px-3 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-200 hover:bg-brand-50/50"
                >
                  <item.icon className="h-4 w-4 text-brand-600" /> {item.label}
                  {typeof item.count === 'number' && item.count > 0 && <Badge tone="danger">{item.count}</Badge>}
                  <ArrowRight className="ml-auto h-4 w-4 text-ink-300" />
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-ink-950 text-white">
            <CardContent className="space-y-2 p-5">
              <p className="flex items-center gap-2 text-sm font-bold"><Gauge className="h-4 w-4 text-mint-400" /> Platform pulse</p>
              <p className="flex justify-between text-sm"><span className="text-ink-300">Completed rides</span><span className="font-semibold">{data.completedRides}</span></p>
              <p className="flex justify-between text-sm"><span className="text-ink-300">Cancelled rides</span><span className="font-semibold">{data.cancelledRides}</span></p>
              <p className="flex justify-between text-sm"><span className="text-ink-300">Active drivers</span><span className="font-semibold">{data.activeDrivers}</span></p>
              <Link to="/admin/reports"><Button variant="secondary" size="sm" fullWidth className="mt-2" leftIcon={<TrendingUp className="h-4 w-4" />}>Open reports</Button></Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent audit activity</CardTitle>
            <p className="text-sm text-ink-500">Latest administrative actions recorded by the backend.</p>
          </div>
          <Link to="/admin/audit-logs" className="text-sm font-semibold text-brand-700 hover:underline">All logs</Link>
        </CardHeader>
        <CardContent>
          {logsQuery.isLoading && <LoadingBlock label="Loading audit logs…" className="min-h-20" />}
          {!logsQuery.isLoading && (logsQuery.data?.items ?? []).length === 0 && <p className="text-sm text-ink-500">No audit entries yet.</p>}
          <ul className="divide-y divide-ink-100">
            {(logsQuery.data?.items ?? []).map((log) => (
              <li key={log.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <CarFront className="h-4 w-4 text-ink-400" />
                  <span className="font-semibold text-ink-800">{log.action}</span>
                  <span className="text-xs text-ink-500">{log.entityType ?? '—'} {log.entityId ? `· ${log.entityId.slice(0, 8)}` : ''}</span>
                </div>
                <span className="text-xs text-ink-400">{formatSmartDateTime(log.createdAt)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
