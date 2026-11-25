import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Wallet } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  EmptyState,
  ErrorState,
  Input,
  LoadingBlock,
  Modal,
  PageHeader,
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
import { formatCurrency } from '@/lib/utils';
import type { PricingRule } from '@/types';

export function AdminPricingPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<PricingRule | null>(null);
  const [form, setForm] = useState({ name: '', baseFare: '', perKm: '', perMinute: '', platformFeePct: '', minFare: '', active: true });

  const rulesQuery = useQuery({ queryKey: ['admin', 'pricing'], queryFn: adminApi.pricingRules });

  const update = useMutation({
    mutationFn: () => {
      if (!target) throw new Error('No rule selected');
      return adminApi.updatePricing(target.id, {
        name: form.name,
        baseFare: Number(form.baseFare),
        perKm: Number(form.perKm),
        perMinute: Number(form.perMinute),
        platformFeePct: Number(form.platformFeePct),
        minFare: form.minFare ? Number(form.minFare) : null,
        active: form.active,
      });
    },
    onSuccess: async () => {
      toast.success('Pricing rule updated');
      setTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'pricing'] });
    },
    onError: (error) => toast.error('Could not update pricing', getApiErrorMessage(error)),
  });

  const openEdit = (rule: PricingRule) => {
    setTarget(rule);
    setForm({
      name: rule.name,
      baseFare: String(rule.baseFare),
      perKm: String(rule.perKm),
      perMinute: String(rule.perMinute),
      platformFeePct: String(rule.platformFeePct),
      minFare: rule.minFare != null ? String(rule.minFare) : '',
      active: rule.active,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing rules"
        description="Backend pricing configuration used for fare estimates and platform fees."
        actions={<Badge tone="neutral">{rulesQuery.data?.length ?? 0} rules</Badge>}
      />

      {rulesQuery.isLoading && <LoadingBlock label="Loading pricing rules…" />}
      {rulesQuery.isError && <ErrorState title="Could not load pricing" description={getApiErrorMessage(rulesQuery.error)} onRetry={() => rulesQuery.refetch()} />}

      {!rulesQuery.isLoading && !rulesQuery.isError && (rulesQuery.data ?? []).length === 0 && (
        <EmptyState icon={<Wallet className="h-6 w-6" />} title="No pricing rules" description="Pricing rules are seeded by the backend." />
      )}

      {(rulesQuery.data ?? []).length > 0 && (
        <TableWrap>
          <THead>
            <TR>
              <TH>Code</TH>
              <TH>Name</TH>
              <TH>Type</TH>
              <TH>Base</TH>
              <TH>Per km</TH>
              <TH>Per min</TH>
              <TH>Fee %</TH>
              <TH>Min fare</TH>
              <TH>Active</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {(rulesQuery.data ?? []).map((rule) => (
              <TR key={rule.id}>
                <TD className="font-mono text-xs text-ink-600">{rule.code}</TD>
                <TD className="font-semibold text-ink-800">{rule.name}</TD>
                <TD className="text-xs text-ink-500">{rule.type}</TD>
                <TD>{formatCurrency(rule.baseFare, true)}</TD>
                <TD>{formatCurrency(rule.perKm, true)}</TD>
                <TD>{formatCurrency(rule.perMinute, true)}</TD>
                <TD>{rule.platformFeePct}%</TD>
                <TD>{rule.minFare != null ? formatCurrency(rule.minFare, true) : '—'}</TD>
                <TD><StatusBadge status={rule.active ? 'ACTIVE' : 'SUSPENDED'} /></TD>
                <TD><Button size="sm" variant="outline" onClick={() => openEdit(rule)} leftIcon={<Pencil className="h-3.5 w-3.5" />}>Edit</Button></TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}

      <p className="text-xs text-ink-400">
        Updates apply to future backend calculations. Existing bookings keep their recorded amounts.
      </p>

      <Modal
        open={Boolean(target)}
        onClose={() => (update.isPending ? undefined : setTarget(null))}
        title={`Edit ${target?.name ?? 'pricing rule'}`}
        description={target ? `${target.code} · ${target.type}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setTarget(null)} disabled={update.isPending}>Cancel</Button>
            <Button onClick={() => update.mutate()} loading={update.isPending}>Save rule</Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} wrapperClassName="sm:col-span-2" />
          <Input label="Base fare (₹)" type="number" min={0} step="0.01" value={form.baseFare} onChange={(event) => setForm({ ...form, baseFare: event.target.value })} />
          <Input label="Per km (₹)" type="number" min={0} step="0.01" value={form.perKm} onChange={(event) => setForm({ ...form, perKm: event.target.value })} />
          <Input label="Per minute (₹)" type="number" min={0} step="0.01" value={form.perMinute} onChange={(event) => setForm({ ...form, perMinute: event.target.value })} />
          <Input label="Platform fee (%)" type="number" min={0} step="0.01" value={form.platformFeePct} onChange={(event) => setForm({ ...form, platformFeePct: event.target.value })} />
          <Input label="Minimum fare (₹, optional)" type="number" min={0} step="0.01" value={form.minFare} onChange={(event) => setForm({ ...form, minFare: event.target.value })} />
          <div className="flex items-end pb-2">
            <Checkbox label="Active rule" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
