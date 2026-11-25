import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 shadow-soft">
        <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M8 10h16L12 22h14" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="24" cy="10" r="2" fill="#6BE9CD" />
        </svg>
      </span>
      <span className="leading-none">
        <span className={cn('block text-lg font-extrabold tracking-tight', light ? 'text-white' : 'text-ink-950')}>
          ZEVORA
        </span>
        <span className={cn('mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.18em]', light ? 'text-white/60' : 'text-ink-400')}>
          Move Smart
        </span>
      </span>
    </span>
  );
}

export function LogoLink({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link to="/" className={cn('inline-flex', className)} aria-label="ZEVORA home">
      <Logo light={light} />
    </Link>
  );
}
