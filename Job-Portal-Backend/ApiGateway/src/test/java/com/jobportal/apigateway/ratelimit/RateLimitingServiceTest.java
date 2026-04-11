package com.jobportal.apigateway.ratelimit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.core.ReactiveValueOperations;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RateLimitingServiceTest {

    @Mock
    private ReactiveRedisTemplate<String, String> redisTemplate;

    @Mock
    private ReactiveValueOperations<String, String> valueOperations;

    @InjectMocks
    private RateLimitingService rateLimitingService;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    void checkUserRateLimit_Allowed_ReturnsStatus() {
        when(valueOperations.increment(anyString())).thenReturn(Mono.just(1L));
        when(redisTemplate.expire(anyString(), any(Duration.class))).thenReturn(Mono.just(true));
        when(redisTemplate.getExpire(anyString())).thenReturn(Mono.just(Duration.ofSeconds(60)));

        rateLimitingService.checkUserRateLimit(1L, 10, 60)
                .as(StepVerifier::create)
                .assertNext(status -> {
                    assertThat(status.isAllowed()).isTrue();
                    assertThat(status.getCurrentCount()).isEqualTo(1);
                    assertThat(status.getMaxAllowed()).isEqualTo(10);
                })
                .verifyComplete();
    }

    @Test
    void checkUserRateLimit_Denied_ReturnsStatus() {
        when(valueOperations.increment(anyString())).thenReturn(Mono.just(11L));
        when(redisTemplate.getExpire(anyString())).thenReturn(Mono.just(Duration.ofSeconds(50)));

        rateLimitingService.checkUserRateLimit(1L, 10, 60)
                .as(StepVerifier::create)
                .assertNext(status -> {
                    assertThat(status.isAllowed()).isFalse();
                    assertThat(status.getCurrentCount()).isEqualTo(11);
                })
                .verifyComplete();
    }

    @Test
    void checkIpRateLimit_Allowed_ReturnsStatus() {
        when(valueOperations.increment(anyString())).thenReturn(Mono.just(5L));
        when(redisTemplate.getExpire(anyString())).thenReturn(Mono.just(Duration.ofSeconds(60)));

        rateLimitingService.checkIpRateLimit("127.0.0.1", 100, 60)
                .as(StepVerifier::create)
                .assertNext(status -> {
                    assertThat(status.isAllowed()).isTrue();
                    assertThat(status.getCurrentCount()).isEqualTo(5);
                })
                .verifyComplete();
    }

    @Test
    void checkRateLimit_SubsequentRequest_NoExpiry() {
        // Mock currentCount = 2, so expire() should not be called
        when(valueOperations.increment(anyString())).thenReturn(Mono.just(2L));
        when(redisTemplate.getExpire(anyString())).thenReturn(Mono.just(Duration.ofSeconds(59)));

        rateLimitingService.checkUserRateLimit(1L, 10, 60)
                .as(StepVerifier::create)
                .assertNext(status -> {
                    assertThat(status.isAllowed()).isTrue();
                    assertThat(status.getCurrentCount()).isEqualTo(2);
                })
                .verifyComplete();
        
        // Verify expire was never called for this second request
        // (already implicit as we didn't mock it, but good to be explicit in thought)
    }

    @Test
    void checkApiKeyRateLimit_Allowed_ReturnsStatus() {
        when(valueOperations.increment(anyString())).thenReturn(Mono.just(1L));
        when(redisTemplate.expire(anyString(), any(Duration.class))).thenReturn(Mono.just(true));
        when(redisTemplate.getExpire(anyString())).thenReturn(Mono.just(Duration.ofSeconds(3600)));

        rateLimitingService.checkApiKeyRateLimit("api-key", 1000, 3600)
                .as(StepVerifier::create)
                .assertNext(status -> {
                    assertThat(status.isAllowed()).isTrue();
                    assertThat(status.getCurrentCount()).isEqualTo(1);
                })
                .verifyComplete();
    }

    @Test
    void checkRateLimit_RedisError_FailsOpen() {
        when(valueOperations.increment(anyString())).thenReturn(Mono.error(new RuntimeException("Redis Down")));

        rateLimitingService.checkUserRateLimit(1L, 10, 60)
                .as(StepVerifier::create)
                .assertNext(status -> {
                    assertThat(status.isAllowed()).isTrue(); // Fail open
                    assertThat(status.getCurrentCount()).isEqualTo(0);
                })
                .verifyComplete();
    }

    @Test
    void resetLimits_CallsDelete() {
        when(redisTemplate.delete(anyString())).thenReturn(Mono.just(1L));
        
        rateLimitingService.resetUserLimit(1L)
                .as(StepVerifier::create)
                .verifyComplete();
                
        rateLimitingService.resetIpLimit("127.0.0.1")
                .as(StepVerifier::create)
                .verifyComplete();
                
        rateLimitingService.resetApiKeyLimit("key")
                .as(StepVerifier::create)
                .verifyComplete();
    }

    @Test
    void resetAllLimits_CallsKeysAndDelete() {
        when(redisTemplate.keys(anyString())).thenReturn(Flux.just("k1", "k2"));
        when(redisTemplate.delete(anyString())).thenReturn(Mono.just(1L));

        rateLimitingService.resetAllLimits()
                .as(StepVerifier::create)
                .verifyComplete();
    }
}
