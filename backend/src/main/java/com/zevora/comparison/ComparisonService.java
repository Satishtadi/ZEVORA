package com.zevora.comparison;

import com.zevora.booking.Booking;
import com.zevora.booking.BookingRepository;
import com.zevora.common.ApiException;
import com.zevora.common.Enums.CommutePreference;
import com.zevora.common.Enums.PricingType;
import com.zevora.common.GeoUtils;
import com.zevora.pricing.PricingService;
import com.zevora.ride.Ride;
import com.zevora.ride.RideRepository;
import com.zevora.security.SecurityUtils;
import com.zevora.settings.SettingsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class ComparisonService {
    private final List<TravelOptionProvider> providers;
    private final RecommendationEngine recommendationEngine;
    private final SettingsService settings;
    private final BookingRepository bookingRepository;
    private final RideRepository rideRepository;
    private final PricingService pricingService;

    public ComparisonService(List<TravelOptionProvider> providers, RecommendationEngine recommendationEngine,
                             SettingsService settings, BookingRepository bookingRepository,
                             RideRepository rideRepository, PricingService pricingService) {
        this.providers = providers;
        this.recommendationEngine = recommendationEngine;
        this.settings = settings;
        this.bookingRepository = bookingRepository;
        this.rideRepository = rideRepository;
        this.pricingService = pricingService;
    }

    @Transactional(readOnly = true)
    public ComparisonDtos.Response compare(ComparisonDtos.Request req) {
        double distance = GeoUtils.routeDistanceKm(req.originLat(), req.originLng(), req.destLat(), req.destLng());
        int duration = GeoUtils.durationMinutes(distance, settings.getDouble("comparison.avg.speed.kmh", 20));
        ComparisonDtos.Context ctx = new ComparisonDtos.Context(
                req.originLat(), req.originLng(), req.destLat(), req.destLng(),
                req.originAddress() == null ? "Pickup point" : req.originAddress(),
                req.destAddress() == null ? "Destination" : req.destAddress(),
                req.departureTime(), Math.max(1, req.seats()), req.womenOnly(),
                req.preference() == null ? CommutePreference.BALANCED : req.preference(),
                distance, duration);

        List<ComparisonDtos.TravelOption> options = providers.stream()
                .flatMap(p -> p.options(ctx).stream())
                .toList();
        List<ComparisonDtos.TravelOption> scored = recommendationEngine.score(options, ctx.preference());
        String recommended = scored.stream().filter(ComparisonDtos.TravelOption::recommended)
                .map(ComparisonDtos.TravelOption::key).findFirst().orElse(null);

        return new ComparisonDtos.Response(ctx.originAddress(), ctx.destAddress(),
                GeoUtils.round2(distance), ctx.seats(), scored, recommended, Instant.now(),
                "Live options are supplied by verified partners. Estimated and external options are labelled. "
                        + "Fares and availability are confirmed at booking time.");
    }

    @Transactional(readOnly = true)
    public ComparisonDtos.SavingsResponse calculateSavings(ComparisonDtos.SavingsRequest req) {
        BigDecimal monthlySolo = req.soloCabFarePerDay().multiply(BigDecimal.valueOf(req.workingDays()))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal monthlyShared = req.sharedFarePerDay().multiply(BigDecimal.valueOf(req.workingDays()))
                .setScale(2, RoundingMode.HALF_UP);
        return new ComparisonDtos.SavingsResponse(monthlySolo, monthlyShared,
                monthlySolo.subtract(monthlyShared).max(BigDecimal.ZERO), req.workingDays(),
                "Estimate only. Actual savings depend on completed trips, fares and cancellations.");
    }

    @Transactional(readOnly = true)
    public ComparisonDtos.MonthlySavingsResponse monthlySavings() {
        UUID userId = SecurityUtils.userId();
        Instant to = Instant.now();
        Instant from = to.minus(30, ChronoUnit.DAYS);
        List<Booking> bookings = bookingRepository.findCompletedForPassenger(userId, from, to);
        BigDecimal shared = bookings.stream().map(Booking::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal solo = BigDecimal.ZERO;
        for (Booking booking : bookings) {
            Ride ride = rideRepository.findById(booking.getRideId()).orElse(null);
            if (ride == null) continue;
            double km = GeoUtils.routeDistanceKm(ride.getOriginLat(), ride.getOriginLng(),
                    ride.getDestLat(), ride.getDestLng());
            int minutes = GeoUtils.durationMinutes(km, 20) + 5;
            solo = solo.add(pricingService.estimateFare(PricingType.CAB, km, minutes));
        }
        BigDecimal savings = solo.subtract(shared).max(BigDecimal.ZERO);
        return new ComparisonDtos.MonthlySavingsResponse(bookings.size(), shared.setScale(2, RoundingMode.HALF_UP),
                solo.setScale(2, RoundingMode.HALF_UP), savings.setScale(2, RoundingMode.HALF_UP), 30,
                "Based on completed trips in the last 30 days. Solo cab cost is an estimate using current configured fares.");
    }

    public List<ComparisonDtos.TravelOption> applySortAndFilter(List<ComparisonDtos.TravelOption> options,
                                                                String sortBy, String category, BigDecimal maxFare) {
        var stream = options.stream();
        if (category != null && !category.isBlank()) {
            stream = stream.filter(o -> o.category().name().equalsIgnoreCase(category));
        }
        if (maxFare != null) {
            stream = stream.filter(o -> o.farePerPassenger().compareTo(maxFare) <= 0);
        }
        Comparator<ComparisonDtos.TravelOption> comparator = Comparator
                .comparing(ComparisonDtos.TravelOption::recommended).reversed()
                .thenComparing(Comparator.comparingDouble(ComparisonDtos.TravelOption::valueScore).reversed());
        if (sortBy != null) {
            switch (sortBy.toUpperCase()) {
                case "LOWEST_PRICE" -> comparator = Comparator.comparing(ComparisonDtos.TravelOption::farePerPassenger);
                case "FASTEST" -> comparator = Comparator.comparingInt(ComparisonDtos.TravelOption::durationMinutes);
                case "LOWEST_WALKING" -> comparator = Comparator.comparingInt(ComparisonDtos.TravelOption::walkingDistanceMeters);
                case "MOST_RELIABLE" -> comparator = Comparator.comparingDouble(ComparisonDtos.TravelOption::reliability).reversed();
                default -> { }
            }
        }
        return stream.sorted(comparator).toList();
    }
}
