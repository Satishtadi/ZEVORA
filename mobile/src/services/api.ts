import { api } from '../lib/api';
import type {
  AppNotification,
  Booking,
  CancelResponse,
  ComparisonResponse,
  DriverProfile,
  DriverType,
  MeResponse,
  MonthlySavingsResponse,
  PageResponse,
  Ride,
  RideSearchResult,
  SafetyEvent,
  SafetyType,
  ShareResponse,
  Subscription,
  SubscriptionPlan,
  TokenResponse,
  UserSummary,
  Vehicle,
} from '../types';

export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface VehicleInput {
  make?: string;
  model?: string;
  plateNumber: string;
  color?: string;
  seatCapacity: number;
}

export interface CreateRideInput {
  vehicleId: string;
  originAddress: string;
  originLat: number;
  originLng: number;
  destAddress: string;
  destLat: number;
  destLng: number;
  departureTime: string;
  totalSeats: number;
  pricePerSeat: number;
  womenOnly: boolean;
  recurring: boolean;
  notes?: string;
}

export interface RideSearchParams {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  departureTime: string;
  seats: number;
  womenOnly: boolean;
}

export interface CompareInput {
  originAddress?: string;
  originLat: number;
  originLng: number;
  destAddress?: string;
  destLat: number;
  destLng: number;
  departureTime: string;
  seats: number;
  womenOnly: boolean;
  preference?: string;
}

export interface UpdateMeInput {
  fullName?: string;
  homeAddress?: string;
  homeLat?: number;
  homeLng?: number;
  workAddress?: string;
  workLat?: number;
  workLng?: number;
  womenOnly?: boolean;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export const authApi = {
  register: (input: RegisterInput) => api.post<TokenResponse>('/auth/register', input).then((r) => r.data),
  login: (identifier: string, password: string) =>
    api.post<TokenResponse>('/auth/login', { identifier, password }).then((r) => r.data),
  logout: (refreshToken?: string | null) =>
    api.post<{ message: string }>('/auth/logout', { refreshToken }, { _skipAuthRefresh: true } as never).then((r) => r.data),
  me: () => api.get<MeResponse>('/users/me').then((r) => r.data),
};

export const usersApi = {
  me: () => api.get<MeResponse>('/users/me').then((r) => r.data),
  updateMe: (input: UpdateMeInput) => api.put<MeResponse>('/users/me', input).then((r) => r.data),
};

export const driversApi = {
  register: (driverType: DriverType, licenseNumber: string) =>
    api.post<DriverProfile>('/drivers/register', { driverType, licenseNumber }).then((r) => r.data),
  profile: () => api.get<DriverProfile>('/drivers/profile').then((r) => r.data),
  setAvailability: (available: boolean, lat?: number, lng?: number) =>
    api.put<DriverProfile>('/drivers/availability', { available, lat, lng }).then((r) => r.data),
  vehicles: () => api.get<Vehicle[]>('/vehicles').then((r) => r.data),
  addVehicle: (input: VehicleInput) => api.post<Vehicle>('/vehicles', input).then((r) => r.data),
};

export const ridesApi = {
  create: (input: CreateRideInput) => api.post<Ride>('/rides', input).then((r) => r.data),
  search: (params: RideSearchParams) => api.get<RideSearchResult[]>('/rides/search', { params }).then((r) => r.data),
  mine: () => api.get<Ride[]>('/rides/mine').then((r) => r.data),
  get: (id: string) => api.get<Ride>(`/rides/${id}`).then((r) => r.data),
  cancel: (id: string, reason?: string) =>
    api.post<{ message: string }>(`/rides/${id}/cancel`, { reason }).then((r) => r.data),
  complete: (id: string) => api.post<{ message: string }>(`/rides/${id}/complete`).then((r) => r.data),
};

export const bookingsApi = {
  create: (rideId: string, seats: number, idempotencyKey: string) =>
    api.post<Booking>('/bookings', { rideId, seats, idempotencyKey }).then((r) => r.data),
  mine: (page = 0, size = 50) =>
    api.get<PageResponse<Booking>>('/bookings', { params: { page, size } }).then((r) => r.data),
  get: (id: string) => api.get<Booking>(`/bookings/${id}`).then((r) => r.data),
  cancel: (id: string, reason?: string) =>
    api.post<CancelResponse>(`/bookings/${id}/cancel`, { reason }).then((r) => r.data),
  forRide: (rideId: string) => api.get<Booking[]>(`/bookings/ride/${rideId}`).then((r) => r.data),
  share: (id: string) => api.post<ShareResponse>(`/bookings/${id}/share`).then((r) => r.data),
};

export const commuteApi = {
  compare: (input: CompareInput) => api.post<ComparisonResponse>('/commute/compare', input).then((r) => r.data),
  options: (params: CompareInput) =>
    api.get<ComparisonResponse>('/commute/options', { params }).then((r) => r.data),
  monthlySavings: () => api.get<MonthlySavingsResponse>('/commute/savings').then((r) => r.data),
};

export const safetyApi = {
  sos: (bookingId?: string, latitude?: number, longitude?: number, note?: string) =>
    api.post<SafetyEvent>('/safety/sos', { bookingId, latitude, longitude, note }).then((r) => r.data),
  report: (input: { bookingId?: string; type: SafetyType; latitude?: number; longitude?: number; note: string }) =>
    api.post<SafetyEvent>('/safety/report', input).then((r) => r.data),
  events: () => api.get<SafetyEvent[]>('/safety/events').then((r) => r.data),
};

export const notificationsApi = {
  list: () => api.get<AppNotification[]>('/notifications').then((r) => r.data),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),
  markRead: (id: string) => api.put<{ message: string }>(`/notifications/${id}/read`).then((r) => r.data),
};

export const subscriptionsApi = {
  subscribe: (plan: SubscriptionPlan) => api.post<Subscription>('/subscriptions', { plan }).then((r) => r.data),
  current: () => api.get<Subscription>('/subscriptions/me').then((r) => r.data),
  cancel: () => api.post<{ message: string }>('/subscriptions/cancel').then((r) => r.data),
};

export type { UserSummary };
