import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const baseField =
  'w-full rounded-xl border bg-white text-ink-900 placeholder:text-ink-400 shadow-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400';

function FieldShell({
  id,
  label,
  error,
  hint,
  required,
  children,
  className,
}: {
  id: string;
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-ink-800">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, hint, leftIcon, rightIcon, wrapperClassName, id, required, ...props },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} required={required} className={wrapperClassName}>
      <div className="relative">
        {leftIcon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">{leftIcon}</span>}
        <input
          ref={ref}
          id={fieldId}
          className={cn(
            baseField,
            'h-11 px-3.5 text-sm',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-ink-200',
            className,
          )}
          aria-invalid={!!error}
          required={required}
          {...props}
        />
        {rightIcon && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400">{rightIcon}</span>}
      </div>
    </FieldShell>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, label, error, hint, wrapperClassName, id, required, ...props },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} required={required} className={wrapperClassName}>
      <textarea
        ref={ref}
        id={fieldId}
        className={cn(baseField, 'min-h-24 px-3.5 py-2.5 text-sm', error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-ink-200', className)}
        aria-invalid={!!error}
        required={required}
        {...props}
      />
    </FieldShell>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, error, hint, wrapperClassName, id, required, children, ...props },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} required={required} className={wrapperClassName}>
      <select
        ref={ref}
        id={fieldId}
        className={cn(baseField, 'h-11 px-3 text-sm', error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-ink-200', className)}
        aria-invalid={!!error}
        required={required}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
});

export function Checkbox({
  label,
  description,
  className,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; description?: string }) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <label htmlFor={fieldId} className={cn('flex cursor-pointer items-start gap-3', className)}>
      <input
        id={fieldId}
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
        {...props}
      />
      <span>
        <span className="block text-sm font-medium text-ink-800">{label}</span>
        {description && <span className="block text-xs text-ink-500">{description}</span>}
      </span>
    </label>
  );
}
