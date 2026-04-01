package com.jobportal.apigateway.filter;

import com.jobportal.apigateway.ratelimit.RateLimitingService;
import com.jobportal.apigateway.ratelimit.RateLimitStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

/**
 * RATE LIMITING FILTER
 * --------------------
 * This filter applies rate limiting to requests based on:
 * - User ID (if authenticated)
 * - IP Address
 * - API Key (if provided)
 *
 * Uses Redis to store request counters with configurable limits per time window
 */
@Slf4j
@Component
public class RateLimitingFilter extends AbstractGatewayFilterFactory<RateLimitingFilter.Config> {

    private final RateLimitingService rateLimitingService;

    @Value("${ratelimit.enabled:true}")
    private boolean rateLimitEnabled;

    @Value("${ratelimit.max-requests:100}")
    private int maxRequests;

    @Value("${ratelimit.time-window-seconds:60}")
    private int timeWindowSeconds;

    @Value("${ratelimit.enable-user-limit:true}")
    private boolean enableUserIdLimit;

    @Value("${ratelimit.enable-ip-limit:true}")
    private boolean enableIpLimit;

    @Value("${ratelimit.enable-apikey-limit:true}")
    private boolean enableApiKeyLimit;

    public RateLimitingFilter(RateLimitingService rateLimitingService) {
        super(Config.class);
        this.rateLimitingService = rateLimitingService;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {

            if (!rateLimitEnabled) {
                return chain.filter(exchange);
            }

            ServerHttpRequest request = exchange.getRequest();
            ServerHttpResponse response = exchange.getResponse();

            try {
                // Check rate limits in order: User ID > API Key > IP Address
                
                // 1. Check User ID Rate Limit (if user is authenticated)
                if (enableUserIdLimit) {
                    String userId = request.getHeaders().getFirst("X-User-Id");
                    if (userId != null && !userId.isEmpty()) {
                        RateLimitStatus status = rateLimitingService.checkUserRateLimit(
                                Long.parseLong(userId), maxRequests, timeWindowSeconds);
                        
                        if (!status.isAllowed()) {
                            log.warn("User rate limit exceeded | userId: {} | count: {}/{}",
                                    userId, status.getCurrentCount(), status.getMaxAllowed());
                            return sendErrorResponse(response, HttpStatus.TOO_MANY_REQUESTS,
                                    "User rate limit exceeded. Max " + maxRequests + " requests per " + 
                                    timeWindowSeconds + " seconds");
                        }
                        
                        // Add rate limit headers
                        addRateLimitHeaders(exchange, status);
                        return chain.filter(exchange);
                    }
                }
                
                // 2. Check API Key Rate Limit (if API key is provided)
                if (enableApiKeyLimit) {
                    String apiKey = request.getHeaders().getFirst("X-API-Key");
                    if (apiKey != null && !apiKey.isEmpty()) {
                        RateLimitStatus status = rateLimitingService.checkApiKeyRateLimit(
                                apiKey, maxRequests, timeWindowSeconds);
                        
                        if (!status.isAllowed()) {
                            log.warn("API key rate limit exceeded | apiKey: {} | count: {}/{}",
                                    apiKey, status.getCurrentCount(), status.getMaxAllowed());
                            return sendErrorResponse(response, HttpStatus.TOO_MANY_REQUESTS,
                                    "API key rate limit exceeded. Max " + maxRequests + " requests per " + 
                                    timeWindowSeconds + " seconds");
                        }
                        
                        // Add rate limit headers
                        addRateLimitHeaders(exchange, status);
                        return chain.filter(exchange);
                    }
                }
                
                // 3. Check IP Address Rate Limit (fallback - always applies)
                if (enableIpLimit) {
                    String clientIp = getClientIpAddress(request);
                    RateLimitStatus status = rateLimitingService.checkIpRateLimit(
                            clientIp, maxRequests, timeWindowSeconds);
                    
                    if (!status.isAllowed()) {
                        log.warn("IP rate limit exceeded | ip: {} | count: {}/{}",
                                clientIp, status.getCurrentCount(), status.getMaxAllowed());
                        return sendErrorResponse(response, HttpStatus.TOO_MANY_REQUESTS,
                                "IP rate limit exceeded. Max " + maxRequests + " requests per " + 
                                timeWindowSeconds + " seconds");
                    }
                    
                    // Add rate limit headers
                    addRateLimitHeaders(exchange, status);
                }
                
                return chain.filter(exchange);

            } catch (NumberFormatException e) {
                log.error("Invalid user ID format in rate limit check", e);
                return chain.filter(exchange);
            } catch (Exception e) {
                log.error("Error in rate limiting filter", e);
                // On error, allow request - fail open
                return chain.filter(exchange);
            }
        };
    }

    /**
     * Extract client IP address from request
     * Handles X-Forwarded-For header for proxied requests
     */
    private String getClientIpAddress(ServerHttpRequest request) {
        String xForwardedFor = request.getHeaders().getFirst("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // X-Forwarded-For can contain multiple IPs, take the first one
            return xForwardedFor.split(",")[0].trim();
        }
        
        String remoteAddress = request.getRemoteAddress() != null 
                ? request.getRemoteAddress().getAddress().getHostAddress() 
                : "unknown";
        
        return remoteAddress;
    }

    /**
     * Add rate limit headers to response
     */
    private void addRateLimitHeaders(ServerWebExchange exchange, RateLimitStatus status) {
        exchange.getResponse().getHeaders().add("X-RateLimit-Limit", String.valueOf(status.getMaxAllowed()));
        exchange.getResponse().getHeaders().add("X-RateLimit-Remaining", String.valueOf(status.getRemainingRequests()));
        exchange.getResponse().getHeaders().add("X-RateLimit-Reset", String.valueOf(status.getResetTime()));
    }

    /**
     * Send error response when rate limit is exceeded
     */
    private Mono<Void> sendErrorResponse(ServerHttpResponse response, HttpStatus status, String message) {
        response.setStatusCode(status);
        response.getHeaders().add("Content-Type", "application/json");
        
        String errorJson = String.format(
                "{\"status\":%d,\"message\":\"%s\",\"errorCode\":\"RATE_LIMIT_EXCEEDED\"}",
                status.value(), message
        );
        
        DataBuffer dataBuffer = response.bufferFactory().wrap(errorJson.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(dataBuffer));
    }

    /**
     * Configuration class
     */
    public static class Config {
        // Configuration options for the filter can be added here
    }
}
