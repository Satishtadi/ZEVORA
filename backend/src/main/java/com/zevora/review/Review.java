package com.zevora.review;

import com.zevora.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "reviews")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Review extends BaseEntity {
    @Column(name = "booking_id", nullable = false, unique = true)
    private UUID bookingId;

    @Column(name = "from_user_id", nullable = false)
    private UUID fromUserId;

    @Column(name = "to_user_id", nullable = false)
    private UUID toUserId;

    @Column(nullable = false)
    private int rating;

    @Column(length = 500)
    private String comment;
}
