package com.jobportal.applicationservice.service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;

import org.springframework.cache.annotation.Caching;
import org.springframework.cloud.client.circuitbreaker.CircuitBreakerFactory;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

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
    public PageResponse<ApplicationResponse> getUserApplications(
            Long userId, String role, int page, int size, String sortBy, String direction) {

        log.info("Fetching user applications | userId: {} | role: {} | page: {}", userId, role, page);

        if (!role.equalsIgnoreCase("JOB_SEEKER")) {
            log.warn("Unauthorized access to user applications | userId: {} | role: {}", userId, role);
            throw new UnauthorizedException(
                    "Access Denied! Only Job Seekers can view their applications.");
        }

        Sort sort = direction.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() :
                Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<JobApplication> pageData = applicationRepository.findByUserId(userId, pageable);

        List<ApplicationResponse> content = pageData.getContent().stream()
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

        return PageResponse.<ApplicationResponse>builder()
                .content(content)
                .pageNumber(pageData.getNumber())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .last(pageData.isLast())
                .first(pageData.isFirst())
                .empty(pageData.isEmpty())
                .build();
    }

    @Override
    public PageResponse<JobApplicationResponse> getJobApplications(
            Long jobId, String role, Long recruiterId, int page, int size, String sortBy, String direction) {

        log.info("Fetching job applications | jobId: {} | recruiterId: {} | page: {}", jobId, recruiterId, page);

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

        Sort sort = direction.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() :
                Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<JobApplication> pageData = applicationRepository.findByJobId(jobId, pageable);

        List<JobApplicationResponse> content = pageData.getContent().stream()
                .map(app -> {
                    JobApplicationResponse response = new JobApplicationResponse();
                    response.setId(app.getId());
                    response.setUserId(app.getUserId());
                    response.setJobId(app.getJobId());
                    response.setResumeUrl(app.getResumeUrl());
                    response.setStatus(app.getStatus());
                    response.setAppliedAt(app.getAppliedAt());
                    response.setJobTitle(job.getTitle());
                    response.setCompanyName(job.getCompanyName());

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

        return PageResponse.<JobApplicationResponse>builder()
                .content(content)
                .pageNumber(pageData.getNumber())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .last(pageData.isLast())
                .first(pageData.isFirst())
                .empty(pageData.isEmpty())
                .build();
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

    @Override
    public PageResponse<JobApplicationResponse> getAllApplicationsForRecruiter(
            Long recruiterId, String role, int page, int size, String sortBy, String direction) {
        log.info("Fetching all applications for recruiter | recruiterId: {} | page: {}", recruiterId, page);

        if (!role.equalsIgnoreCase("RECRUITER")) {
            log.warn("Unauthorized access to recruiter applications | recruiterId: {} | role: {}", recruiterId, role);
            throw new UnauthorizedException("Access Denied! Only Recruiters can view applications.");
        }

        // 1. Fetch all jobs posted by this recruiter from JobService (using a large size to get all, or we could paginate this too)
        // Here we use the provided pagination for the AGGREGATED list, but we need all jobs first.
        // For simplicity, we fetch up to 1000 jobs.
        PageResponse<JobResponse> recruiterJobsPage = jobClient.getJobsByRecruiter(recruiterId, 0, 1000, "createdAt", "desc");
        List<JobResponse> recruiterJobs = recruiterJobsPage.getContent();
        
        List<JobApplicationResponse> allApplications = new ArrayList<>();

        // 2. For each job, fetch applications
        // Note: This approach is NOT ideal for large datasets (N+1 query problem).
        // Ideally, we'd have a findByJobIdIn method in the repository.
        for (JobResponse job : recruiterJobs) {
            try {
                // Fetching ALL applications for each job to aggregate them.
                // We use a large size 1000 to get them all for the local sort/page.
                PageResponse<JobApplicationResponse> jobApps = getJobApplications(job.getId(), role, recruiterId, 0, 1000, "appliedAt", "desc");
                allApplications.addAll(jobApps.getContent());
            } catch (Exception e) {
                log.warn("Failed to fetch applications for jobId: {} | recruiterId: {}", job.getId(), recruiterId);
            }
        }

        // 3. Sort by applied date descending
        allApplications.sort((a, b) -> b.getAppliedAt().compareTo(a.getAppliedAt()));

        // 4. Manually paginate the aggregated list
        int start = Math.min(page * size, allApplications.size());
        int end = Math.min(start + size, allApplications.size());
        List<JobApplicationResponse> pagedList = allApplications.subList(start, end);

        int totalPages = (int) Math.ceil((double) allApplications.size() / size);

        return PageResponse.<JobApplicationResponse>builder()
                .content(pagedList)
                .pageNumber(page)
                .pageSize(size)
                .totalElements(allApplications.size())
                .totalPages(totalPages)
                .last(page >= totalPages - 1)
                .first(page == 0)
                .empty(allApplications.isEmpty())
                .build();
    }
}

