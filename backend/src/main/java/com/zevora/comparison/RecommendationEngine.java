package com.zevora.comparison;

import com.zevora.common.Enums.CommutePreference;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@Component
public class RecommendationEngine {

    public List<ComparisonDtos.TravelOption> score(List<ComparisonDtos.TravelOption> options,
                                                   CommutePreference preference) {
        if (options.isEmpty()) return options;
        double minFare = options.stream().map(o -> o.farePerPassenger().doubleValue()).min(Double::compareTo).orElse(0d);
        double maxFare = options.stream().map(o -> o.farePerPassenger().doubleValue()).max(Double::compareTo).orElse(1d);
        double minDur = options.stream().mapToInt(ComparisonDtos.TravelOption::durationMinutes).min().orElse(0);
        double maxDur = options.stream().mapToInt(ComparisonDtos.TravelOption::durationMinutes).max().orElse(1);
        double maxWalk = options.stream().mapToInt(ComparisonDtos.TravelOption::walkingDistanceMeters).max().orElse(1);

        CommutePreference pref = preference == null ? CommutePreference.BALANCED : preference;
        double wCost, wTime, wWalk, wRel;
        switch (pref) {
            case CHEAPEST -> { wCost = 0.60; wTime = 0.15; wWalk = 0.10; wRel = 0.15; }
            case FASTEST -> { wCost = 0.15; wTime = 0.60; wWalk = 0.10; wRel = 0.15; }
            case MOST_RELIABLE -> { wCost = 0.15; wTime = 0.15; wWalk = 0.10; wRel = 0.60; }
            default -> { wCost = 0.35; wTime = 0.30; wWalk = 0.15; wRel = 0.20; }
        }

        List<ComparisonDtos.TravelOption> scored = options.stream().map(o -> {
            double costScore = invert(o.farePerPassenger().doubleValue(), minFare, maxFare);
            double timeScore = invert(o.durationMinutes(), minDur, maxDur);
            double walkScore = maxWalk <= 0 ? 1 : 1 - (double) o.walkingDistanceMeters() / maxWalk;
            double reliability = Math.max(0, Math.min(1, o.reliability()));
            double total = (costScore * wCost + timeScore * wTime + walkScore * wWalk
                    + reliability * wRel) * 100;
            return o.scored(Math.round(total * 100.0) / 100.0, false);
        }).toList();

        ComparisonDtos.TravelOption best = scored.stream()
                .max(Comparator.comparingDouble(ComparisonDtos.TravelOption::valueScore))
                .orElse(null);
        if (best == null) return scored;
        return scored.stream()
                .map(o -> o.key().equals(best.key()) ? o.scored(o.valueScore(), true) : o)
                .sorted(Comparator.comparing(ComparisonDtos.TravelOption::recommended).reversed()
                        .thenComparing(Comparator.comparingDouble(ComparisonDtos.TravelOption::valueScore).reversed()))
                .toList();
    }

    private double invert(double value, double min, double max) {
        if (max - min < 0.0001) return 1;
        return 1 - (value - min) / (max - min);
    }

    public static BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
