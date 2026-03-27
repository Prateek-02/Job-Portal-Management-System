package com.jobportal.authservice.consumer;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import com.jobportal.authservice.event.UserDeleteEvent;
import com.jobportal.authservice.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserDeleteConsumer {

    private final UserRepository userRepository;
    private final KafkaTemplate<String, UserDeleteEvent> kafkaTemplate;

    @KafkaListener(
            topics = "jobs-deleted",
            groupId = "auth-group"
    )
    public void handle(UserDeleteEvent event) {

        log.info("Received JOBS_DELETED | userId: {}", event.getUserId());

        // ✅ Idempotency
        if (!userRepository.existsById(event.getUserId())) {
            log.warn("User already deleted | userId: {}", event.getUserId());
        } else {
            userRepository.deleteById(event.getUserId());
            log.info("User deleted | userId: {}", event.getUserId());
        }

        // ✅ Update status
        event.setStatus("COMPLETED");

        // ✅ Publish final event
        kafkaTemplate.send("user-deleted", event);

        log.info("Published USER_DELETED event | userId: {}", event.getUserId());
    }
}