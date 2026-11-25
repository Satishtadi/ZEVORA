package com.zevora.safety;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TripTrackingRepository extends JpaRepository<TripTracking, UUID> {
    List<TripTracking> findByBookingIdOrderByRecordedAtAsc(UUID bookingId);
}
