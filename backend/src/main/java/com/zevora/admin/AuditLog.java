package com.zevora.admin;

import com.zevora.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog extends BaseEntity {
    @Column(name = "actor_id")
    private UUID actorId;

    @Column(nullable = false, length = 80)
    private String action;

    @Column(name = "entity_type", length = 60)
    private String entityType;

    @Column(name = "entity_id", length = 60)
    private String entityId;

    @Column(length = 1000)
    private String details;

    @Column(name = "ip_address", length = 60)
    private String ipAddress;
}
