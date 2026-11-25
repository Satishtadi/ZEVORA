import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2, RefreshCw, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-brand-600', className)} />;
}

export function LoadingBlock({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-ink-100 bg-white p-8', className)}>
      <Spinner className="h-7 w-7" />
      <p className="text-sm font-medium text-ink-500">{label}</p>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-ink-100', className)} />;
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 rounded-2xl border border-ink-100 bg-white p-5">
      <Skeleton className="h-5 w-2/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-3.5 w-full" />
      ))}
      <Skeleton className="h-9 w-32" />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-12 text-center', className)}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-bold text-ink-900">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 px-6 py-10 text-center', className)}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-ink-900">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-ink-600">{description}</p>}
      {onRetry && (
        <Button className="mt-5" variant="outline" size="sm" onClick={onRetry} leftIcon={<RefreshCw className="h-4 w-4" />}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function OfflineBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-semibold text-ink-950">
      <WifiOff className="h-4 w-4" />
      You are offline. Some actions may not be available.
    </div>
  );
}
