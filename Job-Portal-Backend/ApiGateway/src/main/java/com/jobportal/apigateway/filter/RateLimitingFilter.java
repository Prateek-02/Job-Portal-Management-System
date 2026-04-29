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
 * RATE LIMITING FILTER (Reactive)
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
            
            // 1. Check User ID Rate Limit
            String userId = request.getHeaders().getFirst("X-User-Id");
            if (enableUserIdLimit && userId != null && !userId.isEmpty()) {
                return rateLimitingService.checkUserRateLimit(Long.parseLong(userId), maxRequests, timeWindowSeconds)
                        .flatMap(status -> handleRateLimitStatus(exchange, chain, status, "User", userId))
                        .onErrorResume(e -> {
                            log.error("Error in User ID rate limiting check", e);
                            return chain.filter(exchange);
                        });
            }
            
            // 2. Check API Key Rate Limit
            String apiKey = request.getHeaders().getFirst("X-API-Key");
            if (enableApiKeyLimit && apiKey != null && !apiKey.isEmpty()) {
                return rateLimitingService.checkApiKeyRateLimit(apiKey, maxRequests, timeWindowSeconds)
                        .flatMap(status -> handleRateLimitStatus(exchange, chain, status, "API key", apiKey))
                        .onErrorResume(e -> {
                            log.error("Error in API Key rate limiting check", e);
                            return chain.filter(exchange);
                        });
            }
            
            // 3. Check IP Address Rate Limit
            if (enableIpLimit) {
                String clientIp = getClientIpAddress(request);
                return rateLimitingService.checkIpRateLimit(clientIp, maxRequests, timeWindowSeconds)
                        .flatMap(status -> handleRateLimitStatus(exchange, chain, status, "IP", clientIp))
                        .onErrorResume(e -> {
                            log.error("Error in IP rate limiting check", e);
                            return chain.filter(exchange);
                        });
            }
            
            return chain.filter(exchange);
        };
    }

    private Mono<Void> handleRateLimitStatus(ServerWebExchange exchange, org.springframework.cloud.gateway.filter.GatewayFilterChain chain, 
                                           RateLimitStatus status, String type, String identity) {
        if (status == null || !status.isAllowed()) {
            log.warn("{} rate limit exceeded | ID: {} | count: {}/{}", 
                type, identity, status != null ? status.getCurrentCount() : 0, status != null ? status.getMaxAllowed() : 0);
            return sendErrorResponse(exchange.getResponse(), HttpStatus.TOO_MANY_REQUESTS,
                type + " rate limit exceeded. Max " + (status != null ? status.getMaxAllowed() : 0) + " requests per " + timeWindowSeconds + " seconds");
        }
        
        addRateLimitHeaders(exchange, status);
        return chain.filter(exchange);
    }

    private String getClientIpAddress(ServerHttpRequest request) {
        String xForwardedFor = request.getHeaders().getFirst("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddress() != null ? request.getRemoteAddress().getAddress().getHostAddress() : "unknown";
    }

    private void addRateLimitHeaders(ServerWebExchange exchange, RateLimitStatus status) {
        exchange.getResponse().getHeaders().add("X-RateLimit-Limit", String.valueOf(status.getMaxAllowed()));
        exchange.getResponse().getHeaders().add("X-RateLimit-Remaining", String.valueOf(status.getRemainingRequests()));
        exchange.getResponse().getHeaders().add("X-RateLimit-Reset", String.valueOf(status.getResetTime()));
    }

    private Mono<Void> sendErrorResponse(ServerHttpResponse response, HttpStatus status, String message) {
        response.setStatusCode(status);
        response.getHeaders().add("Content-Type", "application/json");
        String errorJson = String.format("{\"status\":%d,\"message\":\"%s\",\"errorCode\":\"RATE_LIMIT_EXCEEDED\"}", status.value(), message);
        DataBuffer dataBuffer = response.bufferFactory().wrap(errorJson.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(dataBuffer));
    }

    public static class Config {}
}
