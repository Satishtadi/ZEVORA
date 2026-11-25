import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Route as RouteIcon } from 'lucide-react';
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
import { operatorApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { hyderabadLocations } from '@/lib/hyderabad';
import { useSelectedOperator } from '@/lib/entity-selection';
import { formatCurrency } from '@/lib/utils';

interface RouteForm {
  name: string;
  originAddress: string;
  destAddress: string;
  baseFare: string;
  perKm: string;
  active: boolean;
}

const emptyForm: RouteForm = { name: '', originAddress: '', destAddress: '', baseFare: '', perKm: '', active: true };

export function OperatorRoutesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { operatorsQuery, operators, operator, operatorId, selectOperator } = useSelectedOperator();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RouteForm>(emptyForm);

  const routesQuery = useQuery({
    queryKey: ['operator', 'routes', operatorId],
    queryFn: () => operatorApi.routes(operatorId),
    enabled: Boolean(operatorId),
  });

  const addRoute = useMutation({
    mutationFn: () =>
      operatorApi.addRoute(operatorId, {
        name: form.name.trim(),
        originAddress: form.originAddress.trim() || undefined,
        destAddress: form.destAddress.trim() || undefined,
        baseFare: form.baseFare ? Number(form.baseFare) : undefined,
        perKm: form.perKm ? Number(form.perKm) : undefined,
        active: form.active,
      }),
    onSuccess: async () => {
      toast.success('Route added');
      setOpen(false);
      setForm(emptyForm);
      await queryClient.invalidateQueries({ queryKey: ['operator', 'routes'] });
      await queryClient.invalidateQueries({ queryKey: ['operator', 'summary'] });
    },
    onError: (error) => toast.error('Could not add route', getApiErrorMessage(error)),
  });

  if (operatorsQuery.isLoading) return <LoadingBlock label="Loading operatorâ€¦" />;
  if (operatorsQuery.isError) {
    return <ErrorState title="Could not load operator" description={getApiErrorMessage(operatorsQuery.error)} onRetry={() => operatorsQuery.refetch()} />;
  }
  if (!operator) return <EmptyState icon={<RouteIcon className="h-6 w-6" />} title="No transport operator linked" description="Ask a platform administrator to attach your account to an operator." />;

  const routes = routesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Routes"
        description="Define the corridors your operator serves. Schedules are added per route."
        actions={
          <div className="flex flex-wrap items-end gap-3">
            <EntitySwitcher label="Operator" items={operators.map((item) => ({ id: item.id, label: item.name }))} value={operatorId} onChange={selectOperator} />
            <Button onClick={() => setOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>Add route</Button>
          </div>
        }
      />

      {routesQuery.isLoading && <LoadingBlock label="Loading routesâ€¦" />}
      {routesQuery.isError && <ErrorState title="Could not load routes" description={getApiErrorMessage(routesQuery.error)} onRetry={() => routesQuery.refetch()} />}

      {!routesQuery.isLoading && !routesQuery.isError && routes.length === 0 && (
        <EmptyState icon={<RouteIcon className="h-6 w-6" />} title="No routes yet" description="Add a route before creating schedules." />
      )}

      {routes.length > 0 && (
        <TableWrap>
          <THead>
            <TR>
              <TH>Route</TH>
              <TH>Origin</TH>
              <TH>Destination</TH>
              <TH>Base fare</TH>
              <TH>Per km</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {routes.map((route) => (
              <TR key={route.id}>
                <TD className="font-semibold text-ink-800">{route.name}</TD>
                <TD className="max-w-xs text-xs text-ink-600">{route.originAddress || 'â€”'}</TD>
                <TD className="max-w-xs text-xs text-ink-600">{route.destAddress || 'â€”'}</TD>
                <TD>{route.baseFare != null ? formatCurrency(route.baseFare, true) : 'â€”'}</TD>
                <TD>{route.perKm != null ? formatCurrency(route.perKm, true) : 'â€”'}</TD>
                <TD><StatusBadge status={route.active ? 'ACTIVE' : 'SUSPENDED'} /></TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}

      <p className="text-xs text-ink-400">Routes are additive in this backend; update and delete endpoints are not exposed.</p>

      <Modal
        open={open}
        onClose={() => (addRoute.isPending ? undefined : setOpen(false))}
        title="Add route"
        description="Create a corridor, then attach schedules to it."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={addRoute.isPending}>Cancel</Button>
            <Button onClick={() => addRoute.mutate()} loading={addRoute.isPending} disabled={!form.name.trim()}>Add route</Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Route name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} wrapperClassName="sm:col-span-2" placeholder="e.g. Secunderabad â†” Hitech City" />
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
          <Input label="Origin address" value={form.originAddress} onChange={(event) => setForm({ ...form, originAddress: event.target.value })} wrapperClassName="sm:col-span-2" />
          <Input label="Destination address" value={form.destAddress} onChange={(event) => setForm({ ...form, destAddress: event.target.value })} wrapperClassName="sm:col-span-2" />
          <Input label="Base fare (â‚¹)" type="number" min={0} step="0.01" value={form.baseFare} onChange={(event) => setForm({ ...form, baseFare: event.target.value })} />
          <Input label="Per km (â‚¹)" type="number" min={0} step="0.01" value={form.perKm} onChange={(event) => setForm({ ...form, perKm: event.target.value })} />
          <div className="flex items-end pb-2 sm:col-span-2">
            <Checkbox label="Active route" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
          </div>
          <div className="sm:col-span-2"><Badge tone="neutral">Schedules are managed from the Schedules page</Badge></div>
        </div>
      </Modal>
    </div>
  );
}

