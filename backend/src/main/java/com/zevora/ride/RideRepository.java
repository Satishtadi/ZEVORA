package com.zevora.ride;

import com.zevora.common.Enums.RideStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RideRepository extends JpaRepository<Ride, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Ride r where r.id = :id")
    Optional<Ride> findByIdForUpdate(@Param("id") UUID id);

    @Query("""
            select r from Ride r
            where r.status = com.zevora.common.Enums.RideStatus.PUBLISHED
              and r.departureTime between :from and :to
              and r.availableSeats >= :seats
            order by r.departureTime asc
            """)
    List<Ride> findCandidates(@Param("from") Instant from, @Param("to") Instant to,
                              @Param("seats") int seats, Pageable pageable);

    Page<Ride> findByDriverId(UUID driverId, Pageable pageable);
    List<Ride> findByDriverIdAndStatusIn(UUID driverId, List<RideStatus> statuses);
    List<Ride> findByStatusAndDepartureTimeBetween(RideStatus status, Instant from, Instant to);
    long countByStatus(RideStatus status);

    @Query("select r from Ride r where (:status is null or r.status = :status) order by r.createdAt desc")
    Page<Ride> searchAdmin(@Param("status") RideStatus status, Pageable pageable);

    @Query("select r from Ride r where r.driverId = :driverId and r.departureTime >= :from and r.departureTime < :to order by r.departureTime")
    List<Ride> findDriverRidesInRange(@Param("driverId") UUID driverId,
                                      @Param("from") Instant from, @Param("to") Instant to);
}
