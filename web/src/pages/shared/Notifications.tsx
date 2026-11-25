import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { Badge, Button, Card, EmptyState, ErrorState, LoadingBlock, PageHeader, useToast } from '@/components/ui';
import { notificationsApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { cn, formatRelative } from '@/lib/utils';

const typeTone: Record<string, 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  BOOKING: 'brand',
  CANCELLATION: 'danger',
  SAFETY: 'danger',
  SYSTEM: 'neutral',
  PAYMENT: 'success',
  VERIFICATION: 'warning',
};

export function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.list,
  });

  const markRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    } catch (err) {
      toast.error('Could not mark as read', getApiErrorMessage(err));
    }
  };

  const markAll = async () => {
    const unread = (data ?? []).filter((n) => !n.read);
    if (!unread.length) return;
    try {
      await Promise.all(unread.map((n) => notificationsApi.markRead(n.id)));
      toast.success('All notifications marked as read');
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    } catch (err) {
      toast.error('Could not mark all as read', getApiErrorMessage(err));
    }
  };

  const items = (data ?? []).filter((item) => (filter === 'unread' ? !item.read : true));
  const unreadCount = (data ?? []).filter((item) => !item.read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Booking updates, safety alerts, verification results and payment records."
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={unreadCount ? 'brand' : 'neutral'}>{unreadCount} unread</Badge>
            <Button variant="outline" size="sm" onClick={markAll} disabled={!unreadCount} leftIcon={<CheckCheck className="h-4 w-4" />}>
              Mark all read
            </Button>
          </div>
        }
      />

      <div className="flex gap-2">
        {(['all', 'unread'] as const).map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
              filter === value ? 'bg-ink-950 text-white' : 'bg-white text-ink-600 ring-1 ring-inset ring-ink-200 hover:bg-ink-50',
            )}
          >
            {value === 'all' ? 'All' : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {isLoading && <LoadingBlock label="Loading notifications…" />}
      {isError && <ErrorState title="Could not load notifications" description={getApiErrorMessage(error)} onRetry={() => refetch()} />}

      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          description="Notifications appear here when bookings, payments, verifications or safety events change."
        />
      )}

      {items.length > 0 && (
        <Card>
          <ul className="divide-y divide-ink-100">
            {items.map((item) => (
              <li key={item.id} className={cn('flex items-start gap-3 p-4 sm:p-5', !item.read && 'bg-brand-50/40')}>
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 ring-1 ring-inset ring-ink-100">
                  <Bell className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-ink-900">{item.title}</p>
                    <Badge tone={typeTone[item.type] ?? 'neutral'}>{item.type}</Badge>
                    {!item.read && <span className="h-2 w-2 rounded-full bg-brand-500" aria-label="Unread" />}
                  </div>
                  <p className="mt-1 text-sm text-ink-600">{item.message}</p>
                  <p className="mt-1 text-xs text-ink-400">{formatRelative(item.createdAt)}</p>
                </div>
                {!item.read && (
                  <Button variant="ghost" size="sm" onClick={() => markRead(item.id)}>
                    Mark read
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
