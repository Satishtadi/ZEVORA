import { useQuery } from '@tanstack/react-query';
import { Building2, Mail, ShieldCheck } from 'lucide-react';
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
  StatusBadge,
} from '@/components/ui';
import { EntitySwitcher } from '@/components/shared/EntitySwitcher';
import { corporateApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useSelectedCompany } from '@/lib/entity-selection';
import { initials } from '@/lib/utils';

export function CorporateProfilePage() {
  const { user } = useAuth();
  const { companiesQuery, companies, company, companyId, selectCompany } = useSelectedCompany();
  const reportQuery = useQuery({
    queryKey: ['corporate', 'report', companyId],
    queryFn: () => corporateApi.report(companyId),
    enabled: Boolean(companyId),
  });

  if (companiesQuery.isLoading) return <LoadingBlock label="Loading company…" />;
  if (companiesQuery.isError) {
    return <ErrorState title="Could not load your company" description={getApiErrorMessage(companiesQuery.error)} onRetry={() => companiesQuery.refetch()} />;
  }
  if (!company) return <EmptyState icon={<Building2 className="h-6 w-6" />} title="No company linked" description="Ask a platform administrator to attach your corporate account to a company." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company profile"
        description="Company identity and admin contact details."
        actions={<EntitySwitcher label="Company" items={companies.map((item) => ({ id: item.id, label: item.name }))} value={companyId} onChange={selectCompany} />}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" /> {company.name}</CardTitle>
            <StatusBadge status={company.status} />
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-4 rounded-xl bg-ink-50 p-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-lg font-bold text-white">
                {initials(company.name)}
              </span>
              <div>
                <p className="text-lg font-bold text-ink-900">{company.name}</p>
                <p className="text-ink-500">{company.domain}</p>
              </div>
            </div>
            <p className="flex items-center justify-between border-b border-ink-100 pb-3">
              <span className="text-ink-500">Corporate domain</span>
              <span className="font-semibold">{company.domain}</span>
            </p>
            <p className="flex items-center justify-between border-b border-ink-100 pb-3">
              <span className="text-ink-500">Contact email</span>
              <span className="font-semibold">{company.contactEmail || '—'}</span>
            </p>
            <p className="flex items-center justify-between border-b border-ink-100 pb-3">
              <span className="text-ink-500">Company ID</span>
              <span className="font-mono text-xs">{company.id}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-ink-500">Employees / shuttles</span>
              <span className="font-semibold">{reportQuery.data ? `${reportQuery.data.employees} / ${reportQuery.data.shuttles}` : '—'}</span>
            </p>
            {company.contactEmail && (
              <a
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline"
                href={`mailto:${company.contactEmail}`}
              >
                <Mail className="h-4 w-4" /> Contact company admin
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
            <Badge tone="success">CORPORATE_ADMIN</Badge>
            <p className="rounded-lg bg-ink-50 p-3 text-xs text-ink-500">
              Company details are provisioned by the platform team. This backend does not expose an
              update-company endpoint.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
