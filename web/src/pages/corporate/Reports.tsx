import { useQuery } from '@tanstack/react-query';
import { Building2, FileBarChart, Users } from 'lucide-react';
import {
  Badge,
  Button,
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
import { corporateApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { useSelectedCompany } from '@/lib/entity-selection';
import { formatCurrency } from '@/lib/utils';

export function CorporateReportsPage() {
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

  const report = reportQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Corporate reports"
        description={`Commute metrics for ${company.name}.`}
        actions={
          <div className="flex flex-wrap items-end gap-3">
            <EntitySwitcher label="Company" items={companies.map((item) => ({ id: item.id, label: item.name }))} value={companyId} onChange={selectCompany} />
            <Button variant="outline" onClick={() => window.print()}>Print / save as PDF</Button>
          </div>
        }
      />

      {reportQuery.isLoading && <LoadingBlock label="Loading report…" />}
      {reportQuery.isError && <ErrorState title="Could not load report" description={getApiErrorMessage(reportQuery.error)} onRetry={() => reportQuery.refetch()} />}

      {report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Employees" value={report.employees} hint={`${report.verifiedEmployees} verified`} icon={<Users className="h-5 w-5" />} tone="brand" />
            <StatCard label="Shuttles" value={report.shuttles} hint={`${report.totalShuttleSeats} seats offered`} icon={<FileBarChart className="h-5 w-5" />} tone="mint" />
            <StatCard label="Locations" value={report.locations} hint="Office and pickup points" icon={<Building2 className="h-5 w-5" />} tone="amber" />
            <StatCard label="Est. monthly spend" value={formatCurrency(report.estimatedMonthlyTransportSpend)} hint="Based on published shuttles" icon={<FileBarChart className="h-5 w-5" />} tone="ink" />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Verification coverage</CardTitle>
                <Badge tone={report.employees > 0 && report.verifiedEmployees === report.employees ? 'success' : 'warning'}>
                  {report.employees === 0 ? 'No employees' : `${Math.round((report.verifiedEmployees / report.employees) * 100)}%`}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-2.5 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-mint-500"
                    style={{ width: `${report.employees === 0 ? 0 : (report.verifiedEmployees / report.employees) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-ink-600">{report.verifiedEmployees} of {report.employees} employees are verified for company shuttles.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seat capacity</CardTitle>
                <Badge tone="neutral">{report.totalShuttleSeats} seats</Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="flex justify-between border-b border-ink-100 pb-2"><span className="text-ink-500">Shuttles</span><span className="font-semibold">{report.shuttles}</span></p>
                <p className="flex justify-between border-b border-ink-100 pb-2"><span className="text-ink-500">Total seats offered</span><span className="font-semibold">{report.totalShuttleSeats}</span></p>
                <p className="flex justify-between"><span className="text-ink-500">Est. monthly spend</span><span className="font-semibold">{formatCurrency(report.estimatedMonthlyTransportSpend)}</span></p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-brand-100 bg-brand-50/50">
            <CardHeader>
              <CardTitle>Report note</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-ink-700">{report.note}</CardContent>
          </Card>
        </>
      )}

      <p className="text-xs text-ink-400">
        Figures are computed from current employees, locations and shuttles. Trip-level utilisation and
        CO₂ reporting are not exposed by this backend.
      </p>
    </div>
  );
}
