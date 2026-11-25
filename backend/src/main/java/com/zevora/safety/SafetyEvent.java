package com.zevora.safety;

import com.zevora.common.BaseEntity;
import com.zevora.common.Enums.SafetyStatus;
import com.zevora.common.Enums.SafetyType;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "safety_events")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SafetyEvent extends BaseEntity {
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "booking_id")
    private UUID bookingId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SafetyType type;

    private Double latitude;
    private Double longitude;

    @Column(length = 500)
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SafetyStatus status;
}
