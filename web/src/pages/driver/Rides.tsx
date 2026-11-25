import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, PlusCircle, Send, XCircle } from 'lucide-react';
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
  StatusBadge,
  useToast,
} from '@/components/ui';
import { ridesApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { cn, formatCurrency, formatSmartDateTime } from '@/lib/utils';
import type { Ride, RideStatus } from '@/types';

type Filter = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

const filters: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const activeStatuses: RideStatus[] = ['DRAFT', 'PUBLISHED', 'FULL', 'IN_PROGRESS'];

export function DriverRidesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [cancelTarget, setCancelTarget] = useState<Ride | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const ridesQuery = useQuery({ queryKey: ['rides', 'mine'], queryFn: ridesApi.mine });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['rides'] });
    await queryClient.invalidateQueries({ queryKey: ['driver', 'ride-bookings'] });
  };

  const publish = useMutation({
    mutationFn: (id: string) => ridesApi.publish(id),
    onSuccess: async () => {
      toast.success('Ride published');
      await invalidate();
    },
    onError: (error) => toast.error('Could not publish ride', getApiErrorMessage(error)),
  });

  const complete = useMutation({
    mutationFn: (id: string) => ridesApi.complete(id),
    onSuccess: async () => {
      toast.success('Ride marked completed', 'Passengers can now review the trip.');
      await invalidate();
    },
    onError: (error) => toast.error('Could not complete ride', getApiErrorMessage(error)),
  });

  const cancel = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => ridesApi.cancel(id, reason),
    onSuccess: async () => {
      toast.success('Ride cancelled', 'The backend cancelled all active bookings and recorded reasons.');
      setCancelTarget(null);
      setCancelReason('');
      await invalidate();
    },
    onError: (error) => toast.error('Could not cancel ride', getApiErrorMessage(error)),
  });

  const rides = useMemo(() => {
    const items = [...(ridesQuery.data ?? [])].sort((a, b) => new Date(b.departureTime).getTime() - new Date(a.departureTime).getTime());
    if (filter === 'ACTIVE') return items.filter((ride) => activeStatuses.includes(ride.status));
    if (filter === 'COMPLETED') return items.filter((ride) => ride.status === 'COMPLETED');
    if (filter === 'CANCELLED') return items.filter((ride) => ride.status === 'CANCELLED');
    return items;
  }, [ridesQuery.data, filter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My rides"
        description="Publish, complete or cancel the cost-sharing rides you drive."
        actions={<Link to="/driver/rides/new"><Button leftIcon={<PlusCircle className="h-4 w-4" />}>Publish ride</Button></Link>}
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => {
          const count =
            item.key === 'ALL'
              ? ridesQuery.data?.length ?? 0
              : item.key === 'ACTIVE'
                ? (ridesQuery.data ?? []).filter((ride) => activeStatuses.includes(ride.status)).length
                : (ridesQuery.data ?? []).filter((ride) => ride.status === item.key).length;
          return (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
                filter === item.key ? 'bg-ink-950 text-white' : 'bg-white text-ink-600 ring-1 ring-inset ring-ink-200 hover:bg-ink-50',
              )}
            >
              {item.label} <span className={filter === item.key ? 'text-ink-300' : 'text-ink-400'}>({count})</span>
            </button>
          );
        })}
      </div>

      {ridesQuery.isLoading && <LoadingBlock label="Loading rides…" />}
      {ridesQuery.isError && <ErrorState title="Could not load rides" description={getApiErrorMessage(ridesQuery.error)} onRetry={() => ridesQuery.refetch()} />}

      {!ridesQuery.isLoading && !ridesQuery.isError && rides.length === 0 && (
        <EmptyState
          title={filter === 'ALL' ? 'No rides published yet' : `No ${filter.toLowerCase()} rides`}
          description="Publish a ride on your usual route. You must be an approved driver to publish."
          action={<Link to="/driver/rides/new"><Button leftIcon={<PlusCircle className="h-4 w-4" />}>Publish a ride</Button></Link>}
        />
      )}

      <div className="space-y-3">
        {rides.map((ride) => {
          const canCancel = ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED';
          const canComplete = ride.status === 'PUBLISHED' || ride.status === 'FULL' || ride.status === 'IN_PROGRESS';
          return (
            <Card key={ride.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink-900">
                      {ride.originAddress} <ArrowRight className="h-3.5 w-3.5 text-ink-300" /> {ride.destAddress}
                      {ride.recurring && <Badge tone="info">Recurring</Badge>}
                      {ride.womenOnly && <Badge tone="brand">Women only</Badge>}
                    </p>
                    <p className="mt-1 text-xs text-ink-500">
                      {formatSmartDateTime(ride.departureTime)} · {ride.availableSeats}/{ride.totalSeats} seats available · {formatCurrency(ride.pricePerSeat)} per seat
                    </p>
                    <p className="mt-0.5 text-xs text-ink-400">{ride.vehicleModel} · {ride.vehiclePlate}</p>
                  </div>
                  <StatusBadge status={ride.status} />
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
                  <Link to={`/driver/rides/${ride.id}`}><Button variant="outline" size="sm">Details & passengers</Button></Link>
                  {ride.status === 'DRAFT' && (
                    <Button size="sm" onClick={() => publish.mutate(ride.id)} loading={publish.isPending} leftIcon={<Send className="h-3.5 w-3.5" />}>Publish</Button>
                  )}
                  {canComplete && (
                    <Button size="sm" variant="secondary" onClick={() => complete.mutate(ride.id)} loading={complete.isPending} leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}>Mark completed</Button>
                  )}
                  {canCancel && (
                    <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setCancelTarget(ride)} leftIcon={<XCircle className="h-3.5 w-3.5" />}>Cancel ride</Button>
                  )}
                  {!canComplete && !canCancel && <span className="text-xs text-ink-400">Closed ride</span>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Modal
        open={Boolean(cancelTarget)}
        onClose={() => (cancel.isPending ? undefined : setCancelTarget(null))}
        title="Cancel this ride?"
        description="All active passenger bookings on this ride will be cancelled by the backend."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelTarget(null)} disabled={cancel.isPending}>Keep ride</Button>
            <Button variant="danger" onClick={() => cancelTarget && cancel.mutate({ id: cancelTarget.id, reason: cancelReason || undefined })} loading={cancel.isPending}>
              Cancel ride
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {cancelTarget && (
            <p className="rounded-lg bg-ink-50 p-3 text-sm text-ink-700">
              {cancelTarget.originAddress} → {cancelTarget.destAddress} · {formatSmartDateTime(cancelTarget.departureTime)}
            </p>
          )}
          <Input label="Reason (optional)" placeholder="e.g. Vehicle breakdown" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} />
          <p className="text-xs text-ink-500">Cancelling affects every passenger. Booking refunds follow the backend fare rules.</p>
        </div>
      </Modal>
    </div>
  );
}
