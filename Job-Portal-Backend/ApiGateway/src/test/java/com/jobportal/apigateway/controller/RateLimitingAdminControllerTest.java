package com.jobportal.apigateway.controller;

import com.jobportal.apigateway.config.SecurityConfig;
import com.jobportal.apigateway.ratelimit.RateLimitingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@WebFluxTest(RateLimitingAdminController.class)
@Import(SecurityConfig.class)
@AutoConfigureWebTestClient
class RateLimitingAdminControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private RateLimitingService rateLimitingService;

    @Test
    void resetUserLimit_ReturnsSuccess() {
        when(rateLimitingService.resetUserLimit(anyLong())).thenReturn(Mono.empty());

        webTestClient.post()
                .uri("/api/admin/ratelimit/reset/user/123")
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class).isEqualTo("Rate limit reset for user: 123");
    }

    @Test
    void resetIpLimit_ReturnsSuccess() {
        when(rateLimitingService.resetIpLimit(anyString())).thenReturn(Mono.empty());

        webTestClient.post()
                .uri("/api/admin/ratelimit/reset/ip?ip=127.0.0.1")
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class).isEqualTo("Rate limit reset for IP: 127.0.0.1");
    }

    @Test
    void resetApiKeyLimit_ReturnsSuccess() {
        when(rateLimitingService.resetApiKeyLimit(anyString())).thenReturn(Mono.empty());

        webTestClient.post()
                .uri("/api/admin/ratelimit/reset/apikey?apiKey=test-key")
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class).isEqualTo("Rate limit reset for API Key: test-key");
    }

    @Test
    void resetAll_ReturnsSuccess() {
        when(rateLimitingService.resetAllLimits()).thenReturn(Mono.empty());

        webTestClient.post()
                .uri("/api/admin/ratelimit/reset/all")
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class).isEqualTo("All rate limits reset");
    }

    @Test
    void resetLimit_ServiceError_ReturnsError() {
        when(rateLimitingService.resetUserLimit(anyLong())).thenReturn(Mono.error(new RuntimeException("Reset Failed")));

        webTestClient.post()
                .uri("/api/admin/ratelimit/reset/user/123")
                .exchange()
                .expectStatus().is5xxServerError();
    }
}
