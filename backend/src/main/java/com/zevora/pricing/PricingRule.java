package com.zevora.pricing;

import com.zevora.common.BaseEntity;
import com.zevora.common.Enums.PricingType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "pricing_rules")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PricingRule extends BaseEntity {
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PricingType type;

    @Column(name = "base_fare", nullable = false, precision = 10, scale = 2)
    private BigDecimal baseFare;

    @Column(name = "per_km", nullable = false, precision = 10, scale = 2)
    private BigDecimal perKm;

    @Column(name = "per_minute", nullable = false, precision = 10, scale = 2)
    private BigDecimal perMinute;

    @Column(name = "platform_fee_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal platformFeePct;

    @Column(name = "min_fare", precision = 10, scale = 2)
    private BigDecimal minFare;

    @Column(nullable = false)
    private boolean active;
}
