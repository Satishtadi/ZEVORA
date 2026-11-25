package com.zevora.auth;

import com.zevora.common.ApiException;
import com.zevora.common.Enums.OtpPurpose;
import com.zevora.common.Enums.Role;
import com.zevora.common.Enums.UserStatus;
import com.zevora.common.HashUtils;
import com.zevora.config.AppProperties;
import com.zevora.security.JwtService;
import com.zevora.user.User;
import com.zevora.user.UserProfile;
import com.zevora.user.UserProfileRepository;
import com.zevora.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.UUID;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final OtpCodeRepository otpCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AppProperties props;
    private final SecureRandom random = new SecureRandom();

    public AuthService(UserRepository userRepository, UserProfileRepository profileRepository,
                       RefreshTokenRepository refreshTokenRepository, OtpCodeRepository otpCodeRepository,
                       PasswordEncoder passwordEncoder, JwtService jwtService, AppProperties props) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.otpCodeRepository = otpCodeRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.props = props;
    }

    @Transactional
    public AuthDtos.TokenResponse register(AuthDtos.RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        String phone = normalizePhone(req.phone());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("EMAIL_EXISTS", "An account with this email already exists");
        }
        if (userRepository.existsByPhone(phone)) {
            throw ApiException.conflict("PHONE_EXISTS", "An account with this mobile number already exists");
        }
        User user = User.builder()
                .fullName(req.fullName().trim())
                .email(email)
                .phone(phone)
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(Role.PASSENGER)
                .status(UserStatus.ACTIVE)
                .emailVerified(false)
                .phoneVerified(false)
                .build();
        user = userRepository.save(user);
        profileRepository.save(UserProfile.builder().userId(user.getId()).build());
        return issueTokens(user);
    }

    @Transactional
    public AuthDtos.TokenResponse login(AuthDtos.LoginRequest req) {
        String identifier = req.identifier().trim();
        User user = identifier.contains("@")
                ? userRepository.findByEmailIgnoreCase(identifier).orElse(null)
                : userRepository.findByPhone(normalizePhone(identifier)).orElse(null);
        if (user == null || !passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("INVALID_CREDENTIALS", "Invalid email/mobile or password");
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw ApiException.forbidden("ACCOUNT_BLOCKED", "This account is not active. Contact support.");
        }
        return issueTokens(user);
    }

    @Transactional
    public AuthDtos.TokenResponse refresh(String refreshToken) {
        String hash = HashUtils.sha256Hex(refreshToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> ApiException.unauthorized("INVALID_REFRESH", "Invalid refresh token"));
        if (stored.isRevoked() || stored.getExpiresAt().isBefore(Instant.now())) {
            throw ApiException.unauthorized("INVALID_REFRESH", "Refresh token expired. Please sign in again.");
        }
        User user = userRepository.findById(stored.getUserId())
                .orElseThrow(() -> ApiException.unauthorized("INVALID_REFRESH", "Account no longer exists"));
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw ApiException.forbidden("ACCOUNT_BLOCKED", "This account is not active");
        }
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);
        return issueTokens(user);
    }

    @Transactional
    public void logout(UUID userId, String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) return;
        refreshTokenRepository.findByTokenHash(HashUtils.sha256Hex(refreshToken)).ifPresent(t -> {
            if (t.getUserId().equals(userId)) {
                t.setRevoked(true);
                refreshTokenRepository.save(t);
            }
        });
    }

    @Transactional
    public AuthDtos.OtpResponse requestOtp(AuthDtos.OtpRequest req) {
        String phone = normalizePhone(req.phone());
        String code = String.format("%06d", random.nextInt(1_000_000));
        otpCodeRepository.save(OtpCode.builder()
                .phone(phone)
                .codeHash(HashUtils.sha256Hex(code))
                .purpose(req.purpose())
                .expiresAt(Instant.now().plus(5, ChronoUnit.MINUTES))
                .consumed(false)
                .build());
        String devCode = props.isDevMode() ? code : null;
        return new AuthDtos.OtpResponse("OTP sent to +91 " + phone + ". It expires in 5 minutes.", devCode);
    }

    @Transactional
    public AuthDtos.OtpResponse verifyOtp(AuthDtos.OtpVerifyRequest req) {
        String phone = normalizePhone(req.phone());
        OtpCode otp = otpCodeRepository
                .findTopByPhoneAndPurposeAndConsumedFalseOrderByCreatedAtDesc(phone, req.purpose())
                .orElseThrow(() -> ApiException.badRequest("OTP_NOT_FOUND", "Request a new OTP"));
        if (otp.getExpiresAt().isBefore(Instant.now())) {
            throw ApiException.badRequest("OTP_EXPIRED", "OTP expired. Request a new one.");
        }
        if (!otp.getCodeHash().equals(HashUtils.sha256Hex(req.code()))) {
            throw ApiException.badRequest("OTP_INVALID", "Incorrect OTP");
        }
        otp.setConsumed(true);
        otpCodeRepository.save(otp);
        if (req.purpose() == OtpPurpose.VERIFY_PHONE || req.purpose() == OtpPurpose.LOGIN) {
            userRepository.findByPhone(phone).ifPresent(u -> {
                u.setPhoneVerified(true);
                userRepository.save(u);
            });
        }
        return new AuthDtos.OtpResponse("Mobile number verified successfully.", null);
    }

    private AuthDtos.TokenResponse issueTokens(User user) {
        String access = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        byte[] bytes = new byte[48];
        random.nextBytes(bytes);
        String refresh = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        refreshTokenRepository.save(RefreshToken.builder()
                .userId(user.getId())
                .tokenHash(HashUtils.sha256Hex(refresh))
                .expiresAt(Instant.now().plus(props.getRefreshTokenDays(), ChronoUnit.DAYS))
                .revoked(false)
                .build());
        return new AuthDtos.TokenResponse(access, refresh, "Bearer",
                jwtService.accessTokenSeconds(), AuthDtos.UserSummary.from(user));
    }

    private String normalizePhone(String phone) {
        String p = phone.replaceAll("\\s|-", "");
        if (p.startsWith("+91")) p = p.substring(3);
        else if (p.startsWith("91") && p.length() == 12) p = p.substring(2);
        return p;
    }
}
