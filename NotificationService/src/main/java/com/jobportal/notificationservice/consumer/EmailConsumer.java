package com.jobportal.notificationservice.consumer;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.jobportal.notificationservice.config.RabbitMQConfig;
import com.jobportal.notificationservice.dto.ApplicationStatusEvent;
import com.jobportal.notificationservice.dto.JobAppliedEvent;
import com.jobportal.notificationservice.dto.JobPostedEvent;
import com.jobportal.notificationservice.service.EmailService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class EmailConsumer {

    private final EmailService emailService;

    // Listens: email.job-posted
    // Triggered by: Job Service when job is created
    // Sends email to: All Job Seekers
    @RabbitListener(queues = RabbitMQConfig.JOB_POSTED_QUEUE)
    public void handleJobPosted(JobPostedEvent event) {
        System.out.println(
                "Received job posted event: "
                + event.getJobTitle());

        emailService.sendJobPostedEmailToAllJobSeekers(
                event.getJobTitle(),
                event.getCompanyName(),
                event.getLocation(),
                event.getSalary(),
                event.getExperience()
        );
    }

    // Listens: email.job-applied
    // Triggered by: Application Service when someone applies
    // Sends email to: Recruiter
    @RabbitListener(queues = RabbitMQConfig.JOB_APPLIED_QUEUE)
    public void handleJobApplied(JobAppliedEvent event) {
        System.out.println(
                "Received job applied event: "
                + event.getJobTitle());

        emailService.sendJobAppliedEmail(
                event.getRecruiterEmail(),
                event.getApplicantName(),
                event.getApplicantEmail(),
                event.getJobTitle(),
                event.getCompanyName()
        );
    }

    // Listens: email.application-status
    // Triggered by: Application Service when status changes
    // Sends email to: Job Seeker
    @RabbitListener(
            queues = RabbitMQConfig.APPLICATION_STATUS_QUEUE)
    public void handleApplicationStatus(
            ApplicationStatusEvent event) {
        System.out.println(
                "Received status change event: "
                + event.getStatus()
                + " for " + event.getApplicantEmail());

        emailService.sendApplicationStatusEmail(
                event.getApplicantEmail(),
                event.getApplicantName(),
                event.getJobTitle(),
                event.getCompanyName(),
                event.getStatus()
        );
    }
}