package com.jobportal.apigateway.controller;

import com.jobportal.apigateway.ratelimit.RateLimitingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Rate Limiting Admin Controller
 * Provides endpoints to manage rate limiting
 * Reset rate limits, check status, etc.
 */
@Slf4j
@RestController
@RequestMapping("/api/gateway/ratelimit")
@RequiredArgsConstructor
public class RateLimitingAdminController {

    private final RateLimitingService rateLimitingService;

    /**
     * Reset rate limit for a specific user
     * Only accessible by admin
     */
    @DeleteMapping("/user/{userId}")
    public ResponseEntity<Map<String, String>> resetUserRateLimit(@PathVariable Long userId) {
        try {
            rateLimitingService.resetUserRateLimit(userId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Rate limit reset for user: " + userId);
            response.put("status", "success");
            
            log.info("Rate limit reset for user | userId: {}", userId);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error resetting rate limit for user | userId: {}", userId, e);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Error resetting rate limit: " + e.getMessage());
            response.put("status", "error");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Reset rate limit for a specific IP address
     * Only accessible by admin
     */
    @DeleteMapping("/ip/{ipAddress}")
    public ResponseEntity<Map<String, String>> resetIpRateLimit(@PathVariable String ipAddress) {
        try {
            rateLimitingService.resetIpRateLimit(ipAddress);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Rate limit reset for IP: " + ipAddress);
            response.put("status", "success");
            
            log.info("Rate limit reset for IP | ip: {}", ipAddress);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error resetting rate limit for IP | ip: {}", ipAddress, e);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Error resetting rate limit: " + e.getMessage());
            response.put("status", "error");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Reset rate limit for a specific API key
     * Only accessible by admin
     */
    @DeleteMapping("/apikey/{apiKey}")
    public ResponseEntity<Map<String, String>> resetApiKeyRateLimit(@PathVariable String apiKey) {
        try {
            rateLimitingService.resetApiKeyRateLimit(apiKey);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Rate limit reset for API Key: " + apiKey);
            response.put("status", "success");
            
            log.info("Rate limit reset for API key | apiKey: {}", apiKey);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error resetting rate limit for API key | apiKey: {}", apiKey, e);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Error resetting rate limit: " + e.getMessage());
            response.put("status", "error");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "up");
        response.put("message", "Rate limiting service is running");
        return ResponseEntity.ok(response);
    }
}
