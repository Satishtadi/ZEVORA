import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { portalForRole, portalHome, type Portal } from '@/lib/roles';
import { LoadingBlock } from '@/components/ui';

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 p-6">
      <LoadingBlock label="Preparing your ZEVORA workspace…" className="w-full max-w-sm" />
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
}

export function RequirePortal({ portal, children }: { portal: Portal; children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  const userPortal = portalForRole(user.role);
  if (userPortal !== portal) return <Navigate to={portalHome[userPortal]} replace />;
  return <>{children}</>;
}

export function PublicOnly({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageLoader />;
  if (user) return <Navigate to={portalHome[portalForRole(user.role)]} replace />;
  return <>{children}</>;
}
