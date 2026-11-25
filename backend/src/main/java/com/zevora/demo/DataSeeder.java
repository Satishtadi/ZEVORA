package com.zevora.demo;

import com.zevora.booking.Booking;
import com.zevora.booking.BookingRepository;
import com.zevora.booking.BookingStatusHistory;
import com.zevora.booking.BookingStatusHistoryRepository;
import com.zevora.common.Enums.*;
import com.zevora.config.AppProperties;
import com.zevora.corporate.*;
import com.zevora.driver.Driver;
import com.zevora.driver.DriverRepository;
import com.zevora.driver.Vehicle;
import com.zevora.driver.VehicleRepository;
import com.zevora.notification.Notification;
import com.zevora.notification.NotificationRepository;
import com.zevora.operator.*;
import com.zevora.payment.Payment;
import com.zevora.payment.PaymentRepository;
import com.zevora.pricing.PricingRule;
import com.zevora.pricing.PricingRuleRepository;
import com.zevora.review.Review;
import com.zevora.review.ReviewRepository;
import com.zevora.ride.Ride;
import com.zevora.ride.RideRecurrence;
import com.zevora.ride.RideRecurrenceRepository;
import com.zevora.ride.RideRepository;
import com.zevora.safety.SafetyEvent;
import com.zevora.safety.SafetyEventRepository;
import com.zevora.settings.SettingsService;
import com.zevora.subscription.Subscription;
import com.zevora.subscription.SubscriptionRepository;
import com.zevora.user.User;
import com.zevora.user.UserProfile;
import com.zevora.user.UserProfileRepository;
import com.zevora.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Component
public class DataSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final AppProperties props;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final RideRepository rideRepository;
    private final RideRecurrenceRepository recurrenceRepository;
    private final BookingRepository bookingRepository;
    private final BookingStatusHistoryRepository historyRepository;
    private final PaymentRepository paymentRepository;
    private final PricingRuleRepository pricingRepository;
    private final CompanyRepository companyRepository;
    private final CompanyEmployeeRepository employeeRepository;
    private final CorporateLocationRepository locationRepository;
    private final CompanyShuttleRepository shuttleRepository;
    private final TransportOperatorRepository operatorRepository;
    private final OperatorRouteRepository operatorRouteRepository;
    private final OperatorScheduleRepository operatorScheduleRepository;
    private final OperatorVehicleRepository operatorVehicleRepository;
    private final OperatorDriverRepository operatorDriverRepository;
    private final SettingsService settingsService;
    private final NotificationRepository notificationRepository;
    private final SafetyEventRepository safetyEventRepository;
    private final ReviewRepository reviewRepository;
    private final SubscriptionRepository subscriptionRepository;

    public DataSeeder(AppProperties props, PasswordEncoder passwordEncoder, UserRepository userRepository,
                      UserProfileRepository profileRepository, DriverRepository driverRepository,
                      VehicleRepository vehicleRepository, RideRepository rideRepository,
                      RideRecurrenceRepository recurrenceRepository, BookingRepository bookingRepository,
                      BookingStatusHistoryRepository historyRepository, PaymentRepository paymentRepository,
                      PricingRuleRepository pricingRepository, CompanyRepository companyRepository,
                      CompanyEmployeeRepository employeeRepository, CorporateLocationRepository locationRepository,
                      CompanyShuttleRepository shuttleRepository, TransportOperatorRepository operatorRepository,
                      OperatorRouteRepository operatorRouteRepository, OperatorScheduleRepository operatorScheduleRepository,
                      OperatorVehicleRepository operatorVehicleRepository, OperatorDriverRepository operatorDriverRepository,
                      SettingsService settingsService, NotificationRepository notificationRepository,
                      SafetyEventRepository safetyEventRepository, ReviewRepository reviewRepository,
                      SubscriptionRepository subscriptionRepository) {
        this.props = props;
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
        this.rideRepository = rideRepository;
        this.recurrenceRepository = recurrenceRepository;
        this.bookingRepository = bookingRepository;
        this.historyRepository = historyRepository;
        this.paymentRepository = paymentRepository;
        this.pricingRepository = pricingRepository;
        this.companyRepository = companyRepository;
        this.employeeRepository = employeeRepository;
        this.locationRepository = locationRepository;
        this.shuttleRepository = shuttleRepository;
        this.operatorRepository = operatorRepository;
        this.operatorRouteRepository = operatorRouteRepository;
        this.operatorScheduleRepository = operatorScheduleRepository;
        this.operatorVehicleRepository = operatorVehicleRepository;
        this.operatorDriverRepository = operatorDriverRepository;
        this.settingsService = settingsService;
        this.notificationRepository = notificationRepository;
        this.safetyEventRepository = safetyEventRepository;
        this.reviewRepository = reviewRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedSettings();
        seedPricing();
        if (userRepository.count() > 0) {
            log.info("ZEVORA data already present — skipping demo seed");
            return;
        }
        if (!props.isSeedDemo()) {
            log.info("Demo seeding disabled");
            return;
        }
        log.info("Seeding ZEVORA demo data for Hyderabad pilot");

        User admin = user("admin@zevora.in", "9000000001", "Aarav Mehta", Role.SUPER_ADMIN, "Admin@123!", true);
        User passenger = user("passenger@zevora.in", "9000000002", "Rohan Kumar", Role.PASSENGER, "Passenger@123!", true);
        User priya = user("priya@zevora.in", "9000000003", "Priya Sharma", Role.PASSENGER, "Passenger@123!", true);
        User driverUser1 = user("driver1@zevora.in", "9000000004", "Suresh Reddy", Role.PRIVATE_CARPOOL_DRIVER, "Driver@123!", true);
        User driverUser2 = user("driver2@zevora.in", "9000000005", "Imran Ali", Role.COMMERCIAL_DRIVER, "Driver@123!", true);
        User corporate = user("corporate@zevora.in", "9000000006", "Neha Verma", Role.CORPORATE_ADMIN, "Corporate@123!", true);
        User operatorUser = user("operator@zevora.in", "9000000007", "Vikram Rao", Role.OPERATOR_ADMIN, "Operator@123!", true);

        profile(passenger, "Kukatpally, Hyderabad", 17.4948, 78.3996,
                "HITEC City, Hyderabad", 17.4483, 78.3915, false, "Ravi Kumar", "9000000010");
        profile(priya, "Miyapur, Hyderabad", 17.4967, 78.3528,
                "Gachibowli, Hyderabad", 17.4401, 78.3489, true, "Anita Sharma", "9000000011");
        profile(driverUser1, "Kukatpally, Hyderabad", 17.4948, 78.3996,
                "HITEC City, Hyderabad", 17.4483, 78.3915, false, null, null);
        profile(driverUser2, "Kondapur, Hyderabad", 17.4699, 78.3622,
                "Financial District, Hyderabad", 17.4219, 78.3399, false, null, null);
        profile(corporate, "HITEC City, Hyderabad", 17.4483, 78.3915,
                "HITEC City, Hyderabad", 17.4483, 78.3915, false, null, null);
        profile(operatorUser, "Madhapur, Hyderabad", 17.4483, 78.3915,
                "Madhapur, Hyderabad", 17.4483, 78.3915, false, null, null);
        profile(admin, "Gachibowli, Hyderabad", 17.4401, 78.3489,
                "Gachibowli, Hyderabad", 17.4401, 78.3489, false, null, null);

        Driver privateDriver = driver(driverUser1, DriverType.PRIVATE_CARPOOL, "TS09P202100123", 4.80);
        Driver commercialDriver = driver(driverUser2, DriverType.COMMERCIAL, "TS09C201900456", 4.60);

        Vehicle privateVehicle = vehicle(privateDriver, "Hyundai", "i20", "TS09EA1234", "Polar White", 4);
        Vehicle commercialVehicle = vehicle(commercialDriver, "Maruti Suzuki", "Ertiga", "TS09TC5678", "Silver", 6);

        LocalDate tomorrow = LocalDate.now(IST).plusDays(1);
        Ride ride1 = ride(privateDriver, privateVehicle, "Kukatpally Metro Station, Hyderabad", 17.4948, 78.3996,
                "HITEC City (Cyber Towers), Hyderabad", 17.4483, 78.3915,
                at(tomorrow, 8, 45), 4, 3, 60, false, "Daily office commute · no smoking · music on");
        Ride ride2 = ride(privateDriver, privateVehicle, "Miyapur Metro Station, Hyderabad", 17.4967, 78.3528,
                "Gachibowli (DLF), Hyderabad", 17.4401, 78.3489,
                at(tomorrow, 8, 30), 3, 2, 55, true, "Women-only carpool · verified members");
        Ride ride3 = ride(commercialDriver, commercialVehicle, "Kondapur Bus Depot, Hyderabad", 17.4699, 78.3622,
                "Financial District (Wave Rock), Hyderabad", 17.4219, 78.3399,
                at(tomorrow, 9, 10), 6, 5, 90, false, "Commercial shared cab · AC · verified driver");
        Ride ride4 = ride(commercialDriver, commercialVehicle, "KPHB Colony, Hyderabad", 17.4849, 78.3986,
                "Madhapur (Raheja Mindspace), Hyderabad", 17.4483, 78.3915,
                at(tomorrow, 9, 15), 6, 4, 80, false, "Commercial shared cab · fixed route · on-time guarantee");
        Ride ride5 = ride(privateDriver, privateVehicle, "Kukatpally Metro Station, Hyderabad", 17.4948, 78.3996,
                "Gachibowli (DLF), Hyderabad", 17.4401, 78.3489,
                at(tomorrow, 9, 0), 4, 4, 70, false, "Recurring weekday carpool");

        for (Ride r : new Ride[]{ride1, ride2, ride3, ride4, ride5}) {
            recurrenceRepository.save(RideRecurrence.builder().rideId(r.getId())
                    .daysOfWeek("MON,TUE,WED,THU,FRI")
                    .startDate(tomorrow).endDate(tomorrow.plusMonths(3)).active(true).build());
        }

        Booking completedBooking = seedHistoricalTrips(passenger, privateDriver, privateVehicle);

        Company company = companyRepository.save(Company.builder()
                .name("NovaTech Solutions").domain("novatech.in").contactEmail("transport@novatech.in")
                .status(CompanyStatus.ACTIVE).build());
        employeeRepository.save(CompanyEmployee.builder()
                .companyId(company.getId()).userId(passenger.getId())
                .employeeCode("NTS-1042").department("Engineering")
                .officeAddress("Cyber Towers, HITEC City").officeLat(17.4483).officeLng(78.3915)
                .verified(true).build());
        employeeRepository.save(CompanyEmployee.builder()
                .companyId(company.getId()).userId(corporate.getId())
                .employeeCode("NTS-0001").department("People Operations")
                .officeAddress("Cyber Towers, HITEC City").officeLat(17.4483).officeLng(78.3915)
                .verified(true).build());
        locationRepository.save(CorporateLocation.builder()
                .companyId(company.getId()).name("NovaTech HQ")
                .address("Cyber Towers, HITEC City, Hyderabad").latitude(17.4483).longitude(78.3915).build());
        shuttleRepository.save(CompanyShuttle.builder()
                .companyId(company.getId()).name("NovaTech Shuttle 1").routeName("Kukatpally → HITEC City")
                .originAddress("Kukatpally Metro Station").originLat(17.4948).originLng(78.3996)
                .destAddress("Cyber Towers, HITEC City").destLat(17.4483).destLng(78.3915)
                .departureTime(LocalTime.of(8, 40)).daysOfWeek("MON,TUE,WED,THU,FRI")
                .seatCapacity(24).availableSeats(9).fare(BigDecimal.ZERO).active(true).build());
        shuttleRepository.save(CompanyShuttle.builder()
                .companyId(company.getId()).name("NovaTech Shuttle 2").routeName("Miyapur → Gachibowli")
                .originAddress("Miyapur Metro Station").originLat(17.4967).originLng(78.3528)
                .destAddress("DLF Cyber City, Gachibowli").destLat(17.4401).destLng(78.3489)
                .departureTime(LocalTime.of(8, 50)).daysOfWeek("MON,TUE,WED,THU,FRI")
                .seatCapacity(20).availableSeats(6).fare(BigDecimal.ZERO).active(true).build());

        TransportOperator operator = operatorRepository.save(TransportOperator.builder()
                .name("Hyderabad Smart Shuttle Co.").contactEmail("ops@hssc.in")
                .status(OperatorStatus.ACTIVE).verified(true).build());
        OperatorRoute route = operatorRouteRepository.save(OperatorRoute.builder()
                .operatorId(operator.getId()).name("Kukatpally → HITEC City Express")
                .originAddress("Kukatpally Metro Station").originLat(17.4948).originLng(78.3996)
                .destAddress("HITEC City (Cyber Towers)").destLat(17.4483).destLng(78.3915)
                .baseFare(BigDecimal.valueOf(40)).perKm(BigDecimal.valueOf(12)).active(true).build());
        OperatorRoute route2 = operatorRouteRepository.save(OperatorRoute.builder()
                .operatorId(operator.getId()).name("Miyapur → Financial District")
                .originAddress("Miyapur Metro Station").originLat(17.4967).originLng(78.3528)
                .destAddress("Financial District").destLat(17.4219).destLng(78.3399)
                .baseFare(BigDecimal.valueOf(45)).perKm(BigDecimal.valueOf(13)).active(true).build());
        operatorScheduleRepository.save(OperatorSchedule.builder()
                .routeId(route.getId()).departureTime(LocalTime.of(8, 55)).daysOfWeek("MON,TUE,WED,THU,FRI")
                .seatCapacity(12).availableSeats(5).fare(BigDecimal.valueOf(75)).active(true).build());
        operatorScheduleRepository.save(OperatorSchedule.builder()
                .routeId(route2.getId()).departureTime(LocalTime.of(9, 5)).daysOfWeek("MON,TUE,WED,THU,FRI")
                .seatCapacity(12).availableSeats(7).fare(BigDecimal.valueOf(95)).active(true).build());
        operatorVehicleRepository.save(OperatorVehicle.builder()
                .operatorId(operator.getId()).plateNumber("TS09OP1111").model("Force Traveller")
                .seatCapacity(12).verified(true).build());
        operatorDriverRepository.save(OperatorDriver.builder()
                .operatorId(operator.getId()).fullName("Mahesh Yadav").phone("9000000020")
                .licenseNumber("TS09D201800789").verified(true).build());

        notificationRepository.save(Notification.builder()
                .userId(passenger.getId()).title("Tomorrow's carpool is confirmed")
                .message("Suresh is driving from Kukatpally to HITEC City at 8:45 AM. Your seat is reserved.")
                .type(NotificationType.BOOKING).read(false).build());
        notificationRepository.save(Notification.builder()
                .userId(passenger.getId()).title("You saved ₹285 this week")
                .message("Compared with a solo cab, your shared commutes saved ₹285 over 3 trips.")
                .type(NotificationType.SYSTEM).read(false).build());
        notificationRepository.save(Notification.builder()
                .userId(passenger.getId()).title("Safety check-in enabled")
                .message("Trip sharing is on. Your emergency contact can follow your live route.")
                .type(NotificationType.SAFETY).read(true).build());
        notificationRepository.save(Notification.builder()
                .userId(driverUser1.getId()).title("New booking on your ride")
                .message("Rohan booked 1 seat on your 8:45 AM Kukatpally → HITEC City carpool.")
                .type(NotificationType.BOOKING).read(false).build());
        notificationRepository.save(Notification.builder()
                .userId(driverUser2.getId()).title("Vehicle verification approved")
                .message("Your Maruti Ertiga TS09TC5678 is verified. You can publish commercial rides.")
                .type(NotificationType.VERIFICATION).read(false).build());

        safetyEventRepository.save(SafetyEvent.builder()
                .userId(passenger.getId()).bookingId(completedBooking.getId())
                .type(SafetyType.INCIDENT).latitude(17.4483).longitude(78.3915)
                .note("Demo incident: reported a rough driver behaviour for review.")
                .status(SafetyStatus.OPEN).build());

        reviewRepository.save(Review.builder()
                .bookingId(completedBooking.getId()).fromUserId(passenger.getId())
                .toUserId(driverUser1.getId()).rating(5)
                .comment("Smooth pickup and a very polite driver. Saved money and time.").build());

        subscriptionRepository.save(Subscription.builder()
                .userId(passenger.getId()).plan(SubscriptionPlan.BASIC_PLUS)
                .status(SubscriptionStatus.ACTIVE).startAt(Instant.now())
                .endAt(Instant.now().plusSeconds(30L * 24 * 3600)).price(BigDecimal.valueOf(49)).build());
    }

    private void seedSettings() {
        set("matching.weight.route", "0.35", "Route compatibility weight");
        set("matching.weight.time", "0.25", "Departure time compatibility weight");
        set("matching.weight.pickup", "0.15", "Pickup proximity weight");
        set("matching.weight.destination", "0.15", "Destination compatibility weight");
        set("matching.weight.detour", "0.10", "Detour suitability weight");
        set("matching.max.pickup.km", "6", "Maximum pickup distance for matching");
        set("matching.max.drop.km", "8", "Maximum destination distance for matching");
        set("matching.max.detour.km", "8", "Maximum extra distance");
        set("matching.window.minutes", "60", "Departure time window for matching");
        set("matching.min.score", "30", "Minimum match score to recommend");
        set("matching.avg.speed.kmh", "22", "Average city speed for ETA");
        set("rides.search.window.minutes", "120", "Ride search time window");
        set("rides.search.max.pickup.km", "7", "Ride search pickup radius");
        set("rides.search.max.drop.km", "9", "Ride search destination radius");
        set("booking.cancel.full.refund.hours", "2", "Full refund if cancelled this many hours before departure");
        set("booking.cancel.partial.refund.percent", "50", "Partial refund percentage for late cancellation");
        set("pricing.fuel.cost.per.km", "7.5", "Fuel cost per km used for private cost sharing");
        set("platform.fee.percent", "5", "Platform fee for commercial bookings");
        set("comparison.avg.speed.kmh", "20", "Comparison ETA speed");
        set("comparison.individual.speed.kmh", "20", "Individual cab ETA speed");
        set("comparison.bus.fare.short", "10", "Bus fare up to 3 km");
        set("comparison.bus.fare.medium", "25", "Bus fare 3 to 8 km");
        set("comparison.bus.fare.long", "35", "Bus fare above 8 km");
        set("comparison.metro.base.fare", "15", "Metro base fare");
        set("comparison.metro.per.km", "2", "Metro fare per km");
        set("safety.sos.notify.email", props.getSupportEmail(), "Safety escalation email");
    }

    private void set(String key, String value, String description) {
        if (settingsService.get(key, null) == null) settingsService.set(key, value, description);
    }

    private void seedPricing() {
        if (pricingRepository.count() > 0) return;
        pricingRepository.save(rule("AUTO_STD", "Auto rickshaw standard", PricingType.AUTO, 30, 15, 1, 0, 40));
        pricingRepository.save(rule("CAB_STD", "Individual cab standard", PricingType.CAB, 60, 20, 1.5, 0, 100));
        pricingRepository.save(rule("CAB_SHARED", "Commercial shared cab", PricingType.COMMERCIAL_CAB, 80, 22, 2, 8, 120));
        pricingRepository.save(rule("CARPOOL_COST", "Private carpool cost sharing", PricingType.PRIVATE_CARPOOL, 0, 7.5, 0, 0, 0));
        pricingRepository.save(rule("PLATFORM", "Platform fee reference", PricingType.PLATFORM, 0, 0, 0, 5, 0));
    }

    private PricingRule rule(String code, String name, PricingType type, double base, double perKm,
                             double perMinute, double feePct, double minFare) {
        return PricingRule.builder().code(code).name(name).type(type)
                .baseFare(BigDecimal.valueOf(base)).perKm(BigDecimal.valueOf(perKm))
                .perMinute(BigDecimal.valueOf(perMinute)).platformFeePct(BigDecimal.valueOf(feePct))
                .minFare(BigDecimal.valueOf(minFare)).active(true).build();
    }

    private User user(String email, String phone, String name, Role role, String rawPassword, boolean verified) {
        return userRepository.save(User.builder()
                .email(email).phone(phone).fullName(name).role(role)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .status(UserStatus.ACTIVE).emailVerified(verified).phoneVerified(verified).build());
    }

    private void profile(User user, String homeAddress, double homeLat, double homeLng,
                         String workAddress, double workLat, double workLng,
                         boolean womenOnly, String emergencyName, String emergencyPhone) {
        profileRepository.save(UserProfile.builder()
                .userId(user.getId()).homeAddress(homeAddress).homeLat(homeLat).homeLng(homeLng)
                .workAddress(workAddress).workLat(workLat).workLng(workLng)
                .womenOnly(womenOnly).emergencyContactName(emergencyName)
                .emergencyContactPhone(emergencyPhone).build());
    }

    private Driver driver(User user, DriverType type, String license, double rating) {
        return driverRepository.save(Driver.builder()
                .userId(user.getId()).driverType(type).licenseNumber(license)
                .licenseVerified(true).identityVerified(true).status(DriverStatus.APPROVED)
                .rating(BigDecimal.valueOf(rating)).totalRides(24).available(true)
                .currentLat(17.4948).currentLng(78.3996).build());
    }

    private Vehicle vehicle(Driver driver, String make, String model, String plate, String color, int seats) {
        return vehicleRepository.save(Vehicle.builder()
                .driverId(driver.getId()).make(make).model(model).plateNumber(plate)
                .color(color).seatCapacity(seats).verified(true).build());
    }

    private Ride ride(Driver driver, Vehicle vehicle, String originAddress, double originLat, double originLng,
                      String destAddress, double destLat, double destLng, Instant departure,
                      int totalSeats, int availableSeats, double price, boolean womenOnly, String notes) {
        return rideRepository.save(Ride.builder()
                .driverId(driver.getId()).vehicleId(vehicle.getId())
                .originAddress(originAddress).originLat(originLat).originLng(originLng)
                .destAddress(destAddress).destLat(destLat).destLng(destLng)
                .departureTime(departure).totalSeats(totalSeats).availableSeats(availableSeats)
                .pricePerSeat(BigDecimal.valueOf(price)).status(RideStatus.PUBLISHED)
                .womenOnly(womenOnly).recurring(true).notes(notes).build());
    }

    private Instant at(LocalDate date, int hour, int minute) {
        return date.atTime(hour, minute).atZone(IST).toInstant();
    }

    private Booking seedHistoricalTrips(User passenger, Driver driver, Vehicle vehicle) {
        LocalDate today = LocalDate.now(IST);
        double[] prices = {60, 70, 55};
        String[] starts = {"Kukatpally Metro Station", "Miyapur Metro Station", "Kukatpally Metro Station"};
        Booking last = null;
        for (int i = 0; i < prices.length; i++) {
            LocalDate day = today.minusDays(i + 1);
            Ride ride = rideRepository.save(Ride.builder()
                    .driverId(driver.getId()).vehicleId(vehicle.getId())
                    .originAddress(starts[i]).originLat(17.4948).originLng(78.3996)
                    .destAddress("HITEC City (Cyber Towers)").destLat(17.4483).destLng(78.3915)
                    .departureTime(at(day, 9, 0)).totalSeats(4).availableSeats(0)
                    .pricePerSeat(BigDecimal.valueOf(prices[i])).status(RideStatus.COMPLETED)
                    .womenOnly(false).recurring(true).notes("Historical commute trip").build());
            Booking booking = bookingRepository.save(Booking.builder()
                    .rideId(ride.getId()).passengerId(passenger.getId()).seats(1)
                    .status(BookingStatus.COMPLETED)
                    .fareAmount(BigDecimal.valueOf(prices[i])).platformFee(BigDecimal.ZERO)
                    .totalAmount(BigDecimal.valueOf(prices[i])).paymentStatus(PaymentStatus.PAID)
                    .build());
            historyRepository.save(BookingStatusHistory.builder()
                    .bookingId(booking.getId()).status(BookingStatus.COMPLETED)
                    .note("Historical demo trip completed").build());
            paymentRepository.save(Payment.builder()
                    .bookingId(booking.getId()).provider("MOCK_DEV")
                    .providerRef("mock_" + UUID.randomUUID())
                    .amount(BigDecimal.valueOf(prices[i])).currency("INR")
                    .status(PaymentTxnStatus.SUCCESS).build());
            last = booking;
        }
        return last;
    }
}
