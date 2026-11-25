import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Plus } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  EmptyState,
  ErrorState,
  Input,
  LoadingBlock,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
  TBody,
  TD,
  TH,
  THead,
  TR,
  TableWrap,
  useToast,
} from '@/components/ui';
import { operatorApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { useSelectedOperator } from '@/lib/entity-selection';
import { defaultDeparture, formatCurrency, formatSmartDateTime } from '@/lib/utils';

const days = [
  { value: 'MON', label: 'Mon' },
  { value: 'TUE', label: 'Tue' },
  { value: 'WED', label: 'Wed' },
  { value: 'THU', label: 'Thu' },
  { value: 'FRI', label: 'Fri' },
  { value: 'SAT', label: 'Sat' },
  { value: 'SUN', label: 'Sun' },
];

interface ScheduleForm {
  departureTime: string;
  days: string[];
  seatCapacity: string;
  availableSeats: string;
  fare: string;
  active: boolean;
}

const makeEmptyForm = (): ScheduleForm => ({
  departureTime: defaultDeparture(),
  days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
  seatCapacity: '40',
  availableSeats: '40',
  fare: '',
  active: true,
});

export function OperatorSchedulesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { operatorsQuery, operator, operatorId } = useSelectedOperator();
  const [routeId, setRouteId] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ScheduleForm>(makeEmptyForm);

  const routesQuery = useQuery({
    queryKey: ['operator', 'routes', operatorId],
    queryFn: () => operatorApi.routes(operatorId),
    enabled: Boolean(operatorId),
  });

  useEffect(() => {
    const routes = routesQuery.data ?? [];
    if (routes.length > 0 && !routes.some((route) => route.id === routeId)) {
      setRouteId(routes[0].id);
    }
  }, [routesQuery.data, routeId]);

  const schedulesQuery = useQuery({
    queryKey: ['operator', 'schedules', routeId],
    queryFn: () => operatorApi.schedules(routeId),
    enabled: Boolean(routeId),
  });

  const addSchedule = useMutation({
    mutationFn: () => {
      const departure = new Date(form.departureTime);
      if (Number.isNaN(departure.getTime())) throw new Error('Choose a valid departure time');
      const capacity = Number(form.seatCapacity);
      const available = Number(form.availableSeats);
      if (!Number.isFinite(capacity) || capacity < 1) throw new Error('Seat capacity must be at least 1');
      if (!Number.isFinite(available) || available < 0 || available > capacity) throw new Error('Available seats must be between 0 and capacity');
      return operatorApi.addSchedule(routeId, {
        departureTime: departure.toISOString(),
        daysOfWeek: form.days.length ? form.days.join(',') : undefined,
        seatCapacity: capacity,
        availableSeats: available,
        fare: form.fare ? Number(form.fare) : undefined,
        active: form.active,
      });
    },
    onSuccess: async () => {
      toast.success('Schedule added');
      setOpen(false);
      setForm(makeEmptyForm());
      await queryClient.invalidateQueries({ queryKey: ['operator', 'schedules'] });
      await queryClient.invalidateQueries({ queryKey: ['operator', 'summary'] });
    },
    onError: (error) => toast.error('Could not add schedule', getApiErrorMessage(error)),
  });

  if (operatorsQuery.isLoading || routesQuery.isLoading) return <LoadingBlock label="Loading routes…" />;
  if (operatorsQuery.isError || routesQuery.isError) {
    return <ErrorState title="Could not load operator data" description={getApiErrorMessage(operatorsQuery.error ?? routesQuery.error)} onRetry={() => routesQuery.refetch()} />;
  }
  if (!operator) return <EmptyState icon={<CalendarClock className="h-6 w-6" />} title="No transport operator linked" description="Ask a platform administrator to attach your account to an operator." />;

  const routes = routesQuery.data ?? [];
  if (routes.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Schedules" description="Departure patterns attached to operator routes." />
        <EmptyState
          icon={<CalendarClock className="h-6 w-6" />}
          title="Create a route first"
          description="Schedules belong to a route. Add at least one route to start scheduling departures."
          action={<Link to="/operator/routes"><Button>Go to routes</Button></Link>}
        />
      </div>
    );
  }

  const selectedRoute = routes.find((route) => route.id === routeId);
  const schedules = schedulesQuery.data ?? [];
  const toggleDay = (day: string) => {
    setForm({ ...form, days: form.days.includes(day) ? form.days.filter((item) => item !== day) : [...form.days, day] });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedules"
        description="Departure patterns, capacity and fares for each route."
        actions={<Button onClick={() => setOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>Add schedule</Button>}
      />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <Select label="Route" value={routeId} onChange={(event) => setRouteId(event.target.value)} wrapperClassName="w-80">
            {routes.map((route) => <option key={route.id} value={route.id}>{route.name}</option>)}
          </Select>
          <Badge tone="neutral">{schedules.length} schedules</Badge>
        </CardContent>
      </Card>

      {schedulesQuery.isLoading && <LoadingBlock label="Loading schedules…" />}
      {schedulesQuery.isError && <ErrorState title="Could not load schedules" description={getApiErrorMessage(schedulesQuery.error)} onRetry={() => schedulesQuery.refetch()} />}

      {!schedulesQuery.isLoading && !schedulesQuery.isError && schedules.length === 0 && (
        <EmptyState icon={<CalendarClock className="h-6 w-6" />} title="No schedules for this route" description={`Add a departure pattern for ${selectedRoute?.name ?? 'this route'}.`} />
      )}

      {schedules.length > 0 && (
        <TableWrap>
          <THead>
            <TR>
              <TH>Departure</TH>
              <TH>Days</TH>
              <TH>Seats</TH>
              <TH>Fare</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {schedules.map((schedule) => (
              <TR key={schedule.id}>
                <TD className="text-sm font-semibold">{formatSmartDateTime(schedule.departureTime)}</TD>
                <TD className="text-xs text-ink-500">{schedule.daysOfWeek ? schedule.daysOfWeek.split(',').join(' · ') : 'One-off'}</TD>
                <TD>{schedule.availableSeats}/{schedule.seatCapacity}</TD>
                <TD>{schedule.fare != null ? formatCurrency(schedule.fare, true) : 'Route default'}</TD>
                <TD><StatusBadge status={schedule.active ? 'ACTIVE' : 'SUSPENDED'} /></TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}

      <p className="text-xs text-ink-400">Schedules are additive in this backend; editing and cancellation endpoints are not exposed.</p>

      <Modal
        open={open}
        onClose={() => (addSchedule.isPending ? undefined : setOpen(false))}
        title="Add schedule"
        description={selectedRoute ? `Route: ${selectedRoute.name}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={addSchedule.isPending}>Cancel</Button>
            <Button onClick={() => addSchedule.mutate()} loading={addSchedule.isPending}>Add schedule</Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="First departure" type="datetime-local" value={form.departureTime} onChange={(event) => setForm({ ...form, departureTime: event.target.value })} wrapperClassName="sm:col-span-2" />
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-semibold text-ink-800">Recurs on</p>
            <div className="flex flex-wrap gap-3">
              {days.map((day) => (
                <Checkbox key={day.value} label={day.label} checked={form.days.includes(day.value)} onChange={() => toggleDay(day.value)} />
              ))}
            </div>
          </div>
          <Input label="Seat capacity" type="number" min={1} max={80} value={form.seatCapacity} onChange={(event) => setForm({ ...form, seatCapacity: event.target.value })} />
          <Input label="Available seats" type="number" min={0} max={80} value={form.availableSeats} onChange={(event) => setForm({ ...form, availableSeats: event.target.value })} />
          <Input label="Fare (₹, optional)" type="number" min={0} step="0.01" value={form.fare} onChange={(event) => setForm({ ...form, fare: event.target.value })} hint="Leave blank to use the route fare." />
          <div className="flex items-end pb-2">
            <Checkbox label="Active schedule" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
