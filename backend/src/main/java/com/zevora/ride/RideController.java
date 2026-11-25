package com.zevora.ride;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rides")
public class RideController {
    private final RideService rideService;

    public RideController(RideService rideService) {
        this.rideService = rideService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RideDtos.RideResponse create(@Valid @RequestBody RideDtos.CreateRideRequest request) {
        return rideService.create(request);
    }

    @GetMapping("/search")
    public List<RideDtos.SearchResult> search(@RequestParam double originLat,
                                              @RequestParam double originLng,
                                              @RequestParam double destLat,
                                              @RequestParam double destLng,
                                              @RequestParam Instant departureTime,
                                              @RequestParam(defaultValue = "1") int seats,
                                              @RequestParam(defaultValue = "false") boolean womenOnly) {
        return rideService.search(originLat, originLng, destLat, destLng, departureTime, seats, womenOnly);
    }

    @GetMapping("/mine")
    public List<RideDtos.RideResponse> mine() {
        return rideService.mine();
    }

    @GetMapping("/{id}")
    public RideDtos.RideResponse get(@PathVariable UUID id) {
        return rideService.get(id);
    }

    @PutMapping("/{id}")
    public RideDtos.RideResponse update(@PathVariable UUID id,
                                        @Valid @RequestBody RideDtos.CreateRideRequest request) {
        return rideService.update(id, request);
    }

    @PostMapping("/{id}/publish")
    public RideDtos.RideResponse publish(@PathVariable UUID id) {
        return rideService.publish(id);
    }

    @PostMapping("/{id}/cancel")
    public Map<String, Object> cancel(@PathVariable UUID id,
                                      @RequestBody(required = false) RideDtos.CancelRideRequest request) {
        rideService.cancelRide(id, request == null ? null : request.reason());
        return Map.of("message", "Ride cancelled. Affected passengers were notified and refunds processed per policy.");
    }

    @PostMapping("/{id}/complete")
    public Map<String, Object> complete(@PathVariable UUID id) {
        rideService.completeRide(id);
        return Map.of("message", "Ride completed");
    }

    @PostMapping("/{id}/recurrence")
    public RideDtos.RecurrenceResponse recurrence(@PathVariable UUID id,
                                                  @Valid @RequestBody RideDtos.RecurrenceRequest request) {
        return rideService.createRecurrence(id, request);
    }

    @GetMapping("/{id}/recurrence")
    public RideDtos.RecurrenceResponse recurrence(@PathVariable UUID id) {
        return rideService.recurrence(id);
    }
}
