import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastTone = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  show: (title: string, options?: { description?: string; tone?: ToastTone }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (title: string, options?: { description?: string; tone?: ToastTone }) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, title, description: options?.description, tone: options?.tone ?? 'info' }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (title, description) => show(title, { description, tone: 'success' }),
      error: (title, description) => show(title, { description, tone: 'error' }),
      info: (title, description) => show(title, { description, tone: 'info' }),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lift animate-fade-up',
              toast.tone === 'success' && 'border-mint-200',
              toast.tone === 'error' && 'border-red-200',
              toast.tone === 'info' && 'border-brand-200',
            )}
          >
            {toast.tone === 'success' && <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-mint-600" />}
            {toast.tone === 'error' && <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />}
            {toast.tone === 'info' && <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-900">{toast.title}</p>
              {toast.description && <p className="mt-0.5 text-xs text-ink-500">{toast.description}</p>}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="rounded p-0.5 text-ink-400 hover:text-ink-700"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
