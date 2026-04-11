package com.jobportal.authservice.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "fromEmail", "no-reply@jobportal.com");
    }

    @Test
    void sendPasswordResetOTP_Success() throws MessagingException {
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        emailService.sendPasswordResetOTP("test@example.com", "123456");

        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    void sendPasswordResetOTP_MessagingException_ThrowsRuntimeException() throws MessagingException {
        when(mailSender.createMimeMessage()).thenThrow(new RuntimeException("Messaging error"));

        assertThatThrownBy(() -> emailService.sendPasswordResetOTP("test@example.com", "123456"))
                .isInstanceOf(RuntimeException.class);
    }
    
    @Test
    void sendHtmlEmail_Fails_ThrowsRuntimeException() throws MessagingException {
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        
        // MimeMessageHelper calls setSubject on the MimeMessage, so we can mock that to throw MessagingException
        doThrow(new jakarta.mail.MessagingException("Simulated messaging error"))
                .when(mimeMessage).setSubject(anyString(), anyString());

        assertThatThrownBy(() -> emailService.sendPasswordResetOTP("test@example.com", "123456"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Failed to send email");
    }
}
