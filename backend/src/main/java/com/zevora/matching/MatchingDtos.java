package com.zevora.matching;

import com.zevora.common.Enums.CommutePreference;
import com.zevora.ride.RideDtos;
import jakarta.validation.constraints.*;

import java.time.Instant;

public final class MatchingDtos {
    private MatchingDtos() {}

    public record SearchRequest(
            @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double originLat,
            @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double originLng,
            @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double destLat,
            @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double destLng,
            @NotNull Instant departureTime,
            @Min(1) @Max(4) int seats,
            boolean womenOnly,
            CommutePreference preference
    ) {}

    public record MatchResult(
            RideDtos.RideResponse ride,
            double matchScore,
            double routeScore,
            double timeScore,
            double pickupScore,
            double destinationScore,
            double detourScore,
            double pickupDistanceKm,
            double destinationDistanceKm,
            double extraDistanceKm,
            int estimatedDurationMinutes,
            String explanation
    ) {}

    public record AcceptRequest(@Min(1) @Max(4) int seats, @Size(max = 80) String idempotencyKey) {}
}
