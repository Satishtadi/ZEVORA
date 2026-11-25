import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-ink-100 bg-white shadow-soft', className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-5 py-4', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-bold text-ink-900', className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-0.5 text-sm text-ink-500', className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-4', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 px-5 py-3.5', className)} {...props} />;
}

const tones = {
  neutral: 'bg-ink-100 text-ink-700 ring-ink-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  success: 'bg-mint-50 text-mint-700 ring-mint-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const statusTone: Record<string, BadgeTone> = {
  ACTIVE: 'success',
  APPROVED: 'success',
  VERIFIED: 'success',
  PAID: 'success',
  CONFIRMED: 'success',
  COMPLETED: 'success',
  PUBLISHED: 'success',
  RESOLVED: 'success',
  PENDING: 'warning',
  REQUESTED: 'warning',
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  DRAFT: 'neutral',
  FULL: 'info',
  SUSPENDED: 'danger',
  REJECTED: 'danger',
  CANCELLED: 'danger',
  FAILED: 'danger',
  REFUNDED: 'info',
  ACKNOWLEDGED: 'info',
  DELETED: 'danger',
};

export function StatusBadge({ status, className }: { status?: string | null; className?: string }) {
  if (!status) return <Badge tone="neutral" className={className}>Unknown</Badge>;
  const label = status
    .toLowerCase()
    .split('_')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
  return (
    <Badge tone={statusTone[status] ?? 'neutral'} className={className}>
      {label}
    </Badge>
  );
}
