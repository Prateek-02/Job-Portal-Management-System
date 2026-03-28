package com.jobportal.jobservice.consumer;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.jobportal.jobservice.config.RabbitMQConfig;
import com.jobportal.jobservice.event.UserDeleteEvent;
import com.jobportal.jobservice.repository.JobRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserDeleteConsumer {

    private final JobRepository jobRepository;
    private final RabbitTemplate rabbitTemplate;

    @RabbitListener(queues = RabbitMQConfig.APPLICATION_DELETED_QUEUE)
    @Transactional
    public void handle(UserDeleteEvent event) {

        log.info("Received APPLICATION_DELETED | userId: {}", event.getUserId());

        if ("RECRUITER".equalsIgnoreCase(event.getRole())) {
            if (!jobRepository.existsByRecruiterId(event.getUserId())) {
                log.warn("No jobs found for recruiterId: {}", event.getUserId());
            } else {
                jobRepository.deleteByRecruiterId(event.getUserId());
                log.info("Jobs deleted | recruiterId: {}", event.getUserId());
            }
        }

        event.setStatus("JOBS_DELETED");

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.JOBS_DELETED_QUEUE, event);

        log.info("Published JOBS_DELETED event | userId: {}", event.getUserId());
    }
}