import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Percent, ReceiptText, RefreshCcw, Ticket, Users, Wallet } from 'lucide-react';
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
import { formatCurrency } from '@/lib/utils';

export function AdminReportsPage() {
  const reportsQuery = useQuery({ queryKey: ['admin', 'reports'], queryFn: adminApi.reports });
  const dashboardQuery = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: adminApi.dashboard });

  if (reportsQuery.isLoading) return <LoadingBlock label="Building reports…" />;
  if (reportsQuery.isError) {
    return <ErrorState title="Could not load reports" description={getApiErrorMessage(reportsQuery.error)} onRetry={() => reportsQuery.refetch()} />;
  }
  const report = reportsQuery.data!;
  const activeBookings = dashboardQuery.data?.activeBookings ?? 0;
  const pendingDrivers = dashboardQuery.data?.pendingDriverVerifications ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Aggregated platform metrics computed by the backend reports endpoint."
        actions={<Button variant="outline" onClick={() => window.print()}>Print / save as PDF</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total rides" value={report.totalRides} hint={`${report.totalBookings} bookings`} icon={<Ticket className="h-5 w-5" />} tone="brand" />
        <StatCard label="Revenue collected" value={formatCurrency(report.revenueCollected)} hint="Recorded across bookings" icon={<Wallet className="h-5 w-5" />} tone="mint" />
        <StatCard label="Cancellation rate" value={`${report.cancellationRatePercent.toFixed(1)}%`} hint={`${report.cancelledBookings} cancelled bookings`} icon={<Percent className="h-5 w-5" />} tone="amber" />
        <StatCard label="Active subscriptions" value={report.activeSubscriptions} hint="ZEVORA Plus members" icon={<Users className="h-5 w-5" />} tone="ink" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bookings</CardTitle>
            <Badge tone="neutral">{report.totalBookings} total</Badge>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ReportRow label="Completed bookings" value={report.completedBookings} />
            <ReportRow label="Cancelled bookings" value={report.cancelledBookings} />
            <ReportRow label="Active bookings" value={activeBookings} />
            <div>
              <div className="flex items-center justify-between text-xs text-ink-500">
                <span>Cancellation rate</span>
                <span className="font-semibold">{report.cancellationRatePercent.toFixed(1)}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-red-500"
                  style={{ width: `${Math.min(100, Math.max(0, report.cancellationRatePercent))}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Refunds & settlements</CardTitle>
            <RefreshCcw className="h-4 w-4 text-ink-400" />
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ReportRow label="Refund count" value={report.refundCount} />
            <ReportRow label="Refunded amount" value={formatCurrency(report.refundedAmount)} />
            <ReportRow label="Revenue collected" value={formatCurrency(report.revenueCollected)} />
            <p className="rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-500">
              Refunds are recorded by the backend mock payment provider. No live gateway settlement data exists in this build.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Safety & verification</CardTitle>
            <AlertTriangle className="h-4 w-4 text-ink-400" />
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ReportRow label="Safety incidents" value={report.safetyIncidents} />
            <ReportRow label="Pending driver verifications" value={pendingDrivers} />
            <p className="rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-500">
              Use the driver verification and safety pages to action these items.
            </p>
            <div className="flex gap-2">
              <Link to="/admin/drivers"><Button size="sm" variant="outline">Drivers</Button></Link>
              <Link to="/admin/safety"><Button size="sm" variant="outline">Safety</Button></Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operational summary</CardTitle>
            <ReceiptText className="h-4 w-4 text-ink-400" />
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ReportRow label="Total users" value={dashboardQuery.data?.totalUsers ?? '—'} />
            <ReportRow label="Total drivers" value={dashboardQuery.data?.totalDrivers ?? '—'} />
            <ReportRow label="Active drivers" value={dashboardQuery.data?.activeDrivers ?? '—'} />
            <ReportRow label="Completed rides" value={dashboardQuery.data?.completedRides ?? '—'} />
            <ReportRow label="Revenue (30 days)" value={formatCurrency(dashboardQuery.data?.revenueLast30Days ?? 0)} />
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-ink-400">
        Reports are computed by the backend from stored records. Figures refresh when you reload this page.
      </p>
    </div>
  );
}

function ReportRow({ label, value }: { label: string; value: string | number }) {
  return (
    <p className="flex items-center justify-between border-b border-ink-100 pb-2 last:border-0 last:pb-0">
      <span className="text-ink-500">{label}</span>
      <span className="font-semibold text-ink-800">{value}</span>
    </p>
  );
}
