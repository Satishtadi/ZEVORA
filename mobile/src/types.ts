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

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
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

export interface MonthlySavingsResponse {
  completedTrips: number;
  sharedSpend: number;
  estimatedSoloSpend: number;
  savings: number;
  periodDays: number;
  note: string;
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

export interface Review {
  id: string;
  bookingId: string;
  rating: number;
  comment?: string | null;
  toUserName?: string | null;
  createdAt: string;
}
