package com.zevora.comparison.providers;

import com.zevora.common.Enums.DataQuality;
import com.zevora.common.Enums.PricingType;
import com.zevora.common.Enums.ProviderType;
import com.zevora.common.GeoUtils;
import com.zevora.comparison.ComparisonDtos;
import com.zevora.comparison.TravelOptionProvider;
import com.zevora.operator.OperatorRoute;
import com.zevora.operator.OperatorRouteRepository;
import com.zevora.operator.OperatorSchedule;
import com.zevora.operator.OperatorScheduleRepository;
import com.zevora.operator.TransportOperator;
import com.zevora.operator.TransportOperatorRepository;
import com.zevora.pricing.PricingService;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Component
public class CommercialCabProvider implements TravelOptionProvider {
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private final OperatorRouteRepository routeRepository;
    private final OperatorScheduleRepository scheduleRepository;
    private final TransportOperatorRepository operatorRepository;
    private final PricingService pricingService;

    public CommercialCabProvider(OperatorRouteRepository routeRepository,
                                 OperatorScheduleRepository scheduleRepository,
                                 TransportOperatorRepository operatorRepository,
                                 PricingService pricingService) {
        this.routeRepository = routeRepository;
        this.scheduleRepository = scheduleRepository;
        this.operatorRepository = operatorRepository;
        this.pricingService = pricingService;
    }

    @Override
    public List<ComparisonDtos.TravelOption> options(ComparisonDtos.Context ctx) {
        List<ComparisonDtos.TravelOption> options = new ArrayList<>();
        for (OperatorRoute route : routeRepository.findByActiveTrue()) {
            if (route.getOriginLat() == null || route.getDestLat() == null) continue;
            double pickupKm = GeoUtils.haversineKm(ctx.originLat(), ctx.originLng(), route.getOriginLat(), route.getOriginLng());
            double dropKm = GeoUtils.haversineKm(ctx.destLat(), ctx.destLng(), route.getDestLat(), route.getDestLng());
            if (pickupKm > 7 || dropKm > 7) continue;
            TransportOperator operator = operatorRepository.findById(route.getOperatorId()).orElse(null);
            String operatorName = operator != null ? operator.getName() : "Partner operator";
            List<OperatorSchedule> schedules = scheduleRepository.findByRouteIdAndActiveTrueOrderByDepartureTimeAsc(route.getId());
            if (schedules.isEmpty()) {
                BigDecimal estimate = pricingService.estimateFare(PricingType.COMMERCIAL_CAB,
                        ctx.distanceKm(), ctx.durationMinutes());
                BigDecimal perSeat = estimate.divide(BigDecimal.valueOf(Math.max(2, ctx.seats())), 2, RoundingMode.HALF_UP);
                Instant arrival = ctx.departureTime().plusSeconds((long) ctx.durationMinutes() * 60);
                options.add(option("shared-est-" + route.getId(), operatorName + " · Shared Cab", perSeat, perSeat,
                        ctx, arrival, DataQuality.ESTIMATED, 8, operator != null && operator.isVerified(),
                        "Estimated seat fare · operator confirms availability", route.getId().toString(), operatorName));
                continue;
            }
            for (OperatorSchedule schedule : schedules) {
                if (schedule.getAvailableSeats() < ctx.seats()) continue;
                Instant departure = nextOccurrence(ctx.departureTime(), schedule.getDepartureTime());
                BigDecimal fare = schedule.getFare();
                if (fare == null) {
                    fare = pricingService.estimateFare(PricingType.COMMERCIAL_CAB, ctx.distanceKm(), ctx.durationMinutes())
                            .divide(BigDecimal.valueOf(Math.max(2, schedule.getSeatCapacity())), 2, RoundingMode.HALF_UP);
                }
                Instant arrival = departure.plusSeconds((long) ctx.durationMinutes() * 60);
                options.add(option("operator-" + schedule.getId(), operatorName + " · " + route.getName(),
                        fare, fare, ctx, arrival, DataQuality.LIVE, schedule.getAvailableSeats(),
                        operator != null && operator.isVerified(),
                        "Operator cancellation policy · free cancellation up to 4 hours before", null, operatorName));
            }
        }
        return options;
    }

    private ComparisonDtos.TravelOption option(String key, String providerName, BigDecimal total,
                                               BigDecimal perSeat, ComparisonDtos.Context ctx, Instant arrival,
                                               DataQuality quality, int seats, boolean verified,
                                               String cancellation, String ignored, String operatorName) {
        return new ComparisonDtos.TravelOption(key, ProviderType.COMMERCIAL_SHARED_CAB, providerName,
                total, perSeat, ctx.durationMinutes(), 6, 250,
                ctx.originAddress(), ctx.destAddress(), seats, operatorName, verified,
                cancellation, quality == DataQuality.LIVE ? "INSTANT" : "REQUEST",
                quality, null, "Commercial shared cab", null,
                quality == DataQuality.LIVE ? 0.88 : 0.72, 0, false,
                ctx.departureTime(), arrival,
                quality == DataQuality.LIVE ? "Live seat inventory from verified operator"
                        : "Estimated fare. Live seat inventory is not connected for this route.");
    }

    private Instant nextOccurrence(Instant notBefore, LocalTime time) {
        var zoned = notBefore.atZone(IST).toLocalDate().atTime(time).atZone(IST);
        Instant candidate = zoned.toInstant();
        if (candidate.isBefore(notBefore)) {
            candidate = LocalDate.from(zoned).plusDays(1).atTime(time).atZone(IST).toInstant();
        }
        return candidate;
    }
}
