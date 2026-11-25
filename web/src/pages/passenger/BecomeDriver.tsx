import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, BadgeCheck, CarFront, FileCheck2, ShieldCheck, Star, Wallet } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  ErrorState,
  Input,
  LoadingBlock,
  PageHeader,
  Select,
  StatusBadge,
  useToast,
} from '@/components/ui';
import { driversApi } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { isDriverRole } from '@/lib/roles';
import type { DriverType } from '@/types';

export function BecomeDriverPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [driverType, setDriverType] = useState<DriverType>('PRIVATE_CARPOOL');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [consent, setConsent] = useState(false);

  const driverQuery = useQuery({
    queryKey: ['driver', 'profile'],
    queryFn: driversApi.profile,
    enabled: isDriverRole(user?.role),
    retry: false,
  });

  const register = useMutation({
    mutationFn: () => driversApi.register(driverType, licenseNumber.trim()),
    onSuccess: async () => {
      toast.success('Driver profile created', 'Your licence is pending verification. Add a vehicle to publish rides.');
      await refreshUser();
      await queryClient.invalidateQueries({ queryKey: ['driver', 'profile'] });
      navigate('/driver');
    },
    onError: (error) => toast.error('Could not create driver profile', getApiErrorMessage(error)),
  });

  if (isDriverRole(user?.role)) {
    return (
      <div className="space-y-6">
        <PageHeader title="You are already a ZEVORA driver" description="Manage verification, vehicles and cost-sharing rides in the driver portal." />
        {driverQuery.isLoading && <LoadingBlock label="Loading driver profile…" />}
        {driverQuery.isError && <ErrorState title="Could not load driver profile" description={getApiErrorMessage(driverQuery.error)} onRetry={() => driverQuery.refetch()} />}
        {driverQuery.data && (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>{driverQuery.data.fullName}</CardTitle>
                <p className="text-sm text-ink-500">{driverQuery.data.driverType === 'PRIVATE_CARPOOL' ? 'Private carpool driver' : 'Commercial driver'}</p>
              </div>
              <StatusBadge status={driverQuery.data.status} />
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="flex items-center justify-between"><span className="text-ink-500">Rating</span><span className="inline-flex items-center gap-1 font-semibold"><Star className="h-4 w-4 fill-amber-500 text-amber-500" /> {driverQuery.data.rating.toFixed(1)}</span></p>
              <p className="flex items-center justify-between"><span className="text-ink-500">Licence</span><span className="font-semibold">{driverQuery.data.licenseNumber}</span></p>
              <p className="flex items-center justify-between"><span className="text-ink-500">Licence verified</span><Badge tone={driverQuery.data.licenseVerified ? 'success' : 'warning'}>{driverQuery.data.licenseVerified ? 'Verified' : 'Pending'}</Badge></p>
              <p className="flex items-center justify-between"><span className="text-ink-500">Vehicles</span><span className="font-semibold">{driverQuery.data.vehicles.length}</span></p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Link to="/driver"><Button rightIcon={<ArrowRight className="h-4 w-4" />}>Open driver portal</Button></Link>
                <Link to="/driver/vehicles"><Button variant="outline" leftIcon={<CarFront className="h-4 w-4" />}>Add a vehicle</Button></Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Become a ZEVORA driver"
        description="Share seats on the commute you already drive. Private carpools recover costs; commercial drivers can publish paid seats."
        actions={<Badge tone="brand"><ShieldCheck className="h-3 w-3" /> Verified community</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Driver application</CardTitle>
            <p className="text-sm text-ink-500">Verification is completed by the ZEVORA admin team.</p>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                register.mutate();
              }}
            >
              <Select label="Driver type" value={driverType} onChange={(event) => setDriverType(event.target.value as DriverType)}>
                <option value="PRIVATE_CARPOOL">Private carpool — cost sharing</option>
                <option value="COMMERCIAL">Commercial — paid shared rides</option>
              </Select>
              <Input
                label="Driving licence number"
                placeholder="e.g. TS09 20200012345"
                value={licenseNumber}
                onChange={(event) => setLicenseNumber(event.target.value)}
                required
                hint="The licence is verified by support. No document upload endpoint is available in this build."
              />
              <Checkbox
                label="I confirm my details are accurate"
                description="I understand publishing rides requires an approved driver profile and a verified vehicle."
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
              />
              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={register.isPending}
                disabled={licenseNumber.trim().length < 6 || !consent}
              >
                Create driver profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {[
            { icon: Wallet, title: 'Recover commute costs', text: 'Private carpools are cost sharing per seat. Commercial rides add a platform fee at booking.' },
            { icon: BadgeCheck, title: 'Verification first', text: 'Admin verifies your licence and each vehicle before rides can be published.' },
            { icon: FileCheck2, title: 'Transparent records', text: 'Every ride, booking and earning is recorded by the backend and visible in your driver portal.' },
          ].map((item) => (
            <Card key={item.title}>
              <CardContent className="flex items-start gap-3 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><item.icon className="h-5 w-5" /></span>
                <div>
                  <p className="text-sm font-bold text-ink-900">{item.title}</p>
                  <p className="mt-1 text-sm text-ink-500">{item.text}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
