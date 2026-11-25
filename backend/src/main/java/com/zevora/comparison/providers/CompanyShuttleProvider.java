package com.zevora.comparison.providers;

import com.zevora.common.Enums.DataQuality;
import com.zevora.common.Enums.ProviderType;
import com.zevora.common.GeoUtils;
import com.zevora.comparison.ComparisonDtos;
import com.zevora.comparison.TravelOptionProvider;
import com.zevora.corporate.Company;
import com.zevora.corporate.CompanyRepository;
import com.zevora.corporate.CompanyShuttle;
import com.zevora.corporate.CompanyShuttleRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Component
public class CompanyShuttleProvider implements TravelOptionProvider {
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private final CompanyShuttleRepository shuttleRepository;
    private final CompanyRepository companyRepository;

    public CompanyShuttleProvider(CompanyShuttleRepository shuttleRepository, CompanyRepository companyRepository) {
        this.shuttleRepository = shuttleRepository;
        this.companyRepository = companyRepository;
    }

    @Override
    public List<ComparisonDtos.TravelOption> options(ComparisonDtos.Context ctx) {
        List<ComparisonDtos.TravelOption> options = new ArrayList<>();
        for (CompanyShuttle shuttle : shuttleRepository.findByActiveTrue()) {
            if (shuttle.getOriginLat() == null || shuttle.getDestLat() == null) continue;
            double pickupKm = GeoUtils.haversineKm(ctx.originLat(), ctx.originLng(),
                    shuttle.getOriginLat(), shuttle.getOriginLng());
            double dropKm = GeoUtils.haversineKm(ctx.destLat(), ctx.destLng(),
                    shuttle.getDestLat(), shuttle.getDestLng());
            if (pickupKm > 8 || dropKm > 8) continue;
            if (shuttle.getAvailableSeats() < ctx.seats()) continue;
            Company company = companyRepository.findById(shuttle.getCompanyId()).orElse(null);
            Instant departure = nextOccurrence(ctx.departureTime(), shuttle.getDepartureTime().getHour(),
                    shuttle.getDepartureTime().getMinute());
            int duration = GeoUtils.durationMinutes(ctx.distanceKm(), 24) + 10;
            BigDecimal fare = shuttle.getFare() == null ? BigDecimal.ZERO : shuttle.getFare();
            options.add(new ComparisonDtos.TravelOption("shuttle-" + shuttle.getId(),
                    ProviderType.COMPANY_SHUTTLE,
                    (company != null ? company.getName() : "Company") + " Shuttle",
                    fare, fare, duration, 5, 300,
                    shuttle.getOriginAddress(), shuttle.getDestAddress(),
                    shuttle.getAvailableSeats(), company != null ? company.getName() : "Corporate shuttle",
                    true, "Corporate shuttle seat rules apply", "OPERATOR",
                    DataQuality.LIVE, null, shuttle.getName(), null, 0.92, 0, false,
                    departure, departure.plusSeconds((long) duration * 60),
                    "Live seat inventory published by the corporate transport team."));
        }
        return options;
    }

    private Instant nextOccurrence(Instant notBefore, int hour, int minute) {
        var base = notBefore.atZone(IST).toLocalDate().atTime(hour, minute).atZone(IST);
        Instant candidate = base.toInstant();
        if (candidate.isBefore(notBefore)) {
            candidate = LocalDate.from(base).plusDays(1).atTime(hour, minute).atZone(IST).toInstant();
        }
        return candidate;
    }
}
