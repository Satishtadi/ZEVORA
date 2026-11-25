package com.zevora.operator;

import com.zevora.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "operator_routes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperatorRoute extends BaseEntity {
    @Column(name = "operator_id", nullable = false)
    private UUID operatorId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "origin_address", length = 255)
    private String originAddress;
    @Column(name = "origin_lat")
    private Double originLat;
    @Column(name = "origin_lng")
    private Double originLng;

    @Column(name = "dest_address", length = 255)
    private String destAddress;
    @Column(name = "dest_lat")
    private Double destLat;
    @Column(name = "dest_lng")
    private Double destLng;

    @Column(name = "base_fare", precision = 10, scale = 2)
    private BigDecimal baseFare;

    @Column(name = "per_km", precision = 10, scale = 2)
    private BigDecimal perKm;

    @Column(nullable = false)
    private boolean active;
}
