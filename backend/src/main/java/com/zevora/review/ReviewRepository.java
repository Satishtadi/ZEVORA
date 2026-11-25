package com.zevora.review;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {
    boolean existsByBookingIdAndFromUserId(UUID bookingId, UUID fromUserId);

    @Query("select avg(r.rating) from Review r where r.toUserId = :userId")
    Double averageRatingFor(@Param("userId") UUID userId);

    Optional<Review> findByBookingIdAndFromUserId(UUID bookingId, UUID fromUserId);
}
