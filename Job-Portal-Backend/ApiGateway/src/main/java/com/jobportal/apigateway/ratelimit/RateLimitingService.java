package com.jobportal.apigateway.ratelimit;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Duration;

/**
 * Rate Limiting Service (Reactive)
 * Handles rate limiting logic using Reactive Redis as the counter store
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimitingService {
    
    private final ReactiveRedisTemplate<String, String> redisTemplate;
    
    // Redis key prefixes
    private static final String USER_RATE_LIMIT_PREFIX = "ratelimit:user:";
    private static final String IP_RATE_LIMIT_PREFIX = "ratelimit:ip:";
    private static final String APIKEY_RATE_LIMIT_PREFIX = "ratelimit:apikey:";
    
    /**
     * Check rate limit for user
     */
    public Mono<RateLimitStatus> checkUserRateLimit(Long userId, int maxRequests, int timeWindowSeconds) {
        String key = USER_RATE_LIMIT_PREFIX + userId;
        return checkRateLimit(key, maxRequests, timeWindowSeconds);
    }
    
    /**
     * Check rate limit for IP address
     */
    public Mono<RateLimitStatus> checkIpRateLimit(String ipAddress, int maxRequests, int timeWindowSeconds) {
        String key = IP_RATE_LIMIT_PREFIX + ipAddress;
        return checkRateLimit(key, maxRequests, timeWindowSeconds);
    }
    
    /**
     * Check rate limit for API key
     */
    public Mono<RateLimitStatus> checkApiKeyRateLimit(String apiKey, int maxRequests, int timeWindowSeconds) {
        String key = APIKEY_RATE_LIMIT_PREFIX + apiKey;
        return checkRateLimit(key, maxRequests, timeWindowSeconds);
    }
    
    /**
     * Core reactive rate limiting logic
     */
    private Mono<RateLimitStatus> checkRateLimit(String key, int maxRequests, int timeWindowSeconds) {
        return redisTemplate.opsForValue().increment(key)
                .flatMap(currentCount -> {
                    if (currentCount == 1) {
                        return redisTemplate.expire(key, Duration.ofSeconds(timeWindowSeconds))
                                .thenReturn(currentCount);
                    }
                    return Mono.just(currentCount);
                })
                .flatMap(currentCount -> {
                    return redisTemplate.getExpire(key)
                            .map(duration -> {
                                long resetTime = System.currentTimeMillis() + duration.toMillis();
                                if (currentCount > maxRequests) {
                                    log.warn("Rate limit exceeded | key: {} | count: {}/{}", key, currentCount, maxRequests);
                                    return RateLimitStatus.denied(currentCount, maxRequests, resetTime);
                                }
                                return RateLimitStatus.allowed(currentCount, maxRequests, resetTime);
                            });
                })
                .onErrorResume(e -> {
                    log.error("Error checking rate limit | key: {}", key, e);
                    // Fail open
                    return Mono.just(RateLimitStatus.allowed(0, maxRequests, System.currentTimeMillis() + 60000));
                });
    }
    
    /**
     * Reset rate limit for user
     */
    public Mono<Void> resetUserLimit(Long userId) {
        return redisTemplate.delete(USER_RATE_LIMIT_PREFIX + userId).then();
    }
    
    /**
     * Reset rate limit for IP
     */
    public Mono<Void> resetIpLimit(String ipAddress) {
        return redisTemplate.delete(IP_RATE_LIMIT_PREFIX + ipAddress).then();
    }
    
    /**
     * Reset rate limit for API key
     */
    public Mono<Void> resetApiKeyLimit(String apiKey) {
        return redisTemplate.delete(APIKEY_RATE_LIMIT_PREFIX + apiKey).then();
    }

    /**
     * Reset all limits
     */
    public Mono<Void> resetAllLimits() {
        return redisTemplate.keys("ratelimit:*")
                .flatMap(redisTemplate::delete)
                .then();
    }
}
