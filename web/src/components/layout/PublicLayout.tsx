import { useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowRight, Mail, MapPin, Menu, X } from 'lucide-react';
import { LogoLink } from '@/components/Brand';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { portalForRole } from '@/lib/roles';
import { cn } from '@/lib/utils';
import { SUPPORT_EMAIL } from '@/lib/config';

const navLinks = [
  { to: '/#how-it-works', label: 'How it works', hash: true },
  { to: '/compare', label: 'Compare travel' },
  { to: '/#safety', label: 'Safety', hash: true },
  { to: '/#pricing', label: 'Pricing', hash: true },
  { to: '/contact', label: 'Contact' },
];

export function PublicLayout({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const portal = portalForRole(user?.role);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-40 border-b border-ink-100/80 bg-white/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <LogoLink />
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) =>
              link.hash ? (
                <a
                  key={link.label}
                  href={link.to}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-950"
                >
                  {link.label}
                </a>
              ) : (
                <NavLink
                  key={link.label}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-ink-50 hover:text-ink-950',
                      isActive ? 'text-brand-700' : 'text-ink-600',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ),
            )}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            {user ? (
              <Link
                to={portal === 'passenger' ? '/app' : `/${portal}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-brand-700"
              >
                Open dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-700 hover:text-ink-950">
                  Sign in
                </Link>
                <Button size="sm" rightIcon={<ArrowRight className="h-4 w-4" />} onClick={() => (window.location.href = '/register')}>
                  Get started
                </Button>
              </>
            )}
          </div>
          <button
            className="rounded-lg p-2 text-ink-700 hover:bg-ink-100 lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <div className="border-t border-ink-100 bg-white px-4 pb-4 pt-2 lg:hidden">
            <nav className="flex flex-col">
              {navLinks.map((link) =>
                link.hash ? (
                  <a key={link.label} href={link.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50">
                    {link.label}
                  </a>
                ) : (
                  <Link key={link.label} to={link.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50">
                    {link.label}
                  </Link>
                ),
              )}
            </nav>
            <div className="mt-3 flex flex-col gap-2 border-t border-ink-100 pt-3">
              {user ? (
                <Link to={portal === 'passenger' ? '/app' : `/${portal}`} className="w-full">
                  <Button fullWidth>Open dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)}>
                    <Button variant="outline" fullWidth>Sign in</Button>
                  </Link>
                  <Link to="/register" onClick={() => setOpen(false)}>
                    <Button fullWidth>Create account</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {children ?? <Outlet />}
      </main>

      <footer className="border-t border-ink-100 bg-ink-950 text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
          <div>
            <LogoLink light />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
              ZEVORA brings carpooling, company shuttles, public transport and cabs into one trusted
              comparison and booking experience. Move smart. Travel together.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-white/70">
              <MapPin className="h-4 w-4 text-mint-400" /> Live in Hyderabad, India
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Product</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              <li><a href="/#how-it-works" className="hover:text-white">How it works</a></li>
              <li><Link to="/compare" className="hover:text-white">Compare travel</Link></li>
              <li><a href="/#carpool" className="hover:text-white">Carpooling</a></li>
              <li><a href="/#pricing" className="hover:text-white">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Company</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              <li><a href="/#safety" className="hover:text-white">Safety</a></li>
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link to="/register" className="hover:text-white">Create account</Link></li>
              <li><Link to="/login" className="hover:text-white">Sign in</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Support</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              <li className="inline-flex items-center gap-2"><Mail className="h-4 w-4" /> {SUPPORT_EMAIL}</li>
              <li>Emergency SOS in-app</li>
              <li>Mon–Sat, 8am–9pm IST</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-5">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-4 text-xs text-white/40 sm:px-6 lg:px-8">
            <span>© {new Date().getFullYear()} ZEVORA Mobility Technologies. All rights reserved.</span>
            <span>{location.pathname === '/' ? 'Move Smart. Travel Together.' : 'Hyderabad pilot'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
