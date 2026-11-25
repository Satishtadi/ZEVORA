package com.zevora.ride;

import com.zevora.common.Enums.DriverType;
import com.zevora.common.Enums.RideStatus;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public final class RideDtos {
    private RideDtos() {}

    public record CreateRideRequest(
            @NotNull UUID vehicleId,
            @NotBlank @Size(max = 255) String originAddress,
            @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double originLat,
            @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double originLng,
            @NotBlank @Size(max = 255) String destAddress,
            @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double destLat,
            @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double destLng,
            @NotNull @Future Instant departureTime,
            @Min(1) @Max(12) int totalSeats,
            @NotNull @DecimalMin("0.0") @DecimalMax("10000.0") BigDecimal pricePerSeat,
            boolean womenOnly,
            boolean recurring,
            @Size(max = 500) String notes
    ) {}

    public record CancelRideRequest(@Size(max = 255) String reason) {}

    public record RecurrenceRequest(
            @NotBlank @Pattern(regexp = "^(MON|TUE|WED|THU|FRI|SAT|SUN)(,(MON|TUE|WED|THU|FRI|SAT|SUN))*$",
                    message = "Use comma separated day codes such as MON,TUE,WED") String daysOfWeek,
            @NotNull LocalDate startDate,
            LocalDate endDate
    ) {}

    public record RecurrenceResponse(UUID id, UUID rideId, String daysOfWeek,
                                     LocalDate startDate, LocalDate endDate, boolean active) {
        public static RecurrenceResponse from(RideRecurrence r) {
            return new RecurrenceResponse(r.getId(), r.getRideId(), r.getDaysOfWeek(),
                    r.getStartDate(), r.getEndDate(), r.isActive());
        }
    }

    public record RideResponse(
            UUID id, UUID driverId, String driverName, BigDecimal driverRating,
            boolean driverVerified, DriverType driverType,
            UUID vehicleId, String vehicleModel, String vehiclePlate,
            String originAddress, double originLat, double originLng,
            String destAddress, double destLat, double destLng,
            Instant departureTime, int totalSeats, int availableSeats,
            BigDecimal pricePerSeat, RideStatus status, boolean womenOnly,
            boolean recurring, String notes, Instant createdAt
    ) {}

    public record SearchResult(
            RideResponse ride,
            double pickupDistanceKm,
            double destinationDistanceKm,
            int estimatedDurationMinutes,
            String matchNote
    ) {}
}
