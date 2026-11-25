import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CarFront, Pencil, Plus, ShieldCheck, Truck } from 'lucide-react';
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
  useToast,
} from '@/components/ui';
import { driversApi, type VehicleInput } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import type { Vehicle } from '@/types';

const blank: VehicleInput = { make: '', model: '', plateNumber: '', color: '', seatCapacity: 4 };

export function DriverVehiclesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<VehicleInput>(blank);

  const driverQuery = useQuery({ queryKey: ['driver', 'profile'], queryFn: driversApi.profile, retry: false });
  const vehiclesQuery = useQuery({ queryKey: ['driver', 'vehicles'], queryFn: driversApi.vehicles });

  const save = useMutation({
    mutationFn: () =>
      editing ? driversApi.updateVehicle(editing.id, form) : driversApi.addVehicle(form),
    onSuccess: async () => {
      toast.success(editing ? 'Vehicle updated' : 'Vehicle added', 'Admin verification is required before the badge appears on rides.');
      setOpen(false);
      setEditing(null);
      setForm(blank);
      await queryClient.invalidateQueries({ queryKey: ['driver', 'vehicles'] });
      await queryClient.invalidateQueries({ queryKey: ['driver', 'profile'] });
    },
    onError: (error) => toast.error('Could not save vehicle', getApiErrorMessage(error)),
  });

  const openAdd = () => {
    setEditing(null);
    setForm(blank);
    setOpen(true);
  };

  const openEdit = (vehicle: Vehicle) => {
    setEditing(vehicle);
    setForm({
      make: vehicle.make ?? '',
      model: vehicle.model ?? '',
      plateNumber: vehicle.plateNumber,
      color: vehicle.color ?? '',
      seatCapacity: vehicle.seatCapacity,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicles"
        description="Add every vehicle you may use for carpool rides. Admin verification is required for the verified badge."
        actions={
          <div className="flex gap-2">
            <Link to="/driver"><Button variant="outline">Back to dashboard</Button></Link>
            <Button onClick={openAdd} leftIcon={<Plus className="h-4 w-4" />}>Add vehicle</Button>
          </div>
        }
      />

      {driverQuery.data && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-ink-100 bg-white px-4 py-3 text-sm">
          <ShieldCheck className="h-4 w-4 text-brand-600" />
          <span className="font-semibold text-ink-800">Driver verification:</span>
          <Badge tone={driverQuery.data.status === 'APPROVED' ? 'success' : 'warning'}>{driverQuery.data.status}</Badge>
          <span className="text-ink-500">Licence {driverQuery.data.licenseVerified ? 'verified' : 'pending'} · Identity {driverQuery.data.identityVerified ? 'verified' : 'pending'}</span>
        </div>
      )}

      {vehiclesQuery.isLoading && <LoadingBlock label="Loading vehicles…" />}
      {vehiclesQuery.isError && <ErrorState title="Could not load vehicles" description={getApiErrorMessage(vehiclesQuery.error)} onRetry={() => vehiclesQuery.refetch()} />}

      {!vehiclesQuery.isLoading && !vehiclesQuery.isError && (vehiclesQuery.data ?? []).length === 0 && (
        <EmptyState
          icon={<Truck className="h-6 w-6" />}
          title="No vehicles yet"
          description="Add at least one vehicle so you can publish rides. Verification can be completed by admin afterwards."
          action={<Button onClick={openAdd} leftIcon={<Plus className="h-4 w-4" />}>Add your first vehicle</Button>}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {(vehiclesQuery.data ?? []).map((vehicle) => (
          <Card key={vehicle.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><CarFront className="h-5 w-5" /></span>
                <div>
                  <CardTitle>{vehicle.make || vehicle.model ? `${vehicle.make ?? ''} ${vehicle.model ?? ''}`.trim() : 'Vehicle'}</CardTitle>
                  <p className="text-sm text-ink-500">{vehicle.plateNumber}</p>
                </div>
              </div>
              <Badge tone={vehicle.verified ? 'success' : 'warning'}>{vehicle.verified ? 'Verified' : 'Pending verification'}</Badge>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="space-y-1 text-ink-500">
                <p>Colour: <span className="font-semibold text-ink-700">{vehicle.color || 'Not specified'}</span></p>
                <p>Seats: <span className="font-semibold text-ink-700">{vehicle.seatCapacity}</span></p>
              </div>
              <Button variant="outline" size="sm" onClick={() => openEdit(vehicle)} leftIcon={<Pencil className="h-3.5 w-3.5" />}>Edit</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-ink-400">
        Vehicle verification is performed by ZEVORA admin. This build does not expose document upload endpoints, so verification is manual.
      </p>

      <Modal
        open={open}
        onClose={() => (save.isPending ? undefined : setOpen(false))}
        title={editing ? 'Edit vehicle' : 'Add vehicle'}
        description="Use accurate details — passengers see the model and plate on the ride card."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={save.isPending}>Cancel</Button>
            <Button onClick={() => save.mutate()} loading={save.isPending} disabled={form.plateNumber.trim().length < 4 || form.seatCapacity < 1}>
              {editing ? 'Save changes' : 'Add vehicle'}
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Make" placeholder="Maruti" value={form.make ?? ''} onChange={(event) => setForm({ ...form, make: event.target.value })} />
          <Input label="Model" placeholder="Ertiga" value={form.model ?? ''} onChange={(event) => setForm({ ...form, model: event.target.value })} />
          <Input label="Plate number" placeholder="TS09 AB 1234" value={form.plateNumber} onChange={(event) => setForm({ ...form, plateNumber: event.target.value.toUpperCase() })} required />
          <Input label="Colour" placeholder="White" value={form.color ?? ''} onChange={(event) => setForm({ ...form, color: event.target.value })} />
          <Input
            label="Seat capacity"
            type="number"
            min={1}
            max={12}
            value={form.seatCapacity}
            onChange={(event) => setForm({ ...form, seatCapacity: Number(event.target.value) || 1 })}
            hint="Includes the driver seat."
          />
        </div>
      </Modal>
    </div>
  );
}
