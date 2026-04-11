package com.jobportal.apigateway.filter;

import com.jobportal.apigateway.ratelimit.RateLimitingService;
import com.jobportal.apigateway.ratelimit.RateLimitStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RateLimitingFilterTest {

    @Mock
    private RateLimitingService rateLimitingService;

    @Mock
    private GatewayFilterChain chain;

    @InjectMocks
    private RateLimitingFilter rateLimitingFilter;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(rateLimitingFilter, "rateLimitEnabled", true);
        ReflectionTestUtils.setField(rateLimitingFilter, "maxRequests", 100);
        ReflectionTestUtils.setField(rateLimitingFilter, "timeWindowSeconds", 60);
        ReflectionTestUtils.setField(rateLimitingFilter, "enableUserIdLimit", true);
        ReflectionTestUtils.setField(rateLimitingFilter, "enableIpLimit", true);
        ReflectionTestUtils.setField(rateLimitingFilter, "enableApiKeyLimit", true);

        lenient().when(chain.filter(any(ServerWebExchange.class))).thenReturn(Mono.empty());
    }

    @Test
    void apply_Disabled_BypassesFilter() {
        ReflectionTestUtils.setField(rateLimitingFilter, "rateLimitEnabled", false);
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test").build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        rateLimitingFilter.apply(new RateLimitingFilter.Config()).filter(exchange, chain).block();

        verify(chain).filter(exchange);
        verifyNoInteractions(rateLimitingService);
    }

    @Test
    void apply_UserAuthenticated_CheckUserLimit() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test")
                .header("X-User-Id", "123")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        RateLimitStatus status = RateLimitStatus.allowed(1, 100, 1000L);
        when(rateLimitingService.checkUserRateLimit(eq(123L), anyInt(), anyInt())).thenReturn(Mono.just(status));

        rateLimitingFilter.apply(new RateLimitingFilter.Config()).filter(exchange, chain).block();

        verify(rateLimitingService).checkUserRateLimit(eq(123L), anyInt(), anyInt());
        verify(chain).filter(exchange);
    }

    @Test
    void apply_UserAuthenticated_ExceedLimit_ReturnsTooManyRequests() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test")
                .header("X-User-Id", "123")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        RateLimitStatus status = RateLimitStatus.denied(101, 100, 1000L);
        when(rateLimitingService.checkUserRateLimit(eq(123L), anyInt(), anyInt())).thenReturn(Mono.just(status));

        Mono<Void> result = rateLimitingFilter.apply(new RateLimitingFilter.Config()).filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    void apply_ApiKeyProvided_CheckApiKeyLimit() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test")
                .header("X-API-Key", "test-key")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        RateLimitStatus status = RateLimitStatus.allowed(1, 100, 1000L);
        when(rateLimitingService.checkApiKeyRateLimit(eq("test-key"), anyInt(), anyInt())).thenReturn(Mono.just(status));

        rateLimitingFilter.apply(new RateLimitingFilter.Config()).filter(exchange, chain).block();

        verify(rateLimitingService).checkApiKeyRateLimit(eq("test-key"), anyInt(), anyInt());
        verify(chain).filter(exchange);
    }

    @Test
    void apply_IpOnly_CheckIpLimit() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test")
                .remoteAddress(new java.net.InetSocketAddress("127.0.0.1", 80))
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        RateLimitStatus status = RateLimitStatus.allowed(1, 100, 1000L);
        when(rateLimitingService.checkIpRateLimit(eq("127.0.0.1"), anyInt(), anyInt())).thenReturn(Mono.just(status));

        rateLimitingFilter.apply(new RateLimitingFilter.Config()).filter(exchange, chain).block();

        verify(rateLimitingService).checkIpRateLimit(eq("127.0.0.1"), anyInt(), anyInt());
        verify(chain).filter(exchange);
    }

    @Test
    void apply_XForwardedForIP_CheckIpLimit() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test")
                .header("X-Forwarded-For", "10.0.0.1, 192.168.1.1")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        RateLimitStatus status = RateLimitStatus.allowed(1, 100, 1000L);
        when(rateLimitingService.checkIpRateLimit(eq("10.0.0.1"), anyInt(), anyInt())).thenReturn(Mono.just(status));

        rateLimitingFilter.apply(new RateLimitingFilter.Config()).filter(exchange, chain).block();

        verify(rateLimitingService).checkIpRateLimit(eq("10.0.0.1"), anyInt(), anyInt());
    }

    @Test
    void apply_ServiceError_FailsOpen() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test")
                .remoteAddress(new java.net.InetSocketAddress("127.0.0.1", 80))
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(rateLimitingService.checkIpRateLimit(anyString(), anyInt(), anyInt())).thenReturn(Mono.error(new RuntimeException("Service Error")));

        rateLimitingFilter.apply(new RateLimitingFilter.Config()).filter(exchange, chain).block();

        verify(chain).filter(exchange);
    }

    @Test
    void apply_UnknownIP_StillChecksLimit() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test")
                .build(); // No remote address, no XFF
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(rateLimitingService.checkIpRateLimit(eq("unknown"), anyInt(), anyInt())).thenReturn(Mono.just(RateLimitStatus.allowed(1, 100, 1000L)));

        rateLimitingFilter.apply(new RateLimitingFilter.Config()).filter(exchange, chain).block();

        verify(rateLimitingService).checkIpRateLimit(eq("unknown"), anyInt(), anyInt());
    }

    @Test
    void apply_EmptyApiKey_ChecksIpLimit() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test")
                .header("X-API-Key", "")
                .remoteAddress(new java.net.InetSocketAddress("127.0.0.1", 80))
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(rateLimitingService.checkIpRateLimit(eq("127.0.0.1"), anyInt(), anyInt())).thenReturn(Mono.just(RateLimitStatus.allowed(1, 100, 1000L)));

        rateLimitingFilter.apply(new RateLimitingFilter.Config()).filter(exchange, chain).block();

        verify(rateLimitingService).checkIpRateLimit(eq("127.0.0.1"), anyInt(), anyInt());
        verify(rateLimitingService, times(0)).checkApiKeyRateLimit(anyString(), anyInt(), anyInt());
    }

    @Test
    void apply_ApiKey_ExceedLimit_ReturnsTooManyRequests() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test")
                .header("X-API-Key", "test-key")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        RateLimitStatus status = RateLimitStatus.denied(101, 100, 1000L);
        when(rateLimitingService.checkApiKeyRateLimit(eq("test-key"), anyInt(), anyInt())).thenReturn(Mono.just(status));

        Mono<Void> result = rateLimitingFilter.apply(new RateLimitingFilter.Config()).filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    void apply_Ip_ExceedLimit_ReturnsTooManyRequests() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test")
                .remoteAddress(new java.net.InetSocketAddress("127.0.0.1", 80))
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        RateLimitStatus status = RateLimitStatus.denied(101, 100, 1000L);
        when(rateLimitingService.checkIpRateLimit(eq("127.0.0.1"), anyInt(), anyInt())).thenReturn(Mono.just(status));

        Mono<Void> result = rateLimitingFilter.apply(new RateLimitingFilter.Config()).filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    void apply_UserLimitDisabled_BypassesUserCheck() {
        ReflectionTestUtils.setField(rateLimitingFilter, "enableUserIdLimit", false);
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test")
                .header("X-User-Id", "123")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        // Should fall back to IP check
        when(rateLimitingService.checkIpRateLimit(anyString(), anyInt(), anyInt())).thenReturn(Mono.just(RateLimitStatus.allowed(1, 100, 1000L)));

        rateLimitingFilter.apply(new RateLimitingFilter.Config()).filter(exchange, chain).block();

        verify(rateLimitingService, times(0)).checkUserRateLimit(anyLong(), anyInt(), anyInt());
        verify(rateLimitingService).checkIpRateLimit(anyString(), anyInt(), anyInt());
    }

    @Test
    void apply_ApiKeyLimitDisabled_BypassesApiKeyCheck() {
        ReflectionTestUtils.setField(rateLimitingFilter, "enableApiKeyLimit", false);
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test")
                .header("X-API-Key", "key")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(rateLimitingService.checkIpRateLimit(anyString(), anyInt(), anyInt())).thenReturn(Mono.just(RateLimitStatus.allowed(1, 100, 1000L)));

        rateLimitingFilter.apply(new RateLimitingFilter.Config()).filter(exchange, chain).block();

        verify(rateLimitingService, times(0)).checkApiKeyRateLimit(anyString(), anyInt(), anyInt());
    }

    @Test
    void apply_IpLimitDisabled_BypassesIpCheck() {
        ReflectionTestUtils.setField(rateLimitingFilter, "enableIpLimit", false);
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test").build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        rateLimitingFilter.apply(new RateLimitingFilter.Config()).filter(exchange, chain).block();

        verifyNoInteractions(rateLimitingService);
    }

    @Test
    void apply_EmptyUserId_SkipsUserCheck() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test")
                .header("X-User-Id", "")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(rateLimitingService.checkIpRateLimit(anyString(), anyInt(), anyInt())).thenReturn(Mono.just(RateLimitStatus.allowed(1, 100, 1000L)));

        rateLimitingFilter.apply(new RateLimitingFilter.Config()).filter(exchange, chain).block();

        verify(rateLimitingService, times(0)).checkUserRateLimit(anyLong(), anyInt(), anyInt());
    }

    @Test
    void apply_StatusDenied_Rejects() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test")
                .header("X-User-Id", "123")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(rateLimitingService.checkUserRateLimit(eq(123L), anyInt(), anyInt()))
                .thenReturn(Mono.just(RateLimitStatus.denied(101, 100, 5000L)));

        Mono<Void> result = rateLimitingFilter.apply(new RateLimitingFilter.Config()).filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    void handleRateLimitStatus_NullStatus_Rejects() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test").build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        
        // Use reflection to call private method directly with null
        Mono<Void> result = ReflectionTestUtils.invokeMethod(rateLimitingFilter, "handleRateLimitStatus", 
                exchange, chain, null, "User", "123");

        StepVerifier.create(result).verifyComplete();
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    void getClientIpAddress_MultiXForwardedFor_ReturnsFirst() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test")
                .header("X-Forwarded-For", "192.168.1.1, 10.0.0.1")
                .build();
        
        String ip = ReflectionTestUtils.invokeMethod(rateLimitingFilter, "getClientIpAddress", request);
        assertThat(ip).isEqualTo("192.168.1.1");
    }

    @Test
    void handleRateLimitStatus_Allowed_CallsChain() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test").build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        RateLimitStatus status = RateLimitStatus.allowed(1, 100, 1000L);

        Mono<Void> result = ReflectionTestUtils.invokeMethod(rateLimitingFilter, "handleRateLimitStatus", 
                exchange, chain, status, "User", "123");

        StepVerifier.create(result).verifyComplete();
        verify(chain).filter(exchange);
        assertThat(exchange.getResponse().getHeaders().getFirst("X-RateLimit-Limit")).isEqualTo("100");
    }

    @Test
    void sendErrorResponse_CheckJsonFormat() {
        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get("/").build());
        
        Mono<Void> result = ReflectionTestUtils.invokeMethod(rateLimitingFilter, "sendErrorResponse", 
                exchange.getResponse(), HttpStatus.TOO_MANY_REQUESTS, "Exceeded");

        StepVerifier.create(result).verifyComplete();
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(exchange.getResponse().getHeaders().getFirst("Content-Type")).isEqualTo("application/json");
    }
}
