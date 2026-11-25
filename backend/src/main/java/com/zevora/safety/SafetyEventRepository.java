package com.zevora.safety;

import com.zevora.common.Enums.SafetyStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SafetyEventRepository extends JpaRepository<SafetyEvent, UUID> {
    Page<SafetyEvent> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<SafetyEvent> findByStatusOrderByCreatedAtDesc(SafetyStatus status, Pageable pageable);
    long countByStatus(SafetyStatus status);
}
