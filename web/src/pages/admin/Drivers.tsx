import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, CarFront, Star, XCircle } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  Input,
  LoadingBlock,
  Modal,
  PageHeader,
  Pagination,
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
import { adminApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { titleCase } from '@/lib/utils';
import type { DriverProfile, DriverStatus } from '@/types';

const statuses: { value: DriverStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

export function AdminDriversPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<DriverStatus | ''>('PENDING');
  const [page, setPage] = useState(0);
  const [target, setTarget] = useState<DriverProfile | null>(null);
  const [note, setNote] = useState('');

  const driversQuery = useQuery({
    queryKey: ['admin', 'drivers', status, page],
    queryFn: () => adminApi.drivers(status || undefined, page, 20),
  });

  const verifyDriver = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) => adminApi.verifyDriver(id, approved, note || undefined),
    onSuccess: async () => {
      toast.success('Driver verification updated');
      setTarget(null);
      setNote('');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'drivers'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (error) => toast.error('Could not update driver', getApiErrorMessage(error)),
  });

  const verifyVehicle = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) => adminApi.verifyVehicle(id, approved),
    onSuccess: async () => {
      toast.success('Vehicle verification updated');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'drivers'] });
      await queryClient.invalidateQueries({ queryKey: ['driver', 'profile'] });
    },
    onError: (error) => toast.error('Could not update vehicle', getApiErrorMessage(error)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Driver verification"
        description="Review licences, identities and vehicles. Document uploads are not available in this build, so verification is a manual decision."
        actions={<Badge tone="warning">{driversQuery.data?.totalElements ?? 0} in this view</Badge>}
      />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <Select
            label="Verification status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as DriverStatus | '');
              setPage(0);
            }}
            wrapperClassName="w-56"
          >
            {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </Select>
        </CardContent>
      </Card>

      {driversQuery.isLoading && <LoadingBlock label="Loading drivers…" />}
      {driversQuery.isError && <ErrorState title="Could not load drivers" description={getApiErrorMessage(driversQuery.error)} onRetry={() => driversQuery.refetch()} />}

      {!driversQuery.isLoading && !driversQuery.isError && (driversQuery.data?.items ?? []).length === 0 && (
        <EmptyState icon={<BadgeCheck className="h-6 w-6" />} title="No drivers in this view" description="Try a different verification status." />
      )}

      {(driversQuery.data?.items ?? []).length > 0 && (
        <>
          <TableWrap>
            <THead>
              <TR>
                <TH>Driver</TH>
                <TH>Type</TH>
                <TH>Licence</TH>
                <TH>Verification</TH>
                <TH>Vehicles</TH>
                <TH>Status</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {(driversQuery.data?.items ?? []).map((driver) => (
                <TR key={driver.id}>
                  <TD>
                    <p className="font-semibold text-ink-800">{driver.fullName}</p>
                    <p className="text-xs text-ink-400">{driver.email} · {driver.phone}</p>
                  </TD>
                  <TD>{titleCase(driver.driverType)}</TD>
                  <TD>
                    <p className="font-mono text-xs text-ink-700">{driver.licenseNumber}</p>
                    <p className="text-xs text-ink-400">{driver.licenseVerified ? 'Licence verified' : 'Licence pending'}</p>
                  </TD>
                  <TD>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone={driver.identityVerified ? 'success' : 'warning'}>Identity {driver.identityVerified ? '✓' : 'pending'}</Badge>
                      <Badge tone={driver.licenseVerified ? 'success' : 'warning'}>Licence {driver.licenseVerified ? '✓' : 'pending'}</Badge>
                    </div>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-500"><Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {driver.rating.toFixed(1)} · {driver.totalRides} rides</p>
                  </TD>
                  <TD>{driver.vehicles.length}</TD>
                  <TD><StatusBadge status={driver.status} /></TD>
                  <TD>
                    <Button size="sm" variant="outline" onClick={() => { setTarget(driver); setNote(''); }}>Review</Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </TableWrap>
          <Pagination page={driversQuery.data?.page ?? 0} totalPages={driversQuery.data?.totalPages ?? 0} onPageChange={setPage} />
        </>
      )}

      <Modal
        open={Boolean(target)}
        onClose={() => (verifyDriver.isPending ? undefined : setTarget(null))}
        title={`Review ${target?.fullName ?? 'driver'}`}
        description="Approving unlocks ride publishing for this driver."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setTarget(null)} disabled={verifyDriver.isPending}>Close</Button>
            <Button
              variant="danger"
              onClick={() => target && verifyDriver.mutate({ id: target.id, approved: false })}
              loading={verifyDriver.isPending}
              leftIcon={<XCircle className="h-4 w-4" />}
            >
              Reject
            </Button>
            <Button
              onClick={() => target && verifyDriver.mutate({ id: target.id, approved: true })}
              loading={verifyDriver.isPending}
              leftIcon={<BadgeCheck className="h-4 w-4" />}
            >
              Approve driver
            </Button>
          </>
        }
      >
        {target && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-2 rounded-xl bg-ink-50 p-4 sm:grid-cols-2">
              <p><span className="text-ink-500">Driver ID:</span> <span className="font-mono text-xs">{target.id}</span></p>
              <p><span className="text-ink-500">Type:</span> {titleCase(target.driverType)}</p>
              <p><span className="text-ink-500">Licence:</span> <span className="font-mono">{target.licenseNumber}</span></p>
              <p><span className="text-ink-500">Status:</span> <StatusBadge status={target.status} /></p>
              <p><span className="text-ink-500">Identity verified:</span> {target.identityVerified ? 'Yes' : 'No'}</p>
              <p><span className="text-ink-500">Licence verified:</span> {target.licenseVerified ? 'Yes' : 'No'}</p>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-2 font-semibold text-ink-800"><CarFront className="h-4 w-4" /> Vehicles</p>
              {target.vehicles.length === 0 ? (
                <p className="rounded-lg bg-ink-50 p-3 text-xs text-ink-500">No vehicles on this profile.</p>
              ) : (
                <ul className="space-y-2">
                  {target.vehicles.map((vehicle) => (
                    <li key={vehicle.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink-100 p-3">
                      <div>
                        <p className="font-semibold text-ink-800">{`${vehicle.make ?? ''} ${vehicle.model ?? ''}`.trim() || 'Vehicle'} · {vehicle.plateNumber}</p>
                        <p className="text-xs text-ink-500">{vehicle.seatCapacity} seats · <span className={vehicle.verified ? 'text-mint-700' : 'text-amber-700'}>{vehicle.verified ? 'Verified' : 'Pending verification'}</span></p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => verifyVehicle.mutate({ id: vehicle.id, approved: false })} disabled={verifyVehicle.isPending}>Reject</Button>
                        <Button size="sm" onClick={() => verifyVehicle.mutate({ id: vehicle.id, approved: true })} loading={verifyVehicle.isPending} disabled={vehicle.verified}>Verify</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Input label="Review note (optional)" placeholder="Reason or verification reference" value={note} onChange={(event) => setNote(event.target.value)} />
            <p className="text-xs text-ink-400">Approve only after checking the licence and vehicle details out-of-band, since this build has no document viewer.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
