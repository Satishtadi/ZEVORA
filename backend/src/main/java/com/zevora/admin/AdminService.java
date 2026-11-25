package com.zevora.admin;

import com.zevora.booking.BookingDtos;
import com.zevora.booking.BookingRepository;
import com.zevora.booking.BookingService;
import com.zevora.common.ApiException;
import com.zevora.common.Enums.*;
import com.zevora.common.PageResponse;
import com.zevora.driver.Driver;
import com.zevora.driver.DriverDtos;
import com.zevora.driver.DriverRepository;
import com.zevora.driver.DriverService;
import com.zevora.driver.Vehicle;
import com.zevora.driver.VehicleRepository;
import com.zevora.payment.PaymentRepository;
import com.zevora.payment.PaymentService;
import com.zevora.payment.RefundRepository;
import com.zevora.pricing.PricingRule;
import com.zevora.pricing.PricingService;
import com.zevora.ride.RideRepository;
import com.zevora.safety.SafetyDtos;
import com.zevora.safety.SafetyEventRepository;
import com.zevora.safety.SafetyService;
import com.zevora.settings.SettingsService;
import com.zevora.settings.SystemSetting;
import com.zevora.subscription.SubscriptionRepository;
import com.zevora.user.User;
import com.zevora.user.UserDtos;
import com.zevora.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class AdminService {
    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final DriverService driverService;
    private final VehicleRepository vehicleRepository;
    private final RideRepository rideRepository;
    private final BookingRepository bookingRepository;
    private final BookingService bookingService;
    private final SafetyEventRepository safetyEventRepository;
    private final SafetyService safetyService;
    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PricingService pricingService;
    private final SettingsService settingsService;
    private final AuditService auditService;

    public AdminService(UserRepository userRepository, DriverRepository driverRepository,
                        DriverService driverService, VehicleRepository vehicleRepository,
                        RideRepository rideRepository, BookingRepository bookingRepository,
                        BookingService bookingService, SafetyEventRepository safetyEventRepository,
                        SafetyService safetyService, PaymentService paymentService,
                        PaymentRepository paymentRepository, RefundRepository refundRepository,
                        SubscriptionRepository subscriptionRepository, PricingService pricingService,
                        SettingsService settingsService, AuditService auditService) {
        this.userRepository = userRepository;
        this.driverRepository = driverRepository;
        this.driverService = driverService;
        this.vehicleRepository = vehicleRepository;
        this.rideRepository = rideRepository;
        this.bookingRepository = bookingRepository;
        this.bookingService = bookingService;
        this.safetyEventRepository = safetyEventRepository;
        this.safetyService = safetyService;
        this.paymentService = paymentService;
        this.paymentRepository = paymentRepository;
        this.refundRepository = refundRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.pricingService = pricingService;
        this.settingsService = settingsService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public AdminDtos.DashboardResponse dashboard() {
        Instant now = Instant.now();
        List<AdminDtos.DayCount> trend = new ArrayList<>();
        for (int i = 13; i >= 0; i--) {
            LocalDate day = LocalDate.now(ZoneOffset.UTC).minusDays(i);
            Instant start = day.atStartOfDay(ZoneOffset.UTC).toInstant();
            Instant end = day.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
            trend.add(new AdminDtos.DayCount(day.toString(), bookingRepository.countByCreatedAtBetween(start, end)));
        }
        return new AdminDtos.DashboardResponse(userRepository.count(), driverRepository.count(),
                driverRepository.countByStatus(DriverStatus.APPROVED),
                rideRepository.countByStatus(RideStatus.COMPLETED),
                rideRepository.countByStatus(RideStatus.CANCELLED),
                bookingRepository.countByStatus(BookingStatus.CONFIRMED),
                driverRepository.countByStatus(DriverStatus.PENDING),
                paymentRepository.sumSuccessfulBetween(now.minus(30, ChronoUnit.DAYS), now),
                safetyEventRepository.countByStatus(SafetyStatus.OPEN), trend);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserDtos.Summary> users(String q, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)));
        Page<User> users = userRepository.search(q == null ? "" : q.trim(), pageable);
        return PageResponse.from(users, UserDtos.Summary::from);
    }

    @Transactional
    public UserDtos.Summary setUserStatus(UUID userId, AdminDtos.UserStatusRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND", "User not found"));
        user.setStatus(req.suspend() ? UserStatus.SUSPENDED : UserStatus.ACTIVE);
        userRepository.save(user);
        auditService.log(req.suspend() ? "USER_SUSPENDED" : "USER_ACTIVATED", "User", userId.toString(),
                req.reason() == null ? "" : req.reason());
        return UserDtos.Summary.from(user);
    }

    @Transactional(readOnly = true)
    public PageResponse<DriverDtos.DriverResponse> drivers(DriverStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)));
        return PageResponse.from(driverRepository.search(status, pageable), driverService::toResponse);
    }

    @Transactional
    public DriverDtos.DriverResponse verifyDriver(UUID driverId, AdminDtos.VerifyDriverRequest req) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> ApiException.notFound("DRIVER_NOT_FOUND", "Driver not found"));
        if (req.approved()) {
            driver.setStatus(DriverStatus.APPROVED);
            driver.setLicenseVerified(true);
            driver.setIdentityVerified(true);
        } else {
            driver.setStatus(DriverStatus.REJECTED);
        }
        driverRepository.save(driver);
        auditService.log(req.approved() ? "DRIVER_APPROVED" : "DRIVER_REJECTED", "Driver",
                driverId.toString(), req.note() == null ? "" : req.note());
        return driverService.toResponse(driver);
    }

    @Transactional
    public DriverDtos.VehicleResponse verifyVehicle(UUID vehicleId, boolean approved) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> ApiException.notFound("VEHICLE_NOT_FOUND", "Vehicle not found"));
        vehicle.setVerified(approved);
        vehicleRepository.save(vehicle);
        auditService.log(approved ? "VEHICLE_APPROVED" : "VEHICLE_REJECTED", "Vehicle",
                vehicleId.toString(), "");
        return DriverDtos.VehicleResponse.from(vehicle);
    }

    @Transactional(readOnly = true)
    public PageResponse<BookingDtos.BookingResponse> bookings(BookingStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)));
        return PageResponse.from(bookingRepository.searchAdmin(status, pageable), bookingService::toResponse);
    }

    @Transactional(readOnly = true)
    public PageResponse<SafetyDtos.EventResponse> safetyEvents(SafetyStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)));
        var events = status == null
                ? safetyEventRepository.findAllByOrderByCreatedAtDesc(pageable)
                : safetyEventRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        return PageResponse.from(events, SafetyDtos.EventResponse::from);
    }

    @Transactional
    public SafetyDtos.EventResponse resolveSafety(UUID id, SafetyStatus status) {
        auditService.log("SAFETY_STATUS_UPDATED", "SafetyEvent", id.toString(), status.name());
        return safetyService.resolve(id, status.name());
    }

    @Transactional(readOnly = true)
    public List<SystemSetting> settings() {
        return settingsService.all();
    }

    @Transactional
    public SystemSetting updateSetting(String key, AdminDtos.SettingUpdateRequest req) {
        SystemSetting setting = settingsService.set(key, req.value(), req.description());
        auditService.log("SETTING_UPDATED", "SystemSetting", key, req.value());
        return setting;
    }

    @Transactional(readOnly = true)
    public List<PricingRule> pricingRules() {
        return pricingService.all();
    }

    @Transactional
    public PricingRule updatePricing(UUID id, AdminDtos.PricingUpdateRequest req) {
        PricingRule update = PricingRule.builder()
                .name(req.name()).baseFare(req.baseFare()).perKm(req.perKm())
                .perMinute(req.perMinute()).platformFeePct(req.platformFeePct())
                .minFare(req.minFare()).active(req.active()).build();
        PricingRule saved = pricingService.update(id, update);
        auditService.log("PRICING_UPDATED", "PricingRule", id.toString(), req.name());
        return saved;
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLog> auditLogs(int page, int size) {
        return auditService.list(page, size);
    }

    @Transactional(readOnly = true)
    public AdminDtos.ReportsResponse reports() {
        long totalRides = rideRepository.count();
        long totalBookings = bookingRepository.count();
        long completed = bookingRepository.countByStatus(BookingStatus.COMPLETED);
        long cancelled = bookingRepository.countByStatus(BookingStatus.CANCELLED);
        double cancellationRate = totalBookings == 0 ? 0 : (cancelled * 100.0) / totalBookings;
        BigDecimal revenue = paymentService.totalRevenue();
        var refunds = refundRepository.findAll();
        BigDecimal refunded = refunds.stream().map(r -> r.getAmount()).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new AdminDtos.ReportsResponse(totalRides, totalBookings, completed, cancelled,
                Math.round(cancellationRate * 100.0) / 100.0, revenue, refunds.size(), refunded,
                safetyEventRepository.count(), subscriptionRepository.count());
    }
}
