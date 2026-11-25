import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Building2,
  Bus,
  CalendarCheck,
  CarFront,
  ClipboardList,
  Clock,
  FileBarChart,
  Gauge,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  MapPin,
  Menu,
  PlusCircle,
  Route,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Ticket,
  TrendingUp,
  Truck,
  UserRound,
  Users,
  UsersRound,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { LogoLink } from '@/components/Brand';
import { Avatar, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { screensApi } from '@/services/screen-api';
import { cn } from '@/lib/utils';
import { roleLabels } from '@/lib/roles';

export type ShellPortal = 'passenger' | 'driver' | 'admin' | 'corporate' | 'operator';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const navConfig: Record<ShellPortal, { title: string; subtitle: string; items: NavItem[] }> = {
  passenger: {
    title: 'Passenger',
    subtitle: 'Move smart across Hyderabad',
    items: [
      { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/app/search', label: 'Find a ride', icon: Search },
      { to: '/app/bookings', label: 'My bookings', icon: Ticket },
      { to: '/app/savings', label: 'Monthly savings', icon: TrendingUp },
      { to: '/app/recurring', label: 'Recurring commute', icon: CalendarCheck },
      { to: '/app/notifications', label: 'Notifications', icon: Bell },
      { to: '/app/safety', label: 'Safety & support', icon: ShieldCheck },
      { to: '/app/profile', label: 'Profile', icon: UserRound },
    ],
  },
  driver: {
    title: 'Driver',
    subtitle: 'Publish rides and manage trips',
    items: [
      { to: '/driver', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/driver/rides/new', label: 'Publish ride', icon: PlusCircle },
      { to: '/driver/rides', label: 'My rides', icon: CarFront },
      { to: '/driver/requests', label: 'Passenger requests', icon: ClipboardList },
      { to: '/driver/vehicles', label: 'Vehicles', icon: Truck },
      { to: '/driver/earnings', label: 'Earnings', icon: Wallet },
      { to: '/driver/notifications', label: 'Notifications', icon: Bell },
      { to: '/driver/profile', label: 'Profile', icon: UserRound },
    ],
  },
  admin: {
    title: 'Admin',
    subtitle: 'Platform operations control',
    items: [
      { to: '/admin', label: 'Overview', icon: Gauge, end: true },
      { to: '/admin/users', label: 'Users', icon: Users },
      { to: '/admin/drivers', label: 'Driver verification', icon: BadgeCheck },
      { to: '/admin/bookings', label: 'Bookings', icon: Ticket },
      { to: '/admin/safety', label: 'Safety incidents', icon: AlertTriangle },
      { to: '/admin/pricing', label: 'Pricing rules', icon: Wallet },
      { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
      { to: '/admin/audit-logs', label: 'Audit logs', icon: ScrollText },
      { to: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
  corporate: {
    title: 'Corporate',
    subtitle: 'Employee commute operations',
    items: [
      { to: '/corporate', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/corporate/employees', label: 'Employees', icon: UsersRound },
      { to: '/corporate/locations', label: 'Office locations', icon: MapPin },
      { to: '/corporate/shuttles', label: 'Shuttles', icon: Bus },
      { to: '/corporate/reports', label: 'Reports', icon: FileBarChart },
      { to: '/corporate/profile', label: 'Company profile', icon: Building2 },
    ],
  },
  operator: {
    title: 'Operator',
    subtitle: 'Fleet, routes and schedules',
    items: [
      { to: '/operator', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/operator/routes', label: 'Routes', icon: Route },
      { to: '/operator/schedules', label: 'Schedules', icon: Clock },
      { to: '/operator/fleet', label: 'Fleet', icon: Truck },
      { to: '/operator/drivers', label: 'Drivers', icon: Users },
      { to: '/operator/settlements', label: 'Settlements', icon: ListOrdered },
      { to: '/operator/profile', label: 'Operator profile', icon: Building2 },
    ],
  },
};

function NotificationBell({ portal }: { portal: ShellPortal }) {
  const { data } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: screensApi.notifications.unreadCount,
    refetchInterval: 60_000,
    retry: false,
  });
  const count = data?.count ?? 0;
  return (
    <Link
      to={`/${portal === 'passenger' ? 'app' : portal}/notifications`}
      className="relative rounded-xl border border-ink-200 bg-white p-2.5 text-ink-600 transition-colors hover:bg-ink-50"
      aria-label={`Notifications${count ? `, ${count} unread` : ''}`}
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}

function UserMenu({ portal }: { portal: ShellPortal }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white p-1 pr-3 text-left transition-colors hover:bg-ink-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={user?.fullName} size="sm" />
        <span className="hidden leading-tight sm:block">
          <span className="block max-w-36 truncate text-sm font-semibold text-ink-900">{user?.fullName}</span>
          <span className="block text-[11px] text-ink-500">{user?.role ? roleLabels[user.role] : ''}</span>
        </span>
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-xl border border-ink-100 bg-white shadow-lift" role="menu">
          <div className="border-b border-ink-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink-900">{user?.fullName}</p>
            <p className="truncate text-xs text-ink-500">{user?.email}</p>
          </div>
          <div className="p-1.5">
            <Link
              to={`/${portal === 'passenger' ? 'app' : portal}/profile`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
            >
              <UserRound className="h-4 w-4" /> My profile
            </Link>
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
            >
              <MapPin className="h-4 w-4" /> Public website
            </Link>
            <button
              onClick={async () => {
                setOpen(false);
                await logout();
                navigate('/login');
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarContent({ portal, onNavigate }: { portal: ShellPortal; onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const config = navConfig[portal];
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-ink-100 px-5">
        <LogoLink />
      </div>
      <div className="px-5 pt-5">
        <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-700">
          {config.title} portal
        </span>
        <p className="mt-2 text-xs text-ink-500">{config.subtitle}</p>
      </div>
      <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {config.items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
              )
            }
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        ))}
        {portal === 'passenger' && (
          <Link
            to="/app/become-driver"
            onClick={onNavigate}
            className="mt-3 flex items-center gap-3 rounded-xl border border-dashed border-brand-200 px-3 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            <CarFront className="h-[18px] w-[18px]" /> Become a driver
          </Link>
        )}
      </nav>
      <div className="border-t border-ink-100 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-2.5">
          <Avatar name={user?.fullName} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-900">{user?.fullName}</p>
            <p className="truncate text-[11px] text-ink-500">{user?.phone}</p>
          </div>
          <button onClick={logout} className="rounded-lg p-1.5 text-ink-400 hover:bg-white hover:text-red-600" aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ portal }: { portal: ShellPortal }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const config = navConfig[portal];

  return (
    <div className="min-h-screen bg-ink-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[270px] border-r border-ink-100 bg-white lg:block">
        <SidebarContent portal={portal} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[290px] bg-white shadow-lift">
            <button
              className="absolute right-3 top-3 z-10 rounded-lg p-2 text-ink-500 hover:bg-ink-100"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent portal={portal} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-[270px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-ink-100 bg-white/85 px-4 backdrop-blur-lg sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-ink-400">{config.title}</p>
              <p className="hidden text-sm font-semibold text-ink-900 sm:block">{config.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell portal={portal} />
            <UserMenu portal={portal} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
