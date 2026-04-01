package com.jobportal.apigateway.ratelimit;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Rate Limit Status
 * Contains information about the current rate limit status
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RateLimitStatus {
    private boolean allowed;
    private long currentCount;
    private long maxAllowed;
    private long remainingRequests;
    private long resetTime; // Unix timestamp when counter resets
    
    public static RateLimitStatus allowed(long currentCount, long maxAllowed, long resetTime) {
        return new RateLimitStatus(
                true,
                currentCount,
                maxAllowed,
                maxAllowed - currentCount,
                resetTime
        );
    }
    
    public static RateLimitStatus denied(long currentCount, long maxAllowed, long resetTime) {
        return new RateLimitStatus(
                false,
                currentCount,
                maxAllowed,
                0,
                resetTime
        );
    }
}
