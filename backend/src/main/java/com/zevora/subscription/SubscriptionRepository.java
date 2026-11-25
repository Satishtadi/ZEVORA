package com.zevora.subscription;

import com.zevora.common.Enums.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
    List<Subscription> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<Subscription> findFirstByUserIdAndStatusOrderByCreatedAtDesc(UUID userId, SubscriptionStatus status);
}
