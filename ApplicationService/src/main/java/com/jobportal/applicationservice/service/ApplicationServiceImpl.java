package com.jobportal.applicationservice.service;

import java.util.List;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.cloud.client.circuitbreaker.CircuitBreakerFactory;
import org.springframework.stereotype.Service;

import com.jobportal.applicationservice.client.JobClient;
import com.jobportal.applicationservice.client.UserClient;
import com.jobportal.applicationservice.config.RabbitMQConfig;
import com.jobportal.applicationservice.dto.event.*;
import com.jobportal.applicationservice.dto.request.ApplicationRequest;
import com.jobportal.applicationservice.dto.response.*;
import com.jobportal.applicationservice.entity.JobApplication;
import com.jobportal.applicationservice.enums.ApplicationStatus;
import com.jobportal.applicationservice.exception.*;
import com.jobportal.applicationservice.repository.ApplicationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApplicationServiceImpl implements ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final ModelMapper modelMapper;
    private final UserClient userClient;
    private final JobClient jobClient;
    private final RabbitTemplate rabbitTemplate;
    private final CircuitBreakerFactory<?, ?> circuitBreakerFactory;

    @Value("${internal.secret}")
    private String internalSecret;

    @Override
    @Caching(evict = {
            @CacheEvict(value = "userApplications", key = "#userId"),
            @CacheEvict(value = "jobApplications", key = "#request.jobId")
    })
    public ApplicationResponse applyForJob(
            ApplicationRequest request, Long userId,
            String role, String resumeUrl) {

        log.info("Apply job service called | userId: {} | jobId: {} | role: {}",
                userId, request.getJobId(), role);

        if (!role.equalsIgnoreCase("JOB_SEEKER")) {
            log.warn("Unauthorized apply attempt | userId: {} | role: {}", userId, role);
            throw new UnauthorizedException(
                    "Access Denied! Only Job Seekers can apply for jobs.");
        }

        JobResponse job;
        try {
            job = fetchJobByIdWithCircuitBreaker(request.getJobId());
            log.debug("Fetched job details | jobId: {}", request.getJobId());
        } catch (RuntimeException e) {
            log.warn("Failed to fetch job | jobId: {} | reason: {}", request.getJobId(), e.getMessage());
            throw e;
        }

        if (applicationRepository.existsByUserIdAndJobId(
                userId, request.getJobId())) {
            log.warn("Duplicate application attempt | userId: {} | jobId: {}",
                    userId, request.getJobId());
            throw new DuplicateApplicationException(
                    "You have already applied for this job!");
        }

        UserResponse applicant;
        try {
            applicant = fetchUserByIdWithCircuitBreaker(userId);
        } catch (RuntimeException e) {
            log.warn("Failed to fetch user | userId: {} | reason: {}", userId, e.getMessage());
            throw e;
        }

        JobApplication application = new JobApplication();
        application.setUserId(userId);
        application.setJobId(request.getJobId());
        application.setUserName(applicant.getName());
        application.setUserEmail(applicant.getEmail());
        application.setResumeUrl(resumeUrl);

        JobApplication saved = applicationRepository.save(application);

        log.info("Application saved | applicationId: {} | userId: {} | jobId: {}",
                saved.getId(), userId, request.getJobId());

        ApplicationResponse response = modelMapper.map(saved, ApplicationResponse.class);
        response.setJob(job);

        

        // Publish Job Applied event
        try {
            UserResponse recruiter = fetchUserByIdWithCircuitBreaker(job.getRecruiterId());

            JobAppliedEvent event = new JobAppliedEvent(
                    recruiter.getEmail(),
                    applicant.getName(),
                    applicant.getEmail(),
                    job.getTitle(),
                    job.getCompanyName()
            );

            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.JOB_APPLIED_QUEUE, event);

            log.info("Job applied event published | applicationId: {}", saved.getId());

        } catch (Exception e) {
            log.error("Failed to publish job applied event | applicationId: {}",
                    saved.getId(), e);
        }

        return response;
    }

    @Override
    @Cacheable(value = "userApplications", key = "#userId")
    public List<ApplicationResponse> getUserApplications(
            Long userId, String role) {

        log.info("Fetching user applications | userId: {} | role: {}", userId, role);

        if (!role.equalsIgnoreCase("JOB_SEEKER")) {
            log.warn("Unauthorized access to user applications | userId: {} | role: {}", userId, role);
            throw new UnauthorizedException(
                    "Access Denied! Only Job Seekers can view their applications.");
        }

        List<ApplicationResponse> result = applicationRepository.findByUserId(userId)
                .stream()
                .map(app -> {
                    ApplicationResponse response =
                            modelMapper.map(app, ApplicationResponse.class);
                    try {
                        JobResponse job = fetchJobByIdWithCircuitBreaker(app.getJobId());
                        response.setJob(job);
                    } catch (Exception e) {
                        log.warn("Job not available | jobId: {}", app.getJobId());
                        JobResponse job = new JobResponse();
                        job.setTitle("Job no longer available");
                        job.setCompanyName("N/A");
                        job.setLocation("N/A");
                        response.setJob(job);
                    }
                    return response;
                })
                .collect(Collectors.toList());

        log.debug("Applications fetched | userId: {} | count: {}", userId, result.size());

        return result;
    }

    @Override
    @Cacheable(value = "jobApplications", key = "#jobId")
    public List<JobApplicationResponse> getJobApplications(
            Long jobId, String role, Long recruiterId) {

        log.info("Fetching job applications | jobId: {} | recruiterId: {}", jobId, recruiterId);

        if (!role.equalsIgnoreCase("RECRUITER")) {
            log.warn("Unauthorized access to job applications | recruiterId: {} | role: {}", recruiterId, role);
            throw new UnauthorizedException(
                    "Access Denied! Only Recruiters can view job applicants.");
        }

        JobResponse job = fetchJobByIdWithCircuitBreaker(jobId);

        if (!job.getRecruiterId().equals(recruiterId)) {
            log.warn("Unauthorized job access | jobId: {} | recruiterId: {}", jobId, recruiterId);
            throw new UnauthorizedException(
                    "Access Denied! You can view applications for your own jobs.");
        }

        List<JobApplicationResponse> result =
                applicationRepository.findByJobId(jobId)
                        .stream()
                        .map(app -> {
                            JobApplicationResponse response = new JobApplicationResponse();
                            response.setId(app.getId());
                            response.setUserId(app.getUserId());
                            response.setJobId(app.getJobId());
                            response.setResumeUrl(app.getResumeUrl());
                            response.setStatus(app.getStatus());
                            response.setAppliedAt(app.getAppliedAt());

                            try {
                                UserResponse user =
                                        fetchUserByIdWithCircuitBreaker(app.getUserId());
                                response.setApplicantName(user.getName());
                                response.setApplicantEmail(user.getEmail());
                            } catch (Exception e) {
                                log.warn("Failed to fetch applicant details | userId: {}", app.getUserId());
                                response.setApplicantName("N/A");
                                response.setApplicantEmail("N/A");
                            }
                            return response;
                        })
                        .collect(Collectors.toList());

        log.debug("Job applications fetched | jobId: {} | count: {}", jobId, result.size());

        return result;
    }

    @Override
    @Caching(evict = {
            @CacheEvict(value = "userApplications", allEntries = true),
            @CacheEvict(value = "jobApplications", key = "#result.job.id", condition = "#result != null")
    })
    public ApplicationResponse updateStatus(
            Long applicationId, ApplicationStatus status,
            Long recruiterId, String role) {

        log.info("Update application status | applicationId: {} | status: {} | recruiterId: {}",
                applicationId, status, recruiterId);

        if (!role.equalsIgnoreCase("RECRUITER")) {
            log.warn("Unauthorized status update attempt | recruiterId: {}", recruiterId);
            throw new UnauthorizedException(
                    "Access Denied! Only Recruiters can update application status.");
        }

        JobApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> {
                    log.error("Application not found | applicationId: {}", applicationId);
                    return new ApplicationNotFoundException(
                            "Application not found with id: " + applicationId);
                });

        JobResponse job = fetchJobByIdWithCircuitBreaker(application.getJobId());

        if (!job.getRecruiterId().equals(recruiterId)) {
            log.warn("Unauthorized status update | applicationId: {} | recruiterId: {}",
                    applicationId, recruiterId);
            throw new UnauthorizedException(
                    "Access Denied! You can only update applications for your own jobs.");
        }

        application.setStatus(status);
        JobApplication updated = applicationRepository.save(application);

        log.info("Application status updated | applicationId: {} | status: {}",
                applicationId, status);

        ApplicationResponse response =
                modelMapper.map(updated, ApplicationResponse.class);

        try {
            JobResponse job1 = fetchJobByIdWithCircuitBreaker(updated.getJobId());
            response.setJob(job1);
        } catch (Exception e) {
            log.warn("Failed to fetch job details | jobId: {}", updated.getJobId());
        }

        // Publish status event
        try {
            UserResponse applicant =
                    fetchUserByIdWithCircuitBreaker(updated.getUserId());
            JobResponse job1 =
                    fetchJobByIdWithCircuitBreaker(updated.getJobId());

            ApplicationStatusEvent event =
                    new ApplicationStatusEvent(
                            applicant.getEmail(),
                            applicant.getName(),
                            job1.getTitle(),
                            job1.getCompanyName(),
                            status.name()
                    );

            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.APPLICATION_STATUS_QUEUE, event);

            log.info("Application status event published | applicationId: {}", applicationId);

        } catch (Exception e) {
            log.error("Failed to publish status event | applicationId: {}", applicationId, e);
        }

        return response;
    }

    @Override
    @CacheEvict(value = "userApplications", key = "#userId")
    public void deleteUserApplications(Long userId) {
        log.info("Deleting applications for userId: {}", userId);
        applicationRepository.deleteByUserId(userId);
    }

    @Override
    @CacheEvict(value = "jobApplications", key = "#jobId")
    public void deleteJobApplications(Long jobId) {
        log.info("Deleting applications for jobId: {}", jobId);
        applicationRepository.deleteByJobId(jobId);
    }

    @Override
    public Long getTotalApplications() {
        Long count = applicationRepository.count();
        log.debug("Total applications count: {}", count);
        return count;
    }

    private UserResponse fetchUserByIdWithCircuitBreaker(Long userId) {
        return circuitBreakerFactory.create("applicationAuthService")
                .run(() -> userClient.getUserById(userId, internalSecret),
                        throwable -> {
                            if (throwable instanceof feign.FeignException fe) {
                                if (fe.status() == 404) {
                                    log.warn("User not found | userId: {}", userId);
                                    throw new RuntimeException("User not found with id: " + userId);
                                }
                            }
                            log.error("AuthService unavailable | userId: {}", userId, throwable);
                            throw new RuntimeException("AuthService unavailable. Please try again.");
                        });
    }

    private JobResponse fetchJobByIdWithCircuitBreaker(Long jobId) {
        return circuitBreakerFactory.create("applicationJobService")
                .run(() -> jobClient.getJobById(jobId),
                        throwable -> {
                            if (throwable instanceof feign.FeignException fe) {
                                if (fe.status() == 404) {
                                    log.warn("Job not found | jobId: {}", jobId);
                                    throw new RuntimeException("Job not found with id: " + jobId);
                                }
                            }
                            log.error("JobService unavailable | jobId: {}", jobId, throwable);
                            throw new RuntimeException("JobService unavailable. Please try again.");
                        });
    }
}

