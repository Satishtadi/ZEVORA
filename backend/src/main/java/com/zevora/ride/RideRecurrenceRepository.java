package com.zevora.ride;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RideRecurrenceRepository extends JpaRepository<RideRecurrence, UUID> {
    Optional<RideRecurrence> findByRideId(UUID rideId);
}
