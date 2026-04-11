package com.jobportal.notificationservice.config;

import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class RabbitMQConfigTest {

    private final RabbitMQConfig rabbitMQConfig = new RabbitMQConfig();

    @Test
    void queueBeans_AreCreatedCorrectly() {
        assertThat(rabbitMQConfig.jobPostedQueue().getName()).isEqualTo(RabbitMQConfig.JOB_POSTED_QUEUE);
        assertThat(rabbitMQConfig.jobAppliedQueue().getName()).isEqualTo(RabbitMQConfig.JOB_APPLIED_QUEUE);
        assertThat(rabbitMQConfig.applicationStatusQueue().getName()).isEqualTo(RabbitMQConfig.APPLICATION_STATUS_QUEUE);
    }

    @Test
    void messageConverter_IsCreated() {
        assertThat(rabbitMQConfig.messageConverter()).isInstanceOf(Jackson2JsonMessageConverter.class);
    }

    @Test
    void rabbitTemplate_IsConfiguredCorrectly() {
        ConnectionFactory connectionFactory = mock(ConnectionFactory.class);
        RabbitTemplate template = rabbitMQConfig.rabbitTemplate(connectionFactory);
        assertThat(template.getMessageConverter()).isInstanceOf(Jackson2JsonMessageConverter.class);
    }

    @Test
    void rabbitListenerContainerFactory_IsConfigured() {
        ConnectionFactory connectionFactory = mock(ConnectionFactory.class);
        assertThat(rabbitMQConfig.rabbitListenerContainerFactory(connectionFactory)).isNotNull();
    }
}
