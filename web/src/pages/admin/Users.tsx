import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, ShieldBan, ShieldCheck, Users } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  Input,
  LoadingBlock,
  Modal,
  PageHeader,
  Pagination,
  StatusBadge,
  TBody,
  TD,
  TH,
  THead,
  TR,
  TableWrap,
  useToast,
} from '@/components/ui';
import { adminApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { roleLabels } from '@/lib/roles';
import type { AdminUserSummary } from '@/types';

export function AdminUsersPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [target, setTarget] = useState<AdminUserSummary | null>(null);
  const [reason, setReason] = useState('');

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', appliedSearch, page],
    queryFn: () => adminApi.users(appliedSearch, page, 20),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, suspend, note }: { id: string; suspend: boolean; note?: string }) =>
      adminApi.setUserStatus(id, suspend, note),
    onSuccess: async (_data, variables) => {
      toast.success(variables.suspend ? 'User suspended' : 'User reactivated');
      setTarget(null);
      setReason('');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (error) => toast.error('Could not update user status', getApiErrorMessage(error)),
  });

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setAppliedSearch(search.trim());
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Search accounts and suspend or reactivate access. Role changes are handled by the platform team."
        actions={<Badge tone="neutral">{usersQuery.data?.totalElements ?? 0} users</Badge>}
      />

      <Card>
        <CardContent className="p-4">
          <form onSubmit={submitSearch} className="flex flex-wrap items-end gap-2">
            <Input
              label="Search users"
              placeholder="Name, email or phone"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              wrapperClassName="min-w-[240px] flex-1"
            />
            <Button type="submit">Search</Button>
            {appliedSearch && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSearch('');
                  setAppliedSearch('');
                  setPage(0);
                }}
              >
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {usersQuery.isLoading && <LoadingBlock label="Loading usersâ€¦" />}
      {usersQuery.isError && <ErrorState title="Could not load users" description={getApiErrorMessage(usersQuery.error)} onRetry={() => usersQuery.refetch()} />}

      {!usersQuery.isLoading && !usersQuery.isError && (usersQuery.data?.items ?? []).length === 0 && (
        <EmptyState icon={<Users className="h-6 w-6" />} title="No users match this search" description="Try a different name, email or phone number." />
      )}

      {(usersQuery.data?.items ?? []).length > 0 && (
        <>
          <TableWrap>
            <THead>
              <TR>
                <TH>User</TH>
                <TH>Contact</TH>
                <TH>Role</TH>
                <TH>Status</TH>
                <TH>Action</TH>
              </TR>
            </THead>
            <TBody>
              {(usersQuery.data?.items ?? []).map((user) => (
                <TR key={user.id}>
                  <TD>
                    <p className="font-semibold text-ink-800">{user.fullName}</p>
                    <p className="text-xs text-ink-400">{user.id.slice(0, 8)}</p>
                  </TD>
                  <TD>
                    <p className="text-sm text-ink-700">{user.email}</p>
                    <p className="text-xs text-ink-400">{user.phone}</p>
                  </TD>
                  <TD>{roleLabels[user.role]}</TD>
                  <TD><StatusBadge status={user.status} /></TD>
                  <TD>
                    {user.status === 'SUSPENDED' ? (
                      <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: user.id, suspend: false })} leftIcon={<ShieldCheck className="h-3.5 w-3.5" />}>
                        Reactivate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setTarget(user);
                          setReason('');
                        }}
                        leftIcon={<ShieldBan className="h-3.5 w-3.5" />}
                      >
                        Suspend
                      </Button>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </TableWrap>
          <Pagination page={usersQuery.data?.page ?? 0} totalPages={usersQuery.data?.totalPages ?? 0} onPageChange={setPage} />
        </>
      )}

      <Modal
        open={Boolean(target)}
        onClose={() => (setStatus.isPending ? undefined : setTarget(null))}
        title={`Suspend ${target?.fullName ?? 'user'}?`}
        description="The backend records the suspension reason for audit purposes."
        footer={
          <>
            <Button variant="ghost" onClick={() => setTarget(null)} disabled={setStatus.isPending}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => target && setStatus.mutate({ id: target.id, suspend: true, note: reason || undefined })}
              loading={setStatus.isPending}
            >
              Suspend user
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {target && (
            <p className="rounded-lg bg-ink-50 p-3 text-sm text-ink-700">{target.fullName} Â· {target.email} Â· {roleLabels[target.role]}</p>
          )}
          <Input label="Reason (optional)" placeholder="e.g. Safety policy violation" value={reason} onChange={(event) => setReason(event.target.value)} />
          <p className="text-xs text-ink-500">Suspension blocks sign-in and protected API access through the backend security layer.</p>
        </div>
      </Modal>
    </div>
  );
}

