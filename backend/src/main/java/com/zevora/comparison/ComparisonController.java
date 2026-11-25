package com.zevora.comparison;

import com.zevora.common.Enums.CommutePreference;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;

@RestController
@RequestMapping("/api/v1/commute")
public class ComparisonController {
    private final ComparisonService comparisonService;

    public ComparisonController(ComparisonService comparisonService) {
        this.comparisonService = comparisonService;
    }

    @PostMapping("/compare")
    public ComparisonDtos.Response compare(@Valid @RequestBody ComparisonDtos.Request request) {
        return comparisonService.compare(request);
    }

    @GetMapping({"/options", "/options/public"})
    public ComparisonDtos.Response options(@RequestParam(required = false) String originAddress,
                                           @RequestParam double originLat,
                                           @RequestParam double originLng,
                                           @RequestParam(required = false) String destAddress,
                                           @RequestParam double destLat,
                                           @RequestParam double destLng,
                                           @RequestParam Instant departureTime,
                                           @RequestParam(defaultValue = "1") int seats,
                                           @RequestParam(defaultValue = "false") boolean womenOnly,
                                           @RequestParam(required = false) CommutePreference preference,
                                           @RequestParam(required = false) String sortBy,
                                           @RequestParam(required = false) String category,
                                           @RequestParam(required = false) BigDecimal maxFare) {
        ComparisonDtos.Response response = comparisonService.compare(new ComparisonDtos.Request(
                originAddress, originLat, originLng, destAddress, destLat, destLng,
                departureTime, seats, womenOnly, preference));
        var sorted = comparisonService.applySortAndFilter(response.options(), sortBy, category, maxFare);
        return new ComparisonDtos.Response(response.originAddress(), response.destAddress(),
                response.distanceKm(), response.seats(), sorted, response.recommendedOptionKey(),
                response.generatedAt(), response.disclaimer());
    }

    @GetMapping("/savings")
    public ComparisonDtos.MonthlySavingsResponse monthlySavings() {
        return comparisonService.monthlySavings();
    }

    @PostMapping("/savings")
    public ComparisonDtos.SavingsResponse savings(@Valid @RequestBody ComparisonDtos.SavingsRequest request) {
        return comparisonService.calculateSavings(request);
    }
}
