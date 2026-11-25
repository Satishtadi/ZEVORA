package com.zevora.comparison.providers;

import com.zevora.common.Enums.DataQuality;
import com.zevora.common.Enums.PricingType;
import com.zevora.common.Enums.ProviderType;
import com.zevora.common.GeoUtils;
import com.zevora.comparison.ComparisonDtos;
import com.zevora.comparison.TravelOptionProvider;
import com.zevora.pricing.PricingService;
import com.zevora.settings.SettingsService;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Component
public class IndividualRideProvider implements TravelOptionProvider {
    private final PricingService pricingService;
    private final SettingsService settings;

    public IndividualRideProvider(PricingService pricingService, SettingsService settings) {
        this.pricingService = pricingService;
        this.settings = settings;
    }

    @Override
    public List<ComparisonDtos.TravelOption> options(ComparisonDtos.Context ctx) {
        double speed = settings.getDouble("comparison.individual.speed.kmh", 20);
        int duration = GeoUtils.durationMinutes(ctx.distanceKm(), speed) + 5;
        BigDecimal autoFare = pricingService.estimateFare(PricingType.AUTO, ctx.distanceKm(), duration);
        BigDecimal cabFare = pricingService.estimateFare(PricingType.CAB, ctx.distanceKm(), duration);
        Instant arrival = ctx.departureTime().plusSeconds((long) duration * 60);

        return List.of(
                new ComparisonDtos.TravelOption("external-auto", ProviderType.AUTO,
                        "Auto rickshaw (Ola / Rapido / Uber)", autoFare, autoFare, duration, 7, 150,
                        ctx.originAddress(), ctx.destAddress(), 1, "External provider", false,
                        "Provider cancellation policy applies", "EXTERNAL", DataQuality.EXTERNAL,
                        "https://www.rapido.bike/", "Solo auto", null, 0.78, 0, false,
                        ctx.departureTime(), arrival,
                        "Estimated external fare. Book in the provider app; ZEVORA does not control availability."),
                new ComparisonDtos.TravelOption("external-cab", ProviderType.CAB,
                        "Cab (Ola / Uber)", cabFare, cabFare, duration, 6, 100,
                        ctx.originAddress(), ctx.destAddress(), 1, "External provider", false,
                        "Provider cancellation policy applies", "EXTERNAL", DataQuality.EXTERNAL,
                        "https://www.uber.com/in/en/", "Solo cab", null, 0.82, 0, false,
                        ctx.departureTime(), arrival,
                        "Estimated external fare. Open the provider app to confirm live price and availability."));
    }
}
