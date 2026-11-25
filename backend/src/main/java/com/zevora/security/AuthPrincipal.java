package com.zevora.security;

import java.util.UUID;

public record AuthPrincipal(UUID userId, String email, String role) {}
