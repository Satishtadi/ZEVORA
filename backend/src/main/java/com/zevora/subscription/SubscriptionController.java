package com.zevora.subscription;

import com.zevora.common.Enums.SubscriptionPlan;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/subscriptions")
public class SubscriptionController {
    private final SubscriptionService service;

    public SubscriptionController(SubscriptionService service) {
        this.service = service;
    }

    public record SubscribeRequest(@NotNull SubscriptionPlan plan) {}

    @PostMapping
    public Subscription subscribe(@RequestBody SubscribeRequest request) {
        return service.subscribe(request.plan());
    }

    @GetMapping("/me")
    public Subscription current() {
        return service.current();
    }

    @GetMapping
    public List<Subscription> history() {
        return service.history();
    }

    @PostMapping("/cancel")
    public Map<String, String> cancel() {
        service.cancel();
        return Map.of("message", "Subscription cancelled");
    }
}
