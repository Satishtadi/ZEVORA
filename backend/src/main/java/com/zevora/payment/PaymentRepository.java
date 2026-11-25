package com.zevora.payment;

import com.zevora.common.Enums.PaymentTxnStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    List<Payment> findByBookingIdOrderByCreatedAtDesc(UUID bookingId);
    List<Payment> findByBookingIdAndStatus(UUID bookingId, PaymentTxnStatus status);
    Optional<Payment> findByIdempotencyKey(String idempotencyKey);

    @Query("select coalesce(sum(p.amount), 0) from Payment p where p.status = com.zevora.common.Enums.PaymentTxnStatus.SUCCESS")
    BigDecimal sumSuccessfulPayments();

    @Query("""
            select coalesce(sum(p.amount), 0) from Payment p
            where p.status = com.zevora.common.Enums.PaymentTxnStatus.SUCCESS
              and p.createdAt between :from and :to
            """)
    BigDecimal sumSuccessfulBetween(@org.springframework.data.repository.query.Param("from") java.time.Instant from,
                                    @org.springframework.data.repository.query.Param("to") java.time.Instant to);
}
