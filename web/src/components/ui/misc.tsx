import type { ReactNode } from 'react';
import { Star } from 'lucide-react';
import { cn, initials } from '@/lib/utils';

export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 font-bold text-white',
        sizes[size],
        className,
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function Stars({
  value,
  onChange,
  size = 16,
  className,
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        if (!onChange) {
          return (
            <Star
              key={star}
              style={{ width: size, height: size }}
              className={filled ? 'fill-amber-500 text-amber-500' : 'text-ink-300'}
            />
          );
        }
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <Star
              style={{ width: size, height: size }}
              className={filled ? 'fill-amber-500 text-amber-500' : 'text-ink-300'}
            />
          </button>
        );
      })}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'brand',
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: 'brand' | 'mint' | 'amber' | 'ink' | 'red';
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    mint: 'bg-mint-50 text-mint-700',
    amber: 'bg-amber-50 text-amber-700',
    ink: 'bg-ink-100 text-ink-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
          <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-ink-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
        </div>
        {icon && <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', tones[tone])}>{icon}</span>}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-4', className)}>
      <div>
        {eyebrow && <p className="text-xs font-bold uppercase tracking-widest text-brand-600">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
