package com.zevora.safety;

import com.zevora.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "trip_tracking")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripTracking extends BaseEntity {
    @Column(name = "booking_id", nullable = false)
    private UUID bookingId;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;
}
