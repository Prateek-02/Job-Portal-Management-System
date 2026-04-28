package com.jobportal.applicationservice.consumer;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.jobportal.applicationservice.config.RabbitMQConfig;
import com.jobportal.applicationservice.dto.event.JobDeletedEvent;
import com.jobportal.applicationservice.service.ApplicationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class JobDeleteConsumer {

    private final ApplicationService applicationService;

    @RabbitListener(queues = RabbitMQConfig.JOB_DELETED_QUEUE)
    public void consumeJobDeletedEvent(JobDeletedEvent event) {
        log.info("Received job deleted event | jobId: {}", event.getJobId());
        try {
            applicationService.deleteJobApplications(event.getJobId());
            log.info("Successfully cleaned up applications for deleted job | jobId: {}", event.getJobId());
        } catch (Exception e) {
            log.error("Failed to cleanup applications for deleted job | jobId: {}", event.getJobId(), e);
        }
    }
}
