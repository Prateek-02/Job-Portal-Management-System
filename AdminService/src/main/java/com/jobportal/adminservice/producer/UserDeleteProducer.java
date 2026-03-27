package com.jobportal.adminservice.producer;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.jobportal.adminservice.event.UserDeleteEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserDeleteProducer {

    private final KafkaTemplate<String, UserDeleteEvent> kafkaTemplate;

    private static final String TOPIC = "user-delete-requested";

    public void startSaga(UserDeleteEvent event) {

        log.info("Publishing USER_DELETE_REQUESTED event | userId: {}", event.getUserId());

        kafkaTemplate.send(TOPIC, event);

        log.info("Event published successfully | userId: {}", event.getUserId());
    }
}