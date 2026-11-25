package com.zevora.corporate;

import com.zevora.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "company_shuttles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyShuttle extends BaseEntity {
    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "route_name", length = 150)
    private String routeName;

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
