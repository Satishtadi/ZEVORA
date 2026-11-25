package com.zevora.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zevora.common.ApiError;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitFilter extends OncePerRequestFilter {
    private static final int LIMIT = 30;
    private static final long WINDOW_MS = 60_000;

    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    public RateLimitFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    private static final class Window {
        final AtomicInteger count = new AtomicInteger();
        volatile long resetAt = System.currentTimeMillis() + WINDOW_MS;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (!request.getRequestURI().startsWith("/api/v1/auth/")) {
            chain.doFilter(request, response);
            return;
        }
        String key = request.getRemoteAddr() + ":" + request.getRequestURI();
        long now = System.currentTimeMillis();
        Window window = windows.compute(key, (k, w) -> {
            if (w == null || now > w.resetAt) {
                return new Window();
            }
            return w;
        });
        if (window.count.incrementAndGet() > LIMIT) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            ApiError error = new ApiError(Instant.now(), 429, "RATE_LIMITED",
                    "Too many attempts. Please wait a minute and try again.", request.getRequestURI(), null);
            objectMapper.writeValue(response.getOutputStream(), error);
            return;
        }
        chain.doFilter(request, response);
    }
}
