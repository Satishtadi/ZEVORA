import type { Role } from '@/types';

export type Portal = 'passenger' | 'driver' | 'admin' | 'corporate' | 'operator';

export function portalForRole(role?: Role | null): Portal {
  switch (role) {
    case 'PRIVATE_CARPOOL_DRIVER':
    case 'COMMERCIAL_DRIVER':
      return 'driver';
    case 'PLATFORM_ADMIN':
    case 'SUPER_ADMIN':
    case 'SUPPORT_AGENT':
      return 'admin';
    case 'CORPORATE_ADMIN':
      return 'corporate';
    case 'OPERATOR_ADMIN':
      return 'operator';
    default:
      return 'passenger';
  }
}

export function isAdminRole(role?: Role | null): boolean {
  return role === 'PLATFORM_ADMIN' || role === 'SUPER_ADMIN' || role === 'SUPPORT_AGENT';
}

export function isDriverRole(role?: Role | null): boolean {
  return role === 'PRIVATE_CARPOOL_DRIVER' || role === 'COMMERCIAL_DRIVER';
}

export const portalHome: Record<Portal, string> = {
  passenger: '/app',
  driver: '/driver',
  admin: '/admin',
  corporate: '/corporate',
  operator: '/operator',
};

export const roleLabels: Record<Role, string> = {
  PASSENGER: 'Passenger',
  PRIVATE_CARPOOL_DRIVER: 'Carpool driver',
  COMMERCIAL_DRIVER: 'Commercial driver',
  OPERATOR_ADMIN: 'Operator admin',
  CORPORATE_ADMIN: 'Corporate admin',
  SUPPORT_AGENT: 'Support agent',
  PLATFORM_ADMIN: 'Platform admin',
  SUPER_ADMIN: 'Super admin',
};
