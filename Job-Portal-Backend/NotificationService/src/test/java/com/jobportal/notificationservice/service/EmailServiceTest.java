package com.jobportal.notificationservice.service;

import com.jobportal.notificationservice.client.UserClient;
import com.jobportal.notificationservice.dto.UserResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.client.circuitbreaker.CircuitBreaker;
import org.springframework.cloud.client.circuitbreaker.CircuitBreakerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.function.Function;
import java.util.function.Supplier;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private UserClient userClient;

    @Mock
    private CircuitBreakerFactory<?, ?> circuitBreakerFactory;

    @Mock
    private CircuitBreaker circuitBreaker;

    @InjectMocks
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "internalSecret", "test-secret");
    }

    @Test
    @SuppressWarnings("unchecked")
    void sendJobPostedEmailToAllJobSeekers_Success() {
        UserResponse user1 = new UserResponse(1L, "Seeker", "seeker@test.com", "JOB_SEEKER");
        UserResponse user2 = new UserResponse(2L, "Recruiter", "recruiter@test.com", "RECRUITER");
        
        when(circuitBreakerFactory.create(anyString())).thenReturn(circuitBreaker);
        when(circuitBreaker.run(any(Supplier.class), any(Function.class))).thenAnswer(invocation -> {
            Supplier<List<UserResponse>> supplier = invocation.getArgument(0);
            return supplier.get();
        });
        when(userClient.getAllUsers(anyString())).thenReturn(List.of(user1, user2));

        emailService.sendJobPostedEmailToAllJobSeekers("Dev", "Google", "Remote", 100000.0, 2);

        verify(mailSender, times(1)).send(any(SimpleMailMessage.class));
    }

    @Test
    @SuppressWarnings("unchecked")
    void sendJobPostedEmailToAllJobSeekers_CircuitBreakerFallback() {
        when(circuitBreakerFactory.create(anyString())).thenReturn(circuitBreaker);
        when(circuitBreaker.run(any(Supplier.class), any(Function.class))).thenAnswer(invocation -> {
            Function<Throwable, List<UserResponse>> fallback = invocation.getArgument(1);
            return fallback.apply(new RuntimeException("Down"));
        });

        emailService.sendJobPostedEmailToAllJobSeekers("Dev", "Google", "Remote", 100000.0, 2);

        verify(mailSender, times(0)).send(any(SimpleMailMessage.class));
    }

    @Test
    @SuppressWarnings("unchecked")
    void sendJobPostedEmail_MailSenderError_SwallowsException() {
        UserResponse user1 = new UserResponse(1L, "Seeker", "seeker@test.com", "JOB_SEEKER");
        when(circuitBreakerFactory.create(anyString())).thenReturn(circuitBreaker);
        when(circuitBreaker.run(any(Supplier.class), any(Function.class))).thenReturn(List.of(user1));
        doThrow(new RuntimeException("Mail server down")).when(mailSender).send(any(SimpleMailMessage.class));

        emailService.sendJobPostedEmailToAllJobSeekers("Dev", "Google", "Remote", 100000.0, 2);

        verify(mailSender, times(1)).send(any(SimpleMailMessage.class));
    }

    @Test
    void sendJobAppliedEmail_Success() {
        emailService.sendJobAppliedEmail("rec@test.com", "App", "app@test.com", "Dev", "Comp");
        verify(mailSender, times(1)).send(any(SimpleMailMessage.class));
    }

    @Test
    void sendJobAppliedEmail_Error_SwallowsException() {
        doThrow(new RuntimeException("Error")).when(mailSender).send(any(SimpleMailMessage.class));
        emailService.sendJobAppliedEmail("rec@test.com", "App", "app@test.com", "Dev", "Comp");
        verify(mailSender, times(1)).send(any(SimpleMailMessage.class));
    }

    @Test
    void sendApplicationStatusEmail_Success() {
        String[] statuses = {"UNDER_REVIEW", "SHORTLISTED", "REJECTED", "OTHER"};
        for (String status : statuses) {
            emailService.sendApplicationStatusEmail("app@test.com", "App", "Dev", "Comp", status);
        }
        verify(mailSender, times(4)).send(any(SimpleMailMessage.class));
    }

    @Test
    void sendApplicationStatusEmail_Error_SwallowsException() {
        doThrow(new RuntimeException("Error")).when(mailSender).send(any(SimpleMailMessage.class));
        emailService.sendApplicationStatusEmail("app@test.com", "App", "Dev", "Comp", "REJECTED");
        verify(mailSender, times(1)).send(any(SimpleMailMessage.class));
    }
}