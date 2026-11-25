import { Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { PublicOnly, RequirePortal } from '@/components/layout/ProtectedRoute';
import { LandingPage } from '@/pages/public/Landing';
import { LoginPage, RegisterPage } from '@/pages/public/AuthPages';
import { ContactPage, ForgotPasswordPage, NotFoundPage } from '@/pages/public/ContactPages';
import { PublicComparePage } from '@/pages/public/PublicCompare';
import { PublicTrackingPage } from '@/pages/public/PublicTracking';
import { PassengerDashboard } from '@/pages/passenger/Dashboard';
import { SearchPage } from '@/pages/passenger/Search';
import { CompareResultsPage } from '@/pages/passenger/CompareResults';
import { RideDetailsPage } from '@/pages/passenger/RideDetails';
import { BookingsPage } from '@/pages/passenger/Bookings';
import { BookingDetailsPage } from '@/pages/passenger/BookingDetails';
import { SavingsPage } from '@/pages/passenger/Savings';
import { RecurringPage } from '@/pages/passenger/Recurring';
import { BecomeDriverPage } from '@/pages/passenger/BecomeDriver';
import { DriverDashboard } from '@/pages/driver/Dashboard';
import { DriverVehiclesPage } from '@/pages/driver/Vehicles';
import { DriverRidesPage } from '@/pages/driver/Rides';
import { PublishRidePage } from '@/pages/driver/PublishRide';
import { DriverRideDetailsPage } from '@/pages/driver/RideDetails';
import { DriverRequestsPage } from '@/pages/driver/Requests';
import { DriverEarningsPage } from '@/pages/driver/Earnings';
import { AdminDashboard } from '@/pages/admin/Dashboard';
import { AdminUsersPage } from '@/pages/admin/Users';
import { AdminDriversPage } from '@/pages/admin/Drivers';
import { AdminBookingsPage } from '@/pages/admin/Bookings';
import { AdminSafetyPage } from '@/pages/admin/Safety';
import { AdminPricingPage } from '@/pages/admin/Pricing';
import { AdminReportsPage } from '@/pages/admin/Reports';
import { AdminAuditLogsPage } from '@/pages/admin/AuditLogs';
import { AdminSettingsPage } from '@/pages/admin/Settings';
import { CorporateDashboardPage } from '@/pages/corporate/Dashboard';
import { CorporateEmployeesPage } from '@/pages/corporate/Employees';
import { CorporateLocationsPage } from '@/pages/corporate/Locations';
import { CorporateShuttlesPage } from '@/pages/corporate/Shuttles';
import { CorporateReportsPage } from '@/pages/corporate/Reports';
import { CorporateProfilePage } from '@/pages/corporate/Profile';
import { OperatorDashboardPage } from '@/pages/operator/Dashboard';
import { OperatorRoutesPage } from '@/pages/operator/Routes';
import { OperatorSchedulesPage } from '@/pages/operator/Schedules';
import { OperatorFleetPage } from '@/pages/operator/Fleet';
import { OperatorDriversPage } from '@/pages/operator/Drivers';
import { OperatorSettlementsPage } from '@/pages/operator/Settlements';
import { OperatorProfilePage } from '@/pages/operator/Profile';
import { NotificationsPage } from '@/pages/shared/Notifications';
import { ProfilePage } from '@/pages/shared/Profile';
import { SafetyPage } from '@/pages/shared/Safety';

export function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      <Route path="/compare" element={<PublicComparePage />} />
      <Route path="/track/:token" element={<PublicTrackingPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />

      <Route element={<RequirePortal portal="passenger"><AppShell portal="passenger" /></RequirePortal>}>
        <Route path="/app" element={<PassengerDashboard />} />
        <Route path="/app/search" element={<SearchPage />} />
        <Route path="/app/compare" element={<CompareResultsPage />} />
        <Route path="/app/rides/:id" element={<RideDetailsPage />} />
        <Route path="/app/bookings" element={<BookingsPage />} />
        <Route path="/app/bookings/:id" element={<BookingDetailsPage />} />
        <Route path="/app/savings" element={<SavingsPage />} />
        <Route path="/app/recurring" element={<RecurringPage />} />
        <Route path="/app/become-driver" element={<BecomeDriverPage />} />
        <Route path="/app/notifications" element={<NotificationsPage />} />
        <Route path="/app/safety" element={<SafetyPage />} />
        <Route path="/app/profile" element={<ProfilePage />} />
      </Route>

      <Route element={<RequirePortal portal="driver"><AppShell portal="driver" /></RequirePortal>}>
        <Route path="/driver" element={<DriverDashboard />} />
        <Route path="/driver/rides" element={<DriverRidesPage />} />
        <Route path="/driver/rides/new" element={<PublishRidePage />} />
        <Route path="/driver/rides/:id" element={<DriverRideDetailsPage />} />
        <Route path="/driver/requests" element={<DriverRequestsPage />} />
        <Route path="/driver/vehicles" element={<DriverVehiclesPage />} />
        <Route path="/driver/earnings" element={<DriverEarningsPage />} />
        <Route path="/driver/notifications" element={<NotificationsPage />} />
        <Route path="/driver/profile" element={<ProfilePage />} />
      </Route>

      <Route element={<RequirePortal portal="admin"><AppShell portal="admin" /></RequirePortal>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/drivers" element={<AdminDriversPage />} />
        <Route path="/admin/bookings" element={<AdminBookingsPage />} />
        <Route path="/admin/safety" element={<AdminSafetyPage />} />
        <Route path="/admin/pricing" element={<AdminPricingPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
        <Route path="/admin/notifications" element={<NotificationsPage />} />
        <Route path="/admin/profile" element={<ProfilePage />} />
      </Route>

      <Route element={<RequirePortal portal="corporate"><AppShell portal="corporate" /></RequirePortal>}>
        <Route path="/corporate" element={<CorporateDashboardPage />} />
        <Route path="/corporate/employees" element={<CorporateEmployeesPage />} />
        <Route path="/corporate/locations" element={<CorporateLocationsPage />} />
        <Route path="/corporate/shuttles" element={<CorporateShuttlesPage />} />
        <Route path="/corporate/reports" element={<CorporateReportsPage />} />
        <Route path="/corporate/profile" element={<CorporateProfilePage />} />
        <Route path="/corporate/notifications" element={<NotificationsPage />} />
      </Route>

      <Route element={<RequirePortal portal="operator"><AppShell portal="operator" /></RequirePortal>}>
        <Route path="/operator" element={<OperatorDashboardPage />} />
        <Route path="/operator/routes" element={<OperatorRoutesPage />} />
        <Route path="/operator/schedules" element={<OperatorSchedulesPage />} />
        <Route path="/operator/fleet" element={<OperatorFleetPage />} />
        <Route path="/operator/drivers" element={<OperatorDriversPage />} />
        <Route path="/operator/settlements" element={<OperatorSettlementsPage />} />
        <Route path="/operator/profile" element={<OperatorProfilePage />} />
        <Route path="/operator/notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
