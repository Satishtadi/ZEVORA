package com.zevora.corporate;

import com.zevora.common.BaseEntity;
import com.zevora.common.Enums.CompanyStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "companies")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Company extends BaseEntity {
    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, unique = true, length = 120)
    private String domain;

    @Column(name = "contact_email", length = 180)
    private String contactEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CompanyStatus status;
}
