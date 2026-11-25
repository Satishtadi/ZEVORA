package com.zevora.security;

import com.zevora.common.ApiException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

public final class SecurityUtils {
    private SecurityUtils() {}

    public static AuthPrincipal principal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthPrincipal p)) {
            throw ApiException.unauthorized("UNAUTHORIZED", "Authentication required");
        }
        return p;
    }

    public static UUID userId() {
        return principal().userId();
    }

    public static String role() {
        return principal().role();
    }
}
