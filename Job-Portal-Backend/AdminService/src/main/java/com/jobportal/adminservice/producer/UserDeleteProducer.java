package com.jobportal.adminservice.producer;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import com.jobportal.adminservice.config.RabbitMQConfig;
import com.jobportal.adminservice.event.UserDeleteEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserDeleteProducer {

    private final RabbitTemplate rabbitTemplate;

    public void startSaga(UserDeleteEvent event) {

        log.info("Publishing USER_DELETE_REQUESTED message | userId: {}", event.getUserId());

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.USER_DELETE_REQUESTED_QUEUE, event);

        log.info("Message published successfully | userId: {}", event.getUserId());
    }
}