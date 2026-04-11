package com.jobportal.apigateway.controller;

import com.jobportal.apigateway.ratelimit.RateLimitingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

/**
 * Rate Limiting Admin Controller (Reactive)
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/ratelimit")
@RequiredArgsConstructor
public class RateLimitingAdminController {

    private final RateLimitingService rateLimitingService;

    @PostMapping("/reset/user/{userId}")
    public Mono<String> resetUserLimit(@PathVariable Long userId) {
        return rateLimitingService.resetUserLimit(userId)
                .thenReturn("Rate limit reset for user: " + userId);
    }

    @PostMapping("/reset/ip")
    public Mono<String> resetIpLimit(@RequestParam String ip) {
        return rateLimitingService.resetIpLimit(ip)
                .thenReturn("Rate limit reset for IP: " + ip);
    }

    @PostMapping("/reset/apikey")
    public Mono<String> resetApiKeyLimit(@RequestParam String apiKey) {
        return rateLimitingService.resetApiKeyLimit(apiKey)
                .thenReturn("Rate limit reset for API Key: " + apiKey);
    }

    @PostMapping("/reset/all")
    public Mono<String> resetAllLimits() {
        return rateLimitingService.resetAllLimits()
                .thenReturn("All rate limits reset");
    }
}
