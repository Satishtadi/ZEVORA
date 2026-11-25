import {
  adminApi,
  authApi,
  bookingsApi,
  commuteApi,
  corporateApi,
  driversApi,
  matchingApi,
  notificationsApi,
  operatorApi,
  reviewsApi,
  ridesApi,
  safetyApi,
  subscriptionsApi,
  usersApi,
} from './api-services';

/**
 * Namespaced façade used by screens so each page imports one object while the
 * underlying implementation stays grouped by backend module.
 */
export const screensApi = {
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
