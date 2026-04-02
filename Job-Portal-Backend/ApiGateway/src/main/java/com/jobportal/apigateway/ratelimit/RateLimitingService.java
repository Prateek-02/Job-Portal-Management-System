package com.jobportal.apigateway.ratelimit;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * Rate Limiting Service
 * Handles rate limiting logic using Redis as the counter store
 * Supports limiting by:
 * - User ID
 * - IP Address
 * - API Key
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimitingService {
    
    private final RedisTemplate<String, Object> redisTemplate;
    
    // Default rate limit config: 100 requests per 60 seconds
    private static final int DEFAULT_MAX_REQUESTS = 100;
    private static final int DEFAULT_TIME_WINDOW = 60;
    
    // Redis key prefixes
    private static final String USER_RATE_LIMIT_PREFIX = "ratelimit:user:";
    private static final String IP_RATE_LIMIT_PREFIX = "ratelimit:ip:";
    private static final String APIKEY_RATE_LIMIT_PREFIX = "ratelimit:apikey:";
    
    /**
     * Check rate limit for user
     */
    public RateLimitStatus checkUserRateLimit(Long userId) {
        return checkUserRateLimit(userId, DEFAULT_MAX_REQUESTS, DEFAULT_TIME_WINDOW);
    }
    
    /**
     * Check rate limit for user with custom limits
     */
    public RateLimitStatus checkUserRateLimit(Long userId, int maxRequests, int timeWindowSeconds) {
        String key = USER_RATE_LIMIT_PREFIX + userId;
        return checkRateLimit(key, maxRequests, timeWindowSeconds);
    }
    
    /**
     * Check rate limit for IP address
     */
    public RateLimitStatus checkIpRateLimit(String ipAddress) {
        return checkIpRateLimit(ipAddress, DEFAULT_MAX_REQUESTS, DEFAULT_TIME_WINDOW);
    }
    
    /**
     * Check rate limit for IP address with custom limits
     */
    public RateLimitStatus checkIpRateLimit(String ipAddress, int maxRequests, int timeWindowSeconds) {
        String key = IP_RATE_LIMIT_PREFIX + ipAddress;
        return checkRateLimit(key, maxRequests, timeWindowSeconds);
    }
    
    /**
     * Check rate limit for API key
     */
    public RateLimitStatus checkApiKeyRateLimit(String apiKey) {
        return checkApiKeyRateLimit(apiKey, DEFAULT_MAX_REQUESTS, DEFAULT_TIME_WINDOW);
    }
    
    /**
     * Check rate limit for API key with custom limits
     */
    public RateLimitStatus checkApiKeyRateLimit(String apiKey, int maxRequests, int timeWindowSeconds) {
        String key = APIKEY_RATE_LIMIT_PREFIX + apiKey;
        return checkRateLimit(key, maxRequests, timeWindowSeconds);
    }
    
    /**
     * Core rate limiting logic using Token Bucket Algorithm
     * Stores a counter in Redis with TTL
     */
    private RateLimitStatus checkRateLimit(String key, int maxRequests, int timeWindowSeconds) {
        try {
            // Get current count from Redis
            // Redis may deserialize small integers as Integer even if stored as Long,
            // so we use Number as the safe common supertype before calling longValue()
            Object rawCount = redisTemplate.opsForValue().get(key);
            Long currentCount = rawCount == null ? null : ((Number) rawCount).longValue();
            
            if (currentCount == null) {
                // First request in the window - set counter to 1 with TTL
                redisTemplate.opsForValue().set(key, 1L, timeWindowSeconds, TimeUnit.SECONDS);
                long resetTime = System.currentTimeMillis() + (timeWindowSeconds * 1000L);
                
                log.debug("Rate limit initialized | key: {} | maxRequests: {} | timeWindow: {}s",
                        key, maxRequests, timeWindowSeconds);
                
                return RateLimitStatus.allowed(1, maxRequests, resetTime);
            }
            
            // Increment the counter
            currentCount = redisTemplate.opsForValue().increment(key);
            Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
            long resetTime = System.currentTimeMillis() + (ttl * 1000L);
            
            if (currentCount > maxRequests) {
                log.warn("Rate limit exceeded | key: {} | currentCount: {} | maxAllowed: {}",
                        key, currentCount, maxRequests);
                
                return RateLimitStatus.denied(currentCount, maxRequests, resetTime);
            }
            
            log.debug("Request allowed | key: {} | count: {}/{} | remaining: {}",
                    key, currentCount, maxRequests, (maxRequests - currentCount));
            
            return RateLimitStatus.allowed(currentCount, maxRequests, resetTime);
            
        } catch (Exception e) {
            log.error("Error checking rate limit | key: {}", key, e);
            // On error, allow the request (fail open - don't block traffic due to Redis issues)
            return RateLimitStatus.allowed(0, maxRequests, System.currentTimeMillis() + 60000);
        }
    }
    
    /**
     * Reset rate limit counter for a key
     */
    public void resetRateLimit(String key) {
        redisTemplate.delete(key);
        log.debug("Rate limit reset | key: {}", key);
    }
    
    /**
     * Reset rate limit for user
     */
    public void resetUserRateLimit(Long userId) {
        resetRateLimit(USER_RATE_LIMIT_PREFIX + userId);
    }
    
    /**
     * Reset rate limit for IP
     */
    public void resetIpRateLimit(String ipAddress) {
        resetRateLimit(IP_RATE_LIMIT_PREFIX + ipAddress);
    }
    
    /**
     * Reset rate limit for API key
     */
    public void resetApiKeyRateLimit(String apiKey) {
        resetRateLimit(APIKEY_RATE_LIMIT_PREFIX + apiKey);
    }
}
