import type { Role } from '../types';

export type Portal = 'passenger' | 'driver' | 'admin' | 'corporate' | 'operator' | 'unsupported';

export function portalForRole(role?: Role | null): Portal {
  switch (role) {
    case 'PASSENGER':
      return 'passenger';
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

export function isDriverRole(role?: Role | null) {
  return role === 'PRIVATE_CARPOOL_DRIVER' || role === 'COMMERCIAL_DRIVER';
}

export const roleLabels: Record<Role, string> = {
  PASSENGER: 'Passenger',
  PRIVATE_CARPOOL_DRIVER: 'Private carpool driver',
  COMMERCIAL_DRIVER: 'Commercial driver',
  OPERATOR_ADMIN: 'Operator admin',
  CORPORATE_ADMIN: 'Corporate admin',
  SUPPORT_AGENT: 'Support agent',
  PLATFORM_ADMIN: 'Platform admin',
  SUPER_ADMIN: 'Super admin',
};
