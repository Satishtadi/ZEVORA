package com.zevora.driver;

import com.zevora.common.Enums.DriverStatus;
import com.zevora.common.Enums.DriverType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public final class DriverDtos {
    private DriverDtos() {}

    public record RegisterDriverRequest(
            @NotNull DriverType driverType,
            @NotBlank @Size(min = 6, max = 40) String licenseNumber
    ) {}

    public record AvailabilityRequest(
            @NotNull Boolean available,
            @DecimalMin("-90.0") @DecimalMax("90.0") Double lat,
            @DecimalMin("-180.0") @DecimalMax("180.0") Double lng
    ) {}

    public record VehicleRequest(
            @Size(max = 60) String make,
            @Size(max = 60) String model,
            @NotBlank @Size(max = 20) String plateNumber,
            @Size(max = 30) String color,
            @Min(1) @Max(12) int seatCapacity
    ) {}

    public record VehicleResponse(UUID id, String make, String model, String plateNumber,
                                  String color, int seatCapacity, boolean verified) {
        public static VehicleResponse from(Vehicle v) {
            return new VehicleResponse(v.getId(), v.getMake(), v.getModel(), v.getPlateNumber(),
                    v.getColor(), v.getSeatCapacity(), v.isVerified());
        }
    }

    public record DriverResponse(
            UUID id, UUID userId, String fullName, String email, String phone,
            DriverType driverType, String licenseNumber, boolean licenseVerified,
            boolean identityVerified, DriverStatus status, BigDecimal rating, int totalRides,
            boolean available, List<VehicleResponse> vehicles
    ) {}
}
