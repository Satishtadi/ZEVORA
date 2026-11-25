import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, CarFront, CheckCircle2, Crown, Mail, Phone, ShieldCheck, Sparkles, Star } from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  EmptyState,
  ErrorState,
  Input,
  LoadingBlock,
  PageHeader,
  Select,
  StatusBadge,
  useToast,
} from '@/components/ui';
import { authApi, driversApi, subscriptionsApi, usersApi, type UpdateMeInput } from '@/services/api-services';
import { getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { hyderabadLocations, findLocation } from '@/lib/hyderabad';
import { isDriverRole, roleLabels } from '@/lib/roles';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { SubscriptionPlan } from '@/types';

interface ProfileFormState {
  fullName: string;
  home: string;
  work: string;
  womenOnly: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export function ProfilePage() {
  const { user, refreshUser, portalHome } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProfileFormState | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState<string | null>(null);

  const meQuery = useQuery({ queryKey: ['me'], queryFn: usersApi.me });
  const subscriptionQuery = useQuery({
    queryKey: ['subscriptions', 'current'],
    queryFn: async () => {
      try {
        return await subscriptionsApi.current();
      } catch {
        return null;
      }
    },
    retry: false,
  });
  const historyQuery = useQuery({
    queryKey: ['subscriptions', 'history'],
    queryFn: subscriptionsApi.history,
    retry: false,
  });
  const driverQuery = useQuery({
    queryKey: ['driver', 'profile'],
    queryFn: driversApi.profile,
    enabled: isDriverRole(user?.role),
    retry: false,
  });

  useEffect(() => {
    if (!meQuery.data) return;
    const profile = meQuery.data.profile;
    setForm({
      fullName: meQuery.data.fullName,
      home: profile.homeAddress ?? '',
      work: profile.workAddress ?? '',
      womenOnly: profile.womenOnly,
      emergencyContactName: profile.emergencyContactName ?? '',
      emergencyContactPhone: profile.emergencyContactPhone ?? '',
    });
  }, [meQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (input: UpdateMeInput) => usersApi.updateMe(input),
    onSuccess: async () => {
      toast.success('Profile updated');
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      await refreshUser();
    },
    onError: (error) => toast.error('Could not update profile', getApiErrorMessage(error)),
  });

  const requestOtp = useMutation({
    mutationFn: () => authApi.requestOtp(user?.phone ?? '', 'VERIFY_PHONE'),
    onSuccess: (response) => {
      setOtpSent(response.devCode ?? null);
      toast.success('Verification code requested', response.devCode ? `Dev code: ${response.devCode}` : 'Check your phone for the code.');
    },
    onError: (error) => toast.error('Could not request code', getApiErrorMessage(error)),
  });

  const verifyOtp = useMutation({
    mutationFn: () => authApi.verifyOtp(user?.phone ?? '', otpCode, 'VERIFY_PHONE'),
    onSuccess: async () => {
      toast.success('Phone verified');
      setOtpCode('');
      setOtpSent(null);
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      await refreshUser();
    },
    onError: (error) => toast.error('Verification failed', getApiErrorMessage(error)),
  });

  const subscribe = useMutation({
    mutationFn: (plan: SubscriptionPlan) => subscriptionsApi.subscribe(plan),
    onSuccess: async () => {
      toast.success('Subscription activated');
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
    onError: (error) => toast.error('Could not activate plan', getApiErrorMessage(error)),
  });

  const cancelSubscription = useMutation({
    mutationFn: subscriptionsApi.cancel,
    onSuccess: async () => {
      toast.success('Subscription cancelled');
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
    onError: (error) => toast.error('Could not cancel subscription', getApiErrorMessage(error)),
  });

  const availability = useMutation({
    mutationFn: (available: boolean) => driversApi.setAvailability(available),
    onSuccess: async () => {
      toast.success('Availability updated');
      await queryClient.invalidateQueries({ queryKey: ['driver', 'profile'] });
    },
    onError: (error) => toast.error('Could not update availability', getApiErrorMessage(error)),
  });

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    const home = findLocation(form.home);
    const work = findLocation(form.work);
    saveMutation.mutate({
      fullName: form.fullName,
      homeAddress: home?.name,
      homeLat: home?.lat,
      homeLng: home?.lng,
      workAddress: work?.name,
      workLat: work?.lat,
      workLng: work?.lng,
      womenOnly: form.womenOnly,
      emergencyContactName: form.emergencyContactName || undefined,
      emergencyContactPhone: form.emergencyContactPhone || undefined,
    });
  };

  if (meQuery.isLoading) return <LoadingBlock label="Loading profile…" />;
  if (meQuery.isError) {
    return <ErrorState title="Could not load profile" description={getApiErrorMessage(meQuery.error)} onRetry={() => meQuery.refetch()} />;
  }
  if (!meQuery.data || !form) return null;
  const me = meQuery.data;
  const current = subscriptionQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your profile"
        description="Contact details, saved commute locations, safety preferences and subscription."
        actions={
          <Link to={portalHome}>
            <Button variant="outline" size="sm">Back to dashboard</Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar name={me.fullName} size="lg" />
                <div>
                  <CardTitle>{me.fullName}</CardTitle>
                  <p className="text-sm text-ink-500">{me.email}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Badge tone="brand">{roleLabels[me.role]}</Badge>
                    <StatusBadge status={me.status} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 text-xs text-ink-500">
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> {me.emailVerified ? 'Email verified' : 'Email not verified'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> {me.phoneVerified ? 'Phone verified' : 'Phone not verified'}
                </span>
                <span>Member since {formatDate(me.createdAt)}</span>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={save} className="space-y-4">
                <Input
                  label="Full name"
                  value={form.fullName}
                  onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                  required
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    label="Home location"
                    value={form.home}
                    onChange={(event) => setForm({ ...form, home: event.target.value })}
                    hint="Saved from the Hyderabad pilot location list."
                  >
                    <option value="">Not set</option>
                    {hyderabadLocations.map((location) => (
                      <option key={location.name} value={location.name}>{location.name}</option>
                    ))}
                  </Select>
                  <Select
                    label="Work location"
                    value={form.work}
                    onChange={(event) => setForm({ ...form, work: event.target.value })}
                    hint="Used to prefill commute comparisons."
                  >
                    <option value="">Not set</option>
                    {hyderabadLocations.map((location) => (
                      <option key={location.name} value={location.name}>{location.name}</option>
                    ))}
                  </Select>
                </div>
                <Checkbox
                  label="Prefer women-only carpools"
                  description="Apply women-only filtering by default on searches."
                  checked={form.womenOnly}
                  onChange={(event) => setForm({ ...form, womenOnly: event.target.checked })}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Emergency contact name"
                    value={form.emergencyContactName}
                    onChange={(event) => setForm({ ...form, emergencyContactName: event.target.value })}
                    placeholder="Contact person"
                  />
                  <Input
                    label="Emergency contact phone"
                    value={form.emergencyContactPhone}
                    onChange={(event) => setForm({ ...form, emergencyContactPhone: event.target.value })}
                    placeholder="+91…"
                  />
                </div>
                <Button type="submit" loading={saveMutation.isPending}>Save changes</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Phone verification</CardTitle>
                <p className="text-sm text-ink-500">A one-time code confirms your registered number.</p>
              </div>
              <Badge tone={me.phoneVerified ? 'success' : 'warning'}>{me.phoneVerified ? 'Verified' : 'Pending'}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {me.phoneVerified ? (
                <p className="inline-flex items-center gap-2 text-sm text-mint-700">
                  <CheckCircle2 className="h-4 w-4" /> {me.phone} is verified.
                </p>
              ) : (
                <>
                  <p className="text-sm text-ink-600">We will send an OTP to <span className="font-semibold">{me.phone}</span>.</p>
                  <div className="flex flex-wrap items-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => requestOtp.mutate()}
                      loading={requestOtp.isPending}
                      disabled={!user?.phone}
                    >
                      Request code
                    </Button>
                    <Input
                      label="OTP code"
                      value={otpCode}
                      onChange={(event) => setOtpCode(event.target.value)}
                      placeholder="6-digit code"
                      className="w-40"
                      wrapperClassName="w-40"
                    />
                    <Button
                      onClick={() => verifyOtp.mutate()}
                      loading={verifyOtp.isPending}
                      disabled={otpCode.trim().length < 4}
                    >
                      Verify
                    </Button>
                  </div>
                  {otpSent && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Development mode code: <span className="font-mono font-bold">{otpSent}</span></p>}
                  <p className="text-xs text-ink-400">OTP verification does not create a login session in this backend; it only marks the phone verified.</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {isDriverRole(user?.role) && driverQuery.data && (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Driver account</CardTitle>
                  <p className="text-sm text-ink-500">Cost-sharing driver profile</p>
                </div>
                <StatusBadge status={driverQuery.data.status} />
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="flex items-center justify-between"><span className="text-ink-500">Rating</span><span className="inline-flex items-center gap-1 font-semibold"><Star className="h-4 w-4 fill-amber-500 text-amber-500" /> {driverQuery.data.rating.toFixed(1)}</span></p>
                <p className="flex items-center justify-between"><span className="text-ink-500">Total rides</span><span className="font-semibold">{driverQuery.data.totalRides}</span></p>
                <p className="flex items-center justify-between"><span className="text-ink-500">License verified</span><span className="font-semibold">{driverQuery.data.licenseVerified ? 'Yes' : 'No'}</span></p>
                <p className="flex items-center justify-between"><span className="text-ink-500">Identity verified</span><span className="font-semibold">{driverQuery.data.identityVerified ? 'Yes' : 'No'}</span></p>
                <Checkbox
                  label="Available for matching"
                  description="Let passengers find you for new rides."
                  checked={driverQuery.data.available}
                  onChange={(event) => availability.mutate(event.target.checked)}
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link to="/driver/vehicles"><Button variant="outline" size="sm" leftIcon={<CarFront className="h-4 w-4" />}>Vehicles</Button></Link>
                  <Link to="/driver"><Button size="sm">Driver dashboard</Button></Link>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div>
                <CardTitle>ZEVORA Plus</CardTitle>
                <p className="text-sm text-ink-500">Subscriptions are billed by the backend service.</p>
              </div>
              {current ? <Badge tone="success">{current.plan.replace('_', ' ')}</Badge> : <Badge tone="neutral">No plan</Badge>}
            </CardHeader>
            <CardContent className="space-y-4">
              {current ? (
                <div className="space-y-2 rounded-xl bg-ink-50 p-4 text-sm">
                  <p className="flex items-center justify-between"><span className="text-ink-500">Status</span><StatusBadge status={current.status} /></p>
                  <p className="flex items-center justify-between"><span className="text-ink-500">Started</span><span className="font-semibold">{formatDate(current.startAt)}</span></p>
                  <p className="flex items-center justify-between"><span className="text-ink-500">Renews / ends</span><span className="font-semibold">{formatDate(current.endAt)}</span></p>
                  <p className="flex items-center justify-between"><span className="text-ink-500">Recorded price</span><span className="font-semibold">{formatCurrency(current.price, true)}</span></p>
                  {current.status === 'ACTIVE' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => cancelSubscription.mutate()}
                      loading={cancelSubscription.isPending}
                    >
                      Cancel subscription
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { plan: 'BASIC_PLUS' as SubscriptionPlan, title: 'Basic Plus', desc: 'Priority matching and reduced platform fee guidance.', icon: Sparkles },
                    { plan: 'PREMIUM' as SubscriptionPlan, title: 'Premium', desc: 'Top matching priority and premium support routing.', icon: Crown },
                  ].map((item) => (
                    <div key={item.plan} className="rounded-xl border border-ink-100 p-4">
                      <p className="flex items-center gap-2 text-sm font-bold text-ink-900"><item.icon className="h-4 w-4 text-brand-600" /> {item.title}</p>
                      <p className="mt-1 text-xs text-ink-500">{item.desc}</p>
                      <Button
                        size="sm"
                        className="mt-3"
                        onClick={() => subscribe.mutate(item.plan)}
                        loading={subscribe.isPending && subscribe.variables === item.plan}
                      >
                        Activate
                      </Button>
                    </div>
                  ))}
                  <p className="text-xs text-ink-400">In this build, subscription charges are recorded by the backend without a real payment gateway.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscription history</CardTitle>
            </CardHeader>
            <CardContent>
              {historyQuery.isLoading ? (
                <LoadingBlock label="Loading history…" className="min-h-24" />
              ) : (historyQuery.data ?? []).length === 0 ? (
                <EmptyState title="No subscription history" description="Activate a plan to see records here." className="border-0 py-6" />
              ) : (
                <ul className="space-y-2">
                  {(historyQuery.data ?? []).map((item) => (
                    <li key={item.id} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-xs">
                      <span className="font-semibold text-ink-700">{item.plan.replace('_', ' ')}</span>
                      <span className="text-ink-500">{formatDate(item.startAt)}</span>
                      <StatusBadge status={item.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="bg-ink-950 text-white">
            <CardContent className="space-y-2 p-5 text-sm">
              <p className="flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4 text-mint-400" /> Safety defaults</p>
              <p className="text-ink-300">Emergency contact and women-only preference are used by search and safety flows.</p>
              <p className="inline-flex items-center gap-1.5 text-xs text-ink-400"><BadgeCheck className="h-3.5 w-3.5" /> Verified identity improves trust for co-passengers.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
