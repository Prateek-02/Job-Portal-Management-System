package com.jobportal.applicationservice.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String JOB_APPLIED_QUEUE =
            "email.job-applied";

    public static final String APPLICATION_STATUS_QUEUE =
            "email.application-status";
    public static final String USER_DELETE_REQUESTED_QUEUE =
            "saga.user-delete-requested";
    public static final String APPLICATION_DELETED_QUEUE =
            "saga.application-deleted";
    public static final String JOB_DELETED_QUEUE =
            "saga.job-deleted";

    @Bean
    public Queue jobAppliedQueue() {
        return new Queue(JOB_APPLIED_QUEUE, true);
    }

    @Bean
    public Queue applicationStatusQueue() {
        return new Queue(APPLICATION_STATUS_QUEUE, true);
    }

    @Bean
    public Queue userDeleteRequestedQueue() {
        return new Queue(USER_DELETE_REQUESTED_QUEUE, true);
    }

    @Bean
    public Queue applicationDeletedQueue() {
        return new Queue(APPLICATION_DELETED_QUEUE, true);
    }

    @Bean
    public Queue jobDeletedQueue() {
        return new Queue(JOB_DELETED_QUEUE, true);
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(
            ConnectionFactory connectionFactory) {
        RabbitTemplate template =
                new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory
            rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory) {
        SimpleRabbitListenerContainerFactory factory =
                new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(messageConverter());
        return factory;
    }
}