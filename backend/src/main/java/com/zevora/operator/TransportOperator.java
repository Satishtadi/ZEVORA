package com.zevora.operator;

import com.zevora.common.BaseEntity;
import com.zevora.common.Enums.OperatorStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "transport_operators")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransportOperator extends BaseEntity {
    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "contact_email", length = 180)
    private String contactEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OperatorStatus status;

    @Column(nullable = false)
    private boolean verified;
}
