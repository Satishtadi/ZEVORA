import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BusFront, CalendarClock, ListOrdered, Route as RouteIcon, Truck, Users } from 'lucide-react';
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
import { EntitySwitcher } from '@/components/shared/EntitySwitcher';
import { operatorApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { useSelectedOperator } from '@/lib/entity-selection';
import { formatCurrency } from '@/lib/utils';

export function OperatorDashboardPage() {
  const { operatorsQuery, operators, operator, operatorId, selectOperator } = useSelectedOperator();
  const summaryQuery = useQuery({
    queryKey: ['operator', 'summary', operatorId],
    queryFn: () => operatorApi.summary(operatorId),
    enabled: Boolean(operatorId),
  });
  const fleetQuery = useQuery({
    queryKey: ['operator', 'fleet', operatorId],
    queryFn: () => operatorApi.fleet(operatorId),
    enabled: Boolean(operatorId),
  });

  if (operatorsQuery.isLoading) return <LoadingBlock label="Loading operator…" />;
  if (operatorsQuery.isError) {
    return <ErrorState title="Could not load operator" description={getApiErrorMessage(operatorsQuery.error)} onRetry={() => operatorsQuery.refetch()} />;
  }
  if (!operator) {
    return (
      <EmptyState
        icon={<BusFront className="h-6 w-6" />}
        title="No transport operator linked"
        description="Ask a platform administrator to attach your operator admin account to a transport operator."
      />
    );
  }

  const summary = summaryQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={operator.name}
        description={`Transport operations${operator.contactEmail ? ` · ${operator.contactEmail}` : ''}`}
        actions={
          <div className="flex flex-wrap items-end gap-3">
            <EntitySwitcher label="Operator" items={operators.map((item) => ({ id: item.id, label: item.name }))} value={operatorId} onChange={selectOperator} />
            <Link to="/operator/routes"><Button>Manage routes</Button></Link>
          </div>
        }
      />

      {summaryQuery.isLoading && <LoadingBlock label="Loading operator summary…" />}
      {summaryQuery.isError && <ErrorState title="Could not load operator summary" description={getApiErrorMessage(summaryQuery.error)} onRetry={() => summaryQuery.refetch()} />}

      {summary && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Routes" value={summary.routes} hint={`${summary.schedules} schedules`} icon={<RouteIcon className="h-5 w-5" />} tone="brand" />
            <StatCard label="Daily seat capacity" value={summary.dailySeatCapacity} hint="Across active schedules" icon={<CalendarClock className="h-5 w-5" />} tone="mint" />
            <StatCard label="Vehicles" value={summary.vehicles} hint="Registered fleet" icon={<Truck className="h-5 w-5" />} tone="amber" />
            <StatCard label="Est. monthly revenue" value={formatCurrency(summary.estimatedMonthlyRevenue)} hint={`${summary.drivers} drivers`} icon={<ListOrdered className="h-5 w-5" />} tone="ink" />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Fleet snapshot</CardTitle>
                <Badge tone="neutral">{fleetQuery.data ? `${fleetQuery.data.vehicles.length} vehicles · ${fleetQuery.data.drivers.length} drivers` : 'Loading'}</Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {fleetQuery.isLoading && <p className="text-ink-500">Loading fleet…</p>}
                {fleetQuery.data && fleetQuery.data.vehicles.length === 0 && fleetQuery.data.drivers.length === 0 && (
                  <p className="rounded-lg bg-ink-50 p-3 text-xs text-ink-500">No vehicles or drivers registered yet.</p>
                )}
                {fleetQuery.data && fleetQuery.data.vehicles.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">Vehicles</p>
                    <ul className="space-y-1.5">
                      {fleetQuery.data.vehicles.slice(0, 4).map((vehicle) => (
                        <li key={vehicle.id} className="flex justify-between rounded-lg bg-ink-50 px-3 py-2">
                          <span className="font-semibold text-ink-800">{vehicle.plateNumber}</span>
                          <span className="text-xs text-ink-500">{vehicle.model || '—'} · {vehicle.seatCapacity} seats</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {fleetQuery.data && fleetQuery.data.drivers.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">Drivers</p>
                    <ul className="space-y-1.5">
                      {fleetQuery.data.drivers.slice(0, 4).map((driver) => (
                        <li key={driver.id} className="flex justify-between rounded-lg bg-ink-50 px-3 py-2">
                          <span className="font-semibold text-ink-800">{driver.fullName}</span>
                          <span className="text-xs text-ink-500">{driver.phone || '—'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="rounded-lg bg-ink-50 p-3 text-xs text-ink-500">{summary.note}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operate</CardTitle>
                <BusFront className="h-4 w-4 text-ink-400" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/operator/routes" className="block"><Button variant="outline" fullWidth leftIcon={<RouteIcon className="h-4 w-4" />}>Routes</Button></Link>
                <Link to="/operator/schedules" className="block"><Button variant="outline" fullWidth leftIcon={<CalendarClock className="h-4 w-4" />}>Schedules</Button></Link>
                <Link to="/operator/fleet" className="block"><Button variant="outline" fullWidth leftIcon={<Truck className="h-4 w-4" />}>Fleet</Button></Link>
                <Link to="/operator/drivers" className="block"><Button variant="outline" fullWidth leftIcon={<Users className="h-4 w-4" />}>Drivers</Button></Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <p className="text-xs text-ink-400">
        This backend exposes routes, schedules, fleet, drivers and a summary endpoint. Trip
        allocation, live vehicle tracking and settlement processing are not available.
      </p>
    </div>
  );
}
