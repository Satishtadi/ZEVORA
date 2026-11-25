package com.zevora.auth;

import com.zevora.common.Enums.OtpPurpose;
import com.zevora.common.Enums.Role;
import com.zevora.user.User;
import jakarta.validation.constraints.*;

import java.util.UUID;

public final class AuthDtos {
    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank @Size(min = 2, max = 120) String fullName,
            @NotBlank @Email @Size(max = 180) String email,
            @NotBlank @Pattern(regexp = "^(\\+91)?[6-9]\\d{9}$", message = "Enter a valid Indian mobile number") String phone,
            @NotBlank @Size(min = 8, max = 72, message = "Password must be 8-72 characters") String password
    ) {}

    public record LoginRequest(
            @NotBlank String identifier,
            @NotBlank String password
    ) {}

    public record RefreshRequest(@NotBlank String refreshToken) {}

    public record LogoutRequest(String refreshToken) {}

    public record OtpRequest(
            @NotBlank @Pattern(regexp = "^(\\+91)?[6-9]\\d{9}$", message = "Enter a valid Indian mobile number") String phone,
            @NotNull OtpPurpose purpose
    ) {}

    public record OtpVerifyRequest(
            @NotBlank String phone,
            @NotBlank @Pattern(regexp = "\\d{6}", message = "OTP must be 6 digits") String code,
            @NotNull OtpPurpose purpose
    ) {}

    public record OtpResponse(String message, String devCode) {}

    public record UserSummary(UUID id, String fullName, String email, String phone, Role role) {
        public static UserSummary from(User u) {
            return new UserSummary(u.getId(), u.getFullName(), u.getEmail(), u.getPhone(), u.getRole());
        }
    }

    public record TokenResponse(String accessToken, String refreshToken, String tokenType,
                                long expiresInSeconds, UserSummary user) {}
}
