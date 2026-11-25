package com.zevora.driver;

import com.zevora.common.Enums.DriverStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface DriverRepository extends JpaRepository<Driver, UUID> {
    Optional<Driver> findByUserId(UUID userId);
    long countByStatus(DriverStatus status);

    @Query("select d from Driver d where (:status is null or d.status = :status)")
    Page<Driver> search(@Param("status") DriverStatus status, Pageable pageable);
}
