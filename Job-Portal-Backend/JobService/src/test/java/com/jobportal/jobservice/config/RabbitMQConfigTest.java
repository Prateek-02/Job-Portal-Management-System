package com.jobportal.jobservice.config;

import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class RabbitMQConfigTest {

    private final RabbitMQConfig rabbitMQConfig = new RabbitMQConfig();

    @Test
    void jobPostedQueue_ReturnsConfiguredQueue() {
        Queue queue = rabbitMQConfig.jobPostedQueue();
        assertThat(queue.getName()).isEqualTo(RabbitMQConfig.JOB_POSTED_QUEUE);
        assertThat(queue.isDurable()).isTrue();
    }

    @Test
    void applicationDeletedQueue_ReturnsConfiguredQueue() {
        Queue queue = rabbitMQConfig.applicationDeletedQueue();
        assertThat(queue.getName()).isEqualTo(RabbitMQConfig.APPLICATION_DELETED_QUEUE);
        assertThat(queue.isDurable()).isTrue();
    }

    @Test
    void jobsDeletedQueue_ReturnsConfiguredQueue() {
        Queue queue = rabbitMQConfig.jobsDeletedQueue();
        assertThat(queue.getName()).isEqualTo(RabbitMQConfig.JOBS_DELETED_QUEUE);
        assertThat(queue.isDurable()).isTrue();
    }

    @Test
    void messageConverter_ReturnsJsonConverter() {
        Jackson2JsonMessageConverter converter = rabbitMQConfig.messageConverter();
        assertThat(converter).isNotNull();
    }

    @Test
    void rabbitTemplate_ReturnsConfiguredTemplate() {
        ConnectionFactory factory = mock(ConnectionFactory.class);
        RabbitTemplate template = rabbitMQConfig.rabbitTemplate(factory);
        
        assertThat(template.getConnectionFactory()).isEqualTo(factory);
        assertThat(template.getMessageConverter()).isInstanceOf(Jackson2JsonMessageConverter.class);
    }

    @Test
    void rabbitListenerContainerFactory_ReturnsConfiguredFactory() {
        ConnectionFactory factory = mock(ConnectionFactory.class);
        SimpleRabbitListenerContainerFactory containerFactory = rabbitMQConfig.rabbitListenerContainerFactory(factory);
        
        assertThat(containerFactory).isNotNull();
    }
}
