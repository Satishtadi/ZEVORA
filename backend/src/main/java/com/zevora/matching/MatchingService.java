package com.zevora.matching;

import com.zevora.auth.AuthDtos;
import com.zevora.common.ApiException;
import com.zevora.common.Enums.DriverStatus;
import com.zevora.common.Enums.RideStatus;
import com.zevora.common.GeoUtils;
import com.zevora.driver.Driver;
import com.zevora.driver.DriverRepository;
import com.zevora.ride.Ride;
import com.zevora.ride.RideMapper;
import com.zevora.ride.RideRepository;
import com.zevora.security.SecurityUtils;
import com.zevora.settings.SettingsService;
import com.zevora.user.UserProfile;
import com.zevora.user.UserProfileRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class MatchingService {
    private final RideRepository rideRepository;
    private final RideMapper rideMapper;
    private final DriverRepository driverRepository;
    private final UserProfileRepository profileRepository;
    private final SettingsService settings;

    public MatchingService(RideRepository rideRepository, RideMapper rideMapper,
                           DriverRepository driverRepository, UserProfileRepository profileRepository,
                           SettingsService settings) {
        this.rideRepository = rideRepository;
        this.rideMapper = rideMapper;
        this.driverRepository = driverRepository;
        this.profileRepository = profileRepository;
        this.settings = settings;
    }

    @Transactional(readOnly = true)
    public List<MatchingDtos.MatchResult> search(MatchingDtos.SearchRequest req) {
        if (!GeoUtils.validCoordinate(req.originLat(), req.originLng())
                || !GeoUtils.validCoordinate(req.destLat(), req.destLng())) {
            throw ApiException.badRequest("INVALID_COORDINATES", "Provide valid pickup and drop coordinates");
        }
        int seats = Math.max(1, req.seats());
        UUID passengerId = SecurityUtils.userId();
        boolean womenOnly = req.womenOnly() || profileRepository.findByUserId(passengerId)
                .map(UserProfile::isWomenOnly).orElse(false);
        return searchInternal(req.originLat(), req.originLng(), req.destLat(), req.destLng(),
                req.departureTime(), seats, womenOnly, passengerId, null, 0);
    }

    @Transactional(readOnly = true)
    public List<MatchingDtos.MatchResult> alternatives(double originLat, double originLng,
                                                       double destLat, double destLng,
                                                       Instant departureTime, int seats,
                                                       UUID passengerId, UUID excludeRideId) {
        boolean womenOnly = profileRepository.findByUserId(passengerId)
                .map(UserProfile::isWomenOnly).orElse(false);
        return searchInternal(originLat, originLng, destLat, destLng, departureTime,
                Math.max(1, seats), womenOnly, passengerId, excludeRideId, 1);
    }

    private List<MatchingDtos.MatchResult> searchInternal(double originLat, double originLng,
                                                          double destLat, double destLng,
                                                          Instant departureTime, int seats,
                                                          boolean womenOnly, UUID passengerId,
                                                          UUID excludeRideId, int windowMultiplier) {
        int baseWindow = settings.getInt("matching.window.minutes", 60) * Math.max(1, windowMultiplier);
        double maxPickup = settings.getDouble("matching.max.pickup.km", 6);
        double maxDrop = settings.getDouble("matching.max.drop.km", 8);
        double maxDetour = settings.getDouble("matching.max.detour.km", 8);
        double avgSpeed = settings.getDouble("matching.avg.speed.kmh", 22);
        double minScore = settings.getDouble("matching.min.score", 30);
        double wRoute = settings.getDouble("matching.weight.route", 0.35);
        double wTime = settings.getDouble("matching.weight.time", 0.25);
        double wPickup = settings.getDouble("matching.weight.pickup", 0.15);
        double wDestination = settings.getDouble("matching.weight.destination", 0.15);
        double wDetour = settings.getDouble("matching.weight.detour", 0.10);

        List<Ride> candidates = rideRepository.findCandidates(
                departureTime.minus(baseWindow, ChronoUnit.MINUTES),
                departureTime.plus(baseWindow, ChronoUnit.MINUTES),
                seats, PageRequest.of(0, 200));

        return candidates.stream()
                .filter(r -> excludeRideId == null || !r.getId().equals(excludeRideId))
                .filter(r -> r.getStatus() == RideStatus.PUBLISHED || r.getStatus() == RideStatus.FULL)
                .filter(r -> !womenOnly || r.isWomenOnly())
                .map(r -> score(r, originLat, originLng, destLat, destLng, departureTime, seats,
                        maxPickup, maxDrop, maxDetour, avgSpeed, baseWindow,
                        wRoute, wTime, wPickup, wDestination, wDetour))
                .filter(r -> r.pickupDistanceKm() <= maxPickup && r.destinationDistanceKm() <= maxDrop)
                .filter(r -> r.matchScore() >= minScore)
                .filter(r -> !isOwnRide(r.ride().driverId(), passengerId))
                .sorted(Comparator.comparingDouble(MatchingDtos.MatchResult::matchScore).reversed())
                .toList();
    }

    private boolean isOwnRide(UUID driverId, UUID passengerId) {
        return driverRepository.findByUserId(passengerId).map(Driver::getId).map(driverId::equals).orElse(false);
    }

    private MatchingDtos.MatchResult score(Ride ride, double originLat, double originLng,
                                           double destLat, double destLng, Instant departureTime,
                                           int seats, double maxPickup, double maxDrop, double maxDetour,
                                           double avgSpeed, int windowMinutes,
                                           double wRoute, double wTime, double wPickup,
                                           double wDestination, double wDetour) {
        double pickupKm = GeoUtils.haversineKm(originLat, originLng, ride.getOriginLat(), ride.getOriginLng());
        double dropKm = GeoUtils.haversineKm(destLat, destLng, ride.getDestLat(), ride.getDestLng());
        double rideKm = GeoUtils.routeDistanceKm(ride.getOriginLat(), ride.getOriginLng(), ride.getDestLat(), ride.getDestLng());
        double extraKm = pickupKm + dropKm;
        long minutesDiff = Math.abs(Duration.between(departureTime, ride.getDepartureTime()).toMinutes());

        double routeScore = clamp(1 - extraKm / Math.max(1, maxDetour * 2));
        double timeScore = clamp(1 - (double) minutesDiff / Math.max(1, windowMinutes));
        double pickupScore = clamp(1 - pickupKm / Math.max(0.5, maxPickup));
        double destinationScore = clamp(1 - dropKm / Math.max(0.5, maxDrop));
        double detourScore = clamp(1 - extraKm / Math.max(0.5, maxDetour));

        double total = (routeScore * wRoute + timeScore * wTime + pickupScore * wPickup
                + destinationScore * wDestination + detourScore * wDetour) * 100;

        Driver driver = driverRepository.findById(ride.getDriverId()).orElse(null);
        if (driver != null && driver.getStatus() == DriverStatus.APPROVED) total += 2;

        int duration = GeoUtils.durationMinutes(rideKm, avgSpeed) + 8;
        String explanation = "Route overlap " + pct(routeScore) + ", departure " + minutesDiff
                + " min away, pickup " + GeoUtils.round2(pickupKm) + " km";

        return new MatchingDtos.MatchResult(rideMapper.toResponse(ride), round(total),
                round(routeScore * 100), round(timeScore * 100), round(pickupScore * 100),
                round(destinationScore * 100), round(detourScore * 100),
                GeoUtils.round2(pickupKm), GeoUtils.round2(dropKm), GeoUtils.round2(extraKm),
                duration, explanation);
    }

    private double clamp(double value) {
        return Math.max(0, Math.min(1, value));
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private String pct(double value) {
        return Math.round(value * 100) + "%";
    }
}
