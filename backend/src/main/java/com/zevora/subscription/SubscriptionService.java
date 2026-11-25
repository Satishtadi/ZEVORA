package com.zevora.subscription;

import com.zevora.common.ApiException;
import com.zevora.common.Enums.SubscriptionPlan;
import com.zevora.common.Enums.SubscriptionStatus;
import com.zevora.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class SubscriptionService {
    private final SubscriptionRepository repository;

    public SubscriptionService(SubscriptionRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public Subscription subscribe(SubscriptionPlan plan) {
        var userId = SecurityUtils.userId();
        repository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(userId, SubscriptionStatus.ACTIVE)
                .ifPresent(existing -> {
                    existing.setStatus(SubscriptionStatus.CANCELLED);
                    repository.save(existing);
                });
        BigDecimal price = plan == SubscriptionPlan.PREMIUM ? BigDecimal.valueOf(99) : BigDecimal.valueOf(49);
        return repository.save(Subscription.builder()
                .userId(userId)
                .plan(plan)
                .status(SubscriptionStatus.ACTIVE)
                .startAt(Instant.now())
                .endAt(Instant.now().plus(30, ChronoUnit.DAYS))
                .price(price)
                .build());
    }

    @Transactional(readOnly = true)
    public Subscription current() {
        return repository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(SecurityUtils.userId(), SubscriptionStatus.ACTIVE)
                .orElseThrow(() -> ApiException.notFound("NO_SUBSCRIPTION", "No active subscription"));
    }

    @Transactional(readOnly = true)
    public List<Subscription> history() {
        return repository.findByUserIdOrderByCreatedAtDesc(SecurityUtils.userId());
    }

    @Transactional
    public void cancel() {
        Subscription subscription = current();
        subscription.setStatus(SubscriptionStatus.CANCELLED);
        repository.save(subscription);
    }
}
