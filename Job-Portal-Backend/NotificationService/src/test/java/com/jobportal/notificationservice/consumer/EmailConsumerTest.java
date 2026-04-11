package com.jobportal.notificationservice.consumer;

import com.jobportal.notificationservice.dto.ApplicationStatusEvent;
import com.jobportal.notificationservice.dto.JobAppliedEvent;
import com.jobportal.notificationservice.dto.JobPostedEvent;
import com.jobportal.notificationservice.service.EmailService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class EmailConsumerTest {

    @Mock
    private EmailService emailService;

    @InjectMocks
    private EmailConsumer emailConsumer;

    @Test
    void handleJobPosted_DelegatesToService() {
        JobPostedEvent event = new JobPostedEvent("Dev", "Google", "Remote", 100000.0, 2);
        emailConsumer.handleJobPosted(event);
        verify(emailService).sendJobPostedEmailToAllJobSeekers("Dev", "Google", "Remote", 100000.0, 2);
    }

    @Test
    void handleJobApplied_DelegatesToService() {
        JobAppliedEvent event = new JobAppliedEvent("rec@test.com", "App", "app@test.com", "Dev", "Comp");
        emailConsumer.handleJobApplied(event);
        verify(emailService).sendJobAppliedEmail("rec@test.com", "App", "app@test.com", "Dev", "Comp");
    }

    @Test
    void handleApplicationStatus_DelegatesToService() {
        ApplicationStatusEvent event = new ApplicationStatusEvent("app@test.com", "App", "Dev", "Comp", "SHORTLISTED");
        emailConsumer.handleApplicationStatus(event);
        verify(emailService).sendApplicationStatusEmail("app@test.com", "App", "Dev", "Comp", "SHORTLISTED");
    }
}
