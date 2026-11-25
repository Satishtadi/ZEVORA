package com.zevora.operator;

import com.zevora.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "operator_vehicles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperatorVehicle extends BaseEntity {
    @Column(name = "operator_id", nullable = false)
    private UUID operatorId;

    @Column(name = "plate_number", length = 20)
    private String plateNumber;

    @Column(length = 80)
    private String model;

    @Column(name = "seat_capacity")
    private int seatCapacity;

    @Column(nullable = false)
    private boolean verified;
}
