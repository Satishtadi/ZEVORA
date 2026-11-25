package com.zevora.user;

import com.zevora.common.ApiException;
import com.zevora.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;

    public UserService(UserRepository userRepository, UserProfileRepository profileRepository) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
    }

    public User requireUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND", "User not found"));
    }

    public User currentUser() {
        return requireUser(SecurityUtils.userId());
    }

    public UserProfile profileOf(UUID userId) {
        return profileRepository.findByUserId(userId)
                .orElseGet(() -> profileRepository.save(UserProfile.builder().userId(userId).build()));
    }

    @Transactional(readOnly = true)
    public UserDtos.MeResponse me() {
        User user = currentUser();
        UserProfile profile = profileOf(user.getId());
        return new UserDtos.MeResponse(user.getId(), user.getFullName(), user.getEmail(), user.getPhone(),
                user.getRole(), user.getStatus(), user.isEmailVerified(), user.isPhoneVerified(),
                UserDtos.ProfileResponse.from(profile), user.getCreatedAt());
    }

    @Transactional
    public UserDtos.MeResponse updateMe(UserDtos.UpdateMeRequest req) {
        User user = currentUser();
        if (req.fullName() != null && !req.fullName().isBlank()) {
            user.setFullName(req.fullName().trim());
        }
        UserProfile profile = profileOf(user.getId());
        if (req.homeAddress() != null) profile.setHomeAddress(req.homeAddress().trim());
        if (req.homeLat() != null) profile.setHomeLat(req.homeLat());
        if (req.homeLng() != null) profile.setHomeLng(req.homeLng());
        if (req.workAddress() != null) profile.setWorkAddress(req.workAddress().trim());
        if (req.workLat() != null) profile.setWorkLat(req.workLat());
        if (req.workLng() != null) profile.setWorkLng(req.workLng());
        if (req.womenOnly() != null) profile.setWomenOnly(req.womenOnly());
        if (req.emergencyContactName() != null) profile.setEmergencyContactName(req.emergencyContactName().trim());
        if (req.emergencyContactPhone() != null) profile.setEmergencyContactPhone(normalizePhone(req.emergencyContactPhone()));
        userRepository.save(user);
        profileRepository.save(profile);
        return me();
    }

    private String normalizePhone(String phone) {
        String p = phone.replaceAll("\\s|-", "");
        if (p.startsWith("+91")) p = p.substring(3);
        else if (p.startsWith("91") && p.length() == 12) p = p.substring(2);
        return p;
    }
}
