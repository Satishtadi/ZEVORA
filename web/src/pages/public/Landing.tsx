import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Bus,
  CalendarCheck,
  CarFront,
  CheckCircle2,
  Clock,
  IndianRupee,
  Leaf,
  MapPin,
  Route,
  ShieldCheck,
  Sparkles,
  Star,
  TrainFront,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui';

const steps = [
  {
    title: 'Tell us your commute',
    description: 'Set your pickup, destination and departure time. Save home and work for one-tap searches.',
    icon: MapPin,
  },
  {
    title: 'Compare every option',
    description: 'See carpool, company shuttle, bus, metro feeder and cab options side by side with real fares.',
    icon: Route,
  },
  {
    title: 'Book and travel together',
    description: 'Reserve a seat, share your live trip with family, and rate your driver after the ride.',
    icon: Users,
  },
];

const options = [
  { name: 'Private carpool', icon: CarFront, tone: 'bg-brand-50 text-brand-700' },
  { name: 'Commercial shared cab', icon: CarFront, tone: 'bg-sky-50 text-sky-700' },
  { name: 'Company shuttle', icon: Bus, tone: 'bg-mint-50 text-mint-700' },
  { name: 'Public bus', icon: Bus, tone: 'bg-amber-50 text-amber-700' },
  { name: 'Metro feeder', icon: TrainFront, tone: 'bg-violet-50 text-violet-700' },
  { name: 'Cab & auto', icon: CarFront, tone: 'bg-ink-100 text-ink-700' },
];

const benefits = [
  { title: 'Lower daily cost', description: 'Cost sharing and comparison help you pick the best value option every day.', icon: IndianRupee },
  { title: 'Predictable commutes', description: 'Reliable schedules, verified drivers and punctual departures.', icon: Clock },
  { title: 'Less congestion', description: 'Fewer single-occupancy cars on Hyderabad roads during peak hours.', icon: Leaf },
  { title: 'One trusted account', description: 'One profile for carpooling, shuttles, transit and commercial rides.', icon: BadgeCheck },
];

const safety = [
  'Verified driver identity, licence and vehicle checks',
  'Women-only carpool mode for eligible verified members',
  'One-tap SOS with support escalation and incident tracking',
  'Live trip sharing with a private, expiring link',
  'Ratings and reviews after every completed trip',
  'No cash handling: transparent digital fare records',
];

const faqs = [
  {
    q: 'Which cities does ZEVORA support?',
    a: 'ZEVORA is launching in Hyderabad, India. Pickups, destinations and comparison providers are optimised for the Hyderabad pilot, with more cities to follow.',
  },
  {
    q: 'Is carpooling legal and safe?',
    a: 'Private carpooling is offered as cost sharing, not commercial hire. Drivers complete identity, licence and vehicle verification. Women-only rides and in-app SOS are built in.',
  },
  {
    q: 'How is the fare calculated?',
    a: 'Private carpool fares are cost-sharing estimates based on distance and configured fuel rates. Commercial rides add a clearly displayed platform fee. Comparison options are labelled as live, estimated or external.',
  },
  {
    q: 'Can I cancel a booking?',
    a: 'Yes. Cancellation before the configured cut-off receives a full refund. Late cancellations follow the partial-refund policy, and every status change is recorded in your booking history.',
  },
  {
    q: 'Do I need a subscription?',
    a: 'No. ZEVORA is usable for free. Basic Plus and Premium plans add convenience benefits for frequent commuters, but booking and comparison remain available without a plan.',
  },
  {
    q: 'How do I become a driver?',
    a: 'Open your account, choose “Become a driver”, submit your licence and vehicle details, and wait for verification. Approved drivers can publish rides and manage passenger requests.',
  },
];

export function LandingPage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div className="surface-grid absolute inset-0 opacity-40" />
        <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-mint-500/20 blur-3xl" />
        <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pb-28 lg:pt-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
              <Sparkles className="h-3.5 w-3.5 text-mint-300" /> Now live in Hyderabad
            </span>
            <h1 className="mt-6 max-w-2xl text-balance text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Move smart.<br />
              <span className="bg-gradient-to-r from-mint-300 via-brand-300 to-white bg-clip-text text-transparent">
                Travel together.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              Compare carpooling, company shuttles, buses, metro feeders and cabs in one place.
              Book a seat, share your trip, and turn the daily commute into the easiest part of your day.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/register">
                <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Find my commute
                </Button>
              </Link>
              <Link to="/compare">
                <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" leftIcon={<Route className="h-4 w-4" />}>
                  Compare travel
                </Button>
              </Link>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6">
              {[
                { value: '6', label: 'transport modes' },
                { value: '100%', label: 'verified drivers' },
                { value: '1 tap', label: 'emergency SOS' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                  <p className="text-xs text-white/50">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-up lg:mt-4">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-3 shadow-2xl backdrop-blur-xl">
              <div className="rounded-2xl bg-white p-5 text-ink-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-ink-400">Example comparison</p>
                    <p className="mt-1 text-sm font-bold">Kukatpally → HITEC City</p>
                  </div>
                  <span className="rounded-full bg-mint-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-mint-700">
                    Illustrative
                  </span>
                </div>
                <div className="mt-4 space-y-2.5">
                  {[
                    { name: 'Private carpool', meta: 'Cost sharing · 1 seat', price: '₹60', rec: true, icon: CarFront },
                    { name: 'Company shuttle', meta: 'Employer sponsored', price: 'Free', rec: false, icon: Bus },
                    { name: 'Metro + feeder', meta: 'Estimated · 42 min', price: '₹35', rec: false, icon: TrainFront },
                    { name: 'Shared cab', meta: 'Commercial · verified', price: '₹90', rec: false, icon: Zap },
                  ].map((row) => (
                    <div
                      key={row.name}
                      className={`flex items-center gap-3 rounded-xl border p-3 ${row.rec ? 'border-brand-200 bg-brand-50/50' : 'border-ink-100 bg-white'}`}
                    >
                      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${row.rec ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600'}`}>
                        <row.icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{row.name}</p>
                        <p className="truncate text-[11px] text-ink-500">{row.meta}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold">{row.price}</p>
                        {row.rec && <p className="text-[10px] font-bold uppercase text-brand-600">Best value</p>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-ink-50 p-3 text-[11px] text-ink-500">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-mint-600" />
                  Fares, availability and ETA are confirmed by the backend at booking time.
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-white/10 bg-ink-900/90 p-4 shadow-xl backdrop-blur sm:block">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Monthly savings</p>
              <p className="mt-1 text-2xl font-extrabold text-mint-300">₹2,840</p>
              <p className="text-[11px] text-white/50">Example vs solo cab</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600">How ZEVORA works</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">
            One search. Every sensible way to get there.
          </h2>
          <p className="mt-3 text-ink-500">
            Stop juggling five apps. ZEVORA ranks the options that actually fit your route, time and budget.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="relative rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
              <span className="absolute right-5 top-5 text-4xl font-extrabold text-ink-100">0{index + 1}</span>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <step.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-ink-950">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Travel comparison</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">
                Compare modes, not just prices.
              </h2>
              <p className="mt-3 text-ink-500">
                ZEVORA compares fare, journey time, walking distance, reliability, verification and
                cancellation policy. Every option is labelled with its data source so you always know
                what is live and what is estimated.
              </p>
              <ul className="mt-6 space-y-3">
                {['Fare per passenger, not hidden totals', 'Pickup and drop proximity scoring', 'Women-only filtering', 'Recommendations tuned to your preference'].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-ink-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint-600" /> {item}
                  </li>
                ))}
              </ul>
              <Link to="/compare" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-800">
                Try the public comparison <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {options.map((option) => (
                <div key={option.name} className="rounded-2xl border border-ink-100 bg-ink-50/50 p-5 text-center">
                  <span className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${option.tone}`}>
                    <option.icon className="h-6 w-6" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-ink-800">{option.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="carpool" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-ink-950 p-8 text-white sm:p-12">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                <CarFront className="h-4 w-4 text-mint-300" /> Carpooling built for daily commutes
              </span>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Share the ride. Share the cost. Not the hassle.
              </h2>
              <p className="mt-4 text-white/70">
                Publish a recurring office route, fill your empty seats, and let ZEVORA handle requests,
                seat availability, trip status and cost-sharing records. Passengers get a verified,
                trackable ride at a fraction of a solo cab.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/register">
                  <Button variant="secondary" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Join as a passenger
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="outline" size="lg" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                    Drive with ZEVORA
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: CalendarCheck, title: 'Recurring ride schedules', text: 'Weekday routes with one-tap publishing.' },
                { icon: Wallet, title: 'Transparent cost sharing', text: 'No cash, clear per-seat pricing.' },
                { icon: ShieldCheck, title: 'Verified community', text: 'Identity, licence and vehicle checks.' },
                { icon: Star, title: 'Two-way ratings', text: 'Trust built after every completed trip.' },
              ].map((feature) => (
                <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <feature.icon className="h-5 w-5 text-mint-300" />
                  <p className="mt-3 text-sm font-bold">{feature.title}</p>
                  <p className="mt-1 text-xs text-white/60">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Why ZEVORA</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">
              Built for the everyday commuter.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint-50 text-mint-700">
                  <benefit.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-bold text-ink-950">{benefit.title}</h3>
                <p className="mt-1.5 text-sm text-ink-500">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="safety" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 rounded-3xl border border-ink-100 bg-white p-8 shadow-soft sm:p-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Safety first</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">
              Your family should always know you are safe.
            </h2>
            <p className="mt-3 text-ink-500">
              Safety is not a settings page. It is woven into verification, booking, live trips and
              support escalation.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {safety.map((item) => (
                <div key={item} className="flex items-start gap-2.5 text-sm text-ink-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint-600" /> {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-ink-950 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/40">Live trip</p>
                <p className="mt-1 text-lg font-bold">Kukatpally → HITEC City</p>
              </div>
              <span className="rounded-full bg-mint-500/20 px-2.5 py-1 text-xs font-bold text-mint-300">On trip</span>
            </div>
            <div className="relative mt-5 h-40 overflow-hidden rounded-xl bg-gradient-to-br from-ink-800 to-ink-900">
              <div className="surface-grid absolute inset-0 opacity-20" />
              <div className="absolute left-6 top-6 flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-mint-400" /> Pickup confirmed
              </div>
              <svg viewBox="0 0 320 120" className="absolute inset-0 h-full w-full" aria-hidden="true">
                <path d="M30 95 C 90 90, 100 40, 160 45 S 240 70, 290 25" fill="none" stroke="#6d5ef8" strokeWidth="3" strokeDasharray="6 5" />
                <circle cx="30" cy="95" r="6" fill="#16c7b4" />
                <circle cx="290" cy="25" r="6" fill="#ffc24d" />
              </svg>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-white/40">Driver</p>
                <p className="mt-0.5 font-semibold">Verified · 4.8 ★</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-white/40">Shared with</p>
                <p className="mt-0.5 font-semibold">2 emergency contacts</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-white py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Pricing</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">
              Free to commute. Upgrade for convenience.
            </h2>
            <p className="mt-3 text-ink-500">
              Comparison and booking are free. Optional plans add priority benefits for frequent
              commuters. Fares are always shown before you confirm.
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {[
              { name: 'Free', price: '₹0', period: 'forever', features: ['Travel comparison', 'Carpool & shuttle booking', 'Safety SOS and trip sharing', 'Booking history'], cta: 'Get started', highlight: false },
              { name: 'Basic Plus', price: '₹49', period: 'per month', features: ['Everything in Free', 'Frequent-commuter convenience', 'Priority ride recommendations', 'Monthly savings insights'], cta: 'Choose Basic Plus', highlight: true },
              { name: 'Premium', price: '₹99', period: 'per month', features: ['Everything in Basic Plus', 'Premium commute support', 'Advanced trip insights', 'Early access to new features'], cta: 'Choose Premium', highlight: false },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 ${plan.highlight ? 'border-brand-300 bg-brand-50/40 shadow-glow' : 'border-ink-100 bg-white shadow-soft'}`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-6 rounded-full bg-brand-600 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-ink-950">{plan.name}</h3>
                <p className="mt-2">
                  <span className="text-4xl font-extrabold tracking-tight text-ink-950">{plan.price}</span>
                  <span className="ml-1 text-sm text-ink-500">{plan.period}</span>
                </p>
                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-ink-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint-600" /> {feature}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="mt-6 block">
                  <Button fullWidth variant={plan.highlight ? 'primary' : 'outline'}>{plan.cta}</Button>
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink-400">
            Subscription purchases are processed by the ZEVORA backend. No payment credentials are
            stored in the browser.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">FAQ</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">
              Questions, answered.
            </h2>
            <p className="mt-3 text-ink-500">
              Still unsure? Reach the ZEVORA team at{' '}
              <a className="font-semibold text-brand-700 hover:underline" href="mailto:support@zevora.in">support@zevora.in</a>.
            </p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-ink-900">
                  {faq.q}
                  <span className="text-xl leading-none text-ink-400 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-500">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-14 text-center text-white sm:px-12">
          <div className="surface-grid absolute inset-0 opacity-30" />
          <div className="relative">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to move smarter?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/75">
              Create your free ZEVORA account and find a better way across Hyderabad tomorrow morning.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link to="/register">
                <Button size="lg" variant="dark" rightIcon={<ArrowRight className="h-4 w-4" />}>Create free account</Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">Sign in</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
