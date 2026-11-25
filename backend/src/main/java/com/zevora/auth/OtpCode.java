package com.zevora.auth;

import com.zevora.common.BaseEntity;
import com.zevora.common.Enums.OtpPurpose;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "otp_codes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpCode extends BaseEntity {
    @Column(nullable = false, length = 20)
    private String phone;

    @Column(name = "code_hash", nullable = false, length = 128)
    private String codeHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OtpPurpose purpose;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean consumed;
}
