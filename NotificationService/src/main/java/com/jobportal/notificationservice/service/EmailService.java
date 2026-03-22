package com.jobportal.notificationservice.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.jobportal.notificationservice.client.UserClient;
import com.jobportal.notificationservice.dto.UserResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    private final UserClient userClient;

    // Email to ALL Job Seekers when job is posted
    public void sendJobPostedEmailToAllJobSeekers(
            String jobTitle, String companyName,
            String location, Double salary,
            Integer experience) {

        try {
            // Get all users from Auth Service
            List<UserResponse> users =
                    userClient.getAllUsers();

            // Filter only Job Seekers
            List<UserResponse> jobSeekers = users.stream()
                    .filter(u -> u.getRole()
                            .equalsIgnoreCase("JOB_SEEKER"))
                    .collect(Collectors.toList());

            // Send email to each job seeker
            for (UserResponse jobSeeker : jobSeekers) {
                SimpleMailMessage message =
                        new SimpleMailMessage();
                message.setTo(jobSeeker.getEmail());
                message.setSubject(
                        "New Job Alert! — " + jobTitle
                        + " at " + companyName);
                message.setText(
                        "Hi " + jobSeeker.getName() + ",\n\n"
                        + "A new job has been posted!\n\n"
                        + "Job Title  : " + jobTitle + "\n"
                        + "Company    : " + companyName + "\n"
                        + "Location   : " + location + "\n"
                        + "Salary     : " + salary + "\n"
                        + "Experience : " + experience
                        + " years\n\n"
                        + "Login to Job Portal to apply now!\n\n"
                        + "Best regards,\n"
                        + "Job Portal Team"
                );
                mailSender.send(message);
                System.out.println(
                        "Job alert sent to: "
                        + jobSeeker.getEmail());
            }

        } catch (Exception e) {
            System.out.println(
                    "Failed to send job alerts: "
                    + e.getMessage());
        }
    }

    // =====================================================
    // Email 2 — Job Applied (to Recruiter)
    // Sent when a job seeker applies for a job
    // =====================================================
    public void sendJobAppliedEmail(String recruiterEmail,
            String applicantName, String applicantEmail,
            String jobTitle, String companyName) {

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(recruiterEmail);
        message.setSubject(
                "New Application Received — " + jobTitle);
        message.setText(
                "Hi Recruiter,\n\n"
                + "You have received a new application!\n\n"
                + "Job Title      : " + jobTitle + "\n"
                + "Company        : " + companyName + "\n"
                + "Applicant Name : " + applicantName + "\n"
                + "Applicant Email: " + applicantEmail + "\n\n"
                + "Login to your dashboard to review "
                + "the application.\n\n"
                + "Best regards,\n"
                + "Job Portal Team"
        );

        mailSender.send(message);
        System.out.println(
                "Job Applied email sent to: " + recruiterEmail);
    }

    // =====================================================
    // Email 3 — Application Status Changed (to Job Seeker)
    // Sent when recruiter updates application status
    // =====================================================
    public void sendApplicationStatusEmail(
            String applicantEmail, String applicantName,
            String jobTitle, String companyName,
            String status) {

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(applicantEmail);
        message.setSubject(
                "Application Update — " + jobTitle
                + " at " + companyName);
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
        System.out.println(
                "Status email sent to: " + applicantEmail);
    }

    // Helper method for status message
    private String getStatusMessage(String status) {
        return switch (status) {
            case "UNDER_REVIEW" ->
                "Your application is currently under review. "
                + "We will update you soon!";
            case "SHORTLISTED" ->
                "Congratulations! You have been shortlisted. "
                + "The recruiter will contact you shortly.";
            case "REJECTED" ->
                "Thank you for your interest. Unfortunately, "
                + "your application was not selected this time. "
                + "Keep applying!";
            default ->
                "Your application status has been updated.";
        };
    }
}
