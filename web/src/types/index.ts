export type Role =
  | 'PASSENGER'
  | 'PRIVATE_CARPOOL_DRIVER'
  | 'COMMERCIAL_DRIVER'
  | 'OPERATOR_ADMIN'
  | 'CORPORATE_ADMIN'
  | 'SUPPORT_AGENT'
  | 'PLATFORM_ADMIN'
  | 'SUPER_ADMIN';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';
export type DriverType = 'PRIVATE_CARPOOL' | 'COMMERCIAL';
export type DriverStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type RideStatus = 'DRAFT' | 'PUBLISHED' | 'FULL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type BookingStatus = 'REQUESTED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
export type SafetyType = 'SOS' | 'INCIDENT';
export type SafetyStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
export type ProviderType =
  | 'PRIVATE_CARPOOL'
  | 'COMMERCIAL_SHARED_CAB'
  | 'PUBLIC_BUS'
  | 'METRO_FEEDER'
  | 'COMPANY_SHUTTLE'
  | 'AUTO'
  | 'CAB'
  | 'EXTERNAL_CAB';
export type DataQuality = 'LIVE' | 'ESTIMATED' | 'EXTERNAL';
export type CommutePreference = 'CHEAPEST' | 'FASTEST' | 'MOST_RELIABLE' | 'BALANCED';
export type NotificationType = 'BOOKING' | 'CANCELLATION' | 'SAFETY' | 'SYSTEM' | 'PAYMENT' | 'VERIFICATION';
export type SubscriptionPlan = 'BASIC_PLUS' | 'PREMIUM';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
export type OtpPurpose = 'LOGIN' | 'VERIFY_PHONE' | 'RESET_PASSWORD';

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiErrorBody {
  timestamp?: string;
  status?: number;
  code?: string;
  message?: string;
  path?: string;
  fieldErrors?: Record<string, string>;
}

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: UserSummary;
}

export interface Profile {
  homeAddress?: string | null;
  homeLat?: number | null;
  homeLng?: number | null;
  workAddress?: string | null;
  workLat?: number | null;
  workLng?: number | null;
  womenOnly: boolean;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

export interface MeResponse {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  profile: Profile;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  make?: string | null;
  model?: string | null;
  plateNumber: string;
  color?: string | null;
  seatCapacity: number;
  verified: boolean;
}

export interface DriverProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  driverType: DriverType;
  licenseNumber: string;
  licenseVerified: boolean;
  identityVerified: boolean;
  status: DriverStatus;
  rating: number;
  totalRides: number;
  available: boolean;
  vehicles: Vehicle[];
}

export interface Ride {
  id: string;
  driverId: string;
  driverName: string;
  driverRating: number;
  driverVerified: boolean;
  driverType?: DriverType;
  vehicleId: string;
  vehicleModel: string;
  vehiclePlate: string;
  originAddress: string;
  originLat: number;
  originLng: number;
  destAddress: string;
  destLat: number;
  destLng: number;
  departureTime: string;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: number;
  status: RideStatus;
  womenOnly: boolean;
  recurring: boolean;
  notes?: string | null;
  createdAt: string;
}

export interface RideSearchResult {
  ride: Ride;
  pickupDistanceKm: number;
  destinationDistanceKm: number;
  estimatedDurationMinutes: number;
  matchNote: string;
}

export interface RideRecurrence {
  id: string;
  rideId: string;
  daysOfWeek: string;
  startDate: string;
  endDate?: string | null;
  active: boolean;
}

export interface RideBrief {
  id: string;
  originAddress: string;
  destAddress: string;
  departureTime: string;
  pricePerSeat: number;
  status: RideStatus;
  driverName: string;
  vehiclePlate: string;
}

export interface Booking {
  id: string;
  rideId: string;
  passengerId: string;
  passengerName: string;
  seats: number;
  fareAmount: number;
  platformFee: number;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  ride: RideBrief | null;
}

export interface AlternativeOption {
  rideId: string;
  driverName: string;
  departureTime: string;
  pricePerSeat: number;
  availableSeats: number;
  pickupDistanceKm: number;
  estimatedDurationMinutes: number;
  matchScore: number;
}

export interface CancelResponse {
  booking: Booking;
  alternatives: AlternativeOption[];
}

export interface BookingHistoryEntry {
  status: BookingStatus;
  note: string;
  at: string;
}

export interface TravelOption {
  key: string;
  category: ProviderType;
  providerName: string;
  fare: number;
  farePerPassenger: number;
  durationMinutes: number;
  pickupEtaMinutes: number;
  walkingDistanceMeters: number;
  pickupLabel: string;
  dropLabel: string;
  availableSeats: number;
  operatorName?: string | null;
  verified: boolean;
  cancellationPolicy: string;
  bookingMethod: string;
  source: DataQuality;
  deepLink?: string | null;
  vehicleInfo?: string | null;
  rideId?: string | null;
  reliability: number;
  valueScore: number;
  recommended: boolean;
  departureTime: string;
  arrivalTime: string;
  note?: string | null;
}

export interface ComparisonResponse {
  originAddress: string;
  destAddress: string;
  distanceKm: number;
  seats: number;
  options: TravelOption[];
  recommendedOptionKey?: string | null;
  generatedAt: string;
  disclaimer: string;
}

export interface SavingsResponse {
  monthlySoloCost: number;
  monthlySharedCost: number;
  monthlySavings: number;
  workingDays: number;
  note: string;
}

export interface MonthlySavingsResponse {
  completedTrips: number;
  sharedSpend: number;
  estimatedSoloSpend: number;
  savings: number;
  periodDays: number;
  note: string;
}

export interface MatchResult {
  ride: Ride;
  matchScore: number;
  routeScore: number;
  timeScore: number;
  pickupScore: number;
  destinationScore: number;
  detourScore: number;
  pickupDistanceKm: number;
  destinationDistanceKm: number;
  extraDistanceKm: number;
  estimatedDurationMinutes: number;
  explanation: string;
}

export interface Review {
  id: string;
  bookingId: string;
  rating: number;
  comment?: string | null;
  toUserName?: string | null;
  createdAt: string;
}

export interface SafetyEvent {
  id: string;
  type: SafetyType;
  status: SafetyStatus;
  bookingId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  note?: string | null;
  createdAt: string;
}

export interface ShareResponse {
  token: string;
  publicPath: string;
  expiresAt: string;
}

export interface TrackingPoint {
  latitude: number;
  longitude: number;
  recordedAt: string;
}

export interface TrackingResponse {
  bookingId: string;
  points: TrackingPoint[];
  passengerName: string;
  driverName: string;
  vehiclePlate: string;
  originAddress: string;
  destAddress: string;
  departureTime: string;
  status: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startAt: string;
  endAt: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface PricingRule {
  id: string;
  code: string;
  name: string;
  type: string;
  baseFare: number;
  perKm: number;
  perMinute: number;
  platformFeePct: number;
  minFare?: number | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SystemSetting {
  id: string;
  settingKey: string;
  settingValue: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  actorId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  details?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminDashboard {
  totalUsers: number;
  totalDrivers: number;
  activeDrivers: number;
  completedRides: number;
  cancelledRides: number;
  activeBookings: number;
  pendingDriverVerifications: number;
  revenueLast30Days: number;
  openSafetyIncidents: number;
  bookingTrend: { date: string; count: number }[];
}

export interface AdminReports {
  totalRides: number;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  cancellationRatePercent: number;
  revenueCollected: number;
  refundCount: number;
  refundedAmount: number;
  safetyIncidents: number;
  activeSubscriptions: number;
}

export interface AdminUserSummary {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  status: UserStatus;
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  contactEmail?: string | null;
  status: string;
}

export interface CompanyEmployee {
  id: string;
  userId: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  employeeCode?: string | null;
  department?: string | null;
  officeAddress?: string | null;
  verified: boolean;
}

export interface CorporateLocation {
  id: string;
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CompanyShuttle {
  id: string;
  name: string;
  routeName?: string | null;
  originAddress?: string | null;
  destAddress?: string | null;
  departureTime: string;
  daysOfWeek?: string | null;
  seatCapacity: number;
  availableSeats: number;
  fare: number;
  active: boolean;
}

export interface CorporateReport {
  companyId: string;
  employees: number;
  verifiedEmployees: number;
  shuttles: number;
  locations: number;
  totalShuttleSeats: number;
  estimatedMonthlyTransportSpend: number;
  note: string;
}

export interface TransportOperator {
  id: string;
  name: string;
  contactEmail?: string | null;
  status: string;
  verified: boolean;
}

export interface OperatorRoute {
  id: string;
  operatorId: string;
  name: string;
  originAddress?: string | null;
  destAddress?: string | null;
  baseFare?: number | null;
  perKm?: number | null;
  active: boolean;
}

export interface OperatorSchedule {
  id: string;
  routeId: string;
  departureTime: string;
  daysOfWeek?: string | null;
  seatCapacity: number;
  availableSeats: number;
  fare?: number | null;
  active: boolean;
}

export interface OperatorVehicle {
  id: string;
  plateNumber: string;
  model?: string | null;
  seatCapacity: number;
  verified: boolean;
}

export interface OperatorDriver {
  id: string;
  fullName: string;
  phone?: string | null;
  licenseNumber?: string | null;
  verified: boolean;
}

export interface OperatorFleet {
  vehicles: OperatorVehicle[];
  drivers: OperatorDriver[];
}

export interface OperatorSummary {
  operatorId: string;
  operatorName: string;
  routes: number;
  schedules: number;
  vehicles: number;
  drivers: number;
  dailySeatCapacity: number;
  estimatedMonthlyRevenue: number;
  note: string;
}
