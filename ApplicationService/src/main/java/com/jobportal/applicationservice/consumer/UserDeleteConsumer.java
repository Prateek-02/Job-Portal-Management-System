package com.jobportal.applicationservice.consumer;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.jobportal.applicationservice.event.UserDeleteEvent;
import com.jobportal.applicationservice.repository.ApplicationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserDeleteConsumer {

    private final ApplicationRepository applicationRepository;
    private final KafkaTemplate<String, UserDeleteEvent> kafkaTemplate;

    @KafkaListener(
            topics = "user-delete-requested",
            groupId = "application-group"
    )
    @Transactional
    public void handle(UserDeleteEvent event) {

        log.info("Received USER_DELETE_REQUESTED | userId: {}", event.getUserId());

        if (!applicationRepository.existsByUserId(event.getUserId())) {
            log.warn("No applications found for userId: {}", event.getUserId());
        } else {
            applicationRepository.deleteByUserId(event.getUserId());
            log.info("Applications deleted | userId: {}", event.getUserId());
        }

        event.setStatus("APPLICATION_DELETED");

        kafkaTemplate.send("application-deleted", event);

        log.info("Published APPLICATION_DELETED event | userId: {}", event.getUserId());
    }
}