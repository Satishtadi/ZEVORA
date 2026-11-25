import { api } from '@/lib/api';
import type {
  AdminDashboard,
  AdminReports,
  AdminUserSummary,
  AlternativeOption,
  AppNotification,
  AuditLog,
  Booking,
  BookingHistoryEntry,
  CancelResponse,
  Company,
  CompanyEmployee,
  CompanyShuttle,
  ComparisonResponse,
  CorporateLocation,
  CorporateReport,
  DriverProfile,
  DriverStatus,
  DriverType,
  MeResponse,
  MatchResult,
  MonthlySavingsResponse,
  OperatorDriver,
  OperatorFleet,
  OperatorRoute,
  OperatorSchedule,
  OperatorSummary,
  OperatorVehicle,
  PageResponse,
  PricingRule,
  Profile,
  Review,
  Ride,
  RideRecurrence,
  RideSearchResult,
  Role,
  SafetyEvent,
  SafetyStatus,
  SavingsResponse,
  ShareResponse,
  Subscription,
  SubscriptionPlan,
  SystemSetting,
  TokenResponse,
  TrackingResponse,
  TransportOperator,
  TravelOption,
  UserSummary,
  Vehicle,
} from '@/types';

/* ------------------------------- auth ---------------------------------- */
export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export const authApi = {
  register: (input: RegisterInput) => api.post<TokenResponse>('/auth/register', input).then((r) => r.data),
  login: (identifier: string, password: string) =>
    api.post<TokenResponse>('/auth/login', { identifier, password }).then((r) => r.data),
  logout: (refreshToken?: string | null) =>
    api.post<{ message: string }>('/auth/logout', { refreshToken }, { _skipAuthRefresh: true }).then((r) => r.data),
  requestOtp: (phone: string, purpose: 'LOGIN' | 'VERIFY_PHONE' | 'RESET_PASSWORD') =>
    api.post<{ message: string; devCode?: string | null }>('/auth/request-otp', { phone, purpose }).then((r) => r.data),
  verifyOtp: (phone: string, code: string, purpose: 'LOGIN' | 'VERIFY_PHONE' | 'RESET_PASSWORD') =>
    api.post<{ message: string; devCode?: string | null }>('/auth/verify-otp', { phone, code, purpose }).then((r) => r.data),
};

/* ------------------------------- users --------------------------------- */
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

export const usersApi = {
  me: () => api.get<MeResponse>('/users/me').then((r) => r.data),
  updateMe: (input: UpdateMeInput) => api.put<MeResponse>('/users/me', input).then((r) => r.data),
  profile: () => api.get<Profile>('/users/me/profile').then((r) => r.data),
};

/* ------------------------------ drivers -------------------------------- */
export interface VehicleInput {
  make?: string;
  model?: string;
  plateNumber: string;
  color?: string;
  seatCapacity: number;
}

export const driversApi = {
  register: (driverType: DriverType, licenseNumber: string) =>
    api.post<DriverProfile>('/drivers/register', { driverType, licenseNumber }).then((r) => r.data),
  profile: () => api.get<DriverProfile>('/drivers/profile').then((r) => r.data),
  setAvailability: (available: boolean, lat?: number, lng?: number) =>
    api.put<DriverProfile>('/drivers/availability', { available, lat, lng }).then((r) => r.data),
  vehicles: () => api.get<Vehicle[]>('/vehicles').then((r) => r.data),
  addVehicle: (input: VehicleInput) => api.post<Vehicle>('/vehicles', input).then((r) => r.data),
  updateVehicle: (id: string, input: VehicleInput) => api.put<Vehicle>(`/vehicles/${id}`, input).then((r) => r.data),
};

/* ------------------------------- rides --------------------------------- */
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

export const ridesApi = {
  create: (input: CreateRideInput) => api.post<Ride>('/rides', input).then((r) => r.data),
  search: (params: RideSearchParams) =>
    api.get<RideSearchResult[]>('/rides/search', { params }).then((r) => r.data),
  mine: () => api.get<Ride[]>('/rides/mine').then((r) => r.data),
  get: (id: string) => api.get<Ride>(`/rides/${id}`).then((r) => r.data),
  update: (id: string, input: CreateRideInput) => api.put<Ride>(`/rides/${id}`, input).then((r) => r.data),
  publish: (id: string) => api.post<Ride>(`/rides/${id}/publish`).then((r) => r.data),
  cancel: (id: string, reason?: string) =>
    api.post<{ message: string }>(`/rides/${id}/cancel`, { reason }).then((r) => r.data),
  complete: (id: string) => api.post<{ message: string }>(`/rides/${id}/complete`).then((r) => r.data),
  recurrence: (id: string) => api.get<RideRecurrence>(`/rides/${id}/recurrence`).then((r) => r.data),
  createRecurrence: (id: string, daysOfWeek: string, startDate: string, endDate?: string) =>
    api.post<RideRecurrence>(`/rides/${id}/recurrence`, { daysOfWeek, startDate, endDate }).then((r) => r.data),
};

/* ----------------------------- bookings -------------------------------- */
export const bookingsApi = {
  create: (rideId: string, seats: number, idempotencyKey: string) =>
    api.post<Booking>('/bookings', { rideId, seats, idempotencyKey }).then((r) => r.data),
  mine: (page = 0, size = 20) =>
    api.get<PageResponse<Booking>>('/bookings', { params: { page, size } }).then((r) => r.data),
  get: (id: string) => api.get<Booking>(`/bookings/${id}`).then((r) => r.data),
  cancel: (id: string, reason?: string) =>
    api.post<CancelResponse>(`/bookings/${id}/cancel`, { reason }).then((r) => r.data),
  alternatives: (id: string) => api.get<AlternativeOption[]>(`/bookings/${id}/alternatives`).then((r) => r.data),
  history: (id: string) => api.get<BookingHistoryEntry[]>(`/bookings/${id}/history`).then((r) => r.data),
  forRide: (rideId: string) => api.get<Booking[]>(`/bookings/ride/${rideId}`).then((r) => r.data),
};

/* ----------------------------- comparison ------------------------------ */
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

export interface ComparisonQuery extends CompareInput {
  sortBy?: string;
  category?: string;
  maxFare?: number;
}

export const commuteApi = {
  compare: (input: CompareInput) => api.post<ComparisonResponse>('/commute/compare', input).then((r) => r.data),
  options: (params: ComparisonQuery) =>
    api.get<ComparisonResponse>('/commute/options', { params }).then((r) => r.data),
  monthlySavings: () => api.get<MonthlySavingsResponse>('/commute/savings').then((r) => r.data),
  calculateSavings: (soloCabFarePerDay: number, sharedFarePerDay: number, workingDays: number) =>
    api
      .post<SavingsResponse>('/commute/savings', { soloCabFarePerDay, sharedFarePerDay, workingDays })
      .then((r) => r.data),
};

/* ------------------------------ matching ------------------------------- */
export interface MatchSearchInput {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  departureTime: string;
  seats: number;
  womenOnly: boolean;
  preference?: string;
}

export const matchingApi = {
  search: (input: MatchSearchInput) => api.post<MatchResult[]>('/matching/search', input).then((r) => r.data),
  accept: (rideId: string, seats: number, idempotencyKey: string) =>
    api.post<Booking>(`/matching/${rideId}/accept`, { seats, idempotencyKey }).then((r) => r.data),
};

/* ------------------------------- safety -------------------------------- */
export const safetyApi = {
  sos: (bookingId?: string, latitude?: number, longitude?: number, note?: string) =>
    api.post<SafetyEvent>('/safety/sos', { bookingId, latitude, longitude, note }).then((r) => r.data),
  report: (input: { bookingId?: string; type: 'SOS' | 'INCIDENT'; latitude?: number; longitude?: number; note: string }) =>
    api.post<SafetyEvent>('/safety/report', input).then((r) => r.data),
  events: () => api.get<SafetyEvent[]>('/safety/events').then((r) => r.data),
  share: (bookingId: string) => api.post<ShareResponse>(`/bookings/${bookingId}/share`).then((r) => r.data),
  ping: (bookingId: string, latitude: number, longitude: number) =>
    api.post<{ message: string }>(`/trips/${bookingId}/tracking`, { latitude, longitude }).then((r) => r.data),
  tracking: (bookingId: string) => api.get<TrackingResponse>(`/trips/${bookingId}/tracking`).then((r) => r.data),
  publicTracking: (token: string) => api.get<TrackingResponse>(`/public/trips/${token}`).then((r) => r.data),
};

/* ----------------------------- notifications --------------------------- */
export const notificationsApi = {
  list: () => api.get<AppNotification[]>('/notifications').then((r) => r.data),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),
  markRead: (id: string) => api.put<{ message: string }>(`/notifications/${id}/read`).then((r) => r.data),
};

/* ------------------------------ reviews -------------------------------- */
export const reviewsApi = {
  create: (bookingId: string, rating: number, comment?: string) =>
    api.post<Review>('/reviews', { bookingId, rating, comment }).then((r) => r.data),
  forBooking: (bookingId: string) => api.get<Review | null>(`/reviews/booking/${bookingId}`).then((r) => r.data),
};

/* --------------------------- subscriptions ----------------------------- */
export const subscriptionsApi = {
  subscribe: (plan: SubscriptionPlan) => api.post<Subscription>('/subscriptions', { plan }).then((r) => r.data),
  current: () => api.get<Subscription>('/subscriptions/me').then((r) => r.data),
  history: () => api.get<Subscription[]>('/subscriptions').then((r) => r.data),
  cancel: () => api.post<{ message: string }>('/subscriptions/cancel').then((r) => r.data),
};

/* ------------------------------- admin --------------------------------- */
export const adminApi = {
  dashboard: () => api.get<AdminDashboard>('/admin/dashboard').then((r) => r.data),
  users: (q = '', page = 0, size = 20) =>
    api.get<PageResponse<AdminUserSummary>>('/admin/users', { params: { q, page, size } }).then((r) => r.data),
  setUserStatus: (id: string, suspend: boolean, reason?: string) =>
    api.put<AdminUserSummary>(`/admin/users/${id}/status`, { suspend, reason }).then((r) => r.data),
  drivers: (status?: DriverStatus, page = 0, size = 20) =>
    api
      .get<PageResponse<DriverProfile>>('/admin/drivers', { params: { status, page, size } })
      .then((r) => r.data),
  verifyDriver: (id: string, approved: boolean, note?: string) =>
    api.post<DriverProfile>(`/admin/drivers/${id}/verify`, { approved, note }).then((r) => r.data),
  verifyVehicle: (id: string, approved: boolean) =>
    api.post<Vehicle>(`/admin/vehicles/${id}/verify`, { approved }).then((r) => r.data),
  bookings: (status?: string, page = 0, size = 20) =>
    api.get<PageResponse<Booking>>('/admin/bookings', { params: { status, page, size } }).then((r) => r.data),
  safety: (status?: SafetyStatus, page = 0, size = 20) =>
    api.get<PageResponse<SafetyEvent>>('/admin/safety', { params: { status, page, size } }).then((r) => r.data),
  resolveSafety: (id: string, status: SafetyStatus) =>
    api.put<SafetyEvent>(`/admin/safety/${id}/status`, null, { params: { status } }).then((r) => r.data),
  settings: () => api.get<SystemSetting[]>('/admin/settings').then((r) => r.data),
  updateSetting: (key: string, value: string, description?: string) =>
    api.put<SystemSetting>(`/admin/settings/${encodeURIComponent(key)}`, { value, description }).then((r) => r.data),
  pricingRules: () => api.get<PricingRule[]>('/admin/pricing-rules').then((r) => r.data),
  updatePricing: (id: string, input: Omit<PricingRule, 'id' | 'code' | 'type' | 'createdAt' | 'updatedAt'>) =>
    api.put<PricingRule>(`/admin/pricing-rules/${id}`, input).then((r) => r.data),
  reports: () => api.get<AdminReports>('/admin/reports').then((r) => r.data),
  auditLogs: (page = 0, size = 20) =>
    api.get<PageResponse<AuditLog>>('/admin/audit-logs', { params: { page, size } }).then((r) => r.data),
};

/* ----------------------------- corporate ------------------------------- */
export const corporateApi = {
  companies: () => api.get<Company[]>('/corporate/companies').then((r) => r.data),
  createCompany: (name: string, domain: string, contactEmail?: string) =>
    api.post<Company>('/corporate/companies', { name, domain, contactEmail }).then((r) => r.data),
  employees: (companyId: string) =>
    api.get<CompanyEmployee[]>(`/corporate/companies/${companyId}/employees`).then((r) => r.data),
  addEmployee: (
    companyId: string,
    input: {
      email: string;
      employeeCode?: string;
      department?: string;
      officeAddress?: string;
      officeLat?: number;
      officeLng?: number;
    },
  ) => api.post<CompanyEmployee>(`/corporate/companies/${companyId}/employees`, input).then((r) => r.data),
  verifyEmployee: (companyId: string, employeeId: string, verified: boolean) =>
    api
      .put<CompanyEmployee>(`/corporate/companies/${companyId}/employees/${employeeId}/verify`, null, {
        params: { verified },
      })
      .then((r) => r.data),
  locations: (companyId: string) =>
    api.get<CorporateLocation[]>(`/corporate/companies/${companyId}/locations`).then((r) => r.data),
  addLocation: (companyId: string, input: Omit<CorporateLocation, 'id'>) =>
    api.post<CorporateLocation>(`/corporate/companies/${companyId}/locations`, input).then((r) => r.data),
  shuttles: (companyId: string) =>
    api.get<CompanyShuttle[]>(`/corporate/companies/${companyId}/shuttles`).then((r) => r.data),
  addShuttle: (companyId: string, input: Omit<CompanyShuttle, 'id'>) =>
    api.post<CompanyShuttle>(`/corporate/companies/${companyId}/shuttles`, input).then((r) => r.data),
  report: (companyId: string) =>
    api.get<CorporateReport>(`/corporate/companies/${companyId}/reports`).then((r) => r.data),
};

/* ------------------------------ operator ------------------------------- */
export const operatorApi = {
  operators: () => api.get<TransportOperator[]>('/operator/operators').then((r) => r.data),
  createOperator: (name: string, contactEmail?: string) =>
    api.post<TransportOperator>('/operator/operators', { name, contactEmail }).then((r) => r.data),
  routes: (operatorId: string) =>
    api.get<OperatorRoute[]>(`/operator/operators/${operatorId}/routes`).then((r) => r.data),
  addRoute: (operatorId: string, input: Omit<OperatorRoute, 'id' | 'operatorId'>) =>
    api.post<OperatorRoute>(`/operator/operators/${operatorId}/routes`, input).then((r) => r.data),
  schedules: (routeId: string) =>
    api.get<OperatorSchedule[]>(`/operator/routes/${routeId}/schedules`).then((r) => r.data),
  addSchedule: (routeId: string, input: Omit<OperatorSchedule, 'id' | 'routeId'>) =>
    api.post<OperatorSchedule>(`/operator/routes/${routeId}/schedules`, input).then((r) => r.data),
  fleet: (operatorId: string) =>
    api.get<OperatorFleet>(`/operator/operators/${operatorId}/fleet`).then((r) => r.data),
  addVehicle: (operatorId: string, input: Omit<OperatorVehicle, 'id'>) =>
    api.post<OperatorVehicle>(`/operator/operators/${operatorId}/vehicles`, input).then((r) => r.data),
  addDriver: (operatorId: string, input: Omit<OperatorDriver, 'id'>) =>
    api.post<OperatorDriver>(`/operator/operators/${operatorId}/drivers`, input).then((r) => r.data),
  summary: (operatorId: string) =>
    api.get<OperatorSummary>(`/operator/operators/${operatorId}/summary`).then((r) => r.data),
};

export const services = {
  auth: authApi,
  users: usersApi,
  drivers: driversApi,
  rides: ridesApi,
  bookings: bookingsApi,
  commute: commuteApi,
  matching: matchingApi,
  safety: safetyApi,
  notifications: notificationsApi,
  reviews: reviewsApi,
  subscriptions: subscriptionsApi,
  admin: adminApi,
  corporate: corporateApi,
  operator: operatorApi,
};

export type { TravelOption, UserSummary, Role };
