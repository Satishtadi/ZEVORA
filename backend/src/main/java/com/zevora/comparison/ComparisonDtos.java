package com.zevora.comparison;

import com.zevora.common.Enums.CommutePreference;
import com.zevora.common.Enums.DataQuality;
import com.zevora.common.Enums.ProviderType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class ComparisonDtos {
    private ComparisonDtos() {}

    public record Request(
            @Size(max = 255) String originAddress,
            @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double originLat,
            @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double originLng,
            @Size(max = 255) String destAddress,
            @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double destLat,
            @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double destLng,
            @NotNull Instant departureTime,
            @Min(1) @Max(4) int seats,
            boolean womenOnly,
            CommutePreference preference
    ) {}

    public record TravelOption(
            String key,
            ProviderType category,
            String providerName,
            BigDecimal fare,
            BigDecimal farePerPassenger,
            int durationMinutes,
            int pickupEtaMinutes,
            int walkingDistanceMeters,
            String pickupLabel,
            String dropLabel,
            int availableSeats,
            String operatorName,
            boolean verified,
            String cancellationPolicy,
            String bookingMethod,
            DataQuality source,
            String deepLink,
            String vehicleInfo,
            UUID rideId,
            double reliability,
            double valueScore,
            boolean recommended,
            Instant departureTime,
            Instant arrivalTime,
            String note
    ) {
        public TravelOption scored(double score, boolean isRecommended) {
            return new TravelOption(key, category, providerName, fare, farePerPassenger, durationMinutes,
                    pickupEtaMinutes, walkingDistanceMeters, pickupLabel, dropLabel, availableSeats,
                    operatorName, verified, cancellationPolicy, bookingMethod, source, deepLink,
                    vehicleInfo, rideId, reliability, score, isRecommended, departureTime, arrivalTime, note);
        }
    }

    public record Response(
            String originAddress,
            String destAddress,
            double distanceKm,
            int seats,
            List<TravelOption> options,
            String recommendedOptionKey,
            Instant generatedAt,
            String disclaimer
    ) {}

    public record SavingsRequest(
            @NotNull @DecimalMin("0.0") BigDecimal soloCabFarePerDay,
            @NotNull @DecimalMin("0.0") BigDecimal sharedFarePerDay,
            @Min(1) @Max(31) int workingDays
    ) {}

    public record SavingsResponse(
            BigDecimal monthlySoloCost,
            BigDecimal monthlySharedCost,
            BigDecimal monthlySavings,
            int workingDays,
            String note
    ) {}

    public record MonthlySavingsResponse(
            int completedTrips,
            BigDecimal sharedSpend,
            BigDecimal estimatedSoloSpend,
            BigDecimal savings,
            int periodDays,
            String note
    ) {}

    public record Context(
            double originLat, double originLng, double destLat, double destLng,
            String originAddress, String destAddress, Instant departureTime,
            int seats, boolean womenOnly, CommutePreference preference,
            double distanceKm, int durationMinutes
    ) {}
}
