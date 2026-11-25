package com.zevora.safety;

import com.zevora.common.Enums.SafetyStatus;
import com.zevora.common.Enums.SafetyType;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class SafetyDtos {
    private SafetyDtos() {}

    public record SosRequest(
            UUID bookingId,
            @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
            @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,
            @Size(max = 500) String note
    ) {}

    public record IncidentRequest(
            UUID bookingId,
            @NotNull SafetyType type,
            @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
            @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,
            @NotBlank @Size(max = 500) String note
    ) {}

    public record TrackingPingRequest(
            @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
            @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude
    ) {}

    public record EventResponse(UUID id, SafetyType type, SafetyStatus status, UUID bookingId,
                                Double latitude, Double longitude, String note, Instant createdAt) {
        public static EventResponse from(SafetyEvent e) {
            return new EventResponse(e.getId(), e.getType(), e.getStatus(), e.getBookingId(),
                    e.getLatitude(), e.getLongitude(), e.getNote(), e.getCreatedAt());
        }
    }

    public record ShareResponse(String token, String publicPath, Instant expiresAt) {}

    public record TrackingPoint(double latitude, double longitude, Instant recordedAt) {}

    public record TrackingResponse(UUID bookingId, List<TrackingPoint> points,
                                   String passengerName, String driverName, String vehiclePlate,
                                   String originAddress, String destAddress, Instant departureTime,
                                   String status) {}
}
