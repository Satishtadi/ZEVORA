package com.zevora.driver;

import com.zevora.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "vehicles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Vehicle extends BaseEntity {
    @Column(name = "driver_id", nullable = false)
    private UUID driverId;

    @Column(length = 60)
    private String make;

    @Column(length = 60)
    private String model;

    @Column(name = "plate_number", nullable = false, unique = true, length = 20)
    private String plateNumber;

    @Column(length = 30)
    private String color;

    @Column(name = "seat_capacity", nullable = false)
    private int seatCapacity;

    @Column(nullable = false)
    private boolean verified;
}
