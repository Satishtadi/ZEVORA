package com.zevora.auth;

import com.zevora.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthDtos.TokenResponse register(@Valid @RequestBody AuthDtos.RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthDtos.TokenResponse login(@Valid @RequestBody AuthDtos.LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh-token")
    public AuthDtos.TokenResponse refresh(@Valid @RequestBody AuthDtos.RefreshRequest request) {
        return authService.refresh(request.refreshToken());
    }

    @PostMapping("/logout")
    public Map<String, String> logout(@RequestBody(required = false) AuthDtos.LogoutRequest request) {
        authService.logout(SecurityUtils.userId(), request == null ? null : request.refreshToken());
        return Map.of("message", "Signed out successfully");
    }

    @PostMapping("/request-otp")
    public AuthDtos.OtpResponse requestOtp(@Valid @RequestBody AuthDtos.OtpRequest request) {
        return authService.requestOtp(request);
    }

    @PostMapping("/verify-otp")
    public AuthDtos.OtpResponse verifyOtp(@Valid @RequestBody AuthDtos.OtpVerifyRequest request) {
        return authService.verifyOtp(request);
    }
}
