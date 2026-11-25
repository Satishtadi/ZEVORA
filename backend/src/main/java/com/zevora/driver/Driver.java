package com.zevora.driver;

import com.zevora.common.BaseEntity;
import com.zevora.common.Enums.DriverStatus;
import com.zevora.common.Enums.DriverType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "drivers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Driver extends BaseEntity {
    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "driver_type", nullable = false, length = 30)
    private DriverType driverType;

    @Column(name = "license_number", nullable = false, length = 40)
    private String licenseNumber;

    @Column(name = "license_verified", nullable = false)
    private boolean licenseVerified;

    @Column(name = "identity_verified", nullable = false)
    private boolean identityVerified;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DriverStatus status;

    @Column(nullable = false, precision = 3, scale = 2)
    private BigDecimal rating;

    @Column(name = "total_rides", nullable = false)
    private int totalRides;

    @Column(nullable = false)
    private boolean available;

    @Column(name = "current_lat")
    private Double currentLat;

    @Column(name = "current_lng")
    private Double currentLng;
}
