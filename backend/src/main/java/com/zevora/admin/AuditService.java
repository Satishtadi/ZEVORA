package com.zevora.admin;

import com.zevora.common.PageResponse;
import com.zevora.security.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
public class AuditService {
    private final AuditLogRepository repository;

    public AuditService(AuditLogRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void log(String action, String entityType, String entityId, String details) {
        String ip = null;
        var attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes sra) {
            HttpServletRequest request = sra.getRequest();
            ip = request.getHeader("X-Forwarded-For");
            if (ip == null || ip.isBlank()) ip = request.getRemoteAddr();
        }
        repository.save(AuditLog.builder()
                .actorId(actorId())
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .ipAddress(ip)
                .build());
    }

    private java.util.UUID actorId() {
        try {
            return SecurityUtils.userId();
        } catch (Exception e) {
            return null;
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLog> list(int page, int size) {
        return PageResponse.from(repository.findAllByOrderByCreatedAtDesc(
                PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)))), l -> l);
    }
}
