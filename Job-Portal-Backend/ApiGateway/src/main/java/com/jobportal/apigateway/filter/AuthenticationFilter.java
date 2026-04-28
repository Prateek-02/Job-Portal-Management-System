package com.jobportal.apigateway.filter;

import com.jobportal.apigateway.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import lombok.extern.slf4j.Slf4j;

/**
 * AUTHENTICATION FILTER
 * ---------------------
 * This filter runs on every PROTECTED route.
 *
 * Flow:
 * 1. Check Authorization header exists
 * 2. Extract JWT token
 * 3. Validate token
 * 4. Extract email, role, userId from token
 * 5. Add them as headers to the request
 * 6. Forward request to the microservice
 *
 * Microservices then read:
 *   X-User-Id    → to know who is making the request
 *   X-User-Role  → to know their role
 *   X-User-Email → to know their email
 */
@Slf4j
@Component
public class AuthenticationFilter extends
        AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    @Autowired
    private JwtUtil jwtUtil;

    public AuthenticationFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String path = request.getURI().getPath();

            if (isPublicEndpoint(request)) {
                log.debug("Auth Filter | Bypassing public route: {}", path);
                return chain.filter(exchange);
            }

            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            if (isInvalidHeader(authHeader)) {
                log.warn("Auth Filter | Unauthorized - Invalid Header | Path: {}", path);
                return onError(exchange, "Missing or invalid Authorization header");
            }

            String token = authHeader.substring(7);
            if (!jwtUtil.validateToken(token)) {
                log.warn("Auth Filter | Unauthorized - Invalid Token | Path: {}", path);
                return onError(exchange, "Invalid or expired token");
            }

            return chain.filter(exchange.mutate()
                    .request(getMutatedRequest(request, token))
                    .build());
        };
    }

    private boolean isPublicEndpoint(ServerHttpRequest request) {
        String path = request.getURI().getPath();
        String method = request.getMethod().name();

        // Check Job related public routes
        if (path.startsWith("/api/jobs") && !path.contains("/saved") && !path.contains("/recruiter")) {
            return method.equalsIgnoreCase("GET") || 
                   (method.equalsIgnoreCase("POST") && path.toLowerCase().contains("search"));
        }

        // Check Auth and Admin public routes
        return path.contains("/api/auth/refresh") ||
               path.contains("/api/auth/forgot-password") ||
               path.contains("/api/auth/reset-password") ||
               path.contains("/api/auth/register") ||
               path.contains("/api/auth/login") ||
               path.startsWith("/api/admin/public/");
    }

    private boolean isInvalidHeader(String authHeader) {
        return authHeader == null || !authHeader.startsWith("Bearer ");
    }

    private ServerHttpRequest getMutatedRequest(ServerHttpRequest request, String token) {
        String email = jwtUtil.extractEmail(token);
        String role = jwtUtil.extractRole(token);
        Long userId = jwtUtil.extractUserId(token);

        log.debug("Auth Filter | Authenticated User: {} | Role: {}", email, role);

        return request.mutate()
                .header("X-User-Email", email != null ? email : "")
                .header("X-User-Role", role != null ? role : "")
                .header("X-User-Id", userId != null ? userId.toString() : "")
                .build();
    }

    private Mono<Void> onError(ServerWebExchange exchange, String message) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders().add("Content-Type", "application/json");
        DataBuffer buffer = exchange.getResponse().bufferFactory()
                .wrap(("{\"error\":\"" + message + "\"}")
                        .getBytes());
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }

    public static class Config {
        // Empty config class required by AbstractGatewayFilterFactory
    }
}
