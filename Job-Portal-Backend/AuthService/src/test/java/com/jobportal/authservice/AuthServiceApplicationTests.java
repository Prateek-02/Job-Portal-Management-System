package com.jobportal.authservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=MySQL",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
    "eureka.client.enabled=false",
    "spring.cloud.config.enabled=false",
    "MYSQL_PASSWORD=root",
    "JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
    "INTERNAL_SECRET=test-secret",
    "CLOUDINARY_CLOUD_NAME=test",
    "CLOUDINARY_API_KEY=test",
    "CLOUDINARY_API_SECRET=test",
    "RABBITMQ_USERNAME=guest",
    "RABBITMQ_PASSWORD=guest",
    "ADMIN_EMAIL=admin@test.com",
    "ADMIN_PASSWORD=admin123",
    "ADMIN_NAME=Admin",
    "ADMIN_PHONE=1234567890",
    "MAIL_USERNAME=test",
    "MAIL_PASSWORD=test",
    "FRONTEND_URL=http://localhost:4200",
    "jwt.expiration=3600000",
    "jwt.refresh.expiration=86400000"
})
class AuthServiceApplicationTests {

    @Test
    void contextLoads() {
    }

}
