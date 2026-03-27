package com.jobportal.notificationservice.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.jobportal.notificationservice.client.UserClient;
import com.jobportal.notificationservice.dto.UserResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final UserClient userClient;

    @Value("${internal.secret}")
    private String internalSecret;

    public void sendJobPostedEmailToAllJobSeekers(
            String jobTitle, String companyName,
            String location, Double salary,
            Integer experience) {

        log.info("Sending job alert emails | jobTitle: {} | company: {}", jobTitle, companyName);

        try {
            List<UserResponse> users =
                    userClient.getAllUsers(internalSecret);

            log.debug("Fetched users from AuthService | totalUsers: {}", users.size());

            List<UserResponse> jobSeekers = users.stream()
                    .filter(u -> u.getRole().equalsIgnoreCase("JOB_SEEKER"))
                    .collect(Collectors.toList());

            log.info("Filtered job seekers | count: {}", jobSeekers.size());

            for (UserResponse jobSeeker : jobSeekers) {
                try {
                    SimpleMailMessage message = new SimpleMailMessage();
                    message.setTo(jobSeeker.getEmail());
                    message.setSubject("New Job Alert! — " + jobTitle + " at " + companyName);
                    message.setText(
                            "Hi " + jobSeeker.getName() + ",\n\n"
                                    + "A new job has been posted!\n\n"
                                    + "Job Title  : " + jobTitle + "\n"
                                    + "Company    : " + companyName + "\n"
                                    + "Location   : " + location + "\n"
                                    + "Salary     : " + salary + "\n"
                                    + "Experience : " + experience + " years\n\n"
                                    + "Login to Job Portal to apply now!\n\n"
                                    + "Best regards,\n"
                                    + "Job Portal Team"
                    );

                    mailSender.send(message);

                    log.debug("Email sent to job seeker | email: {}", jobSeeker.getEmail());

                } catch (Exception e) {
                    log.error("Failed to send email to job seeker | email: {}",
                            jobSeeker.getEmail(), e);
                }
            }

            log.info("Job alert emails sent successfully | jobTitle: {}", jobTitle);

        } catch (Exception e) {
            log.error("Failed to send job alert emails | jobTitle: {}", jobTitle, e);
        }
    }

    public void sendJobAppliedEmail(String recruiterEmail,
                                    String applicantName, String applicantEmail,
                                    String jobTitle, String companyName) {

        log.info("Sending job applied email | recruiterEmail: {} | jobTitle: {}",
                recruiterEmail, jobTitle);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(recruiterEmail);
            message.setSubject("New Application Received — " + jobTitle);
            message.setText(
                    "Hi Recruiter,\n\n"
                            + "You have received a new application!\n\n"
                            + "Job Title      : " + jobTitle + "\n"
                            + "Company        : " + companyName + "\n"
                            + "Applicant Name : " + applicantName + "\n"
                            + "Applicant Email: " + applicantEmail + "\n\n"
                            + "Login to your dashboard to review the application.\n\n"
                            + "Best regards,\n"
                            + "Job Portal Team"
            );

            mailSender.send(message);

            log.info("Job applied email sent successfully | recruiterEmail: {}", recruiterEmail);

        } catch (Exception e) {
            log.error("Failed to send job applied email | recruiterEmail: {}",
                    recruiterEmail, e);
        }
    }

    public void sendApplicationStatusEmail(
            String applicantEmail, String applicantName,
            String jobTitle, String companyName,
            String status) {

        log.info("Sending application status email | applicantEmail: {} | status: {}",
                applicantEmail, status);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(applicantEmail);
            message.setSubject("Application Update — " + jobTitle + " at " + companyName);
            message.setText(
                    "Hi " + applicantName + ",\n\n"
                            + "Your application status has been updated!\n\n"
                            + "Job Title : " + jobTitle + "\n"
                            + "Company   : " + companyName + "\n"
                            + "Status    : " + status + "\n\n"
                            + getStatusMessage(status)
                            + "\n\nBest regards,\n"
                            + "Job Portal Team"
            );

            mailSender.send(message);

            log.info("Application status email sent | applicantEmail: {}", applicantEmail);

        } catch (Exception e) {
            log.error("Failed to send application status email | applicantEmail: {}",
                    applicantEmail, e);
        }
    }

    private String getStatusMessage(String status) {
        return switch (status) {
            case "UNDER_REVIEW" ->
                    "Your application is currently under review. We will update you soon!";
            case "SHORTLISTED" ->
                    "Congratulations! You have been shortlisted. The recruiter will contact you shortly.";
            case "REJECTED" ->
                    "Thank you for your interest. Unfortunately, your application was not selected this time. Keep applying!";
            default ->
                    "Your application status has been updated.";
        };
    }
}

