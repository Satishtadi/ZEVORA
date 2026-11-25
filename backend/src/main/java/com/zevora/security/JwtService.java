package com.zevora.security;

import com.zevora.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {
    private final AppProperties props;
    private final SecretKey key;

    public JwtService(AppProperties props) {
        this.props = props;
        byte[] secret = props.getJwtSecret().getBytes(StandardCharsets.UTF_8);
        if (secret.length < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 characters");
        }
        this.key = Keys.hmacShaKeyFor(secret);
    }

    public String generateAccessToken(UUID userId, String email, String role) {
        Instant now = Instant.now();
        Instant exp = now.plus(props.getAccessTokenMinutes(), ChronoUnit.MINUTES);
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("role", role)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }

    public long accessTokenSeconds() {
        return props.getAccessTokenMinutes() * 60;
    }
}
