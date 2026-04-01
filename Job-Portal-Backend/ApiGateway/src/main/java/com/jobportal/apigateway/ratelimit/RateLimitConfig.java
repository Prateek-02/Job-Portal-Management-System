package com.jobportal.apigateway.ratelimit;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Rate Limit Configuration
 * Holds configuration for different types of rate limiting
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RateLimitConfig {
    // Maximum requests per time window
    private int maxRequests;
    
    // Time window in seconds
    private int timeWindowSeconds;
    
    // Enable/disable per user ID limiting
    private boolean enableUserIdLimit;
    
    // Enable/disable per IP address limiting
    private boolean enableIpLimit;
    
    // Enable/disable per API key limiting
    private boolean enableApiKeyLimit;
    
    // Default constructor with standard limits
    public static RateLimitConfig defaultConfig() {
        return new RateLimitConfig(
                100,           // 100 requests
                60,            // per 60 seconds
                true,          // enable user ID limiting
                true,          // enable IP limiting
                true           // enable API key limiting
        );
    }
    
    // Constructor for custom limits
    public static RateLimitConfig custom(int maxRequests, int timeWindowSeconds) {
        return new RateLimitConfig(
                maxRequests,
                timeWindowSeconds,
                true,
                true,
                true
        );
    }
}
