package com.jobportal.notificationservice;

import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
    "eureka.client.enabled=false",
    "spring.cloud.config.enabled=false",
    "internal.secret=test-secret",
    "spring.mail.host=localhost",
    "spring.mail.port=587"
})
class NotificationServiceApplicationTests {

    @MockBean
    private ConnectionFactory connectionFactory;

	@Test
	void contextLoads() {
	}

}
