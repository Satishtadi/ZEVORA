import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Mail, MapPin, MessageSquare, Phone, Send } from 'lucide-react';
import { Button, Card, CardContent, Input, Select, Textarea, useToast } from '@/components/ui';
import { SUPPORT_EMAIL } from '@/lib/config';

const schema = z.object({
  name: z.string().min(2, 'Enter your name'),
  email: z.string().email('Enter a valid email'),
  topic: z.string().min(1, 'Choose a topic'),
  message: z.string().min(20, 'Please share at least 20 characters'),
});
type Values = z.infer<typeof schema>;

export function ContactPage() {
  const toast = useToast();
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { topic: 'General enquiry' } });

  const onSubmit = (values: Values) => {
    const subject = encodeURIComponent(`[ZEVORA] ${values.topic}`);
    const body = encodeURIComponent(`${values.message}\n\n— ${values.name}\n${values.email}`);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    setSubmitted(true);
    toast.info('Email draft opened', 'Your email client should open with the message ready to send.');
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-ink-800">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">Talk to the ZEVORA team</h1>
          <p className="mt-3 max-w-lg text-ink-500">
            Questions about a ride, verification, refunds or corporate commuting? We are based in
            Hyderabad and respond Monday to Saturday, 8am–9pm IST.
          </p>
          <div className="mt-8 space-y-3">
            {[
              { icon: Mail, label: 'Email', value: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
              { icon: Phone, label: 'Support hours', value: 'Mon–Sat, 8am–9pm IST' },
              { icon: MapPin, label: 'Pilot city', value: 'Hyderabad, Telangana, India' },
              { icon: MessageSquare, label: 'In-app', value: 'Signed-in users can raise SOS and incidents from Safety & support' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-soft">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <item.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-400">{item.label}</p>
                  {item.href ? (
                    <a href={item.href} className="text-sm font-semibold text-ink-800 hover:text-brand-700">{item.value}</a>
                  ) : (
                    <p className="text-sm font-semibold text-ink-800">{item.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-xl font-bold text-ink-950">Send a message</h2>
            <p className="mt-1 text-sm text-ink-500">
              This opens your email client with a pre-filled message. No message is stored on our
              servers until it reaches support.
            </p>
            {submitted ? (
              <div className="mt-6 rounded-xl border border-mint-200 bg-mint-50 p-5 text-sm text-mint-800">
                Your email draft was opened. If nothing happened, email us directly at{' '}
                <a className="font-bold underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Your name" placeholder="Full name" error={errors.name?.message} {...register('name')} />
                  <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
                </div>
                <Select label="Topic" error={errors.topic?.message} {...register('topic')}>
                  <option>General enquiry</option>
                  <option>Booking issue</option>
                  <option>Refund request</option>
                  <option>Driver verification</option>
                  <option>Corporate commute</option>
                  <option>Safety concern</option>
                  <option>Partnership</option>
                </Select>
                <Textarea label="Message" placeholder="Tell us what you need help with…" error={errors.message?.message} {...register('message')} />
                <Button type="submit" fullWidth size="lg" rightIcon={<Send className="h-4 w-4" />}>Draft email</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col justify-center px-4 py-16">
      <div className="rounded-2xl border border-ink-100 bg-white p-8 shadow-soft">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">Password reset</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-500">
          Self-service password reset is not enabled in this backend build. To protect your account,
          password changes are handled by the ZEVORA support team after identity verification.
        </p>
        <p className="mt-3 text-sm text-ink-500">
          Email <a className="font-semibold text-brand-700 hover:underline" href="mailto:support@zevora.in">support@zevora.in</a> from your
          registered address, or contact support in-app after signing in on a trusted device.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/login"><Button variant="outline">Back to sign in</Button></Link>
          <Link to="/contact"><Button>Contact support</Button></Link>
        </div>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 px-4 text-center">
      <p className="text-7xl font-extrabold tracking-tight text-brand-600">404</p>
      <h1 className="mt-3 text-2xl font-extrabold text-ink-950">This route does not exist</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-500">
        The page may have moved, or the link is incorrect. Head back to the ZEVORA home page.
      </p>
      <Link to="/" className="mt-6"><Button>Back to home</Button></Link>
    </div>
  );
}
