package com.jobportal.jobservice.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String JOB_POSTED_QUEUE =
            "email.job-posted";
    public static final String APPLICATION_DELETED_QUEUE =
            "saga.application-deleted";
    public static final String JOBS_DELETED_QUEUE =
            "saga.jobs-deleted";

    @Bean
    public Queue jobPostedQueue() {
        return new Queue(JOB_POSTED_QUEUE, true);
    }

    @Bean
    public Queue applicationDeletedQueue() {
        return new Queue(APPLICATION_DELETED_QUEUE, true);
    }

    @Bean
    public Queue jobsDeletedQueue() {
        return new Queue(JOBS_DELETED_QUEUE, true);
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