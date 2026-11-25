package com.zevora.user;

import com.zevora.common.Enums.Role;
import com.zevora.common.Enums.UserStatus;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.UUID;

public final class UserDtos {
    private UserDtos() {}

    public record ProfileResponse(
            String homeAddress, Double homeLat, Double homeLng,
            String workAddress, Double workLat, Double workLng,
            boolean womenOnly, String emergencyContactName, String emergencyContactPhone
    ) {
        public static ProfileResponse from(UserProfile p) {
            return new ProfileResponse(p.getHomeAddress(), p.getHomeLat(), p.getHomeLng(),
                    p.getWorkAddress(), p.getWorkLat(), p.getWorkLng(), p.isWomenOnly(),
                    p.getEmergencyContactName(), p.getEmergencyContactPhone());
        }
    }

    public record UpdateMeRequest(
            @Size(min = 2, max = 120) String fullName,
            @Size(max = 255) String homeAddress,
            @DecimalMin("-90.0") @DecimalMax("90.0") Double homeLat,
            @DecimalMin("-180.0") @DecimalMax("180.0") Double homeLng,
            @Size(max = 255) String workAddress,
            @DecimalMin("-90.0") @DecimalMax("90.0") Double workLat,
            @DecimalMin("-180.0") @DecimalMax("180.0") Double workLng,
            Boolean womenOnly,
            @Size(max = 120) String emergencyContactName,
            @Pattern(regexp = "^(\\+91)?[6-9]\\d{9}$", message = "Enter a valid Indian mobile number")
            String emergencyContactPhone
    ) {}

    public record MeResponse(
            UUID id, String fullName, String email, String phone,
            Role role, UserStatus status, boolean emailVerified, boolean phoneVerified,
            ProfileResponse profile, Instant createdAt
    ) {}

    public record Summary(UUID id, String fullName, String email, String phone, Role role, UserStatus status) {
        public static Summary from(User u) {
            return new Summary(u.getId(), u.getFullName(), u.getEmail(), u.getPhone(), u.getRole(), u.getStatus());
        }
    }
}
