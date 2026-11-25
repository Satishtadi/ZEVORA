package com.zevora.notification;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {
    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    public List<Notification> mine() {
        return service.mine();
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unread() {
        return Map.of("count", service.unreadCount());
    }

    @PutMapping("/{id}/read")
    public Map<String, String> read(@PathVariable UUID id) {
        service.markRead(id);
        return Map.of("message", "Marked as read");
    }
}
