package com.jobportal.apigateway.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class JwtUtilTest {

    private JwtUtil jwtUtil;
    private String secret = "abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890";
    private Key key = Keys.hmacShaKeyFor(secret.getBytes());

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "jwtSecret", secret);
    }

    private String createToken(String subject, Map<String, Object> claims, long expirationMs) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    @Test
    void validateToken_ValidToken_ReturnsTrue() {
        String token = createToken("test@test.com", new HashMap<>(), 1000 * 60);
        assertThat(jwtUtil.validateToken(token)).isTrue();
    }

    @Test
    void validateToken_ExpiredToken_ReturnsFalse() {
        String token = createToken("test@test.com", new HashMap<>(), -1000);
        assertThat(jwtUtil.validateToken(token)).isFalse();
    }

    @Test
    void validateToken_InvalidSignature_ReturnsFalse() {
        String token = Jwts.builder()
                .setSubject("test")
                .signWith(Keys.hmacShaKeyFor("different-secret-different-secret-different-secret-different-secret".getBytes()), SignatureAlgorithm.HS256)
                .compact();
        assertThat(jwtUtil.validateToken(token)).isFalse();
    }

    @Test
    void extractEmail_ReturnsSubject() {
        String token = createToken("test@test.com", new HashMap<>(), 1000 * 60);
        assertThat(jwtUtil.extractEmail(token)).isEqualTo("test@test.com");
    }

    @Test
    void extractRole_ReturnsRoleClaim() {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", "ADMIN");
        String token = createToken("test", claims, 1000 * 60);
        assertThat(jwtUtil.extractRole(token)).isEqualTo("ADMIN");
    }

    @Test
    void extractUserId_IntegerClaim_ReturnsLong() {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", 123); // Integer
        String token = createToken("test", claims, 1000 * 60);
        assertThat(jwtUtil.extractUserId(token)).isEqualTo(123L);
    }

    @Test
    void extractUserId_LongClaim_ReturnsLong() {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", 456L); // Long
        String token = createToken("test", claims, 1000 * 60);
        assertThat(jwtUtil.extractUserId(token)).isEqualTo(456L);
    }

    @Test
    void extractUserId_NullClaim_ReturnsNull() {
        String token = createToken("test", new HashMap<>(), 1000 * 60);
        assertThat(jwtUtil.extractUserId(token)).isNull();
    }
}
