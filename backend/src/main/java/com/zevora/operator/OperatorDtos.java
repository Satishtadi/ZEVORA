package com.zevora.operator;

import com.zevora.common.Enums.OperatorStatus;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public final class OperatorDtos {
    private OperatorDtos() {}

    public record CreateOperatorRequest(
            @NotBlank @Size(max = 150) String name,
            @Email @Size(max = 180) String contactEmail
    ) {}

    public record OperatorResponse(UUID id, String name, String contactEmail, OperatorStatus status, boolean verified) {
        public static OperatorResponse from(TransportOperator o) {
            return new OperatorResponse(o.getId(), o.getName(), o.getContactEmail(), o.getStatus(), o.isVerified());
        }
    }

    public record RouteRequest(
            @NotBlank @Size(max = 150) String name,
            @Size(max = 255) String originAddress,
            @DecimalMin("-90.0") @DecimalMax("90.0") Double originLat,
            @DecimalMin("-180.0") @DecimalMax("180.0") Double originLng,
            @Size(max = 255) String destAddress,
            @DecimalMin("-90.0") @DecimalMax("90.0") Double destLat,
            @DecimalMin("-180.0") @DecimalMax("180.0") Double destLng,
            @DecimalMin("0.0") BigDecimal baseFare,
            @DecimalMin("0.0") BigDecimal perKm,
            boolean active
    ) {}

    public record RouteResponse(UUID id, UUID operatorId, String name, String originAddress,
                                String destAddress, BigDecimal baseFare, BigDecimal perKm, boolean active) {
        public static RouteResponse from(OperatorRoute r) {
            return new RouteResponse(r.getId(), r.getOperatorId(), r.getName(), r.getOriginAddress(),
                    r.getDestAddress(), r.getBaseFare(), r.getPerKm(), r.isActive());
        }
    }

    public record ScheduleRequest(
            @NotNull LocalTime departureTime,
            @Size(max = 30) String daysOfWeek,
            @Min(1) int seatCapacity,
            @Min(0) int availableSeats,
            @DecimalMin("0.0") BigDecimal fare,
            boolean active
    ) {}

    public record ScheduleResponse(UUID id, UUID routeId, LocalTime departureTime, String daysOfWeek,
                                   int seatCapacity, int availableSeats, BigDecimal fare, boolean active) {
        public static ScheduleResponse from(OperatorSchedule s) {
            return new ScheduleResponse(s.getId(), s.getRouteId(), s.getDepartureTime(), s.getDaysOfWeek(),
                    s.getSeatCapacity(), s.getAvailableSeats(), s.getFare(), s.isActive());
        }
    }

    public record VehicleRequest(
            @NotBlank @Size(max = 20) String plateNumber,
            @Size(max = 80) String model,
            @Min(1) int seatCapacity,
            boolean verified
    ) {}

    public record OperatorVehicleResponse(UUID id, String plateNumber, String model, int seatCapacity, boolean verified) {
        public static OperatorVehicleResponse from(OperatorVehicle v) {
            return new OperatorVehicleResponse(v.getId(), v.getPlateNumber(), v.getModel(), v.getSeatCapacity(), v.isVerified());
        }
    }

    public record DriverRequest(
            @NotBlank @Size(max = 120) String fullName,
            @Pattern(regexp = "^(\\+91)?[6-9]\\d{9}$") String phone,
            @Size(max = 40) String licenseNumber,
            boolean verified
    ) {}

    public record OperatorDriverResponse(UUID id, String fullName, String phone, String licenseNumber, boolean verified) {
        public static OperatorDriverResponse from(OperatorDriver d) {
            return new OperatorDriverResponse(d.getId(), d.getFullName(), d.getPhone(), d.getLicenseNumber(), d.isVerified());
        }
    }

    public record SummaryResponse(UUID operatorId, String operatorName, long routes, long schedules,
                                  long vehicles, long drivers, int dailySeatCapacity,
                                  BigDecimal estimatedMonthlyRevenue, String note) {}

    public record FleetResponse(List<OperatorVehicleResponse> vehicles, List<OperatorDriverResponse> drivers) {}
}
