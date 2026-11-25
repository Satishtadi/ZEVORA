import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Users } from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  LoadingBlock,
  Modal,
  PageHeader,
  TBody,
  TD,
  TH,
  THead,
  TR,
  TableWrap,
  useToast,
} from '@/components/ui';
import { useSelectedOperator } from '@/lib/entity-selection';
import { operatorApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';

const emptyForm = { fullName: '', phone: '', licenseNumber: '' };

export function OperatorDriversPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { operatorsQuery, operator, operatorId } = useSelectedOperator();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fleetQuery = useQuery({
    queryKey: ['operator', 'fleet', operatorId],
    queryFn: () => operatorApi.fleet(operatorId),
    enabled: Boolean(operatorId),
  });

  const addDriver = useMutation({
    mutationFn: () =>
      operatorApi.addDriver(operatorId, {
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        licenseNumber: form.licenseNumber.trim() || undefined,
        verified: false,
      }),
    onSuccess: async () => {
      toast.success('Driver added');
      setOpen(false);
      setForm(emptyForm);
      await queryClient.invalidateQueries({ queryKey: ['operator', 'fleet'] });
      await queryClient.invalidateQueries({ queryKey: ['operator', 'summary'] });
    },
    onError: (error) => toast.error('Could not add driver', getApiErrorMessage(error)),
  });

  if (operatorsQuery.isLoading) return <LoadingBlock label="Loading operator…" />;
  if (operatorsQuery.isError) {
    return <ErrorState title="Could not load operator" description={getApiErrorMessage(operatorsQuery.error)} onRetry={() => operatorsQuery.refetch()} />;
  }
  if (!operator) return <EmptyState icon={<Users className="h-6 w-6" />} title="No transport operator linked" description="Ask a platform administrator to attach your account to an operator." />;

  const drivers = fleetQuery.data?.drivers ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drivers"
        description="Drivers registered to this operator. Platform admins verify licences."
        actions={<Button onClick={() => setOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>Add driver</Button>}
      />

      {fleetQuery.isLoading && <LoadingBlock label="Loading drivers…" />}
      {fleetQuery.isError && <ErrorState title="Could not load drivers" description={getApiErrorMessage(fleetQuery.error)} onRetry={() => fleetQuery.refetch()} />}

      {!fleetQuery.isLoading && !fleetQuery.isError && drivers.length === 0 && (
        <EmptyState icon={<Users className="h-6 w-6" />} title="No drivers yet" description="Add drivers so they can be assigned to operator schedules." />
      )}

      {drivers.length > 0 && (
        <TableWrap>
          <THead>
            <TR><TH>Driver</TH><TH>Phone</TH><TH>Licence</TH><TH>Verification</TH></TR>
          </THead>
          <TBody>
            {drivers.map((driver) => (
              <TR key={driver.id}>
                <TD className="font-semibold text-ink-800">{driver.fullName}</TD>
                <TD className="text-xs text-ink-600">{driver.phone || '—'}</TD>
                <TD className="font-mono text-xs">{driver.licenseNumber || '—'}</TD>
                <TD>{driver.verified ? <Badge tone="success">Verified</Badge> : <Badge tone="warning">Pending admin verification</Badge>}</TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}

      <p className="text-xs text-ink-400">
        This backend has no operator-side driver status or assignment endpoint. Verified drivers are
        managed by platform admins.
      </p>

      <Modal
        open={open}
        onClose={() => (addDriver.isPending ? undefined : setOpen(false))}
        title="Add driver"
        description="New drivers start unverified."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={addDriver.isPending}>Cancel</Button>
            <Button onClick={() => addDriver.mutate()} loading={addDriver.isPending} disabled={!form.fullName.trim()}>Add driver</Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Full name" required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} wrapperClassName="sm:col-span-2" />
          <Input label="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <Input label="Licence number" value={form.licenseNumber} onChange={(event) => setForm({ ...form, licenseNumber: event.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
