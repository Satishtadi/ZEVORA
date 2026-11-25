import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Truck, UserRound } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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

interface VehicleForm {
  plateNumber: string;
  model: string;
  seatCapacity: string;
}

interface DriverForm {
  fullName: string;
  phone: string;
  licenseNumber: string;
}

const emptyVehicle: VehicleForm = { plateNumber: '', model: '', seatCapacity: '40' };
const emptyDriver: DriverForm = { fullName: '', phone: '', licenseNumber: '' };

export function OperatorFleetPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { operatorsQuery, operator, operatorId } = useSelectedOperator();
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [driverOpen, setDriverOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState<VehicleForm>(emptyVehicle);
  const [driverForm, setDriverForm] = useState<DriverForm>(emptyDriver);

  const fleetQuery = useQuery({
    queryKey: ['operator', 'fleet', operatorId],
    queryFn: () => operatorApi.fleet(operatorId),
    enabled: Boolean(operatorId),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['operator', 'fleet'] });
    await queryClient.invalidateQueries({ queryKey: ['operator', 'summary'] });
  };

  const addVehicle = useMutation({
    mutationFn: () =>
      operatorApi.addVehicle(operatorId, {
        plateNumber: vehicleForm.plateNumber.trim().toUpperCase(),
        model: vehicleForm.model.trim() || undefined,
        seatCapacity: Number(vehicleForm.seatCapacity),
        verified: false,
      }),
    onSuccess: async () => {
      toast.success('Vehicle added');
      setVehicleOpen(false);
      setVehicleForm(emptyVehicle);
      await invalidate();
    },
    onError: (error) => toast.error('Could not add vehicle', getApiErrorMessage(error)),
  });

  const addDriver = useMutation({
    mutationFn: () =>
      operatorApi.addDriver(operatorId, {
        fullName: driverForm.fullName.trim(),
        phone: driverForm.phone.trim() || undefined,
        licenseNumber: driverForm.licenseNumber.trim() || undefined,
        verified: false,
      }),
    onSuccess: async () => {
      toast.success('Driver added');
      setDriverOpen(false);
      setDriverForm(emptyDriver);
      await invalidate();
    },
    onError: (error) => toast.error('Could not add driver', getApiErrorMessage(error)),
  });

  if (operatorsQuery.isLoading) return <LoadingBlock label="Loading operator…" />;
  if (operatorsQuery.isError) {
    return <ErrorState title="Could not load operator" description={getApiErrorMessage(operatorsQuery.error)} onRetry={() => operatorsQuery.refetch()} />;
  }
  if (!operator) return <EmptyState icon={<Truck className="h-6 w-6" />} title="No transport operator linked" description="Ask a platform administrator to attach your account to an operator." />;

  const fleet = fleetQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fleet"
        description="Vehicles and drivers available to this operator."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDriverOpen(true)} leftIcon={<UserRound className="h-4 w-4" />}>Add driver</Button>
            <Button onClick={() => setVehicleOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>Add vehicle</Button>
          </div>
        }
      />

      {fleetQuery.isLoading && <LoadingBlock label="Loading fleet…" />}
      {fleetQuery.isError && <ErrorState title="Could not load fleet" description={getApiErrorMessage(fleetQuery.error)} onRetry={() => fleetQuery.refetch()} />}

      {fleet && (
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Vehicles</CardTitle>
              <Badge tone="neutral">{fleet.vehicles.length}</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {fleet.vehicles.length === 0 ? (
                <p className="px-5 pb-5 text-sm text-ink-500">No vehicles registered yet.</p>
              ) : (
                <TableWrap>
                  <THead>
                    <TR><TH>Plate</TH><TH>Model</TH><TH>Seats</TH><TH>Verification</TH></TR>
                  </THead>
                  <TBody>
                    {fleet.vehicles.map((vehicle) => (
                      <TR key={vehicle.id}>
                        <TD className="font-mono font-semibold text-ink-800">{vehicle.plateNumber}</TD>
                        <TD>{vehicle.model || '—'}</TD>
                        <TD>{vehicle.seatCapacity}</TD>
                        <TD>{vehicle.verified ? <Badge tone="success">Verified</Badge> : <Badge tone="warning">Pending admin verification</Badge>}</TD>
                      </TR>
                    ))}
                  </TBody>
                </TableWrap>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Drivers</CardTitle>
              <Badge tone="neutral">{fleet.drivers.length}</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {fleet.drivers.length === 0 ? (
                <p className="px-5 pb-5 text-sm text-ink-500">No drivers registered yet.</p>
              ) : (
                <TableWrap>
                  <THead>
                    <TR><TH>Driver</TH><TH>Phone</TH><TH>Licence</TH><TH>Verification</TH></TR>
                  </THead>
                  <TBody>
                    {fleet.drivers.map((driver) => (
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
            </CardContent>
          </Card>
        </div>
      )}

      <p className="text-xs text-ink-400">
        Operator-added vehicles and drivers start unverified; platform admins verify them. This build
        has no document upload endpoint.
      </p>

      <Modal
        open={vehicleOpen}
        onClose={() => (addVehicle.isPending ? undefined : setVehicleOpen(false))}
        title="Add vehicle"
        description="Vehicles are verified by platform admins before use."
        footer={
          <>
            <Button variant="ghost" onClick={() => setVehicleOpen(false)} disabled={addVehicle.isPending}>Cancel</Button>
            <Button onClick={() => addVehicle.mutate()} loading={addVehicle.isPending} disabled={!vehicleForm.plateNumber.trim()}>Add vehicle</Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Plate number" required value={vehicleForm.plateNumber} onChange={(event) => setVehicleForm({ ...vehicleForm, plateNumber: event.target.value })} placeholder="TS09AB1234" />
          <Input label="Model" value={vehicleForm.model} onChange={(event) => setVehicleForm({ ...vehicleForm, model: event.target.value })} placeholder="e.g. Tata Starbus" />
          <Input label="Seat capacity" type="number" min={1} max={80} value={vehicleForm.seatCapacity} onChange={(event) => setVehicleForm({ ...vehicleForm, seatCapacity: event.target.value })} />
        </div>
      </Modal>

      <Modal
        open={driverOpen}
        onClose={() => (addDriver.isPending ? undefined : setDriverOpen(false))}
        title="Add driver"
        description="Drivers are verified by platform admins before assignment."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDriverOpen(false)} disabled={addDriver.isPending}>Cancel</Button>
            <Button onClick={() => addDriver.mutate()} loading={addDriver.isPending} disabled={!driverForm.fullName.trim()}>Add driver</Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Full name" required value={driverForm.fullName} onChange={(event) => setDriverForm({ ...driverForm, fullName: event.target.value })} wrapperClassName="sm:col-span-2" />
          <Input label="Phone" value={driverForm.phone} onChange={(event) => setDriverForm({ ...driverForm, phone: event.target.value })} />
          <Input label="Licence number" value={driverForm.licenseNumber} onChange={(event) => setDriverForm({ ...driverForm, licenseNumber: event.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
