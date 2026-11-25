import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Settings } from 'lucide-react';
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
  TBody,
  TD,
  TH,
  THead,
  TR,
  TableWrap,
  Textarea,
  useToast,
} from '@/components/ui';
import { adminApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { formatSmartDateTime } from '@/lib/utils';
import type { SystemSetting } from '@/types';

export function AdminSettingsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<SystemSetting | null>(null);
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');

  const settingsQuery = useQuery({ queryKey: ['admin', 'settings'], queryFn: adminApi.settings });

  const update = useMutation({
    mutationFn: () => {
      if (!target) throw new Error('No setting selected');
      return adminApi.updateSetting(target.settingKey, value, description || undefined);
    },
    onSuccess: async () => {
      toast.success('Setting updated');
      setTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
    onError: (error) => toast.error('Could not update setting', getApiErrorMessage(error)),
  });

  const openEdit = (setting: SystemSetting) => {
    setTarget(setting);
    setValue(setting.settingValue);
    setDescription(setting.description ?? '');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System settings"
        description="Runtime configuration stored by the backend. Changes may affect matching, fees and safety thresholds."
        actions={<Badge tone="neutral">{settingsQuery.data?.length ?? 0} settings</Badge>}
      />

      {settingsQuery.isLoading && <LoadingBlock label="Loading settings…" />}
      {settingsQuery.isError && <ErrorState title="Could not load settings" description={getApiErrorMessage(settingsQuery.error)} onRetry={() => settingsQuery.refetch()} />}

      {!settingsQuery.isLoading && !settingsQuery.isError && (settingsQuery.data ?? []).length === 0 && (
        <EmptyState icon={<Settings className="h-6 w-6" />} title="No settings configured" description="Settings are seeded by the backend." />
      )}

      {(settingsQuery.data ?? []).length > 0 && (
        <TableWrap>
          <THead>
            <TR>
              <TH>Key</TH>
              <TH>Value</TH>
              <TH>Description</TH>
              <TH>Updated</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {(settingsQuery.data ?? []).map((setting) => (
              <TR key={setting.id}>
                <TD className="font-mono text-xs font-semibold text-ink-700">{setting.settingKey}</TD>
                <TD className="max-w-xs font-mono text-xs text-ink-600">{setting.settingValue}</TD>
                <TD className="max-w-sm text-xs text-ink-500">{setting.description || '—'}</TD>
                <TD className="text-xs text-ink-400">{setting.updatedAt ? formatSmartDateTime(setting.updatedAt) : '—'}</TD>
                <TD><Button size="sm" variant="outline" onClick={() => openEdit(setting)} leftIcon={<Pencil className="h-3.5 w-3.5" />}>Edit</Button></TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}

      <Card className="border-amber-100 bg-amber-50/60">
        <CardContent className="p-5 text-sm text-amber-900">
          <p className="font-bold">Change with care</p>
          <p className="mt-1">
            These values are read by backend services. Invalid values can change pricing, matching
            windows or safety behaviour. There is no settings audit trail beyond the general audit log.
          </p>
        </CardContent>
      </Card>

      <Modal
        open={Boolean(target)}
        onClose={() => (update.isPending ? undefined : setTarget(null))}
        title={`Edit ${target?.settingKey ?? 'setting'}`}
        description="The key is fixed; only the value and description can change."
        footer={
          <>
            <Button variant="ghost" onClick={() => setTarget(null)} disabled={update.isPending}>Cancel</Button>
            <Button onClick={() => update.mutate()} loading={update.isPending}>Save setting</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Setting key" value={target?.settingKey ?? ''} readOnly disabled />
          <Textarea label="Value" value={value} onChange={(event) => setValue(event.target.value)} rows={3} />
          <Textarea label="Description (optional)" value={description} onChange={(event) => setDescription(event.target.value)} rows={2} />
        </div>
      </Modal>
    </div>
  );
}
