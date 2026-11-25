package com.zevora.booking;

import com.zevora.common.Enums.BookingStatus;
import com.zevora.common.Enums.PaymentStatus;
import com.zevora.common.Enums.RideStatus;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class BookingDtos {
    private BookingDtos() {}

    public record CreateBookingRequest(
            @NotNull UUID rideId,
            @Min(1) @Max(4) int seats,
            @Size(max = 80) String idempotencyKey
    ) {}

    public record CancelBookingRequest(@Size(max = 255) String reason) {}

    public record RideBrief(
            UUID id, String originAddress, String destAddress, Instant departureTime,
            BigDecimal pricePerSeat, RideStatus status, String driverName, String vehiclePlate
    ) {}

    public record BookingResponse(
            UUID id, UUID rideId, UUID passengerId, String passengerName,
            int seats, BigDecimal fareAmount, BigDecimal platformFee, BigDecimal totalAmount,
            BookingStatus status, PaymentStatus paymentStatus, String cancellationReason,
            Instant cancelledAt, Instant createdAt, RideBrief ride
    ) {}

    public record AlternativeOption(
            UUID rideId, String driverName, Instant departureTime,
            BigDecimal pricePerSeat, int availableSeats,
            double pickupDistanceKm, int estimatedDurationMinutes, double matchScore
    ) {}

    public record CancelResponse(BookingResponse booking, List<AlternativeOption> alternatives) {}

    public record BookingHistoryEntry(BookingStatus status, String note, Instant at) {}
}
