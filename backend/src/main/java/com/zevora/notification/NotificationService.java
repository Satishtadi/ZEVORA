package com.zevora.notification;

import com.zevora.common.ApiException;
import com.zevora.common.Enums.NotificationType;
import com.zevora.security.SecurityUtils;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {
    private final NotificationRepository repository;

    public NotificationService(NotificationRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void notify(UUID userId, String title, String message, NotificationType type) {
        repository.save(Notification.builder()
                .userId(userId).title(title).message(message).type(type).read(false).build());
    }

    @Transactional(readOnly = true)
    public List<Notification> mine() {
        UUID userId = SecurityUtils.userId();
        return repository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 50)).getContent();
    }

    public long unreadCount() {
        return repository.countByUserIdAndReadFalse(SecurityUtils.userId());
    }

    @Transactional
    public void markRead(UUID id) {
        Notification n = repository.findById(id)
                .orElseThrow(() -> ApiException.notFound("NOTIFICATION_NOT_FOUND", "Notification not found"));
        if (!n.getUserId().equals(SecurityUtils.userId())) {
            throw ApiException.forbidden("NOT_OWNER", "This notification does not belong to you");
        }
        n.setRead(true);
        repository.save(n);
    }
}
