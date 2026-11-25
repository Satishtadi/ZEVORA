package com.zevora.ride;

import com.zevora.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "ride_recurrences")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RideRecurrence extends BaseEntity {
    @Column(name = "ride_id", nullable = false, unique = true)
    private UUID rideId;

    @Column(name = "days_of_week", nullable = false, length = 30)
    private String daysOfWeek;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(nullable = false)
    private boolean active;
}
