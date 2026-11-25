package com.zevora.operator;

import com.zevora.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "operator_schedules")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperatorSchedule extends BaseEntity {
    @Column(name = "route_id", nullable = false)
    private UUID routeId;

    @Column(name = "departure_time", nullable = false)
    private LocalTime departureTime;

    @Column(name = "days_of_week", length = 30)
    private String daysOfWeek;

    @Column(name = "seat_capacity", nullable = false)
    private int seatCapacity;

    @Column(name = "available_seats", nullable = false)
    private int availableSeats;

    @Column(precision = 10, scale = 2)
    private BigDecimal fare;

    @Column(nullable = false)
    private boolean active;
}
