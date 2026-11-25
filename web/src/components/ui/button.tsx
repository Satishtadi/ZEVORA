import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'dark';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white shadow-soft hover:bg-brand-700 focus-visible:ring-brand-500 disabled:bg-brand-300',
  secondary:
    'bg-brand-50 text-brand-700 hover:bg-brand-100 focus-visible:ring-brand-400 disabled:text-brand-300',
  outline:
    'border border-ink-200 bg-white text-ink-800 hover:border-ink-300 hover:bg-ink-50 focus-visible:ring-brand-400',
  ghost: 'text-ink-700 hover:bg-ink-100 focus-visible:ring-ink-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-400 disabled:bg-red-300',
  success: 'bg-mint-600 text-white hover:bg-mint-700 focus-visible:ring-mint-400 disabled:bg-mint-300',
  dark: 'bg-ink-950 text-white hover:bg-ink-900 focus-visible:ring-ink-700',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
  icon: 'h-10 w-10 rounded-xl',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, leftIcon, rightIcon, fullWidth, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed',
        'active:translate-y-px',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});
