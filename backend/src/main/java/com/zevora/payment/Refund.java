package com.zevora.payment;

import com.zevora.common.BaseEntity;
import com.zevora.common.Enums.PaymentTxnStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "refunds")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Refund extends BaseEntity {
    @Column(name = "payment_id", nullable = false)
    private UUID paymentId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentTxnStatus status;

    @Column(length = 255)
    private String reason;
}
