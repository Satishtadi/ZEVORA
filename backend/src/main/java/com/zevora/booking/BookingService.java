package com.zevora.booking;

import com.zevora.common.ApiException;
import com.zevora.common.Enums.*;
import com.zevora.common.PageResponse;
import com.zevora.driver.Driver;
import com.zevora.driver.DriverRepository;
import com.zevora.driver.Vehicle;
import com.zevora.driver.VehicleRepository;
import com.zevora.matching.MatchingDtos;
import com.zevora.matching.MatchingService;
import com.zevora.notification.NotificationService;
import com.zevora.payment.PaymentService;
import com.zevora.ride.Ride;
import com.zevora.ride.RideRepository;
import com.zevora.security.SecurityUtils;
import com.zevora.settings.SettingsService;
import com.zevora.user.User;
import com.zevora.user.UserProfile;
import com.zevora.user.UserProfileRepository;
import com.zevora.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class BookingService {
    private final BookingRepository bookingRepository;
    private final BookingStatusHistoryRepository historyRepository;
    private final RideRepository rideRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final PaymentService paymentService;
    private final NotificationService notificationService;
    private final MatchingService matchingService;
    private final SettingsService settings;

    public BookingService(BookingRepository bookingRepository, BookingStatusHistoryRepository historyRepository,
                          RideRepository rideRepository, DriverRepository driverRepository,
                          VehicleRepository vehicleRepository, UserRepository userRepository,
                          UserProfileRepository profileRepository, PaymentService paymentService,
                          NotificationService notificationService, MatchingService matchingService,
                          SettingsService settings) {
        this.bookingRepository = bookingRepository;
        this.historyRepository = historyRepository;
        this.rideRepository = rideRepository;
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.paymentService = paymentService;
        this.notificationService = notificationService;
        this.matchingService = matchingService;
        this.settings = settings;
    }

    @Transactional
    public BookingDtos.BookingResponse book(BookingDtos.CreateBookingRequest req) {
        UUID passengerId = SecurityUtils.userId();

        if (req.idempotencyKey() != null && !req.idempotencyKey().isBlank()) {
            var existing = bookingRepository.findByIdempotencyKey(req.idempotencyKey());
            if (existing.isPresent()) return toResponse(existing.get());
        }

        Ride ride = rideRepository.findByIdForUpdate(req.rideId())
                .orElseThrow(() -> ApiException.notFound("RIDE_NOT_FOUND", "Ride not found"));
        if (ride.getStatus() != RideStatus.PUBLISHED && ride.getStatus() != RideStatus.FULL) {
            throw ApiException.badRequest("RIDE_NOT_BOOKABLE", "This ride is not open for booking");
        }
        if (ride.getDepartureTime().isBefore(Instant.now())) {
            throw ApiException.badRequest("RIDE_DEPARTED", "This ride has already departed");
        }
        Driver driver = driverRepository.findById(ride.getDriverId())
                .orElseThrow(() -> ApiException.notFound("DRIVER_NOT_FOUND", "Ride driver not found"));
        if (driver.getUserId().equals(passengerId)) {
            throw ApiException.badRequest("OWN_RIDE", "You cannot book your own ride");
        }
        int seats = Math.max(1, req.seats());
        if (ride.getAvailableSeats() < seats) {
            throw ApiException.conflict("SEATS_UNAVAILABLE", "Only " + ride.getAvailableSeats() + " seat(s) left on this ride");
        }

        boolean passengerWomenOnly = profileRepository.findByUserId(passengerId)
                .map(UserProfile::isWomenOnly).orElse(false);
        if (ride.isWomenOnly() && !passengerWomenOnly) {
            throw ApiException.forbidden("WOMEN_ONLY_RIDE", "This ride is reserved for women-only commute members");
        }

        List<BookingStatus> active = List.of(BookingStatus.REQUESTED, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS);
        if (bookingRepository.existsByRideIdAndPassengerIdAndStatusIn(ride.getId(), passengerId, active)) {
            throw ApiException.conflict("ALREADY_BOOKED", "You already have an active booking on this ride");
        }

        BigDecimal fare = ride.getPricePerSeat().multiply(BigDecimal.valueOf(seats)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal feePercent = driver.getDriverType() == DriverType.COMMERCIAL
                ? settings.getDouble("platform.fee.percent", 5) > 0
                    ? BigDecimal.valueOf(settings.getDouble("platform.fee.percent", 5)) : BigDecimal.ZERO
                : BigDecimal.ZERO;
        BigDecimal platformFee = fare.multiply(feePercent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal total = fare.add(platformFee);

        ride.setAvailableSeats(ride.getAvailableSeats() - seats);
        if (ride.getAvailableSeats() == 0) ride.setStatus(RideStatus.FULL);
        rideRepository.save(ride);

        Booking booking = bookingRepository.save(Booking.builder()
                .rideId(ride.getId())
                .passengerId(passengerId)
                .seats(seats)
                .status(BookingStatus.CONFIRMED)
                .fareAmount(fare)
                .platformFee(platformFee)
                .totalAmount(total)
                .paymentStatus(PaymentStatus.PENDING)
                .idempotencyKey(req.idempotencyKey() == null || req.idempotencyKey().isBlank() ? null : req.idempotencyKey())
                .build());

        paymentService.recordMockPayment(booking.getId(), total, "pay-" + booking.getId());
        booking.setPaymentStatus(PaymentStatus.PAID);
        booking = bookingRepository.save(booking);
        history(booking.getId(), BookingStatus.CONFIRMED, "Booking confirmed with " + seats + " seat(s)");

        notificationService.notify(passengerId, "Ride confirmed",
                "Your seat from " + ride.getOriginAddress() + " to " + ride.getDestAddress()
                        + " is confirmed for " + ride.getDepartureTime() + ".", NotificationType.BOOKING);
        notificationService.notify(driver.getUserId(), "New passenger",
                "A passenger booked " + seats + " seat(s) on your ride to " + ride.getDestAddress() + ".",
                NotificationType.BOOKING);
        return toResponse(booking);
    }

    @Transactional
    public BookingDtos.CancelResponse cancel(UUID bookingId, String reason) {
        UUID userId = SecurityUtils.userId();
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> ApiException.notFound("BOOKING_NOT_FOUND", "Booking not found"));
        if (!booking.getPassengerId().equals(userId)) {
            throw ApiException.forbidden("NOT_OWNER", "You can only cancel your own booking");
        }
        if (booking.getStatus() != BookingStatus.CONFIRMED && booking.getStatus() != BookingStatus.REQUESTED) {
            throw ApiException.badRequest("NOT_CANCELLABLE", "This booking cannot be cancelled");
        }
        Ride ride = rideRepository.findByIdForUpdate(booking.getRideId())
                .orElseThrow(() -> ApiException.notFound("RIDE_NOT_FOUND", "Ride not found"));
        if (ride.getStatus() == RideStatus.IN_PROGRESS || ride.getStatus() == RideStatus.COMPLETED) {
            throw ApiException.badRequest("TRIP_STARTED", "This trip has already started and cannot be cancelled");
        }

        double fullRefundHours = settings.getDouble("booking.cancel.full.refund.hours", 2);
        double partialPercent = settings.getDouble("booking.cancel.partial.refund.percent", 50);
        double hoursUntil = Duration.between(Instant.now(), ride.getDepartureTime()).toMinutes() / 60.0;
        BigDecimal refundAmount = hoursUntil >= fullRefundHours
                ? booking.getTotalAmount()
                : booking.getTotalAmount().multiply(BigDecimal.valueOf(partialPercent))
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        if (ride.getStatus() == RideStatus.PUBLISHED || ride.getStatus() == RideStatus.FULL) {
            ride.setAvailableSeats(Math.min(ride.getTotalSeats(), ride.getAvailableSeats() + booking.getSeats()));
            if (ride.getStatus() == RideStatus.FULL) ride.setStatus(RideStatus.PUBLISHED);
            rideRepository.save(ride);
        }

        String note = reason == null || reason.isBlank() ? "Cancelled by passenger" : reason;
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancellationReason(note);
        booking.setCancelledAt(Instant.now());
        booking.setPaymentStatus(refundAmount.signum() > 0 ? PaymentStatus.REFUNDED : PaymentStatus.PAID);
        bookingRepository.save(booking);
        if (refundAmount.signum() > 0) {
            paymentService.refund(booking.getId(), refundAmount, "Passenger cancellation: " + note);
        }
        history(booking.getId(), BookingStatus.CANCELLED, note);
        notificationService.notify(userId, "Booking cancelled",
                "Your booking was cancelled. Refund of ₹" + refundAmount + " is being processed.",
                NotificationType.CANCELLATION);

        List<MatchingDtos.MatchResult> matches = matchingService.alternatives(
                ride.getOriginLat(), ride.getOriginLng(), ride.getDestLat(), ride.getDestLng(),
                ride.getDepartureTime(), booking.getSeats(), userId, ride.getId());
        List<BookingDtos.AlternativeOption> alternatives = matches.stream()
                .limit(5)
                .map(m -> new BookingDtos.AlternativeOption(m.ride().id(), m.ride().driverName(),
                        m.ride().departureTime(), m.ride().pricePerSeat(), m.ride().availableSeats(),
                        m.pickupDistanceKm(), m.estimatedDurationMinutes(), m.matchScore()))
                .toList();
        return new BookingDtos.CancelResponse(toResponse(booking), alternatives);
    }

    @Transactional
    public int cancelAllForRide(UUID rideId, String reason, boolean driverCancelled) {
        List<Booking> bookings = bookingRepository.findByRideIdAndStatusIn(rideId,
                List.of(BookingStatus.REQUESTED, BookingStatus.CONFIRMED));
        for (Booking booking : bookings) {
            booking.setStatus(BookingStatus.CANCELLED);
            booking.setCancellationReason(reason);
            booking.setCancelledAt(Instant.now());
            if (driverCancelled) {
                booking.setPaymentStatus(PaymentStatus.REFUNDED);
                paymentService.refund(booking.getId(), booking.getTotalAmount(), "Driver cancelled ride");
            }
            bookingRepository.save(booking);
            history(booking.getId(), BookingStatus.CANCELLED, reason);
            notificationService.notify(booking.getPassengerId(), "Ride cancelled by driver",
                    reason + ". A full refund has been initiated and alternative rides are available in the app.",
                    NotificationType.CANCELLATION);
        }
        return bookings.size();
    }

    @Transactional
    public void completeAllForRide(UUID rideId) {
        List<Booking> bookings = bookingRepository.findByRideIdAndStatusIn(rideId,
                List.of(BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS));
        for (Booking booking : bookings) {
            booking.setStatus(BookingStatus.COMPLETED);
            bookingRepository.save(booking);
            history(booking.getId(), BookingStatus.COMPLETED, "Trip completed");
            notificationService.notify(booking.getPassengerId(), "Trip completed",
                    "Your trip is complete. Please rate your driver.", NotificationType.BOOKING);
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<BookingDtos.BookingResponse> mine(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(50, Math.max(1, size)));
        Page<Booking> bookings = bookingRepository.findByPassengerIdOrderByCreatedAtDesc(SecurityUtils.userId(), pageable);
        return PageResponse.from(bookings, this::toResponse);
    }

    @Transactional(readOnly = true)
    public BookingDtos.BookingResponse get(UUID id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("BOOKING_NOT_FOUND", "Booking not found"));
        authorizeView(booking);
        return toResponse(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingDtos.BookingHistoryEntry> history(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> ApiException.notFound("BOOKING_NOT_FOUND", "Booking not found"));
        authorizeView(booking);
        return historyRepository.findByBookingIdOrderByCreatedAtAsc(bookingId).stream()
                .map(h -> new BookingDtos.BookingHistoryEntry(h.getStatus(), h.getNote(), h.getCreatedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BookingDtos.AlternativeOption> alternatives(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> ApiException.notFound("BOOKING_NOT_FOUND", "Booking not found"));
        if (!booking.getPassengerId().equals(SecurityUtils.userId())) {
            throw ApiException.forbidden("NOT_OWNER", "You can only view alternatives for your own booking");
        }
        Ride ride = rideRepository.findById(booking.getRideId())
                .orElseThrow(() -> ApiException.notFound("RIDE_NOT_FOUND", "Ride not found"));
        return matchingService.alternatives(ride.getOriginLat(), ride.getOriginLng(),
                        ride.getDestLat(), ride.getDestLng(), ride.getDepartureTime(),
                        booking.getSeats(), booking.getPassengerId(), ride.getId())
                .stream().limit(6)
                .map(m -> new BookingDtos.AlternativeOption(m.ride().id(), m.ride().driverName(),
                        m.ride().departureTime(), m.ride().pricePerSeat(), m.ride().availableSeats(),
                        m.pickupDistanceKm(), m.estimatedDurationMinutes(), m.matchScore()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BookingDtos.BookingResponse> forRide(UUID rideId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> ApiException.notFound("RIDE_NOT_FOUND", "Ride not found"));
        Driver driver = driverRepository.findById(ride.getDriverId())
                .orElseThrow(() -> ApiException.notFound("DRIVER_NOT_FOUND", "Driver not found"));
        if (!driver.getUserId().equals(SecurityUtils.userId()) && !isAdmin()) {
            throw ApiException.forbidden("NOT_OWNER", "Only the ride driver can view these bookings");
        }
        return bookingRepository.findByRideIdOrderByCreatedAtAsc(rideId).stream()
                .map(this::toResponse).toList();
    }

    private void authorizeView(Booking booking) {
        if (booking.getPassengerId().equals(SecurityUtils.userId()) || isAdmin()) return;
        Ride ride = rideRepository.findById(booking.getRideId()).orElse(null);
        if (ride != null) {
            Driver driver = driverRepository.findById(ride.getDriverId()).orElse(null);
            if (driver != null && driver.getUserId().equals(SecurityUtils.userId())) return;
        }
        throw ApiException.forbidden("NOT_OWNER", "You cannot view this booking");
    }

    private boolean isAdmin() {
        String role = SecurityUtils.role();
        return role.equals(Role.PLATFORM_ADMIN.name()) || role.equals(Role.SUPER_ADMIN.name())
                || role.equals(Role.SUPPORT_AGENT.name());
    }

    private void history(UUID bookingId, BookingStatus status, String note) {
        historyRepository.save(BookingStatusHistory.builder()
                .bookingId(bookingId).status(status).note(note).build());
    }

    public BookingDtos.BookingResponse toResponse(Booking booking) {
        Ride ride = rideRepository.findById(booking.getRideId()).orElse(null);
        User passenger = userRepository.findById(booking.getPassengerId()).orElse(null);
        Driver driver = ride != null ? driverRepository.findById(ride.getDriverId()).orElse(null) : null;
        User driverUser = driver != null ? userRepository.findById(driver.getUserId()).orElse(null) : null;
        Vehicle vehicle = ride != null ? vehicleRepository.findById(ride.getVehicleId()).orElse(null) : null;
        BookingDtos.RideBrief brief = ride == null ? null : new BookingDtos.RideBrief(
                ride.getId(), ride.getOriginAddress(), ride.getDestAddress(), ride.getDepartureTime(),
                ride.getPricePerSeat(), ride.getStatus(),
                driverUser != null ? driverUser.getFullName() : "ZEVORA Driver",
                vehicle != null ? vehicle.getPlateNumber() : "—");
        return new BookingDtos.BookingResponse(booking.getId(), booking.getRideId(), booking.getPassengerId(),
                passenger != null ? passenger.getFullName() : "Passenger",
                booking.getSeats(), booking.getFareAmount(), booking.getPlatformFee(), booking.getTotalAmount(),
                booking.getStatus(), booking.getPaymentStatus(), booking.getCancellationReason(),
                booking.getCancelledAt(), booking.getCreatedAt(), brief);
    }
}
