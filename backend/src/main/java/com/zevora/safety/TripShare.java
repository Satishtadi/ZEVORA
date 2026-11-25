package com.zevora.safety;

import com.zevora.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "trip_shares")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripShare extends BaseEntity {
    @Column(name = "booking_id", nullable = false)
    private UUID bookingId;

    @Column(nullable = false, unique = true, length = 80)
    private String token;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;
}
