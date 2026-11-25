package com.zevora.comparison.providers;

import com.zevora.common.Enums.DataQuality;
import com.zevora.common.Enums.ProviderType;
import com.zevora.common.GeoUtils;
import com.zevora.comparison.ComparisonDtos;
import com.zevora.comparison.TravelOptionProvider;
import com.zevora.settings.SettingsService;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Component
public class PublicTransportProvider implements TravelOptionProvider {
    private final SettingsService settings;

    public PublicTransportProvider(SettingsService settings) {
        this.settings = settings;
    }

    @Override
    public List<ComparisonDtos.TravelOption> options(ComparisonDtos.Context ctx) {
        double km = Math.max(1, ctx.distanceKm());
        int busFare = km <= 3 ? settings.getInt("comparison.bus.fare.short", 10)
                : km <= 8 ? settings.getInt("comparison.bus.fare.medium", 25)
                : settings.getInt("comparison.bus.fare.long", 35);
        int metroFare = (int) Math.min(60, Math.round(settings.getDouble("comparison.metro.base.fare", 15)
                + km * settings.getDouble("comparison.metro.per.km", 2)));
        int busDuration = GeoUtils.durationMinutes(km, 16) + 12;
        int metroDuration = GeoUtils.durationMinutes(km, 28) + 15;

        return List.of(
                new ComparisonDtos.TravelOption("public-bus", ProviderType.PUBLIC_BUS,
                        "TGSRTC Bus", BigDecimal.valueOf(busFare), BigDecimal.valueOf(busFare),
                        busDuration, 8, 600, "Nearest bus stop", "Nearest stop to destination",
                        0, "Telangana State Road Transport Corporation", false,
                        "Public transport cancellation rules apply", "EXTERNAL", DataQuality.ESTIMATED,
                        "https://www.tsrtconline.in/", "City ordinary / metro express", null,
                        0.80, 0, false, ctx.departureTime(),
                        ctx.departureTime().plusSeconds((long) busDuration * 60),
                        "Estimated fare and frequency. Confirm live bus timings with TGSRTC."),
                new ComparisonDtos.TravelOption("metro-feeder", ProviderType.METRO_FEEDER,
                        "Hyderabad Metro + Feeder", BigDecimal.valueOf(metroFare), BigDecimal.valueOf(metroFare),
                        metroDuration, 10, 450, "Nearest metro station", "Metro station near destination",
                        0, "L&T Metro Rail Hyderabad", false,
                        "Metro ticket rules apply", "EXTERNAL", DataQuality.ESTIMATED,
                        "https://www.ltmetro.com/", "Metro rail + last-mile feeder", null,
                        0.90, 0, false, ctx.departureTime(),
                        ctx.departureTime().plusSeconds((long) metroDuration * 60),
                        "Estimated metro fare and feeder time. Confirm schedules with L&T Metro."));
    }
}
