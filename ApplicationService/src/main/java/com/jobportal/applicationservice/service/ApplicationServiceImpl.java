package com.jobportal.applicationservice.service;

import java.util.List;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.jobportal.applicationservice.client.JobClient;
import com.jobportal.applicationservice.client.UserClient;
import com.jobportal.applicationservice.config.RabbitMQConfig;
import com.jobportal.applicationservice.dto.event.ApplicationStatusEvent;
import com.jobportal.applicationservice.dto.event.JobAppliedEvent;
import com.jobportal.applicationservice.dto.request.ApplicationRequest;
import com.jobportal.applicationservice.dto.response.ApplicationResponse;
import com.jobportal.applicationservice.dto.response.JobApplicationResponse;
import com.jobportal.applicationservice.dto.response.JobResponse;
import com.jobportal.applicationservice.dto.response.UserResponse;
import com.jobportal.applicationservice.entity.JobApplication;
import com.jobportal.applicationservice.enums.ApplicationStatus;
import com.jobportal.applicationservice.exception.ApplicationNotFoundException;
import com.jobportal.applicationservice.exception.DuplicateApplicationException;
import com.jobportal.applicationservice.exception.UnauthorizedException;
import com.jobportal.applicationservice.repository.ApplicationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ApplicationServiceImpl implements ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final ModelMapper modelMapper;
    private final UserClient userClient;
    private final JobClient jobClient;
    private final RabbitTemplate rabbitTemplate;

    @Value("${internal.secret}")
    private String internalSecret;

    @Override
    public ApplicationResponse applyForJob(
            ApplicationRequest request, Long userId,
            String role, String resumeUrl) {
    	

        if (!role.equalsIgnoreCase("JOB_SEEKER")) {
            throw new UnauthorizedException(
                    "Access Denied! Only Job Seekers can apply for jobs.");
        }

        JobResponse job;
        try {
            job = jobClient.getJobById(request.getJobId());
        } catch (Exception e) {
            throw new RuntimeException(
                    "Job not found with id: "
                            + request.getJobId());
        }

        if (applicationRepository.existsByUserIdAndJobId(
                userId, request.getJobId())) {
            throw new DuplicateApplicationException(
                    "You have already applied for this job!");
        }

        JobApplication application = new JobApplication();
        application.setUserId(userId);
        application.setJobId(request.getJobId());
        application.setResumeUrl(resumeUrl);

        JobApplication saved =
                applicationRepository.save(application);

        ApplicationResponse response =
                modelMapper.map(saved, ApplicationResponse.class);
        response.setJob(job);

        // Publish Job Applied event
        try {
            UserResponse applicant =
                    userClient.getUserById(
                            userId, internalSecret);
            UserResponse recruiter =
                    userClient.getUserById(
                            job.getRecruiterId(), internalSecret);

            JobAppliedEvent event = new JobAppliedEvent(
                    recruiter.getEmail(),
                    applicant.getName(),
                    applicant.getEmail(),
                    job.getTitle(),
                    job.getCompanyName()
            );

            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.JOB_APPLIED_QUEUE, event);
            System.out.println("Job Applied event published!");

        } catch (Exception e) {
            System.out.println(
                    "Failed to publish event: "
                            + e.getMessage());
        }

        return response;
    }

    @Override
    public List<ApplicationResponse> getUserApplications(
            Long userId, String role) {

        if (!role.equalsIgnoreCase("JOB_SEEKER")) {
            throw new UnauthorizedException(
                    "Access Denied! Only Job Seekers can view their applications.");
        }

        return applicationRepository.findByUserId(userId)
                .stream()
                .map(app -> {
                    ApplicationResponse response =
                            modelMapper.map(app,
                                    ApplicationResponse.class);
                    try {
                        JobResponse job =
                                jobClient.getJobById(
                                        app.getJobId());
                        response.setJob(job);
                    } catch (Exception e) {
                        JobResponse job = new JobResponse();
                        job.setTitle("Job no longer available");
                        job.setCompanyName("N/A");
                        job.setLocation("N/A");
                        response.setJob(job);
                    }
                    return response;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<JobApplicationResponse> getJobApplications(
            Long jobId, String role) {

        if (!role.equalsIgnoreCase("RECRUITER")) {
            throw new UnauthorizedException(
                    "Access Denied! Only Recruiters can view job applicants.");
        }

        return applicationRepository.findByJobId(jobId)
                .stream()
                .map(app -> {
                    JobApplicationResponse response =
                            new JobApplicationResponse();
                    response.setId(app.getId());
                    response.setUserId(app.getUserId());
                    response.setJobId(app.getJobId());
                    response.setResumeUrl(app.getResumeUrl());
                    response.setStatus(app.getStatus());
                    response.setAppliedAt(app.getAppliedAt());
                    try {
                        UserResponse user =
                                userClient.getUserById(
                                        app.getUserId(),
                                        internalSecret);
                        response.setApplicantName(
                                user.getName());
                        response.setApplicantEmail(
                                user.getEmail());
                    } catch (Exception e) {
                        response.setApplicantName("N/A");
                        response.setApplicantEmail("N/A");
                    }
                    return response;
                })
                .collect(Collectors.toList());
    }

    @Override
    public ApplicationResponse updateStatus(
            Long applicationId, ApplicationStatus status,
            Long recruiterId, String role) {

        if (!role.equalsIgnoreCase("RECRUITER")) {
            throw new UnauthorizedException(
                    "Access Denied! Only Recruiters can update application status.");
        }

        JobApplication application = applicationRepository
                .findById(applicationId)
                .orElseThrow(() ->
                        new ApplicationNotFoundException(
                                "Application not found with id: "
                                        + applicationId));

        application.setStatus(status);
        JobApplication updated =
                applicationRepository.save(application);

        // Map response and set job details
        ApplicationResponse response =
                modelMapper.map(updated,
                        ApplicationResponse.class);

        try {
            JobResponse job =
                    jobClient.getJobById(updated.getJobId());
            response.setJob(job);
        } catch (Exception e) {
            System.out.println(
                    "Failed to fetch job details: "
                            + e.getMessage());
        }

        // Publish Application Status event
        try {
            UserResponse applicant =
                    userClient.getUserById(
                            updated.getUserId(), internalSecret);
            JobResponse job =
                    jobClient.getJobById(updated.getJobId());

            ApplicationStatusEvent event =
                    new ApplicationStatusEvent(
                            applicant.getEmail(),
                            applicant.getName(),
                            job.getTitle(),
                            job.getCompanyName(),
                            status.name()
                    );

            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.APPLICATION_STATUS_QUEUE,
                    event);
            System.out.println(
                    "Application Status event published!");

        } catch (Exception e) {
            System.out.println(
                    "Failed to publish status event: "
                            + e.getMessage());
        }

        return response;
    }

    @Override
    public void deleteUserApplications(Long userId) {
        applicationRepository.deleteByUserId(userId);
    }

    @Override
    public void deleteJobApplications(Long jobId) {
        applicationRepository.deleteByJobId(jobId);
    }

    @Override
    public Long getTotalApplications() {
        return applicationRepository.count();
    }
}