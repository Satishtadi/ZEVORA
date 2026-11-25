import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, BusFront, Mail, ShieldCheck } from 'lucide-react';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
} from '@/components/ui';
import { EntitySwitcher } from '@/components/shared/EntitySwitcher';
import { operatorApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useSelectedOperator } from '@/lib/entity-selection';
import { initials } from '@/lib/utils';

export function OperatorProfilePage() {
  const { user } = useAuth();
  const { operatorsQuery, operators, operator, operatorId, selectOperator } = useSelectedOperator();
  const summaryQuery = useQuery({
    queryKey: ['operator', 'summary', operatorId],
    queryFn: () => operatorApi.summary(operatorId),
    enabled: Boolean(operatorId),
  });

  if (operatorsQuery.isLoading) return <LoadingBlock label="Loading operator…" />;
  if (operatorsQuery.isError) {
    return <ErrorState title="Could not load operator" description={getApiErrorMessage(operatorsQuery.error)} onRetry={() => operatorsQuery.refetch()} />;
  }
  if (!operator) return <EmptyState icon={<BusFront className="h-6 w-6" />} title="No transport operator linked" description="Ask a platform administrator to attach your account to an operator." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operator profile"
        description="Operator identity and organisation details."
        actions={<EntitySwitcher label="Operator" items={operators.map((item) => ({ id: item.id, label: item.name }))} value={operatorId} onChange={selectOperator} />}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BusFront className="h-4 w-4" /> {operator.name}</CardTitle>
            <Badge tone={operator.verified ? 'success' : 'warning'}>{operator.verified ? 'Verified operator' : 'Verification pending'}</Badge>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-4 rounded-xl bg-ink-50 p-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-900 text-lg font-bold text-white">
                {initials(operator.name)}
              </span>
              <div>
                <p className="text-lg font-bold text-ink-900">{operator.name}</p>
                <p className="text-ink-500">Transport operator · {operator.status}</p>
              </div>
            </div>
            <p className="flex items-center justify-between border-b border-ink-100 pb-3">
              <span className="text-ink-500">Status</span>
              <span className="font-semibold">{operator.status}</span>
            </p>
            <p className="flex items-center justify-between border-b border-ink-100 pb-3">
              <span className="text-ink-500">Contact email</span>
              <span className="font-semibold">{operator.contactEmail || '—'}</span>
            </p>
            <p className="flex items-center justify-between border-b border-ink-100 pb-3">
              <span className="text-ink-500">Operator ID</span>
              <span className="font-mono text-xs">{operator.id}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-ink-500">Routes / schedules</span>
              <span className="font-semibold">{summaryQuery.data ? `${summaryQuery.data.routes} / ${summaryQuery.data.schedules}` : '—'}</span>
            </p>
            {operator.contactEmail && (
              <a className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline" href={`mailto:${operator.contactEmail}`}>
                <Mail className="h-4 w-4" /> Email operator contact
              </a>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your admin account</CardTitle>
            <ShieldCheck className="h-4 w-4 text-mint-600" />
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="font-semibold text-ink-900">{user?.fullName}</p>
            <p className="text-ink-500">{user?.email}</p>
            <p className="text-ink-500">{user?.phone}</p>
            <Badge tone="success">OPERATOR_ADMIN</Badge>
            <p className="rounded-lg bg-ink-50 p-3 text-xs text-ink-500">
              Operator details are provisioned by the platform team. This backend does not expose an
              update-operator endpoint.
            </p>
            {operator.verified && <p className="inline-flex items-center gap-1 text-xs text-mint-700"><BadgeCheck className="h-3.5 w-3.5" /> Platform verified</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
