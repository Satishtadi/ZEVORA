import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Bus, MapPin, TrendingUp, UserCheck, Users } from 'lucide-react';
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

export function CorporateDashboardPage() {
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
  if (!company) {
    return (
      <EmptyState
        icon={<Building2 className="h-6 w-6" />}
        title="No company linked to this account"
        description="Ask a platform administrator to attach your corporate admin account to a company."
      />
    );
  }

  const report = reportQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={company.name}
        description={`${company.domain} · Employee commute operations`}
        actions={
          <div className="flex flex-wrap items-end gap-3">
            <EntitySwitcher label="Company" items={companies.map((item) => ({ id: item.id, label: item.name }))} value={companyId} onChange={selectCompany} />
            <Link to="/corporate/employees"><Button>Manage employees</Button></Link>
          </div>
        }
      />

      {reportQuery.isLoading && <LoadingBlock label="Loading company snapshot…" />}
      {reportQuery.isError && <ErrorState title="Could not load company report" description={getApiErrorMessage(reportQuery.error)} onRetry={() => reportQuery.refetch()} />}

      {report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Employees" value={report.employees} hint={`${report.verifiedEmployees} verified`} icon={<Users className="h-5 w-5" />} tone="brand" />
            <StatCard label="Shuttles" value={report.shuttles} hint={`${report.totalShuttleSeats} seats`} icon={<Bus className="h-5 w-5" />} tone="mint" />
            <StatCard label="Office locations" value={report.locations} hint="Configured pickup points" icon={<MapPin className="h-5 w-5" />} tone="amber" />
            <StatCard label="Est. monthly spend" value={formatCurrency(report.estimatedMonthlyTransportSpend)} hint="Derived from shuttle fares" icon={<TrendingUp className="h-5 w-5" />} tone="ink" />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Verification progress</CardTitle>
                <Badge tone={report.verifiedEmployees === report.employees ? 'success' : 'warning'}>
                  {report.employees === 0 ? 'No employees' : `${Math.round((report.verifiedEmployees / report.employees) * 100)}% verified`}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-2.5 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-mint-500"
                    style={{ width: `${report.employees === 0 ? 0 : (report.verifiedEmployees / report.employees) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-ink-600">
                  Verified employees can be matched to company shuttles. Verification is manual because
                  this build has no HRMS integration.
                </p>
                <p className="rounded-lg bg-ink-50 p-3 text-xs text-ink-500">{report.note}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick actions</CardTitle>
                <UserCheck className="h-4 w-4 text-ink-400" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/corporate/employees" className="block"><Button variant="outline" fullWidth>Add or verify employees</Button></Link>
                <Link to="/corporate/locations" className="block"><Button variant="outline" fullWidth>Add office locations</Button></Link>
                <Link to="/corporate/shuttles" className="block"><Button variant="outline" fullWidth>Publish a shuttle</Button></Link>
                <Link to="/corporate/reports" className="block"><Button variant="outline" fullWidth>View reports</Button></Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <p className="text-xs text-ink-400">
        This backend exposes company read/create, employee verification, locations, shuttles and a
        report endpoint. Department CRUD and recurring commute schedules are not available.
      </p>
    </div>
  );
}
