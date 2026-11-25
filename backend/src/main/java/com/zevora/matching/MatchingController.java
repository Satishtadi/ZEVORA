package com.zevora.matching;

import com.zevora.booking.BookingDtos;
import com.zevora.booking.BookingService;
import com.zevora.common.Enums.CommutePreference;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/matching")
public class MatchingController {
    private final MatchingService matchingService;
    private final BookingService bookingService;

    public MatchingController(MatchingService matchingService, BookingService bookingService) {
        this.matchingService = matchingService;
        this.bookingService = bookingService;
    }

    @PostMapping("/search")
    public List<MatchingDtos.MatchResult> search(@Valid @RequestBody MatchingDtos.SearchRequest request) {
        return matchingService.search(request);
    }

    @GetMapping("/results")
    public List<MatchingDtos.MatchResult> results(@RequestParam double originLat,
                                                  @RequestParam double originLng,
                                                  @RequestParam double destLat,
                                                  @RequestParam double destLng,
                                                  @RequestParam Instant departureTime,
                                                  @RequestParam(defaultValue = "1") int seats,
                                                  @RequestParam(defaultValue = "false") boolean womenOnly,
                                                  @RequestParam(required = false) CommutePreference preference) {
        return matchingService.search(new MatchingDtos.SearchRequest(originLat, originLng, destLat, destLng,
                departureTime, seats, womenOnly, preference));
    }

    @PostMapping("/{rideId}/accept")
    public BookingDtos.BookingResponse accept(@PathVariable java.util.UUID rideId,
                                              @Valid @RequestBody MatchingDtos.AcceptRequest request) {
        return bookingService.book(new BookingDtos.CreateBookingRequest(rideId, request.seats(), request.idempotencyKey()));
    }
}
