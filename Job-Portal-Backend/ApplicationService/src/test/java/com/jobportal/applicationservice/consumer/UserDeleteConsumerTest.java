package com.jobportal.applicationservice.consumer;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import com.jobportal.applicationservice.config.RabbitMQConfig;
import com.jobportal.applicationservice.event.UserDeleteEvent;
import com.jobportal.applicationservice.repository.ApplicationRepository;

@ExtendWith(MockitoExtension.class)
class UserDeleteConsumerTest {

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private UserDeleteConsumer userDeleteConsumer;

    private UserDeleteEvent event;

    @BeforeEach
    void setUp() {
        event = new UserDeleteEvent();
        event.setUserId(1L);
    }

    @Test
    void handle_UserWithApplications_DeletesAndPublishes() {
        when(applicationRepository.existsByUserId(1L)).thenReturn(true);

        userDeleteConsumer.handle(event);

        verify(applicationRepository).deleteByUserId(1L);
        verify(rabbitTemplate).convertAndSend(eq(RabbitMQConfig.APPLICATION_DELETED_QUEUE), any(UserDeleteEvent.class));
    }

    @Test
    void handle_UserWithoutApplications_OnlyPublishes() {
        when(applicationRepository.existsByUserId(1L)).thenReturn(false);

        userDeleteConsumer.handle(event);

        verify(applicationRepository, never()).deleteByUserId(1L);
        verify(rabbitTemplate).convertAndSend(eq(RabbitMQConfig.APPLICATION_DELETED_QUEUE), any(UserDeleteEvent.class));
    }
}
