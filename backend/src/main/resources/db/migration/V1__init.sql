-- ZEVORA initial schema (PostgreSQL 16+). PostGIS is optional; geo distance is computed in the matching engine.

create table users (
    id uuid primary key,
    email varchar(180) not null unique,
    phone varchar(20) not null unique,
    password_hash varchar(100) not null,
    full_name varchar(120) not null,
    role varchar(40) not null,
    status varchar(20) not null,
    email_verified boolean not null default false,
    phone_verified boolean not null default false,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table user_profiles (
    id uuid primary key,
    user_id uuid not null unique references users(id) on delete cascade,
    home_address varchar(255),
    home_lat double precision,
    home_lng double precision,
    work_address varchar(255),
    work_lat double precision,
    work_lng double precision,
    women_only boolean not null default false,
    emergency_contact_name varchar(120),
    emergency_contact_phone varchar(20),
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table refresh_tokens (
    id uuid primary key,
    user_id uuid not null references users(id) on delete cascade,
    token_hash varchar(128) not null unique,
    expires_at timestamptz not null,
    revoked boolean not null default false,
    created_at timestamptz not null,
    updated_at timestamptz not null
);
create index idx_refresh_tokens_user on refresh_tokens(user_id);

create table otp_codes (
    id uuid primary key,
    phone varchar(20) not null,
    code_hash varchar(128) not null,
    purpose varchar(30) not null,
    expires_at timestamptz not null,
    consumed boolean not null default false,
    created_at timestamptz not null,
    updated_at timestamptz not null
);
create index idx_otp_phone_purpose on otp_codes(phone, purpose, consumed);

create table drivers (
    id uuid primary key,
    user_id uuid not null unique references users(id) on delete cascade,
    driver_type varchar(30) not null,
    license_number varchar(40) not null,
    license_verified boolean not null default false,
    identity_verified boolean not null default false,
    status varchar(20) not null,
    rating numeric(3,2) not null default 5.00,
    total_rides int not null default 0,
    available boolean not null default false,
    current_lat double precision,
    current_lng double precision,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table vehicles (
    id uuid primary key,
    driver_id uuid not null references drivers(id) on delete cascade,
    make varchar(60),
    model varchar(60),
    plate_number varchar(20) not null unique,
    color varchar(30),
    seat_capacity int not null,
    verified boolean not null default false,
    created_at timestamptz not null,
    updated_at timestamptz not null
);
create index idx_vehicles_driver on vehicles(driver_id);

create table rides (
    id uuid primary key,
    driver_id uuid not null references drivers(id),
    vehicle_id uuid not null references vehicles(id),
    origin_address varchar(255) not null,
    origin_lat double precision not null,
    origin_lng double precision not null,
    dest_address varchar(255) not null,
    dest_lat double precision not null,
    dest_lng double precision not null,
    departure_time timestamptz not null,
    total_seats int not null,
    available_seats int not null,
    price_per_seat numeric(10,2) not null,
    status varchar(20) not null,
    women_only boolean not null default false,
    recurring boolean not null default false,
    notes varchar(500),
    created_at timestamptz not null,
    updated_at timestamptz not null,
    constraint chk_rides_seats check (available_seats >= 0 and available_seats <= total_seats)
);
create index idx_rides_departure on rides(departure_time);
create index idx_rides_status_departure on rides(status, departure_time);
create index idx_rides_driver on rides(driver_id);

create table ride_recurrences (
    id uuid primary key,
    ride_id uuid not null unique references rides(id) on delete cascade,
    days_of_week varchar(30) not null,
    start_date date not null,
    end_date date,
    active boolean not null default true,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table bookings (
    id uuid primary key,
    ride_id uuid not null references rides(id),
    passenger_id uuid not null references users(id),
    seats int not null,
    status varchar(20) not null,
    fare_amount numeric(10,2) not null,
    platform_fee numeric(10,2) not null,
    total_amount numeric(10,2) not null,
    payment_status varchar(20) not null,
    idempotency_key varchar(80) unique,
    cancellation_reason varchar(255),
    cancelled_at timestamptz,
    created_at timestamptz not null,
    updated_at timestamptz not null,
    constraint chk_booking_seats check (seats > 0)
);
create index idx_bookings_ride on bookings(ride_id);
create index idx_bookings_passenger on bookings(passenger_id);

create table booking_status_history (
    id uuid primary key,
    booking_id uuid not null references bookings(id) on delete cascade,
    status varchar(20) not null,
    note varchar(255),
    created_at timestamptz not null,
    updated_at timestamptz not null
);
create index idx_booking_history_booking on booking_status_history(booking_id);

create table payments (
    id uuid primary key,
    booking_id uuid not null references bookings(id),
    provider varchar(30) not null,
    provider_ref varchar(80),
    amount numeric(10,2) not null,
    currency varchar(3) not null default 'INR',
    status varchar(20) not null,
    idempotency_key varchar(80) unique,
    created_at timestamptz not null,
    updated_at timestamptz not null
);
create index idx_payments_booking on payments(booking_id);

create table refunds (
    id uuid primary key,
    payment_id uuid not null references payments(id),
    amount numeric(10,2) not null,
    status varchar(20) not null,
    reason varchar(255),
    created_at timestamptz not null,
    updated_at timestamptz not null
);
create index idx_refunds_payment on refunds(payment_id);

create table pricing_rules (
    id uuid primary key,
    code varchar(50) not null unique,
    name varchar(100) not null,
    type varchar(30) not null,
    base_fare numeric(10,2) not null,
    per_km numeric(10,2) not null,
    per_minute numeric(10,2) not null default 0,
    platform_fee_pct numeric(5,2) not null default 0,
    min_fare numeric(10,2),
    active boolean not null default true,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table system_settings (
    id uuid primary key,
    setting_key varchar(80) not null unique,
    setting_value varchar(500) not null,
    description varchar(255),
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table safety_events (
    id uuid primary key,
    user_id uuid not null references users(id),
    booking_id uuid references bookings(id),
    type varchar(20) not null,
    latitude double precision,
    longitude double precision,
    note varchar(500),
    status varchar(20) not null,
    created_at timestamptz not null,
    updated_at timestamptz not null
);
create index idx_safety_status on safety_events(status);

create table trip_tracking (
    id uuid primary key,
    booking_id uuid not null references bookings(id) on delete cascade,
    latitude double precision not null,
    longitude double precision not null,
    recorded_at timestamptz not null,
    created_at timestamptz not null,
    updated_at timestamptz not null
);
create index idx_tracking_booking on trip_tracking(booking_id);

create table trip_shares (
    id uuid primary key,
    booking_id uuid not null references bookings(id) on delete cascade,
    token varchar(80) not null unique,
    expires_at timestamptz not null,
    created_by uuid not null references users(id),
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table reviews (
    id uuid primary key,
    booking_id uuid not null unique references bookings(id),
    from_user_id uuid not null references users(id),
    to_user_id uuid not null references users(id),
    rating int not null check (rating between 1 and 5),
    comment varchar(500),
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table companies (
    id uuid primary key,
    name varchar(150) not null,
    domain varchar(120) not null unique,
    contact_email varchar(180),
    status varchar(20) not null,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table company_employees (
    id uuid primary key,
    company_id uuid not null references companies(id) on delete cascade,
    user_id uuid not null references users(id) on delete cascade,
    employee_code varchar(40),
    department varchar(80),
    office_address varchar(255),
    office_lat double precision,
    office_lng double precision,
    verified boolean not null default false,
    created_at timestamptz not null,
    updated_at timestamptz not null,
    constraint uq_company_employee unique (company_id, user_id)
);

create table corporate_locations (
    id uuid primary key,
    company_id uuid not null references companies(id) on delete cascade,
    name varchar(120) not null,
    address varchar(255),
    latitude double precision,
    longitude double precision,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table company_shuttles (
    id uuid primary key,
    company_id uuid not null references companies(id) on delete cascade,
    name varchar(120) not null,
    route_name varchar(150),
    origin_address varchar(255),
    origin_lat double precision,
    origin_lng double precision,
    dest_address varchar(255),
    dest_lat double precision,
    dest_lng double precision,
    departure_time time not null,
    days_of_week varchar(30),
    seat_capacity int not null,
    available_seats int not null,
    fare numeric(10,2),
    active boolean not null default true,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table transport_operators (
    id uuid primary key,
    name varchar(150) not null,
    contact_email varchar(180),
    status varchar(20) not null,
    verified boolean not null default false,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table operator_routes (
    id uuid primary key,
    operator_id uuid not null references transport_operators(id) on delete cascade,
    name varchar(150) not null,
    origin_address varchar(255),
    origin_lat double precision,
    origin_lng double precision,
    dest_address varchar(255),
    dest_lat double precision,
    dest_lng double precision,
    base_fare numeric(10,2),
    per_km numeric(10,2),
    active boolean not null default true,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table operator_schedules (
    id uuid primary key,
    route_id uuid not null references operator_routes(id) on delete cascade,
    departure_time time not null,
    days_of_week varchar(30),
    seat_capacity int not null,
    available_seats int not null,
    fare numeric(10,2),
    active boolean not null default true,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table operator_vehicles (
    id uuid primary key,
    operator_id uuid not null references transport_operators(id) on delete cascade,
    plate_number varchar(20),
    model varchar(80),
    seat_capacity int,
    verified boolean not null default false,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table operator_drivers (
    id uuid primary key,
    operator_id uuid not null references transport_operators(id) on delete cascade,
    full_name varchar(120) not null,
    phone varchar(20),
    license_number varchar(40),
    verified boolean not null default false,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table subscriptions (
    id uuid primary key,
    user_id uuid not null references users(id) on delete cascade,
    plan varchar(30) not null,
    status varchar(20) not null,
    start_at timestamptz,
    end_at timestamptz,
    price numeric(10,2),
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table notifications (
    id uuid primary key,
    user_id uuid not null references users(id) on delete cascade,
    title varchar(120) not null,
    message varchar(500) not null,
    type varchar(30) not null,
    is_read boolean not null default false,
    created_at timestamptz not null,
    updated_at timestamptz not null
);
create index idx_notifications_user on notifications(user_id, is_read);

create table audit_logs (
    id uuid primary key,
    actor_id uuid,
    action varchar(80) not null,
    entity_type varchar(60),
    entity_id varchar(60),
    details varchar(1000),
    ip_address varchar(60),
    created_at timestamptz not null,
    updated_at timestamptz not null
);
create index idx_audit_created on audit_logs(created_at);
