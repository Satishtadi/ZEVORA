import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Eye, Siren } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  LoadingBlock,
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
import { formatSmartDateTime } from '@/lib/utils';
import type { SafetyStatus } from '@/types';

const statuses: { value: SafetyStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { value: 'RESOLVED', label: 'Resolved' },
];

export function AdminSafetyPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SafetyStatus | ''>('OPEN');
  const [page, setPage] = useState(0);

  const safetyQuery = useQuery({
    queryKey: ['admin', 'safety', status, page],
    queryFn: () => adminApi.safety(status || undefined, page, 20),
  });

  const resolve = useMutation({
    mutationFn: ({ id, next }: { id: string; next: SafetyStatus }) => adminApi.resolveSafety(id, next),
    onSuccess: async (_data, variables) => {
      toast.success(variables.next === 'RESOLVED' ? 'Incident resolved' : 'Incident acknowledged');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'safety'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (error) => toast.error('Could not update incident', getApiErrorMessage(error)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Safety incidents"
        description="SOS alerts and incident reports raised by passengers and drivers."
        actions={<Badge tone={status === 'OPEN' ? 'danger' : 'neutral'}>{safetyQuery.data?.totalElements ?? 0} in view</Badge>}
      />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <Select
            label="Status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as SafetyStatus | '');
              setPage(0);
            }}
            wrapperClassName="w-56"
          >
            {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </Select>
        </CardContent>
      </Card>

      {safetyQuery.isLoading && <LoadingBlock label="Loading safety incidents…" />}
      {safetyQuery.isError && <ErrorState title="Could not load incidents" description={getApiErrorMessage(safetyQuery.error)} onRetry={() => safetyQuery.refetch()} />}

      {!safetyQuery.isLoading && !safetyQuery.isError && (safetyQuery.data?.items ?? []).length === 0 && (
        <EmptyState icon={<CheckCircle2 className="h-6 w-6" />} title="No incidents in this view" description="Nothing needs attention for this status." />
      )}

      {(safetyQuery.data?.items ?? []).length > 0 && (
        <>
          <TableWrap>
            <THead>
              <TR>
                <TH>Type</TH>
                <TH>Note</TH>
                <TH>Booking</TH>
                <TH>Location</TH>
                <TH>Created</TH>
                <TH>Status</TH>
                <TH>Actions</TH>
              </TR>
            </THead>
            <TBody>
              {(safetyQuery.data?.items ?? []).map((event) => (
                <TR key={event.id}>
                  <TD>
                    <span className={`inline-flex items-center gap-1.5 font-semibold ${event.type === 'SOS' ? 'text-red-700' : 'text-amber-700'}`}>
                      {event.type === 'SOS' ? <Siren className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />} {event.type}
                    </span>
                  </TD>
                  <TD className="max-w-xs">
                    <p className="text-sm text-ink-700">{event.note || '—'}</p>
                    <p className="font-mono text-[11px] text-ink-400">{event.id.slice(0, 8)}</p>
                  </TD>
                  <TD className="font-mono text-xs">{event.bookingId ? event.bookingId.slice(0, 8) : '—'}</TD>
                  <TD className="text-xs">
                    {event.latitude != null && event.longitude != null
                      ? <a className="inline-flex items-center gap-1 text-brand-700 hover:underline" href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`} target="_blank" rel="noreferrer"><Eye className="h-3.5 w-3.5" /> {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}</a>
                      : '—'}
                  </TD>
                  <TD className="text-xs text-ink-500">{formatSmartDateTime(event.createdAt)}</TD>
                  <TD><StatusBadge status={event.status} /></TD>
                  <TD>
                    <div className="flex flex-wrap gap-1.5">
                      {event.status === 'OPEN' && (
                        <Button size="sm" variant="outline" onClick={() => resolve.mutate({ id: event.id, next: 'ACKNOWLEDGED' })} loading={resolve.isPending}>
                          Acknowledge
                        </Button>
                      )}
                      {event.status !== 'RESOLVED' && (
                        <Button size="sm" onClick={() => resolve.mutate({ id: event.id, next: 'RESOLVED' })} loading={resolve.isPending}>
                          Resolve
                        </Button>
                      )}
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </TableWrap>
          <Pagination page={safetyQuery.data?.page ?? 0} totalPages={safetyQuery.data?.totalPages ?? 0} onPageChange={setPage} />
        </>
      )}

      <p className="text-xs text-ink-400">
        The backend exposes a status update only; there is no incident detail endpoint. Contact the
        reporter out-of-band for sensitive follow-up.
      </p>
    </div>
  );
}
