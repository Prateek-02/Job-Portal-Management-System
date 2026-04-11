package com.jobportal.authservice.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class JwtUtilTest {

    private final JwtUtil jwtUtil = new JwtUtil();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(jwtUtil, "jwtSecret", "ThisIsAVerySecretKeyForTestingPurposes12345");
        ReflectionTestUtils.setField(jwtUtil, "jwtExpiration", 3600000L); // 1 hour
        ReflectionTestUtils.setField(jwtUtil, "jwtRefreshExpiration", 86400000L); // 24 hours
    }

    @Test
    void generateToken_AndValidation_Success() {
        String email = "test@example.com";
        String token = jwtUtil.generateToken(email, 1L, "USER");

        assertThat(token).isNotNull();
        assertThat(jwtUtil.extractEmail(token)).isEqualTo(email);
        assertThat(jwtUtil.validateToken(token, email)).isTrue();
    }

    @Test
    void generateRefreshToken_Success() {
        String email = "test@example.com";
        String token = jwtUtil.generateRefreshToken(email);

        assertThat(token).isNotNull();
        assertThat(jwtUtil.extractEmail(token)).isEqualTo(email);
    }

    @Test
    void validateToken_WrongEmail_ReturnsFalse() {
        String email = "test@example.com";
        String token = jwtUtil.generateToken(email, 1L, "USER");

        assertThat(jwtUtil.validateToken(token, "wrong@example.com")).isFalse();
    }

    @Test
    void validateToken_NullEmail_ReturnsFalse() {
        String token = jwtUtil.generateToken("test@example.com", 1L, "USER");
        assertThat(jwtUtil.validateToken(token, null)).isFalse();
    }

    @Test
    void extractEmail_InvalidToken_ReturnsNull() {
        assertThat(jwtUtil.extractEmail("invalid-token")).isNull();
    }

    @Test
    void validateToken_InvalidToken_ReturnsFalse() {
        assertThat(jwtUtil.validateToken("invalid-token", "test@example.com")).isFalse();
    }

    @Test
    void isTokenExpired_ReturnsTrue_AfterExpiration() {
        ReflectionTestUtils.setField(jwtUtil, "jwtExpiration", -100L); // Set negative expiration
        String token = jwtUtil.generateToken("test@example.com", 1L, "USER");
        
        assertThat(jwtUtil.validateToken(token, "test@example.com")).isFalse();
    }
}
