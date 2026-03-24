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

            // Step 1: Check Authorization header exists
            if (!request.getHeaders()
                    .containsKey(HttpHeaders.AUTHORIZATION)) {
                return onError(exchange,
                        "Missing Authorization header");
            }

            // Step 2: Extract token
            String authHeader = request.getHeaders()
                    .getFirst(HttpHeaders.AUTHORIZATION);

            if (authHeader == null ||
                    !authHeader.startsWith("Bearer ")) {
                return onError(exchange,
                        "Invalid Authorization format");
            }

            String token = authHeader.substring(7);

            // Step 3: Validate token
            if (!jwtUtil.validateToken(token)) {
                return onError(exchange,
                        "Invalid or expired token");
            }

            // Step 4: Extract user info from token
            String email  = jwtUtil.extractEmail(token);
            String role   = jwtUtil.extractRole(token);
            Long   userId = jwtUtil.extractUserId(token);

            // Step 5: Add user info as headers
            ServerHttpRequest modifiedRequest = request.mutate()
                    .header("X-User-Email",
                            email  != null ? email  : "")
                    .header("X-User-Role",
                            role   != null ? role   : "")
                    .header("X-User-Id",
                            userId != null ? userId.toString() : "")
                    .build();

            // Step 6: Forward to microservice
            return chain.filter(exchange.mutate()
                    .request(modifiedRequest).build());
        };
    }

    private Mono<Void> onError(ServerWebExchange exchange,
            String message) {
        exchange.getResponse()
                .setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders()
                .add("Content-Type", "application/json");
        DataBuffer buffer = exchange.getResponse()
                .bufferFactory()
                .wrap(("{\"error\":\"" + message + "\"}")
                        .getBytes());
        return exchange.getResponse()
                .writeWith(Mono.just(buffer));
    }

    public static class Config {
        // Empty config class required by
        // AbstractGatewayFilterFactory
    }
}
