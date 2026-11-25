import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText } from 'lucide-react';
import {
  Badge,
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  Pagination,
  TBody,
  TD,
  TH,
  THead,
  TR,
  TableWrap,
} from '@/components/ui';
import { adminApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { formatSmartDateTime } from '@/lib/utils';

export function AdminAuditLogsPage() {
  const [page, setPage] = useState(0);
  const logsQuery = useQuery({ queryKey: ['admin', 'audit', page], queryFn: () => adminApi.auditLogs(page, 20) });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit logs"
        description="Backend-recorded administrative and system actions. Read-only in this build."
        actions={<Badge tone="neutral">{logsQuery.data?.totalElements ?? 0} entries</Badge>}
      />

      {logsQuery.isLoading && <LoadingBlock label="Loading audit logs…" />}
      {logsQuery.isError && <ErrorState title="Could not load audit logs" description={getApiErrorMessage(logsQuery.error)} onRetry={() => logsQuery.refetch()} />}

      {!logsQuery.isLoading && !logsQuery.isError && (logsQuery.data?.items ?? []).length === 0 && (
        <EmptyState icon={<ScrollText className="h-6 w-6" />} title="No audit entries" description="Administrative actions will be recorded here." />
      )}

      {(logsQuery.data?.items ?? []).length > 0 && (
        <>
          <TableWrap>
            <THead>
              <TR>
                <TH>Action</TH>
                <TH>Actor</TH>
                <TH>Entity</TH>
                <TH>Details</TH>
                <TH>Recorded</TH>
              </TR>
            </THead>
            <TBody>
              {(logsQuery.data?.items ?? []).map((log) => (
                <TR key={log.id}>
                  <TD className="font-semibold text-ink-800">{log.action}</TD>
                  <TD className="font-mono text-xs text-ink-500">{log.actorId ? log.actorId.slice(0, 8) : 'system'}</TD>
                  <TD>
                    <p className="text-sm text-ink-700">{log.entityType ?? '—'}</p>
                    <p className="font-mono text-xs text-ink-400">{log.entityId ? log.entityId.slice(0, 8) : ''}</p>
                  </TD>
                  <TD className="max-w-md text-xs text-ink-600">{log.details || '—'}</TD>
                  <TD className="text-xs text-ink-500">{formatSmartDateTime(log.createdAt)}</TD>
                </TR>
              ))}
            </TBody>
          </TableWrap>
          <Pagination page={logsQuery.data?.page ?? 0} totalPages={logsQuery.data?.totalPages ?? 0} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
