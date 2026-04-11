package com.jobportal.apigateway;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
    "JWT_SECRET=abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890",
    "REDIS_HOST=localhost",
    "REDIS_PORT=6379"
})
class ApiGatewayApplicationTests {
    @Test
    void contextLoads() {
    }
}
