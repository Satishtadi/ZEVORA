package com.zevora.auth;

import com.zevora.common.Enums.OtpPurpose;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OtpCodeRepository extends JpaRepository<OtpCode, UUID> {
    Optional<OtpCode> findTopByPhoneAndPurposeAndConsumedFalseOrderByCreatedAtDesc(String phone, OtpPurpose purpose);
}
