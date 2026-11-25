import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, CheckCircle2, Eye, EyeOff, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { LogoLink } from '@/components/Brand';
import { Button, Input, useToast } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { getApiErrorMessage } from '@/lib/api';
import { portalForRole, portalHome } from '@/lib/roles';

const demoAccounts = [
  { label: 'Passenger', email: 'passenger@zevora.in', password: 'Passenger@123!' },
  { label: 'Private driver', email: 'driver1@zevora.in', password: 'Driver@123!' },
  { label: 'Commercial driver', email: 'driver2@zevora.in', password: 'Driver@123!' },
  { label: 'Admin', email: 'admin@zevora.in', password: 'Admin@123!' },
  { label: 'Corporate', email: 'corporate@zevora.in', password: 'Corporate@123!' },
  { label: 'Operator', email: 'operator@zevora.in', password: 'Operator@123!' },
];

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden bg-ink-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="surface-grid absolute inset-0 opacity-40" />
        <div className="absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-mint-500/20 blur-3xl" />
        <div className="relative">
          <LogoLink light />
        </div>
        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-mint-300" /> Hyderabad commuter platform
          </span>
          <h2 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight">
            Your whole commute,<br />in one calm place.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Compare carpool, shuttle, bus, metro and cab options. Book with verified drivers.
            Share your live trip. Save money every month.
          </p>
          <div className="mt-7 space-y-3">
            {[
              { icon: ShieldCheck, text: 'Verified drivers and vehicles' },
              { icon: Users, text: 'Women-only carpool mode' },
              { icon: CheckCircle2, text: 'Live trip sharing and SOS' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-sm text-white/75">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <item.icon className="h-4 w-4 text-mint-300" />
                </span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} ZEVORA Mobility Technologies</p>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 lg:hidden">
          <LogoLink />
          <Link to="/" className="text-sm font-semibold text-ink-500">Back to site</Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-8">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}

const loginSchema = z.object({
  identifier: z.string().min(3, 'Enter your email or mobile number'),
  password: z.string().min(1, 'Enter your password'),
});
type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { identifier: '', password: '' } });

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    try {
      const session = await login(values.identifier.trim(), values.password);
      toast.success('Welcome back', `Signed in as ${session.fullName}`);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? portalHome[portalForRole(session.role)], { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(error);
      setServerError(message);
      toast.error('Sign in failed', message);
    }
  };

  return (
    <AuthShell>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">Sign in to ZEVORA</h1>
        <p className="mt-2 text-sm text-ink-500">
          New here?{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline">Create a free account</Link>
        </p>

        {params.get('expired') && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your session expired. Please sign in again to continue.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <Input
            label="Email or mobile number"
            placeholder="you@example.com or 9876543210"
            autoComplete="username"
            error={errors.identifier?.message}
            {...register('identifier')}
          />
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            autoComplete="current-password"
            error={errors.password?.message}
            rightIcon={
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            {...register('password')}
          />
          <div className="flex items-center justify-between">
            <Link to="/forgot-password" className="text-xs font-semibold text-brand-700 hover:underline">Forgot password?</Link>
            <span className="text-xs text-ink-400">Secure JWT session</span>
          </div>
          {serverError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {serverError}
            </div>
          )}
          <Button type="submit" fullWidth size="lg" loading={isSubmitting} rightIcon={<ArrowRight className="h-4 w-4" />}>
            Sign in
          </Button>
        </form>

        <div className="mt-8 rounded-2xl border border-ink-100 bg-ink-50/60 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-400">Demo accounts</p>
          <p className="mt-1 text-xs text-ink-500">Seeded by the backend in development mode. Click to fill the form.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setValue('identifier', account.email, { shouldValidate: true });
                  setValue('password', account.password, { shouldValidate: true });
                }}
                className="rounded-lg border border-ink-200 bg-white px-2 py-2 text-[11px] font-semibold text-ink-600 transition-colors hover:border-brand-300 hover:text-brand-700"
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AuthShell>
  );
}

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Enter your full name').max(120),
    email: z.string().email('Enter a valid email address'),
    phone: z.string().regex(/^(\+91)?[6-9]\d{9}$/, 'Enter a valid Indian mobile number'),
    password: z.string().min(8, 'Use at least 8 characters').max(72),
    confirmPassword: z.string().min(8, 'Confirm your password'),
    terms: z.literal(true, { errorMap: () => ({ message: 'Accept the terms to continue' }) }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', phone: '', password: '', confirmPassword: '', terms: undefined },
  });

  const onSubmit = async (values: RegisterValues) => {
    setServerError(null);
    try {
      const session = await registerUser({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: values.password,
      });
      toast.success('Account created', `Welcome to ZEVORA, ${session.fullName.split(' ')[0]}!`);
      navigate('/app', { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(error);
      setServerError(message);
      toast.error('Could not create account', message);
    }
  };

  return (
    <AuthShell>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">Create your free account</h1>
        <p className="mt-2 text-sm text-ink-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">Sign in</Link>
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <Input label="Full name" placeholder="Rohan Kumar" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
          <Input label="Email address" type="email" placeholder="you@example.com" autoComplete="email" error={errors.email?.message} {...register('email')} />
          <Input
            label="Mobile number"
            placeholder="9876543210"
            autoComplete="tel"
            hint="Indian mobile number, with or without +91"
            error={errors.phone?.message}
            {...register('phone')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Password" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
            <Input label="Confirm password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
          </div>
          <label className="flex items-start gap-2.5 text-xs text-ink-500">
            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500" {...register('terms')} />
            <span>
              I agree to the ZEVORA terms of use and privacy policy, and understand that private
              carpooling is offered as cost sharing.
            </span>
          </label>
          {errors.terms && <p className="text-xs font-medium text-red-600">{errors.terms.message}</p>}
          {serverError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {serverError}
            </div>
          )}
          <Button type="submit" fullWidth size="lg" loading={isSubmitting} rightIcon={<ArrowRight className="h-4 w-4" />}>
            Create account
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-ink-400">
          You can add driver details and verify your mobile number after signing in.
        </p>
      </div>
    </AuthShell>
  );
}
