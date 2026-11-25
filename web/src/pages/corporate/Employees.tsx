import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Plus, Search, ShieldCheck, UserX, UsersRound } from 'lucide-react';
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
  Select,
  TBody,
  TD,
  TH,
  THead,
  TR,
  TableWrap,
  useToast,
} from '@/components/ui';
import { EntitySwitcher } from '@/components/shared/EntitySwitcher';
import { corporateApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { hyderabadLocations } from '@/lib/hyderabad';
import { useSelectedCompany } from '@/lib/entity-selection';

interface EmployeeForm {
  email: string;
  employeeCode: string;
  department: string;
  officeAddress: string;
  officeLat: string;
  officeLng: string;
}

const emptyForm: EmployeeForm = { email: '', employeeCode: '', department: '', officeAddress: '', officeLat: '', officeLng: '' };

export function CorporateEmployeesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { companiesQuery, companies, company, companyId, selectCompany } = useSelectedCompany();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);

  const employeesQuery = useQuery({
    queryKey: ['corporate', 'employees', companyId],
    queryFn: () => corporateApi.employees(companyId),
    enabled: Boolean(companyId),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['corporate', 'employees'] });
    await queryClient.invalidateQueries({ queryKey: ['corporate', 'report'] });
  };

  const addEmployee = useMutation({
    mutationFn: () =>
      corporateApi.addEmployee(companyId, {
        email: form.email.trim(),
        employeeCode: form.employeeCode.trim() || undefined,
        department: form.department.trim() || undefined,
        officeAddress: form.officeAddress.trim() || undefined,
        officeLat: form.officeLat ? Number(form.officeLat) : undefined,
        officeLng: form.officeLng ? Number(form.officeLng) : undefined,
      }),
    onSuccess: async () => {
      toast.success('Employee added');
      setOpen(false);
      setForm(emptyForm);
      await invalidate();
    },
    onError: (error) => toast.error('Could not add employee', getApiErrorMessage(error)),
  });

  const verify = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
      corporateApi.verifyEmployee(companyId, id, verified),
    onSuccess: async (_data, variables) => {
      toast.success(variables.verified ? 'Employee verified' : 'Verification removed');
      await invalidate();
    },
    onError: (error) => toast.error('Could not update verification', getApiErrorMessage(error)),
  });

  if (companiesQuery.isLoading) return <LoadingBlock label="Loading companyâ€¦" />;
  if (companiesQuery.isError) {
    return <ErrorState title="Could not load your company" description={getApiErrorMessage(companiesQuery.error)} onRetry={() => companiesQuery.refetch()} />;
  }
  if (!company) {
    return <EmptyState icon={<UsersRound className="h-6 w-6" />} title="No company linked" description="Ask a platform administrator to attach your corporate account to a company." />;
  }

  const employees = (employeesQuery.data ?? []).filter((employee) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return [employee.fullName, employee.email, employee.employeeCode, employee.department].some((value) => value?.toLowerCase().includes(needle));
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Register colleagues and verify eligibility for company shuttles."
        actions={
          <div className="flex flex-wrap items-end gap-3">
            <EntitySwitcher label="Company" items={companies.map((item) => ({ id: item.id, label: item.name }))} value={companyId} onChange={selectCompany} />
            <Button onClick={() => setOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>Add employee</Button>
          </div>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <Input
            label="Filter employees"
            placeholder="Name, email, code or department"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            wrapperClassName="min-w-[240px] flex-1"
          />
          <Badge tone="neutral">{employees.length} shown</Badge>
        </CardContent>
      </Card>

      {employeesQuery.isLoading && <LoadingBlock label="Loading employeesâ€¦" />}
      {employeesQuery.isError && <ErrorState title="Could not load employees" description={getApiErrorMessage(employeesQuery.error)} onRetry={() => employeesQuery.refetch()} />}

      {!employeesQuery.isLoading && !employeesQuery.isError && employees.length === 0 && (
        <EmptyState
          icon={<UsersRound className="h-6 w-6" />}
          title={search ? 'No employees match this filter' : 'No employees yet'}
          description={search ? 'Try a different search term.' : 'Add your first colleague to start verifying shuttle eligibility.'}
        />
      )}

      {employees.length > 0 && (
        <TableWrap>
          <THead>
            <TR>
              <TH>Employee</TH>
              <TH>Code</TH>
              <TH>Department</TH>
              <TH>Office</TH>
              <TH>Status</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {employees.map((employee) => (
              <TR key={employee.id}>
                <TD>
                  <p className="font-semibold text-ink-800">{employee.fullName}</p>
                  <p className="text-xs text-ink-400">{employee.email} {employee.phone ? `Â· ${employee.phone}` : ''}</p>
                </TD>
                <TD className="font-mono text-xs">{employee.employeeCode || 'â€”'}</TD>
                <TD>{employee.department || 'â€”'}</TD>
                <TD className="max-w-xs text-xs text-ink-600">{employee.officeAddress || 'â€”'}</TD>
                <TD>
                  {employee.verified
                    ? <Badge tone="success"><CheckCircle2 className="mr-1 h-3 w-3" /> Verified</Badge>
                    : <Badge tone="warning">Pending</Badge>}
                </TD>
                <TD>
                  {employee.verified ? (
                    <Button size="sm" variant="ghost" onClick={() => verify.mutate({ id: employee.id, verified: false })} loading={verify.isPending} leftIcon={<UserX className="h-3.5 w-3.5" />}>
                      Remove verification
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => verify.mutate({ id: employee.id, verified: true })} loading={verify.isPending} leftIcon={<ShieldCheck className="h-3.5 w-3.5" />}>
                      Verify
                    </Button>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}

      <p className="text-xs text-ink-400">
        Adding an employee requires an existing ZEVORA account with this company's email domain. The
        backend returns a validation error if the user is not found.
      </p>

      <Modal
        open={open}
        onClose={() => (addEmployee.isPending ? undefined : setOpen(false))}
        title="Add employee"
        description={`Link a registered ZEVORA user to ${company.name}.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={addEmployee.isPending}>Cancel</Button>
            <Button onClick={() => addEmployee.mutate()} loading={addEmployee.isPending} disabled={!form.email.trim()}>Add employee</Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Work email" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} wrapperClassName="sm:col-span-2" placeholder={`name@${company.domain}`} />
          <Input label="Employee code" value={form.employeeCode} onChange={(event) => setForm({ ...form, employeeCode: event.target.value })} />
          <Input label="Department" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} />
          <Select
            label="Office location preset"
            value=""
            onChange={(event) => {
              const location = hyderabadLocations.find((item) => item.address === event.target.value);
              if (location) {
                setForm({ ...form, officeAddress: location.address, officeLat: String(location.lat), officeLng: String(location.lng) });
              }
            }}
            wrapperClassName="sm:col-span-2"
            hint="Optional â€” prefills the office address below."
          >
            <option value="">No preset</option>
            {hyderabadLocations.map((location) => <option key={location.address} value={location.address}>{location.name}</option>)}
          </Select>
          <Input label="Office address" value={form.officeAddress} onChange={(event) => setForm({ ...form, officeAddress: event.target.value })} wrapperClassName="sm:col-span-2" />
          <Input label="Office latitude" type="number" step="any" value={form.officeLat} onChange={(event) => setForm({ ...form, officeLat: event.target.value })} />
          <Input label="Office longitude" type="number" step="any" value={form.officeLng} onChange={(event) => setForm({ ...form, officeLng: event.target.value })} />
        </div>
      </Modal>
    </div>
  );
}

