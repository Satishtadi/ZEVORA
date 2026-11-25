package com.zevora.payment;

import com.zevora.common.Enums.PaymentTxnStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Development payment adapter. Production must replace MockPaymentGateway with
 * a verified provider (e.g. Razorpay) and validate webhook signatures.
 */
@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;

    public PaymentService(PaymentRepository paymentRepository, RefundRepository refundRepository) {
        this.paymentRepository = paymentRepository;
        this.refundRepository = refundRepository;
    }

    @Transactional
    public Payment recordMockPayment(UUID bookingId, BigDecimal amount, String idempotencyKey) {
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            return paymentRepository.findByIdempotencyKey(idempotencyKey)
                    .orElseGet(() -> paymentRepository.save(Payment.builder()
                            .bookingId(bookingId)
                            .provider("MOCK_DEV")
                            .providerRef("mock_" + UUID.randomUUID())
                            .amount(amount)
                            .currency("INR")
                            .status(PaymentTxnStatus.SUCCESS)
                            .idempotencyKey(idempotencyKey)
                            .build()));
        }
        return paymentRepository.save(Payment.builder()
                .bookingId(bookingId)
                .provider("MOCK_DEV")
                .providerRef("mock_" + UUID.randomUUID())
                .amount(amount)
                .currency("INR")
                .status(PaymentTxnStatus.SUCCESS)
                .build());
    }

    @Transactional
    public void refund(UUID bookingId, BigDecimal amount, String reason) {
        List<Payment> payments = paymentRepository.findByBookingIdAndStatus(bookingId, PaymentTxnStatus.SUCCESS);
        BigDecimal remaining = amount;
        for (Payment payment : payments) {
            if (remaining.signum() <= 0) break;
            BigDecimal already = refundRepository.findByPaymentId(payment.getId()).stream()
                    .map(Refund::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal refundable = payment.getAmount().subtract(already);
            if (refundable.signum() <= 0) continue;
            BigDecimal part = refundable.min(remaining);
            refundRepository.save(Refund.builder()
                    .paymentId(payment.getId())
                    .amount(part)
                    .status(PaymentTxnStatus.REFUNDED)
                    .reason(reason)
                    .build());
            remaining = remaining.subtract(part);
        }
    }

    public BigDecimal totalRevenue() {
        return paymentRepository.sumSuccessfulPayments();
    }

    @Transactional(readOnly = true)
    public List<Payment> forBooking(UUID bookingId) {
        return paymentRepository.findByBookingIdOrderByCreatedAtDesc(bookingId);
    }
}
