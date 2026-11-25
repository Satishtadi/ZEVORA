package com.zevora.comparison.providers;

import com.zevora.common.Enums.CommutePreference;
import com.zevora.common.Enums.DataQuality;
import com.zevora.common.Enums.ProviderType;
import com.zevora.comparison.ComparisonDtos;
import com.zevora.comparison.TravelOptionProvider;
import com.zevora.matching.MatchingDtos;
import com.zevora.matching.MatchingService;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Component
public class PrivateCarpoolProvider implements TravelOptionProvider {
    private final MatchingService matchingService;

    public PrivateCarpoolProvider(MatchingService matchingService) {
        this.matchingService = matchingService;
    }

    @Override
    public List<ComparisonDtos.TravelOption> options(ComparisonDtos.Context ctx) {
        List<MatchingDtos.MatchResult> matches = matchingService.search(new MatchingDtos.SearchRequest(
                ctx.originLat(), ctx.originLng(), ctx.destLat(), ctx.destLng(),
                ctx.departureTime(), ctx.seats(), ctx.womenOnly(),
                ctx.preference() == null ? CommutePreference.BALANCED : ctx.preference()));

        return matches.stream().limit(8).map(m -> {
            var ride = m.ride();
            BigDecimal perSeat = ride.pricePerSeat();
            BigDecimal total = perSeat.multiply(BigDecimal.valueOf(ctx.seats()));
            double reliability = Math.min(1.0, 0.75 + ride.driverRating().doubleValue() / 20.0);
            Instant arrival = ride.departureTime().plusSeconds((long) m.estimatedDurationMinutes() * 60);
            return new ComparisonDtos.TravelOption(
                    "carpool-" + ride.id(),
                    ProviderType.PRIVATE_CARPOOL,
                    ride.driverName() + " · Carpool",
                    total, perSeat,
                    m.estimatedDurationMinutes(), 0, 0,
                    ride.originAddress(), ride.destAddress(),
                    ride.availableSeats(), ride.driverName(), ride.driverVerified(),
                    "Free cancellation up to 2 hours before departure",
                    "INSTANT", DataQuality.LIVE, null,
                    ride.vehicleModel() + " · " + ride.vehiclePlate(),
                    ride.id(), reliability, 0, false,
                    ride.departureTime(), arrival,
                    m.explanation() + " · " + (ride.womenOnly() ? "Women-only ride" : "Verified community carpool"));
        }).toList();
    }
}
