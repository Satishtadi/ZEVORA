package com.zevora.booking;

import com.zevora.common.Enums.BookingStatus;
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

public interface BookingRepository extends JpaRepository<Booking, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Booking b where b.id = :id")
    Optional<Booking> findByIdForUpdate(@Param("id") UUID id);

    Optional<Booking> findByIdempotencyKey(String idempotencyKey);

    Page<Booking> findByPassengerIdOrderByCreatedAtDesc(UUID passengerId, Pageable pageable);

    List<Booking> findByRideIdOrderByCreatedAtAsc(UUID rideId);

    List<Booking> findByRideIdAndStatusIn(UUID rideId, List<BookingStatus> statuses);

    boolean existsByRideIdAndPassengerIdAndStatusIn(UUID rideId, UUID passengerId, List<BookingStatus> statuses);

    long countByStatus(BookingStatus status);

    long countByCreatedAtBetween(Instant from, Instant to);

    @Query("select b from Booking b where (:status is null or b.status = :status) order by b.createdAt desc")
    Page<Booking> searchAdmin(@Param("status") BookingStatus status, Pageable pageable);

    @Query("select b from Booking b where b.passengerId = :passengerId and b.status = com.zevora.common.Enums.BookingStatus.COMPLETED and b.createdAt between :from and :to")
    List<Booking> findCompletedForPassenger(@Param("passengerId") UUID passengerId,
                                            @Param("from") Instant from, @Param("to") Instant to);

    @Query("select b from Booking b where b.passengerId = :passengerId and b.status = com.zevora.common.Enums.BookingStatus.COMPLETED")
    Page<Booking> findCompletedForPassenger(@Param("passengerId") UUID passengerId, Pageable pageable);
}
