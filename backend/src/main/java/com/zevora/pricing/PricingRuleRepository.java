package com.zevora.pricing;

import com.zevora.common.Enums.PricingType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PricingRuleRepository extends JpaRepository<PricingRule, UUID> {
    Optional<PricingRule> findByCode(String code);
    List<PricingRule> findByTypeAndActiveTrue(PricingType type);
    List<PricingRule> findByActiveTrue();
}
