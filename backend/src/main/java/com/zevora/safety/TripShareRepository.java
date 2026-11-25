package com.zevora.safety;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TripShareRepository extends JpaRepository<TripShare, UUID> {
    Optional<TripShare> findByToken(String token);
}
