package com.zevora.booking;

import com.zevora.common.BaseEntity;
import com.zevora.common.Enums.BookingStatus;
import com.zevora.common.Enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Booking extends BaseEntity {
    @Column(name = "ride_id", nullable = false)
    private UUID rideId;

    @Column(name = "passenger_id", nullable = false)
    private UUID passengerId;

    @Column(nullable = false)
    private int seats;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BookingStatus status;

    @Column(name = "fare_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal fareAmount;

    @Column(name = "platform_fee", nullable = false, precision = 10, scale = 2)
    private BigDecimal platformFee;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    private PaymentStatus paymentStatus;

    @Column(name = "idempotency_key", unique = true, length = 80)
    private String idempotencyKey;

    @Column(name = "cancellation_reason", length = 255)
    private String cancellationReason;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;
}
