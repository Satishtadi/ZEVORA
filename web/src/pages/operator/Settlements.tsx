import { useQuery } from '@tanstack/react-query';
import { CircleDollarSign, Info, ListOrdered } from 'lucide-react';
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
  StatCard,
} from '@/components/ui';
import { EntitySwitcher } from '@/components/shared/EntitySwitcher';
import { operatorApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { useSelectedOperator } from '@/lib/entity-selection';
import { formatCurrency } from '@/lib/utils';

export function OperatorSettlementsPage() {
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
  if (!operator) return <EmptyState icon={<ListOrdered className="h-6 w-6" />} title="No transport operator linked" description="Ask a platform administrator to attach your account to an operator." />;

  const summary = summaryQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settlements"
        description="Revenue indicators and settlement readiness for this operator."
        actions={<EntitySwitcher label="Operator" items={operators.map((item) => ({ id: item.id, label: item.name }))} value={operatorId} onChange={selectOperator} />}
      />

      {summaryQuery.isLoading && <LoadingBlock label="Loading revenue indicators…" />}
      {summaryQuery.isError && <ErrorState title="Could not load revenue indicators" description={getApiErrorMessage(summaryQuery.error)} onRetry={() => summaryQuery.refetch()} />}

      {summary && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Estimated monthly revenue" value={formatCurrency(summary.estimatedMonthlyRevenue)} hint="Derived from active schedules" icon={<CircleDollarSign className="h-5 w-5" />} tone="mint" />
            <StatCard label="Daily seat capacity" value={summary.dailySeatCapacity} hint={`${summary.schedules} schedules`} icon={<ListOrdered className="h-5 w-5" />} tone="brand" />
            <StatCard label="Routes" value={summary.routes} hint={`${summary.vehicles} vehicles · ${summary.drivers} drivers`} icon={<ListOrdered className="h-5 w-5" />} tone="ink" />
          </div>

          <Card className="border-amber-100 bg-amber-50/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900"><Info className="h-4 w-4" /> Settlement processing is not available</CardTitle>
              <Badge tone="warning">Read-only estimate</Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-amber-900">
              <p>{summary.note}</p>
              <p>
                This backend does not expose settlement batches, payout statements, commission
                deductions or bank-transfer status. The figure above is a backend-calculated estimate,
                not a payable amount.
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>No settlement history or downloadable statements.</li>
                <li>No payout account or bank details management.</li>
                <li>No dispute or adjustment workflow.</li>
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      <p className="text-xs text-ink-400">
        When settlement APIs are added to the backend, this page should be replaced with batch and
        payout tables rather than estimates.
      </p>
    </div>
  );
}
