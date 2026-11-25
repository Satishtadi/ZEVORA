package com.zevora.user;

import com.zevora.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfile extends BaseEntity {
    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "home_address", length = 255)
    private String homeAddress;
    @Column(name = "home_lat")
    private Double homeLat;
    @Column(name = "home_lng")
    private Double homeLng;

    @Column(name = "work_address", length = 255)
    private String workAddress;
    @Column(name = "work_lat")
    private Double workLat;
    @Column(name = "work_lng")
    private Double workLng;

    @Column(name = "women_only", nullable = false)
    private boolean womenOnly;

    @Column(name = "emergency_contact_name", length = 120)
    private String emergencyContactName;
    @Column(name = "emergency_contact_phone", length = 20)
    private String emergencyContactPhone;
}
