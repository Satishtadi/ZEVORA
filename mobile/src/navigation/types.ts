import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  PassengerTabs: NavigatorScreenParams<PassengerTabParamList> | undefined;
  DriverTabs: NavigatorScreenParams<DriverTabParamList> | undefined;
  RideDetails: { rideId: string };
  BookingDetails: { bookingId: string };
  Notifications: undefined;
  PortalUnsupported: undefined;
};

export type SearchStackParamList = {
  Search: undefined;
  Compare: CompareParams;
};

export type BookingsStackParamList = {
  Bookings: undefined;
};

export type PassengerTabParamList = {
  Home: undefined;
  SearchTab: NavigatorScreenParams<SearchStackParamList> | undefined;
  BookingsTab: NavigatorScreenParams<BookingsStackParamList> | undefined;
  SafetyTab: undefined;
  ProfileTab: undefined;
};

export type DriverRidesStackParamList = {
  MyRides: undefined;
  PublishRide: undefined;
};

export type DriverTabParamList = {
  DriverHome: undefined;
  DriverRides: NavigatorScreenParams<DriverRidesStackParamList> | undefined;
  DriverRequests: undefined;
  DriverVehicles: undefined;
  DriverProfile: undefined;
};

export interface CompareParams {
  originName?: string;
  originAddress: string;
  originLat: number;
  originLng: number;
  destName?: string;
  destAddress: string;
  destLat: number;
  destLng: number;
  departureTime: string;
  seats: number;
  womenOnly: boolean;
  preference?: string;
}
