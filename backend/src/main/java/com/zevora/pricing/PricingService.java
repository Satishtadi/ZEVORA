package com.zevora.pricing;

import com.zevora.common.ApiException;
import com.zevora.common.Enums.PricingType;
import com.zevora.settings.SettingsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
public class PricingService {
    private final PricingRuleRepository repository;
    private final SettingsService settings;

    public PricingService(PricingRuleRepository repository, SettingsService settings) {
        this.repository = repository;
        this.settings = settings;
    }

    @Transactional(readOnly = true)
    public BigDecimal estimateFare(PricingType type, double distanceKm, int durationMinutes) {
        PricingRule rule = repository.findByTypeAndActiveTrue(type).stream().findFirst()
                .orElseThrow(() -> ApiException.notFound("PRICING_RULE_MISSING",
                        "No active pricing rule configured for " + type));
        BigDecimal fare = rule.getBaseFare()
                .add(rule.getPerKm().multiply(BigDecimal.valueOf(distanceKm)))
                .add(rule.getPerMinute().multiply(BigDecimal.valueOf(durationMinutes)));
        if (rule.getMinFare() != null && fare.compareTo(rule.getMinFare()) < 0) {
            fare = rule.getMinFare();
        }
        return fare.setScale(2, RoundingMode.HALF_UP);
    }

    @Transactional(readOnly = true)
    public double costSharePerPassenger(double distanceKm, int passengers) {
        double fuelPerKm = settings.getDouble("pricing.fuel.cost.per.km", 7.5);
        double tollAndParking = 0;
        return Math.max(0, (fuelPerKm * distanceKm + tollAndParking) / Math.max(1, passengers));
    }

    @Transactional(readOnly = true)
    public List<PricingRule> all() {
        return repository.findAll();
    }

    @Transactional
    public PricingRule update(UUID id, PricingRule update) {
        PricingRule rule = repository.findById(id)
                .orElseThrow(() -> ApiException.notFound("PRICING_RULE_NOT_FOUND", "Pricing rule not found"));
        rule.setName(update.getName());
        rule.setBaseFare(update.getBaseFare());
        rule.setPerKm(update.getPerKm());
        rule.setPerMinute(update.getPerMinute());
        rule.setPlatformFeePct(update.getPlatformFeePct());
        rule.setMinFare(update.getMinFare());
        rule.setActive(update.isActive());
        return repository.save(rule);
    }
}
