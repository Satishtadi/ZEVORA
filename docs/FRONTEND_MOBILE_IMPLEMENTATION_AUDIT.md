# ZEVORA – Frontend & Mobile Implementation Audit

**Audit date:** 2026-11-10
**Auditor role:** Senior Full-Stack / Mobile Architect
**Backend:** Spring Boot 3.3.5, Java 17, PostgreSQL 16 (port 5433), JWT, Flyway
**Runtime verified:** `GET /actuator/health` → `{"status":"UP"}` on `http://localhost:8080`
**OpenAPI verified:** `GET /v3/api-docs` (86 operations)

## 1. Repository state at audit

| Area | State before this work |
|---|---|
| `backend/` | Fully implemented Spring Boot service (modules below) |
| `web/` | **Empty** – no frontend existed |
| `mobile/` | **Empty** – no mobile app existed |
| `docs/` | **Empty** |
| `infra/` | **Empty** |
| `scripts/` | PowerShell scripts to start/stop/reset backend + local PostgreSQL |

Because `web/` and `mobile/` were empty, both applications were created from
scratch in this implementation. The backend was **not** rebuilt; it is reused as-is.

## 2. Backend modules found (verified in source)

Auth/JWT/refresh/OTP, Users & profiles, Drivers & vehicles, Rides & recurrence,
Travel comparison (carpool, commercial shared cab, public bus, metro feeder,
company shuttle), Matching engine, Bookings & cancellation/refund policy, Mock
payment adapter & refunds, Notifications, Reviews, Safety (SOS, incident,
trip share, live tracking), Subscriptions, Pricing, Settings, Admin operations,
Audit log, Corporate portal APIs, Operator portal APIs, Demo data seeder.

### Roles
`PASSENGER`, `PRIVATE_CARPOOL_DRIVER`, `COMMERCIAL_DRIVER`, `OPERATOR_ADMIN`,
`CORPORATE_ADMIN`, `SUPPORT_AGENT`, `PLATFORM_ADMIN`, `SUPER_ADMIN`.

### Demo accounts (seeded when DB is empty)
| Role | Email | Password |
|---|---|---|
| Super admin | `admin@zevora.in` | `Admin@123!` |
| Passenger | `passenger@zevora.in` | `Passenger@123!` |
| Passenger (women-only) | `priya@zevora.in` | `Passenger@123!` |
| Private carpool driver | `driver1@zevora.in` | `Driver@123!` |
| Commercial driver | `driver2@zevora.in` | `Driver@123!` |
| Corporate admin | `corporate@zevora.in` | `Corporate@123!` |
| Operator admin | `operator@zevora.in` | `Operator@123!` |

## 3. Backend features: complete / partial / missing

### Fully implemented
- Registration (passenger by default), email/phone login, JWT access + rotating
  refresh token, logout, OTP request/verify (dev code returned when `DEV_MODE=true`).
- Profile read/update, home/work addresses, emergency contact, women-only flag.
- Driver registration (upgrades role), availability, vehicles add/update/list.
- Ride create/update/publish/cancel/complete, ride search, recurrence.
- Matching search + accept-as-booking, comparison engine + savings calculator.
- Booking create (idempotent, auto mock payment), list, detail, history,
  cancel with full/partial refund policy, alternatives.
- Reviews (completed bookings only), driver rating aggregation.
- Safety SOS/incident, trip share token, tracking ping/read, public tracking.
- Notifications list/unread/mark-read (created by booking/cancel flows).
- Subscriptions subscribe/current/history/cancel.
- Admin dashboard, users (suspend), drivers (verify), vehicles (verify), bookings,
  safety (resolve), settings, pricing rules, reports, audit logs.
- Corporate companies/employees/verify/locations/shuttles/report.
- Operator create/list/routes/schedules/fleet/vehicles/drivers/summary.
- Global validation/error envelope: `{timestamp,status,code,message,path,fieldErrors}`.
- Swagger/OpenAPI at `/swagger-ui.html` and `/v3/api-docs`.

### Partially implemented
- **Payments:** only an internal mock adapter invoked automatically on booking.
  No payment endpoints, no payment history API, no admin payment/refund listing.
- **Notifications:** persistence + read APIs exist; no push token registration,
  no email/SMS/FCM delivery adapter.
- **Corporate:** departments are a free-text field on employees; no separate
  department CRUD, no commute-schedule entity beyond shuttles, no booking/seat
  inventory API for corporate commuters.
- **Operator:** routes/schedules/fleet/drivers/summary exist; no operator
  booking/trip management or settlement report endpoint.
- **Admin:** no admin endpoints for operator management, corporate management,
  subscription management, role/permission management, or support tickets
  (support is represented by Safety events only).
- **File uploads:** multipart is configured, but there is **no document upload
  endpoint**. Driver/vehicle verification is a status flag only.
- **Maps:** no backend geocoding/autocomplete/routing provider endpoint.
  Comparison/matching are coordinate based. Frontend must use device GPS +
  configured provider externally.
- **OTP login:** OTP verify marks phone verified; it does **not** return tokens,
  so password-less login is not a complete flow.
- **Password reset:** `OtpPurpose.RESET_PASSWORD` exists, but no reset-password
  endpoint exists.

### Missing (documented, not fabricated)
- Payment gateway integration, payment history endpoint, webhook handling.
- Push/email/SMS notification providers and device token storage.
- Document upload/storage and verification workflow APIs.
- Geocoding/autocomplete + route/ETA map provider API.
- Admin operator/corporate/subscription/role management APIs.
- Operator booking/trip/settlement APIs.
- Corporate department CRUD, commute schedule, per-employee seat booking.
- Support ticket module, WebSocket/live location streaming.
- Password reset endpoint.

## 4. Web application

State before: empty. Implemented in this work:

- React 18 + TypeScript (strict) + Vite + Tailwind CSS design system.
- React Router with public site and role-protected portals.
- TanStack Query for server state; React Hook Form + Zod validation.
- Axios client with base URL, JWT injection, refresh-token rotation,
  global 401/403/network handling, typed error envelope.
- Pages: public landing/compare/login/register/contact; passenger dashboard,
  search, comparison results, ride details, booking, bookings, booking detail,
  savings, recurring commute, profile, notifications, safety/support;
  driver dashboard, onboarding, vehicles, publish ride, rides, ride detail,
  requests, earnings, profile; admin dashboard, users, drivers, bookings,
  safety, pricing, settings, reports, audit logs; corporate dashboard,
  employees, locations, shuttles, reports, profile; operator dashboard,
  routes, schedules, fleet, drivers, settlements/summary, profile.
- Role-based navigation and route guards; no admin UI exposed to other roles.

## 5. Mobile application

State before: empty. Implemented in this work (Expo, shared Android/iOS codebase):

- Expo + React Native + TypeScript, React Navigation (native stack + bottom tabs),
  TanStack Query, Axios, Expo SecureStore.
- Splash/onboarding, login, register, OTP verification, profile setup,
  location + notification permission screens, role-aware home.
- Passenger screens: home, search, comparison, ride detail, booking
  confirmation, bookings, booking detail with cancel/refund/tracking/share/SOS,
  savings, recurring, profile, notifications, settings, help.
- Driver screens: onboarding, dashboard, vehicles, publish ride, rides,
  ride detail/requests, trip controls, earnings, profile, notifications.
- Device integration: expo-location (GPS, permissions, current location),
  expo-notifications (permission + local confirmation notifications),
  expo-secure-store (tokens), expo-image-picker (documents/vehicles),
  network connectivity banner, Android back handling, iOS safe areas.
- Maps: `react-native-maps` integration layer included, gated on
  `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`; graceful coordinate fallback is displayed
  when no provider key is configured (documented, not faked).

## 6. Integration issues found & handling

1. **CORS** allows `localhost:5173`, `127.0.0.1:5173`, `localhost:19006`,
   `localhost:8081`. Web uses 5173; Expo dev uses 8081. Configurable via
   `CORS_ORIGINS`.
2. **API prefix** is `/api/v1`. `VITE_API_URL` / `EXPO_PUBLIC_API_URL` already
   point at it; clients also normalize a base URL without the prefix.
3. **Date/time** is ISO-8601 UTC (`Instant`). Clients convert for display and
   send UTC ISO strings for `departureTime`.
4. **Money** is decimal in INR. Clients format with `Intl.NumberFormat('en-IN')`.
5. **Booking auto-payment**: booking response already returns `paymentStatus=PAID`
   after the mock adapter. UI must not claim a separate real gateway payment.
6. **Refresh rotation**: every refresh revokes the old token. The client must
   store the new refresh token atomically and single-flight refresh requests.
7. **OTP** is not a login flow; mobile OTP screen is used for phone verification
   only, with password login as the token source.
8. **Driver onboarding** changes the user role, so the client must re-fetch
   `/users/me` after registration to unlock driver navigation.
9. **Women-only** rides require the passenger profile `womenOnly=true`; the UI
   surfaces the backend error and links to profile settings.
10. **Empty mobile directory** meant no prior design system; a shared token file
    is used across web and mobile for visual consistency.

## 7. Implementation roadmap (executed)

1. Audit backend and contracts (this document).
2. Web foundation: config, design tokens, components, routing, API client, auth.
3. Passenger web features and end-to-end booking flow.
4. Driver web features and ride lifecycle.
5. Admin, corporate, operator portals.
6. Mobile foundation: Expo config, navigation, API client, secure storage.
7. Mobile common + passenger + driver screens with device features.
8. Build, typecheck, test, fix; documentation and mapping.

See `docs/API_INTEGRATION_MAPPING.md` for endpoint-by-endpoint status.
