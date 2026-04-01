package com.jobportal.notificationservice.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

   
    // Queue Names

    // When a new job is posted → notify recruiter
    public static final String JOB_POSTED_QUEUE =
            "email.job-posted";

    // When a job seeker applies → notify recruiter
    public static final String JOB_APPLIED_QUEUE =
            "email.job-applied";

    // When application status changes → notify job seeker
    public static final String APPLICATION_STATUS_QUEUE =
            "email.application-status";

    // Queue Beans

    @Bean
    public Queue jobPostedQueue() {
        return new Queue(JOB_POSTED_QUEUE, true);
    }

    @Bean
    public Queue jobAppliedQueue() {
        return new Queue(JOB_APPLIED_QUEUE, true);
    }

    @Bean
    public Queue applicationStatusQueue() {
        return new Queue(APPLICATION_STATUS_QUEUE, true);
    }

  
    // JSON Converter

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
