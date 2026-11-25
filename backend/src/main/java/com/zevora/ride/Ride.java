package com.zevora.ride;

import com.zevora.common.BaseEntity;
import com.zevora.common.Enums.RideStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rides")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ride extends BaseEntity {
    @Column(name = "driver_id", nullable = false)
    private UUID driverId;

    @Column(name = "vehicle_id", nullable = false)
    private UUID vehicleId;

    @Column(name = "origin_address", nullable = false, length = 255)
    private String originAddress;
    @Column(name = "origin_lat", nullable = false)
    private double originLat;
    @Column(name = "origin_lng", nullable = false)
    private double originLng;

    @Column(name = "dest_address", nullable = false, length = 255)
    private String destAddress;
    @Column(name = "dest_lat", nullable = false)
    private double destLat;
    @Column(name = "dest_lng", nullable = false)
    private double destLng;

    @Column(name = "departure_time", nullable = false)
    private Instant departureTime;

    @Column(name = "total_seats", nullable = false)
    private int totalSeats;

    @Column(name = "available_seats", nullable = false)
    private int availableSeats;

    @Column(name = "price_per_seat", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerSeat;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RideStatus status;

    @Column(name = "women_only", nullable = false)
    private boolean womenOnly;

    @Column(nullable = false)
    private boolean recurring;

    @Column(length = 500)
    private String notes;
}
