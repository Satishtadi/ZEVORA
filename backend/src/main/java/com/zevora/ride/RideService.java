package com.zevora.ride;

import com.zevora.booking.BookingService;
import com.zevora.common.ApiException;
import com.zevora.common.Enums.DriverStatus;
import com.zevora.common.Enums.RideStatus;
import com.zevora.common.GeoUtils;
import com.zevora.driver.Driver;
import com.zevora.driver.DriverRepository;
import com.zevora.driver.DriverService;
import com.zevora.driver.Vehicle;
import com.zevora.driver.VehicleRepository;
import com.zevora.settings.SettingsService;
import com.zevora.user.User;
import com.zevora.user.UserProfile;
import com.zevora.user.UserProfileRepository;
import com.zevora.user.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class RideService {
    private final RideRepository rideRepository;
    private final RideRecurrenceRepository recurrenceRepository;
    private final DriverService driverService;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final BookingService bookingService;
    private final SettingsService settings;

    public RideService(RideRepository rideRepository, RideRecurrenceRepository recurrenceRepository,
                       DriverService driverService, DriverRepository driverRepository,
                       VehicleRepository vehicleRepository, UserRepository userRepository,
                       UserProfileRepository profileRepository, BookingService bookingService,
                       SettingsService settings) {
        this.rideRepository = rideRepository;
        this.recurrenceRepository = recurrenceRepository;
        this.driverService = driverService;
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.bookingService = bookingService;
        this.settings = settings;
    }

    public Ride requireRide(UUID id) {
        return rideRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("RIDE_NOT_FOUND", "Ride not found"));
    }

    @Transactional
    public RideDtos.RideResponse create(RideDtos.CreateRideRequest req) {
        Driver driver = driverService.currentDriver();
        if (driver.getStatus() != DriverStatus.APPROVED) {
            throw ApiException.forbidden("DRIVER_NOT_VERIFIED",
                    "Your driver profile is pending verification. You can publish rides once approved.");
        }
        Vehicle vehicle = vehicleRepository.findByIdAndDriverId(req.vehicleId(), driver.getId())
                .orElseThrow(() -> ApiException.notFound("VEHICLE_NOT_FOUND", "Vehicle not found on your profile"));
        if (!vehicle.isVerified()) {
            throw ApiException.forbidden("VEHICLE_NOT_VERIFIED", "This vehicle is pending verification");
        }
        if (req.totalSeats() > vehicle.getSeatCapacity()) {
            throw ApiException.badRequest("SEAT_CAPACITY", "Total seats cannot exceed the vehicle seat capacity");
        }
        if (!GeoUtils.validCoordinate(req.originLat(), req.originLng())
                || !GeoUtils.validCoordinate(req.destLat(), req.destLng())) {
            throw ApiException.badRequest("INVALID_COORDINATES", "Provide valid pickup and drop coordinates");
        }
        Ride ride = Ride.builder()
                .driverId(driver.getId())
                .vehicleId(vehicle.getId())
                .originAddress(req.originAddress().trim())
                .originLat(req.originLat())
                .originLng(req.originLng())
                .destAddress(req.destAddress().trim())
                .destLat(req.destLat())
                .destLng(req.destLng())
                .departureTime(req.departureTime())
                .totalSeats(req.totalSeats())
                .availableSeats(req.totalSeats())
                .pricePerSeat(req.pricePerSeat())
                .status(RideStatus.PUBLISHED)
                .womenOnly(req.womenOnly())
                .recurring(req.recurring())
                .notes(req.notes())
                .build();
        ride = rideRepository.save(ride);
        if (req.recurring()) {
            recurrenceRepository.save(RideRecurrence.builder()
                    .rideId(ride.getId())
                    .daysOfWeek("MON,TUE,WED,THU,FRI")
                    .startDate(ride.getDepartureTime().atZone(java.time.ZoneOffset.UTC).toLocalDate())
                    .active(true)
                    .build());
        }
        return toResponse(ride);
    }

    @Transactional
    public RideDtos.RideResponse update(UUID id, RideDtos.CreateRideRequest req) {
        Driver driver = driverService.currentDriver();
        Ride ride = requireRide(id);
        if (!ride.getDriverId().equals(driver.getId())) {
            throw ApiException.forbidden("NOT_OWNER", "You can only edit your own rides");
        }
        if (ride.getStatus() == RideStatus.CANCELLED || ride.getStatus() == RideStatus.COMPLETED) {
            throw ApiException.badRequest("RIDE_CLOSED", "This ride can no longer be edited");
        }
        int booked = ride.getTotalSeats() - ride.getAvailableSeats();
        if (req.totalSeats() < booked) {
            throw ApiException.badRequest("SEATS_BOOKED", "Total seats cannot be less than already booked seats");
        }
        Vehicle vehicle = vehicleRepository.findByIdAndDriverId(req.vehicleId(), driver.getId())
                .orElseThrow(() -> ApiException.notFound("VEHICLE_NOT_FOUND", "Vehicle not found"));
        if (req.totalSeats() > vehicle.getSeatCapacity()) {
            throw ApiException.badRequest("SEAT_CAPACITY", "Total seats cannot exceed vehicle capacity");
        }
        ride.setVehicleId(vehicle.getId());
        ride.setOriginAddress(req.originAddress().trim());
        ride.setOriginLat(req.originLat());
        ride.setOriginLng(req.originLng());
        ride.setDestAddress(req.destAddress().trim());
        ride.setDestLat(req.destLat());
        ride.setDestLng(req.destLng());
        ride.setDepartureTime(req.departureTime());
        ride.setTotalSeats(req.totalSeats());
        ride.setAvailableSeats(req.totalSeats() - booked);
        ride.setPricePerSeat(req.pricePerSeat());
        ride.setWomenOnly(req.womenOnly());
        ride.setNotes(req.notes());
        return toResponse(rideRepository.save(ride));
    }

    @Transactional
    public RideDtos.RideResponse publish(UUID id) {
        Driver driver = driverService.currentDriver();
        Ride ride = requireRide(id);
        if (!ride.getDriverId().equals(driver.getId())) {
            throw ApiException.forbidden("NOT_OWNER", "You can only publish your own rides");
        }
        if (driver.getStatus() != DriverStatus.APPROVED) {
            throw ApiException.forbidden("DRIVER_NOT_VERIFIED", "Driver profile must be approved first");
        }
        if (ride.getAvailableSeats() <= 0) {
            throw ApiException.badRequest("RIDE_FULL", "This ride has no available seats");
        }
        if (ride.getDepartureTime().isBefore(Instant.now())) {
            throw ApiException.badRequest("DEPARTURE_PAST", "Departure time must be in the future");
        }
        ride.setStatus(RideStatus.PUBLISHED);
        return toResponse(rideRepository.save(ride));
    }

    @Transactional(readOnly = true)
    public RideDtos.RideResponse get(UUID id) {
        return toResponse(requireRide(id));
    }

    @Transactional(readOnly = true)
    public List<RideDtos.RideResponse> mine() {
        Driver driver = driverService.currentDriver();
        return rideRepository.findByDriverId(driver.getId(), PageRequest.of(0, 100)).getContent()
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<RideDtos.SearchResult> search(double originLat, double originLng, double destLat, double destLng,
                                              Instant departureTime, int seats, boolean womenOnly) {
        if (!GeoUtils.validCoordinate(originLat, originLng) || !GeoUtils.validCoordinate(destLat, destLng)) {
            throw ApiException.badRequest("INVALID_COORDINATES", "Provide valid pickup and drop coordinates");
        }
        int windowMinutes = settings.getInt("rides.search.window.minutes", 120);
        double maxPickupKm = settings.getDouble("rides.search.max.pickup.km", 7);
        double maxDropKm = settings.getDouble("rides.search.max.drop.km", 9);
        double avgSpeed = settings.getDouble("matching.avg.speed.kmh", 22);

        boolean passengerWomenOnly = womenOnly || profileRepository.findByUserId(
                        com.zevora.security.SecurityUtils.userId())
                .map(UserProfile::isWomenOnly).orElse(false);

        List<Ride> candidates = rideRepository.findCandidates(
                departureTime.minus(windowMinutes, ChronoUnit.MINUTES),
                departureTime.plus(windowMinutes, ChronoUnit.MINUTES),
                Math.max(1, seats), PageRequest.of(0, 200));

        return candidates.stream()
                .filter(r -> !passengerWomenOnly || r.isWomenOnly())
                .map(r -> {
                    double pickupKm = GeoUtils.haversineKm(originLat, originLng, r.getOriginLat(), r.getOriginLng());
                    double dropKm = GeoUtils.haversineKm(destLat, destLng, r.getDestLat(), r.getDestLng());
                    double routeKm = GeoUtils.routeDistanceKm(r.getOriginLat(), r.getOriginLng(), r.getDestLat(), r.getDestLng());
                    int duration = GeoUtils.durationMinutes(routeKm, avgSpeed) + 8;
                    return new RideDtos.SearchResult(toResponse(r), GeoUtils.round2(pickupKm),
                            GeoUtils.round2(dropKm), duration,
                            "Pickup about " + GeoUtils.round2(pickupKm) + " km away");
                })
                .filter(r -> r.pickupDistanceKm() <= maxPickupKm && r.destinationDistanceKm() <= maxDropKm)
                .sorted(Comparator.comparingDouble(RideDtos.SearchResult::pickupDistanceKm))
                .toList();
    }

    @Transactional
    public void cancelRide(UUID id, String reason) {
        Driver driver = driverService.currentDriver();
        Ride ride = rideRepository.findByIdForUpdate(id)
                .orElseThrow(() -> ApiException.notFound("RIDE_NOT_FOUND", "Ride not found"));
        if (!ride.getDriverId().equals(driver.getId())) {
            throw ApiException.forbidden("NOT_OWNER", "You can only cancel your own rides");
        }
        if (ride.getStatus() == RideStatus.COMPLETED || ride.getStatus() == RideStatus.CANCELLED) {
            throw ApiException.badRequest("RIDE_CLOSED", "This ride is already closed");
        }
        ride.setStatus(RideStatus.CANCELLED);
        rideRepository.save(ride);
        bookingService.cancelAllForRide(ride.getId(), reason == null || reason.isBlank()
                ? "Driver cancelled the ride" : reason, true);
    }

    @Transactional
    public void completeRide(UUID id) {
        Driver driver = driverService.currentDriver();
        Ride ride = rideRepository.findByIdForUpdate(id)
                .orElseThrow(() -> ApiException.notFound("RIDE_NOT_FOUND", "Ride not found"));
        if (!ride.getDriverId().equals(driver.getId())) {
            throw ApiException.forbidden("NOT_OWNER", "You can only complete your own rides");
        }
        if (ride.getStatus() != RideStatus.PUBLISHED && ride.getStatus() != RideStatus.IN_PROGRESS
                && ride.getStatus() != RideStatus.FULL) {
            throw ApiException.badRequest("INVALID_STATE", "Only active rides can be completed");
        }
        bookingService.completeAllForRide(ride.getId());
        ride.setStatus(RideStatus.COMPLETED);
        rideRepository.save(ride);
        driver.setTotalRides(driver.getTotalRides() + 1);
        driverRepository.save(driver);
    }

    @Transactional
    public RideDtos.RecurrenceResponse createRecurrence(UUID rideId, RideDtos.RecurrenceRequest req) {
        Driver driver = driverService.currentDriver();
        Ride ride = requireRide(rideId);
        if (!ride.getDriverId().equals(driver.getId())) {
            throw ApiException.forbidden("NOT_OWNER", "You can only schedule your own rides");
        }
        if (req.endDate() != null && req.endDate().isBefore(req.startDate())) {
            throw ApiException.badRequest("INVALID_DATES", "End date must be after the start date");
        }
        RideRecurrence recurrence = recurrenceRepository.findByRideId(rideId).orElseGet(RideRecurrence::new);
        recurrence.setRideId(rideId);
        recurrence.setDaysOfWeek(req.daysOfWeek());
        recurrence.setStartDate(req.startDate());
        recurrence.setEndDate(req.endDate());
        recurrence.setActive(true);
        return RideDtos.RecurrenceResponse.from(recurrenceRepository.save(recurrence));
    }

    @Transactional(readOnly = true)
    public RideDtos.RecurrenceResponse recurrence(UUID rideId) {
        return recurrenceRepository.findByRideId(rideId)
                .map(RideDtos.RecurrenceResponse::from)
                .orElseThrow(() -> ApiException.notFound("RECURRENCE_NOT_FOUND", "No recurring schedule for this ride"));
    }

    public RideDtos.RideResponse toResponse(Ride ride) {
        Driver driver = driverRepository.findById(ride.getDriverId()).orElse(null);
        User driverUser = driver != null ? userRepository.findById(driver.getUserId()).orElse(null) : null;
        Vehicle vehicle = vehicleRepository.findById(ride.getVehicleId()).orElse(null);
        boolean verified = driver != null && driver.getStatus() == DriverStatus.APPROVED
                && driver.isLicenseVerified() && vehicle != null && vehicle.isVerified();
        return new RideDtos.RideResponse(ride.getId(), ride.getDriverId(),
                driverUser != null ? driverUser.getFullName() : "ZEVORA Driver",
                driver != null ? driver.getRating() : BigDecimal.valueOf(5),
                verified, driver != null ? driver.getDriverType() : null,
                ride.getVehicleId(),
                vehicle != null ? ((vehicle.getMake() == null ? "" : vehicle.getMake() + " ")
                        + (vehicle.getModel() == null ? "" : vehicle.getModel())).trim() : "Vehicle",
                vehicle != null ? vehicle.getPlateNumber() : "—",
                ride.getOriginAddress(), ride.getOriginLat(), ride.getOriginLng(),
                ride.getDestAddress(), ride.getDestLat(), ride.getDestLng(),
                ride.getDepartureTime(), ride.getTotalSeats(), ride.getAvailableSeats(),
                ride.getPricePerSeat(), ride.getStatus(), ride.isWomenOnly(),
                ride.isRecurring(), ride.getNotes(), ride.getCreatedAt());
    }
}
