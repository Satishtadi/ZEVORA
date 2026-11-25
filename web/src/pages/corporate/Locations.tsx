import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus } from 'lucide-react';
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
  Select,
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

interface LocationForm {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
}

const emptyForm: LocationForm = { name: '', address: '', latitude: '', longitude: '' };

export function CorporateLocationsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { companiesQuery, companies, company, companyId, selectCompany } = useSelectedCompany();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<LocationForm>(emptyForm);

  const locationsQuery = useQuery({
    queryKey: ['corporate', 'locations', companyId],
    queryFn: () => corporateApi.locations(companyId),
    enabled: Boolean(companyId),
  });

  const addLocation = useMutation({
    mutationFn: () =>
      corporateApi.addLocation(companyId, {
        name: form.name.trim(),
        address: form.address.trim() || undefined,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
      }),
    onSuccess: async () => {
      toast.success('Location added');
      setOpen(false);
      setForm(emptyForm);
      await queryClient.invalidateQueries({ queryKey: ['corporate', 'locations'] });
      await queryClient.invalidateQueries({ queryKey: ['corporate', 'report'] });
    },
    onError: (error) => toast.error('Could not add location', getApiErrorMessage(error)),
  });

  if (companiesQuery.isLoading) return <LoadingBlock label="Loading companyâ€¦" />;
  if (companiesQuery.isError) {
    return <ErrorState title="Could not load your company" description={getApiErrorMessage(companiesQuery.error)} onRetry={() => companiesQuery.refetch()} />;
  }
  if (!company) return <EmptyState icon={<MapPin className="h-6 w-6" />} title="No company linked" description="Ask a platform administrator to attach your corporate account to a company." />;

  const locations = locationsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Office locations"
        description="Pickup and drop points used by company shuttles."
        actions={
          <div className="flex flex-wrap items-end gap-3">
            <EntitySwitcher label="Company" items={companies.map((item) => ({ id: item.id, label: item.name }))} value={companyId} onChange={selectCompany} />
            <Button onClick={() => setOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>Add location</Button>
          </div>
        }
      />

      {locationsQuery.isLoading && <LoadingBlock label="Loading locationsâ€¦" />}
      {locationsQuery.isError && <ErrorState title="Could not load locations" description={getApiErrorMessage(locationsQuery.error)} onRetry={() => locationsQuery.refetch()} />}

      {!locationsQuery.isLoading && !locationsQuery.isError && locations.length === 0 && (
        <EmptyState icon={<MapPin className="h-6 w-6" />} title="No office locations yet" description="Add your first office or pickup point to build shuttle routes." />
      )}

      {locations.length > 0 && (
        <TableWrap>
          <THead>
            <TR>
              <TH>Location</TH>
              <TH>Address</TH>
              <TH>Coordinates</TH>
            </TR>
          </THead>
          <TBody>
            {locations.map((location) => (
              <TR key={location.id}>
                <TD className="font-semibold text-ink-800">{location.name}</TD>
                <TD className="max-w-md text-sm text-ink-600">{location.address || 'â€”'}</TD>
                <TD className="text-xs">
                  {location.latitude != null && location.longitude != null ? (
                    <a
                      className="inline-flex items-center gap-1 text-brand-700 hover:underline"
                      href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MapPin className="h-3.5 w-3.5" /> {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </a>
                  ) : 'â€”'}
                </TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}

      <p className="text-xs text-ink-400">
        Locations are additive in this backend â€” editing and deleting are not exposed. Create a new
        location and stop using the old one if a point moves.
      </p>

      <Modal
        open={open}
        onClose={() => (addLocation.isPending ? undefined : setOpen(false))}
        title="Add office location"
        description="Coordinates are optional but improve shuttle matching."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={addLocation.isPending}>Cancel</Button>
            <Button onClick={() => addLocation.mutate()} loading={addLocation.isPending} disabled={!form.name.trim()}>Add location</Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Location name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} wrapperClassName="sm:col-span-2" placeholder="e.g. Hitech City HQ" />
          <Select
            label="Hyderabad preset"
            value=""
            onChange={(event) => {
              const preset = hyderabadLocations.find((item) => item.address === event.target.value);
              if (preset) setForm({ ...form, address: preset.address, latitude: String(preset.lat), longitude: String(preset.lng) });
            }}
            wrapperClassName="sm:col-span-2"
          >
            <option value="">No preset</option>
            {hyderabadLocations.map((item) => <option key={item.address} value={item.address}>{item.name}</option>)}
          </Select>
          <Input label="Address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} wrapperClassName="sm:col-span-2" />
          <Input label="Latitude" type="number" step="any" value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} />
          <Input label="Longitude" type="number" step="any" value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} />
        </div>
      </Modal>
    </div>
  );
}

