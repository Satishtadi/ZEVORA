import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bus, Plus } from 'lucide-react';
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
import { EntitySwitcher } from '@/components/shared/EntitySwitcher';
import { corporateApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { hyderabadLocations } from '@/lib/hyderabad';
import { useSelectedCompany } from '@/lib/entity-selection';
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

interface ShuttleForm {
  name: string;
  routeName: string;
  originAddress: string;
  destAddress: string;
  departureTime: string;
  days: string[];
  seatCapacity: string;
  availableSeats: string;
  fare: string;
  active: boolean;
}

const makeEmptyForm = (): ShuttleForm => ({
  name: '',
  routeName: '',
  originAddress: '',
  destAddress: '',
  departureTime: defaultDeparture(),
  days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
  seatCapacity: '20',
  availableSeats: '20',
  fare: '40',
  active: true,
});

export function CorporateShuttlesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { companiesQuery, companies, company, companyId, selectCompany } = useSelectedCompany();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ShuttleForm>(makeEmptyForm);

  const shuttlesQuery = useQuery({
    queryKey: ['corporate', 'shuttles', companyId],
    queryFn: () => corporateApi.shuttles(companyId),
    enabled: Boolean(companyId),
  });

  const addShuttle = useMutation({
    mutationFn: () => {
      const departure = new Date(form.departureTime);
      if (Number.isNaN(departure.getTime())) throw new Error('Choose a valid departure time');
      const capacity = Number(form.seatCapacity);
      const available = Number(form.availableSeats);
      if (!form.name.trim()) throw new Error('Shuttle name is required');
      if (!Number.isFinite(capacity) || capacity < 1) throw new Error('Seat capacity must be at least 1');
      if (!Number.isFinite(available) || available < 0 || available > capacity) throw new Error('Available seats must be between 0 and capacity');
      return corporateApi.addShuttle(companyId, {
        name: form.name.trim(),
        routeName: form.routeName.trim() || undefined,
        originAddress: form.originAddress.trim() || undefined,
        destAddress: form.destAddress.trim() || undefined,
        departureTime: departure.toISOString(),
        daysOfWeek: form.days.length ? form.days.join(',') : undefined,
        seatCapacity: capacity,
        availableSeats: available,
        fare: Number(form.fare) || 0,
        active: form.active,
      });
    },
    onSuccess: async () => {
      toast.success('Shuttle published');
      setOpen(false);
      setForm(makeEmptyForm());
      await queryClient.invalidateQueries({ queryKey: ['corporate', 'shuttles'] });
      await queryClient.invalidateQueries({ queryKey: ['corporate', 'report'] });
    },
    onError: (error) => toast.error('Could not publish shuttle', getApiErrorMessage(error)),
  });

  if (companiesQuery.isLoading) return <LoadingBlock label="Loading companyâ€¦" />;
  if (companiesQuery.isError) {
    return <ErrorState title="Could not load your company" description={getApiErrorMessage(companiesQuery.error)} onRetry={() => companiesQuery.refetch()} />;
  }
  if (!company) return <EmptyState icon={<Bus className="h-6 w-6" />} title="No company linked" description="Ask a platform administrator to attach your corporate account to a company." />;

  const shuttles = shuttlesQuery.data ?? [];
  const toggleDay = (day: string) => {
    setForm({ ...form, days: form.days.includes(day) ? form.days.filter((item) => item !== day) : [...form.days, day] });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company shuttles"
        description="Publish recurring shuttle services for verified employees."
        actions={
          <div className="flex flex-wrap items-end gap-3">
            <EntitySwitcher label="Company" items={companies.map((item) => ({ id: item.id, label: item.name }))} value={companyId} onChange={selectCompany} />
            <Button onClick={() => setOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>Publish shuttle</Button>
          </div>
        }
      />

      {shuttlesQuery.isLoading && <LoadingBlock label="Loading shuttlesâ€¦" />}
      {shuttlesQuery.isError && <ErrorState title="Could not load shuttles" description={getApiErrorMessage(shuttlesQuery.error)} onRetry={() => shuttlesQuery.refetch()} />}

      {!shuttlesQuery.isLoading && !shuttlesQuery.isError && shuttles.length === 0 && (
        <EmptyState icon={<Bus className="h-6 w-6" />} title="No shuttles yet" description="Publish a recurring shuttle to offer employees a shared commute." />
      )}

      {shuttles.length > 0 && (
        <TableWrap>
          <THead>
            <TR>
              <TH>Shuttle</TH>
              <TH>Route</TH>
              <TH>Departure</TH>
              <TH>Days</TH>
              <TH>Seats</TH>
              <TH>Fare</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {shuttles.map((shuttle) => (
              <TR key={shuttle.id}>
                <TD>
                  <p className="font-semibold text-ink-800">{shuttle.name}</p>
                  <p className="text-xs text-ink-400">{shuttle.routeName || 'â€”'}</p>
                </TD>
                <TD className="max-w-xs text-xs text-ink-600">{shuttle.originAddress || 'â€”'} â†’ {shuttle.destAddress || 'â€”'}</TD>
                <TD className="text-xs">{formatSmartDateTime(shuttle.departureTime)}</TD>
                <TD className="text-xs text-ink-500">{shuttle.daysOfWeek ? shuttle.daysOfWeek.split(',').join(' Â· ') : 'One-off'}</TD>
                <TD>{shuttle.availableSeats}/{shuttle.seatCapacity}</TD>
                <TD>{formatCurrency(shuttle.fare, true)}</TD>
                <TD><StatusBadge status={shuttle.active ? 'ACTIVE' : 'SUSPENDED'} /></TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}

      <p className="text-xs text-ink-400">
        Shuttle updates and cancellation endpoints are not exposed by this backend. Publish a new
        shuttle when a schedule changes.
      </p>

      <Modal
        open={open}
        onClose={() => (addShuttle.isPending ? undefined : setOpen(false))}
        title="Publish company shuttle"
        description="Visible to verified employees of this company."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={addShuttle.isPending}>Cancel</Button>
            <Button onClick={() => addShuttle.mutate()} loading={addShuttle.isPending}>Publish shuttle</Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Shuttle name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Hitech City â†” Gachibowli" />
          <Input label="Route name" value={form.routeName} onChange={(event) => setForm({ ...form, routeName: event.target.value })} placeholder="e.g. Morning express" />
          <Input label="Origin address" value={form.originAddress} onChange={(event) => setForm({ ...form, originAddress: event.target.value })} wrapperClassName="sm:col-span-2" />
          <Input label="Destination address" value={form.destAddress} onChange={(event) => setForm({ ...form, destAddress: event.target.value })} wrapperClassName="sm:col-span-2" />
          <Select
            label="Origin preset"
            value=""
            onChange={(event) => {
              const preset = hyderabadLocations.find((item) => item.address === event.target.value);
              if (preset) setForm({ ...form, originAddress: preset.address });
            }}
          >
            <option value="">No preset</option>
            {hyderabadLocations.map((item) => <option key={item.address} value={item.address}>{item.name}</option>)}
          </Select>
          <Select
            label="Destination preset"
            value=""
            onChange={(event) => {
              const preset = hyderabadLocations.find((item) => item.address === event.target.value);
              if (preset) setForm({ ...form, destAddress: preset.address });
            }}
          >
            <option value="">No preset</option>
            {hyderabadLocations.map((item) => <option key={item.address} value={item.address}>{item.name}</option>)}
          </Select>
          <Input label="First departure" type="datetime-local" value={form.departureTime} onChange={(event) => setForm({ ...form, departureTime: event.target.value })} wrapperClassName="sm:col-span-2" />
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-semibold text-ink-800">Recurs on</p>
            <div className="flex flex-wrap gap-3">
              {days.map((day) => (
                <Checkbox key={day.value} label={day.label} checked={form.days.includes(day.value)} onChange={() => toggleDay(day.value)} />
              ))}
            </div>
          </div>
          <Input label="Seat capacity" type="number" min={1} max={60} value={form.seatCapacity} onChange={(event) => setForm({ ...form, seatCapacity: event.target.value })} />
          <Input label="Available seats" type="number" min={0} max={60} value={form.availableSeats} onChange={(event) => setForm({ ...form, availableSeats: event.target.value })} />
          <Input label="Fare per seat (â‚¹)" type="number" min={0} step="0.01" value={form.fare} onChange={(event) => setForm({ ...form, fare: event.target.value })} />
          <div className="flex items-end pb-2">
            <Checkbox label="Active immediately" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
          </div>
          {form.days.length === 0 && <p className="text-xs text-amber-700 sm:col-span-2">No recurrence selected â€” this shuttle will be treated as a one-off.</p>}
        </div>
      </Modal>
    </div>
  );
}

