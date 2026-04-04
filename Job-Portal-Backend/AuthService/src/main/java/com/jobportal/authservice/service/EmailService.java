package com.jobportal.authservice.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendPasswordResetOTP(String to, String otp) {
        log.info("Preparing OTP email for: {}", to);

        // Log the OTP to terminal for easy local testing in case SMTP isn't configured
        log.info("\n==============================\n" +
                "OTP (For testing): " + otp +
                "\n==============================\n");

        String subject = "Password Reset OTP - Job Portal";
        String content = String.format(
                "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>"
                        +
                        "<h2 style='color: #2c3e50; text-align: center;'>Reset Your Password</h2>" +
                        "<p>Hello,</p>" +
                        "<p>You requested to reset your password. Use the following 6-digit numeric code to complete the process:</p>"
                        +
                        "<div style='background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;'>"
                        +
                        "<span style='font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #3498db;'>%s</span>"
                        +
                        "</div>" +
                        "<p>This code will expire in <strong>10 minutes</strong>.</p>" +
                        "<p>If you did not request this, please ignore this email or contact support.</p>" +
                        "<p style='color: #7f8c8d; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;'>Do not share this OTP with anyone for security reasons.</p>"
                        +
                        "</div>",
                otp);
        sendHtmlEmail(to, subject, content);
    }

    private void sendHtmlEmail(String toEmail, String subject, String content) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(content, true); // true indicates HTML content

            mailSender.send(message);
            log.info("Password reset email sent to {}", toEmail);

        } catch (MessagingException e) {
            log.error("Failed to send password reset email to {}", toEmail, e);
            throw new RuntimeException("Failed to send email. Please try again later.");
        }
    }
}
