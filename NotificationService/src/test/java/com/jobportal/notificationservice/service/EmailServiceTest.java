package com.jobportal.notificationservice.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import com.jobportal.notificationservice.client.UserClient;
import com.jobportal.notificationservice.dto.UserResponse;

@ExtendWith(MockitoExtension.class)
public class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private UserClient userClient;

    @InjectMocks
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        // Manually inject the @Value field for the test environment
        ReflectionTestUtils.setField(emailService, "internalSecret", "test-secret");
    }

    // TEST 1: Job Alert to All Job Seekers
    @Test
    void testSendJobPostedEmailToAllJobSeekers() {
        // Setup mock users: 1 Job Seeker, 1 Recruiter
        UserResponse seeker = new UserResponse();
        seeker.setName("Kushagra");
        seeker.setEmail("kushagra@gmail.com");
        seeker.setRole("JOB_SEEKER");

        UserResponse recruiter = new UserResponse();
        recruiter.setRole("RECRUITER");

        List<UserResponse> mockUsers = Arrays.asList(seeker, recruiter);

        when(userClient.getAllUsers("test-secret")).thenReturn(mockUsers);

        // Execute
        emailService.sendJobPostedEmailToAllJobSeekers(
            "Java Developer", "Google", "Remote", 120000.0, 2
        );

        // Verify: mailSender.send() should be called only ONCE (for the seeker)
        verify(mailSender, times(1)).send(any(SimpleMailMessage.class));
    }

    // TEST 2: Email to Recruiter on Application
    @Test
    void testSendJobAppliedEmail() {
        // Execute
        emailService.sendJobAppliedEmail(
            "recruiter@google.com", "Kushagra", 
            "kushagra@gmail.com", "Java Dev", "Google"
        );

        // Verify behavior
        verify(mailSender, times(1)).send(any(SimpleMailMessage.class));
    }

    // TEST 3: Application Status Updates (Switch/Case Logic)
    @Test
    void testSendApplicationStatusEmail_Shortlisted() {
        String email = "kushagra@gmail.com";
        String status = "SHORTLISTED";

        // Execute
        emailService.sendApplicationStatusEmail(email, "Kushagra", "Java Dev", "Google", status);

        // Capture the message to inspect the text content
        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        SimpleMailMessage sentMessage = messageCaptor.getValue();

        // Assertions
        assertEquals(email, sentMessage.getTo()[0]);
        assertTrue(sentMessage.getText().contains("Congratulations! You have been shortlisted."));
    }

    @Test
    void testSendApplicationStatusEmail_Rejected() {
        String email = "user@test.com";
        String status = "REJECTED"; 

        // Execute
        emailService.sendApplicationStatusEmail(email, "User", "Dev", "Meta", status);

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        // Use verify(mailSender).send(...) instead of atLeastOnce() to be precise
        verify(mailSender).send(messageCaptor.capture());

        String body = messageCaptor.getValue().getText();

        // In your service it is "Unfortunately" (Capital U)
        assertTrue(body.contains("Unfortunately, your application was not selected"), 
                   "Email body did not contain the expected rejection text. Actual body: " + body);
    }
}