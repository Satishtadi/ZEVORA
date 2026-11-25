package com.zevora.payment;

import com.zevora.common.BaseEntity;
import com.zevora.common.Enums.PaymentTxnStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "payments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment extends BaseEntity {
    @Column(name = "booking_id", nullable = false)
    private UUID bookingId;

    @Column(nullable = false, length = 30)
    private String provider;

    @Column(name = "provider_ref", length = 80)
    private String providerRef;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentTxnStatus status;

    @Column(name = "idempotency_key", unique = true, length = 80)
    private String idempotencyKey;
}
