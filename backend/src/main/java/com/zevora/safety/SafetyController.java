package com.zevora.safety;

import com.zevora.common.Enums.SafetyStatus;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class SafetyController {
    private final SafetyService safetyService;

    public SafetyController(SafetyService safetyService) {
        this.safetyService = safetyService;
    }

    @PostMapping("/safety/sos")
    public SafetyDtos.EventResponse sos(@Valid @RequestBody SafetyDtos.SosRequest request) {
        return safetyService.sos(request);
    }

    @PostMapping("/safety/report")
    public SafetyDtos.EventResponse report(@Valid @RequestBody SafetyDtos.IncidentRequest request) {
        return safetyService.report(request);
    }

    @GetMapping("/safety/events")
    public List<SafetyDtos.EventResponse> myEvents() {
        return safetyService.myEvents();
    }

    @PostMapping("/bookings/{bookingId}/share")
    public SafetyDtos.ShareResponse share(@PathVariable UUID bookingId) {
        return safetyService.share(bookingId);
    }

    @PostMapping("/trips/{bookingId}/tracking")
    public java.util.Map<String, String> ping(@PathVariable UUID bookingId,
                                              @Valid @RequestBody SafetyDtos.TrackingPingRequest request) {
        safetyService.ping(bookingId, request);
        return java.util.Map.of("message", "Location recorded");
    }

    @GetMapping("/trips/{bookingId}/tracking")
    public SafetyDtos.TrackingResponse tracking(@PathVariable UUID bookingId) {
        return safetyService.tracking(bookingId);
    }

    @GetMapping("/public/trips/{token}")
    public SafetyDtos.TrackingResponse publicTracking(@PathVariable String token) {
        return safetyService.publicTracking(token);
    }

    @PutMapping("/safety/events/{id}/status")
    public SafetyDtos.EventResponse resolve(@PathVariable UUID id, @RequestParam SafetyStatus status) {
        return safetyService.resolve(id, status.name());
    }
}
