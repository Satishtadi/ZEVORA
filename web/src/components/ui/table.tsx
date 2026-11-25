import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function TableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto rounded-2xl border border-ink-100 bg-white', className)}>
      <table className="w-full min-w-[680px] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-ink-50/80 text-xs uppercase tracking-wide text-ink-500">{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-ink-100">{children}</tbody>;
}

export function TR({ children, className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('transition-colors hover:bg-ink-50/60', className)} {...props}>
      {children}
    </tr>
  );
}

export function TH({ children, className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn('whitespace-nowrap px-4 py-3 font-semibold', className)} {...props}>
      {children}
    </th>
  );
}

export function TD({ children, className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-4 py-3.5 align-middle text-ink-700', className)} {...props}>
      {children}
    </td>
  );
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 px-1 py-3 text-sm text-ink-500">
      <span>
        Page {page + 1} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 font-medium text-ink-700 disabled:opacity-40"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <button
          className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 font-medium text-ink-700 disabled:opacity-40"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
