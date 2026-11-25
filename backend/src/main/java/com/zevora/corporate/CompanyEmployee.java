package com.zevora.corporate;

import com.zevora.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "company_employees", uniqueConstraints = @UniqueConstraint(columnNames = {"company_id", "user_id"}))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyEmployee extends BaseEntity {
    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "employee_code", length = 40)
    private String employeeCode;

    @Column(length = 80)
    private String department;

    @Column(name = "office_address", length = 255)
    private String officeAddress;

    @Column(name = "office_lat")
    private Double officeLat;

    @Column(name = "office_lng")
    private Double officeLng;

    @Column(nullable = false)
    private boolean verified;
}
