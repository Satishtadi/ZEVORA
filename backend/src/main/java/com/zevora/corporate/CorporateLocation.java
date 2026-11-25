package com.zevora.corporate;

import com.zevora.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "corporate_locations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CorporateLocation extends BaseEntity {
    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 255)
    private String address;

    private Double latitude;
    private Double longitude;
}
