package com.zevora.operator;

import com.zevora.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "operator_drivers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperatorDriver extends BaseEntity {
    @Column(name = "operator_id", nullable = false)
    private UUID operatorId;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Column(length = 20)
    private String phone;

    @Column(name = "license_number", length = 40)
    private String licenseNumber;

    @Column(nullable = false)
    private boolean verified;
}
