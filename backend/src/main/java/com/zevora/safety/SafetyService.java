package com.zevora.safety;

import com.zevora.booking.Booking;
import com.zevora.booking.BookingRepository;
import com.zevora.common.ApiException;
import com.zevora.common.Enums.NotificationType;
import com.zevora.common.Enums.Role;
import com.zevora.common.Enums.SafetyStatus;
import com.zevora.common.Enums.SafetyType;
import com.zevora.driver.Driver;
import com.zevora.driver.DriverRepository;
import com.zevora.driver.Vehicle;
import com.zevora.driver.VehicleRepository;
import com.zevora.notification.NotificationService;
import com.zevora.ride.Ride;
import com.zevora.ride.RideRepository;
import com.zevora.security.SecurityUtils;
import com.zevora.user.User;
import com.zevora.user.UserProfile;
import com.zevora.user.UserProfileRepository;
import com.zevora.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
public class SafetyService {
    private final SafetyEventRepository eventRepository;
    private final TripTrackingRepository trackingRepository;
    private final TripShareRepository shareRepository;
    private final BookingRepository bookingRepository;
    private final RideRepository rideRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final NotificationService notificationService;
    private final SecureRandom random = new SecureRandom();

    public SafetyService(SafetyEventRepository eventRepository, TripTrackingRepository trackingRepository,
                         TripShareRepository shareRepository, BookingRepository bookingRepository,
                         RideRepository rideRepository, DriverRepository driverRepository,
                         VehicleRepository vehicleRepository, UserRepository userRepository,
                         UserProfileRepository profileRepository, NotificationService notificationService) {
        this.eventRepository = eventRepository;
        this.trackingRepository = trackingRepository;
        this.shareRepository = shareRepository;
        this.bookingRepository = bookingRepository;
        this.rideRepository = rideRepository;
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public SafetyDtos.EventResponse sos(SafetyDtos.SosRequest req) {
        UUID userId = SecurityUtils.userId();
        if (req.bookingId() != null) requireBookingAccess(req.bookingId(), userId);
        SafetyEvent event = eventRepository.save(SafetyEvent.builder()
                .userId(userId)
                .bookingId(req.bookingId())
                .type(SafetyType.SOS)
                .latitude(req.latitude())
                .longitude(req.longitude())
                .note(req.note() == null ? "Emergency SOS triggered" : req.note())
                .status(SafetyStatus.OPEN)
                .build());
        notificationService.notify(userId, "SOS received",
                "Our safety team has received your emergency alert and will contact you immediately.",
                NotificationType.SAFETY);
        userRepository.findByRoleIn(List.of(Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.SUPPORT_AGENT))
                .forEach(admin -> notificationService.notify(admin.getId(), "SOS ALERT",
                        "Emergency SOS from user " + userId + (req.bookingId() != null ? " on booking " + req.bookingId() : "")
                                + ". Open the safety dashboard now.", NotificationType.SAFETY));
        return SafetyDtos.EventResponse.from(event);
    }

    @Transactional
    public SafetyDtos.EventResponse report(SafetyDtos.IncidentRequest req) {
        UUID userId = SecurityUtils.userId();
        if (req.bookingId() != null) requireBookingAccess(req.bookingId(), userId);
        SafetyEvent event = eventRepository.save(SafetyEvent.builder()
                .userId(userId)
                .bookingId(req.bookingId())
                .type(SafetyType.INCIDENT)
                .latitude(req.latitude())
                .longitude(req.longitude())
                .note(req.note())
                .status(SafetyStatus.OPEN)
                .build());
        notificationService.notify(userId, "Report received",
                "Thank you. Our support team will review your safety report.", NotificationType.SAFETY);
        return SafetyDtos.EventResponse.from(event);
    }

    @Transactional
    public SafetyDtos.ShareResponse share(UUID bookingId) {
        UUID userId = SecurityUtils.userId();
        Booking booking = requireBookingAccess(bookingId, userId);
        if (!booking.getPassengerId().equals(userId)) {
            throw ApiException.forbidden("NOT_OWNER", "Only the passenger can share this trip");
        }
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        TripShare share = shareRepository.save(TripShare.builder()
                .bookingId(bookingId)
                .token(token)
                .expiresAt(Instant.now().plus(12, ChronoUnit.HOURS))
                .createdBy(userId)
                .build());
        return new SafetyDtos.ShareResponse(token, "/api/v1/public/trips/" + token, share.getExpiresAt());
    }

    @Transactional
    public void ping(UUID bookingId, SafetyDtos.TrackingPingRequest req) {
        requireBookingAccess(bookingId, SecurityUtils.userId());
        trackingRepository.save(TripTracking.builder()
                .bookingId(bookingId)
                .latitude(req.latitude())
                .longitude(req.longitude())
                .recordedAt(Instant.now())
                .build());
    }

    @Transactional(readOnly = true)
    public SafetyDtos.TrackingResponse tracking(UUID bookingId) {
        requireBookingAccess(bookingId, SecurityUtils.userId());
        return buildTracking(bookingId);
    }

    @Transactional(readOnly = true)
    public SafetyDtos.TrackingResponse publicTracking(String token) {
        TripShare share = shareRepository.findByToken(token)
                .orElseThrow(() -> ApiException.notFound("SHARE_NOT_FOUND", "Trip link is invalid"));
        if (share.getExpiresAt().isBefore(Instant.now())) {
            throw ApiException.badRequest("SHARE_EXPIRED", "This trip link has expired");
        }
        return buildTracking(share.getBookingId());
    }

    private SafetyDtos.TrackingResponse buildTracking(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> ApiException.notFound("BOOKING_NOT_FOUND", "Booking not found"));
        Ride ride = rideRepository.findById(booking.getRideId())
                .orElseThrow(() -> ApiException.notFound("RIDE_NOT_FOUND", "Ride not found"));
        Driver driver = driverRepository.findById(ride.getDriverId()).orElse(null);
        User driverUser = driver != null ? userRepository.findById(driver.getUserId()).orElse(null) : null;
        User passenger = userRepository.findById(booking.getPassengerId()).orElse(null);
        Vehicle vehicle = vehicleRepository.findById(ride.getVehicleId()).orElse(null);
        List<SafetyDtos.TrackingPoint> points = trackingRepository.findByBookingIdOrderByRecordedAtAsc(bookingId)
                .stream().map(t -> new SafetyDtos.TrackingPoint(t.getLatitude(), t.getLongitude(), t.getRecordedAt()))
                .toList();
        return new SafetyDtos.TrackingResponse(bookingId, points,
                passenger != null ? passenger.getFullName() : "Passenger",
                driverUser != null ? driverUser.getFullName() : "Driver",
                vehicle != null ? vehicle.getPlateNumber() : "—",
                ride.getOriginAddress(), ride.getDestAddress(), ride.getDepartureTime(), booking.getStatus().name());
    }

    @Transactional(readOnly = true)
    public List<SafetyDtos.EventResponse> myEvents() {
        return eventRepository.findAllByOrderByCreatedAtDesc(org.springframework.data.domain.PageRequest.of(0, 50))
                .getContent().stream()
                .filter(e -> e.getUserId().equals(SecurityUtils.userId()) || isAdmin())
                .map(SafetyDtos.EventResponse::from).toList();
    }

    @Transactional
    public SafetyDtos.EventResponse resolve(UUID id, String status) {
        SafetyEvent event = eventRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("SAFETY_EVENT_NOT_FOUND", "Safety event not found"));
        event.setStatus(SafetyStatus.valueOf(status.toUpperCase()));
        return SafetyDtos.EventResponse.from(eventRepository.save(event));
    }

    private Booking requireBookingAccess(UUID bookingId, UUID userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> ApiException.notFound("BOOKING_NOT_FOUND", "Booking not found"));
        if (booking.getPassengerId().equals(userId) || isAdmin()) return booking;
        Ride ride = rideRepository.findById(booking.getRideId()).orElse(null);
        if (ride != null) {
            Driver driver = driverRepository.findById(ride.getDriverId()).orElse(null);
            if (driver != null && driver.getUserId().equals(userId)) return booking;
        }
        throw ApiException.forbidden("NOT_OWNER", "You cannot access this trip");
    }

    private boolean isAdmin() {
        String role = SecurityUtils.role();
        return role.equals(Role.PLATFORM_ADMIN.name()) || role.equals(Role.SUPER_ADMIN.name())
                || role.equals(Role.SUPPORT_AGENT.name());
    }

    public String emergencyContactOf(UUID userId) {
        return profileRepository.findByUserId(userId).map(UserProfile::getEmergencyContactPhone).orElse(null);
    }
}
