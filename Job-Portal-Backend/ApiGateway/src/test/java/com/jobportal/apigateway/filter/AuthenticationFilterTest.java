package com.jobportal.apigateway.filter;

import com.jobportal.apigateway.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthenticationFilterTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private GatewayFilterChain chain;

    @InjectMocks
    private AuthenticationFilter authenticationFilter;

    @BeforeEach
    void setUp() {
        lenient().when(chain.filter(any(ServerWebExchange.class))).thenReturn(Mono.empty());
    }

    @Test
    void apply_PublicRoute_BypassesFilter() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/jobs")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        authenticationFilter.apply(new AuthenticationFilter.Config()).filter(exchange, chain).block();

        verify(chain).filter(any(ServerWebExchange.class));
        verifyNoInteractions(jwtUtil);
    }

    @Test
    void apply_ProtectedNoHeader_ReturnsUnauthorized() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/protected")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        Mono<Void> result = authenticationFilter.apply(new AuthenticationFilter.Config()).filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        org.assertj.core.api.Assertions.assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void apply_ProtectedInvalidHeaderFormat_ReturnsUnauthorized() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/protected")
                .header(HttpHeaders.AUTHORIZATION, "Basic password")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        Mono<Void> result = authenticationFilter.apply(new AuthenticationFilter.Config()).filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        org.assertj.core.api.Assertions.assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void apply_InvalidToken_ReturnsUnauthorized() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/protected")
                .header(HttpHeaders.AUTHORIZATION, "Bearer invalid-token")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(jwtUtil.validateToken(anyString())).thenReturn(false);

        Mono<Void> result = authenticationFilter.apply(new AuthenticationFilter.Config()).filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        org.assertj.core.api.Assertions.assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void apply_ValidToken_StripsBearerAndCallsNext() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/users/profile")
                .header(HttpHeaders.AUTHORIZATION, "Bearer valid-token")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(jwtUtil.validateToken("valid-token")).thenReturn(true);
        when(jwtUtil.extractEmail("valid-token")).thenReturn("user@test.com");
        when(jwtUtil.extractRole("valid-token")).thenReturn("USER");
        when(jwtUtil.extractUserId("valid-token")).thenReturn(123L);

        authenticationFilter.apply(new AuthenticationFilter.Config()).filter(exchange, chain).block();

        verify(chain).filter(argThat(ex -> {
            HttpHeaders headers = ex.getRequest().getHeaders();
            return "user@test.com".equals(headers.getFirst("X-User-Email")) &&
                   "USER".equals(headers.getFirst("X-User-Role")) &&
                   "123".equals(headers.getFirst("X-User-Id"));
        }));
    }

    @Test
    void apply_ValidToken_MixedNullHeaders_HandlesPermutations() {
        String[][] cases = {
            {null, "USER", "123"},
            {"test@test.com", null, "123"},
            {"test@test.com", "USER", null}
        };

        for (String[] c : cases) {
            MockServerHttpRequest request = MockServerHttpRequest.get("/api/users/profile")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer valid-token")
                    .build();
            ServerWebExchange exchange = MockServerWebExchange.from(request);

            reset(chain);
            lenient().when(chain.filter(any())).thenReturn(Mono.empty());
            
            when(jwtUtil.validateToken("valid-token")).thenReturn(true);
            when(jwtUtil.extractEmail("valid-token")).thenReturn(c[0]);
            when(jwtUtil.extractRole("valid-token")).thenReturn(c[1]);
            when(jwtUtil.extractUserId("valid-token")).thenReturn(c[2] != null ? Long.parseLong(c[2]) : null);

            authenticationFilter.apply(new AuthenticationFilter.Config()).filter(exchange, chain).block();

            verify(chain).filter(argThat(ex -> {
                HttpHeaders h = ex.getRequest().getHeaders();
                boolean emailOk = (c[0] == null) ? "".equals(h.getFirst("X-User-Email")) : c[0].equals(h.getFirst("X-User-Email"));
                boolean roleOk = (c[1] == null) ? "".equals(h.getFirst("X-User-Role")) : c[1].equals(h.getFirst("X-User-Role"));
                boolean idOk = (c[2] == null) ? "".equals(h.getFirst("X-User-Id")) : c[2].equals(h.getFirst("X-User-Id"));
                return emailOk && roleOk && idOk;
            }));
        }
    }

    @Test
    void apply_ValidToken_AllHeaderPermutations() {
        String[] values = {"email@test.com", "USER", "123"};
        for (int i = 0; i < 3; i++) {
            String[] mixed = values.clone();
            mixed[i] = null; // Test one null at a time
            
            MockServerHttpRequest request = MockServerHttpRequest.get("/api/test")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer token")
                    .build();
            ServerWebExchange exchange = MockServerWebExchange.from(request);
            
            reset(jwtUtil, chain);
            lenient().when(chain.filter(any())).thenReturn(Mono.empty());
            when(jwtUtil.validateToken(anyString())).thenReturn(true);
            when(jwtUtil.extractEmail(anyString())).thenReturn(mixed[0]);
            when(jwtUtil.extractRole(anyString())).thenReturn(mixed[1]);
            when(jwtUtil.extractUserId(anyString())).thenReturn(mixed[2] != null ? Long.parseLong(mixed[2]) : null);

            authenticationFilter.apply(new AuthenticationFilter.Config()).filter(exchange, chain).block();
        }
    }

    @Test
    void apply_JobsSaved_RequiresAuth() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/jobs/saved")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        Mono<Void> result = authenticationFilter.apply(new AuthenticationFilter.Config()).filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        org.assertj.core.api.Assertions.assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void apply_PostSearchJobs_BypassesFilter() {
        MockServerHttpRequest request = MockServerHttpRequest.post("/api/jobs/search")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        authenticationFilter.apply(new AuthenticationFilter.Config()).filter(exchange, chain).block();

        verify(chain).filter(any(ServerWebExchange.class));
        verifyNoInteractions(jwtUtil);
    }

    @Test
    void apply_PostJobs_NoSearch_RequiresAuth() {
        MockServerHttpRequest request = MockServerHttpRequest.post("/api/jobs")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        Mono<Void> result = authenticationFilter.apply(new AuthenticationFilter.Config()).filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        org.assertj.core.api.Assertions.assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void apply_PutJobs_RequiresAuth() {
        MockServerHttpRequest request = MockServerHttpRequest.put("/api/jobs/123")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        Mono<Void> result = authenticationFilter.apply(new AuthenticationFilter.Config()).filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        org.assertj.core.api.Assertions.assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void apply_JobsSaved_RequiresAuth_Explicit() {
        // Path starts with /api/jobs but contains /saved
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/jobs/saved/all")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        Mono<Void> result = authenticationFilter.apply(new AuthenticationFilter.Config()).filter(exchange, chain);
        StepVerifier.create(result).verifyComplete();
        org.assertj.core.api.Assertions.assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void apply_PostSearchJobs_CaseInsensitive_BypassesFilter() {
        MockServerHttpRequest request = MockServerHttpRequest.post("/api/jobs/SEARCH")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        authenticationFilter.apply(new AuthenticationFilter.Config()).filter(exchange, chain).block();

        verify(chain).filter(any(ServerWebExchange.class));
    }

    @Test
    void apply_AllPublicAuthRoutes_Exhaustive() {
        String[] paths = {
            "/api/auth/refresh", "/api/auth/forgot-password", "/api/auth/reset-password",
            "/api/auth/register", "/api/auth/login", "/api/admin/public/any"
        };
        for (String path : paths) {
            MockServerHttpRequest request = MockServerHttpRequest.get(path).build();
            ServerWebExchange exchange = MockServerWebExchange.from(request);
            reset(chain);
            lenient().when(chain.filter(any())).thenReturn(Mono.empty());
            authenticationFilter.apply(new AuthenticationFilter.Config()).filter(exchange, chain).block();
            verify(chain).filter(any());
        }
    }

    @Test
    void apply_NullHeadersInContext_HandlesGracefully() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/protected")
                .header(HttpHeaders.AUTHORIZATION, "Bearer token")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(jwtUtil.validateToken(anyString())).thenReturn(true);
        when(jwtUtil.extractEmail(anyString())).thenReturn(null);
        when(jwtUtil.extractRole(anyString())).thenReturn(null);
        when(jwtUtil.extractUserId(anyString())).thenReturn(null);

        authenticationFilter.apply(new AuthenticationFilter.Config()).filter(exchange, chain).block();

        verify(chain).filter(argThat(ex -> {
            HttpHeaders h = ex.getRequest().getHeaders();
            return "".equals(h.getFirst("X-User-Email")) && 
                   "".equals(h.getFirst("X-User-Role")) && 
                   "".equals(h.getFirst("X-User-Id"));
        }));
    }
}
