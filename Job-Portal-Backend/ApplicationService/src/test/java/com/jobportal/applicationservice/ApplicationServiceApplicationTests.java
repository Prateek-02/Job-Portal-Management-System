package com.jobportal.applicationservice;

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
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration",
    "MYSQL_PASSWORD=root",
    "INTERNAL_SECRET=test-secret",
    "RABBITMQ_USERNAME=guest",
    "RABBITMQ_PASSWORD=guest",
    "REDIS_PASSWORD=guest",
    "CLOUDINARY_CLOUD_NAME=test",
    "CLOUDINARY_API_KEY=test",
    "CLOUDINARY_API_SECRET=test"
})
class ApplicationServiceApplicationTests {

	@Test
	void contextLoads() {
	}

}
