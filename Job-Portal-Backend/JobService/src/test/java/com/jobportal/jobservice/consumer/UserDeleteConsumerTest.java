package com.jobportal.jobservice.consumer;

import com.jobportal.jobservice.config.RabbitMQConfig;
import com.jobportal.jobservice.event.UserDeleteEvent;
import com.jobportal.jobservice.repository.JobRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserDeleteConsumerTest {

    @Mock
    private JobRepository jobRepository;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private UserDeleteConsumer consumer;

    private UserDeleteEvent event;

    @BeforeEach
    void setUp() {
        event = new UserDeleteEvent();
        event.setUserId(200L);
    }

    @Test
    void handle_RoleRecruiter_JobsExist_DeletesJobsAndPublishes() {
        event.setRole("RECRUITER");
        when(jobRepository.existsByRecruiterId(200L)).thenReturn(true);

        consumer.handle(event);

        verify(jobRepository).deleteByRecruiterId(200L);
        verify(rabbitTemplate).convertAndSend(eq(RabbitMQConfig.JOBS_DELETED_QUEUE), eq(event));
    }

    @Test
    void handle_RoleRecruiter_NoJobsExist_PublishesOnly() {
        event.setRole("RECRUITER");
        when(jobRepository.existsByRecruiterId(200L)).thenReturn(false);

        consumer.handle(event);

        // verify NO delete occurred
        verify(jobRepository, never()).deleteByRecruiterId(anyLong());
        verify(rabbitTemplate).convertAndSend(eq(RabbitMQConfig.JOBS_DELETED_QUEUE), eq(event));
    }

    @Test
    void handle_RoleJobSeeker_PublishesOnly() {
        event.setRole("JOB_SEEKER");

        consumer.handle(event);

        verify(jobRepository, never()).existsByRecruiterId(anyLong());
        verify(jobRepository, never()).deleteByRecruiterId(anyLong());
        verify(rabbitTemplate).convertAndSend(eq(RabbitMQConfig.JOBS_DELETED_QUEUE), eq(event));
    }
}
