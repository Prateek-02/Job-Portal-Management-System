package com.jobportal.adminservice.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.client.circuitbreaker.CircuitBreakerFactory;
import org.springframework.stereotype.Service;

import com.jobportal.adminservice.client.ApplicationServiceClient;
import com.jobportal.adminservice.client.AuthServiceClient;
import com.jobportal.adminservice.client.JobServiceClient;
import com.jobportal.adminservice.dto.response.JobResponse;
import com.jobportal.adminservice.dto.response.PageResponse;
import com.jobportal.adminservice.dto.response.UserResponse;
import com.jobportal.adminservice.event.UserDeleteEvent;
import com.jobportal.adminservice.producer.UserDeleteProducer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final AuthServiceClient authServiceClient;
    private final JobServiceClient jobServiceClient;
    private final ApplicationServiceClient applicationServiceClient;
    private final UserDeleteProducer userDeleteProducer;
    private final CircuitBreakerFactory<?, ?> circuitBreakerFactory;

    @Value("${internal.secret}")
    private String internalSecret;

    @Override
    public List<UserResponse> getAllUsers() {

        log.info("Fetching all users from AuthService");

        List<UserResponse> users =
                circuitBreakerFactory.create("adminAuthService")
                        .run(() -> authServiceClient.getAllUsers(internalSecret),
                                throwable -> {
                                    log.error("AuthService unavailable while fetching users", throwable);
                                    throw new RuntimeException("AuthService is unavailable. Please try again.");
                                });

        log.debug("Users fetched | count: {}", users.size());

        return users;
    }

    @Override
    public UserResponse getUserById(Long id) {

        log.info("Fetching user by ID | userId: {}", id);

        UserResponse user =
                circuitBreakerFactory.create("adminAuthService")
                        .run(() -> authServiceClient.getUserById(id, internalSecret),
                                throwable -> {
                                    if (throwable instanceof feign.FeignException fe && fe.status() == 404) {
                                        log.warn("User not found | userId: {}", id);
                                        throw new RuntimeException("User not found with id: " + id);
                                    }
                                    log.error("AuthService unavailable while fetching userId: {}", id, throwable);
                                    throw new RuntimeException("AuthService is unavailable. Please try again.");
                                });

        log.info("User fetched successfully | userId: {}", id);

        return user;
    }

    @Override
    public void deleteUser(Long id) {

        log.info("Starting USER DELETE SAGA | userId: {}", id);

        UserResponse user =
                circuitBreakerFactory.create("adminAuthService")
                        .run(() -> authServiceClient.getUserById(id, internalSecret),
                                throwable -> {
                                    if (throwable instanceof feign.FeignException fe && fe.status() == 404) {
                                        log.warn("User not found | userId: {}", id);
                                        throw new RuntimeException("User not found with id: " + id);
                                    }
                                    log.error("AuthService unavailable while starting delete saga for userId: {}", id, throwable);
                                    throw new RuntimeException("AuthService is unavailable. Please try again.");
                                });

        log.debug("User role identified | userId: {} | role: {}",
                id, user.getRole());

        UserDeleteEvent event = new UserDeleteEvent(
                id,
                user.getRole(),
                "STARTED",
                null
        );

        userDeleteProducer.startSaga(event);

        log.info("User delete saga triggered | userId: {}", id);
    }

    @Override
    public PageResponse getAllJobs() {

        log.info("Fetching all jobs from JobService");

        PageResponse jobs =
                circuitBreakerFactory.create("adminJobService")
                        .run(jobServiceClient::getAllJobs,
                                throwable -> {
                                    log.error("JobService unavailable while fetching jobs", throwable);
                                    throw new RuntimeException("JobService is unavailable. Please try again.");
                                });

        log.debug("Jobs fetched successfully");

        return jobs;
    }

    @Override
    public JobResponse getJobById(Long id) {

        log.info("Fetching job by ID | jobId: {}", id);

        JobResponse job =
                circuitBreakerFactory.create("adminJobService")
                        .run(() -> jobServiceClient.getJobById(id),
                                throwable -> {
                                    if (throwable instanceof feign.FeignException fe && fe.status() == 404) {
                                        log.warn("Job not found | jobId: {}", id);
                                        throw new RuntimeException("Job not found with id: " + id);
                                    }
                                    log.error("JobService unavailable while fetching jobId: {}", id, throwable);
                                    throw new RuntimeException("JobService is unavailable. Please try again.");
                                });

        log.info("Job fetched successfully | jobId: {}", id);

        return job;
    }

    @Override
    public Map<String, Object> getReports() {

        log.info("Generating platform reports");

        List<UserResponse> users =
                circuitBreakerFactory.create("adminAuthService")
                        .run(() -> authServiceClient.getAllUsers(internalSecret),
                                throwable -> {
                                    log.error("AuthService unavailable while building reports", throwable);
                                    throw new RuntimeException("AuthService is unavailable. Cannot build reports.");
                                });

        long totalUsers = users.size();
        long jobSeekers = users.stream()
                .filter(u -> u.getRole().equalsIgnoreCase("JOB_SEEKER"))
                .count();
        long recruiters = users.stream()
                .filter(u -> u.getRole().equalsIgnoreCase("RECRUITER"))
                .count();

        PageResponse jobsPage = circuitBreakerFactory.create("adminJobService")
                .run(jobServiceClient::getAllJobs,
                        throwable -> {
                            log.error("JobService unavailable while building reports", throwable);
                            throw new RuntimeException("JobService is unavailable. Cannot build reports.");
                        });
        long totalJobs = jobsPage.getTotalElements();

        Long totalApplications =
                circuitBreakerFactory.create("adminApplicationService")
                        .run(applicationServiceClient::getTotalApplications,
                                throwable -> {
                                    log.error("ApplicationService call failed while building reports. Reason: {}", 
                                            throwable.getMessage(), throwable);
                                    throw new RuntimeException("ApplicationService is unavailable (" + throwable.getMessage() + "). Cannot build reports.");
                                });

        log.info("Reports generated | users: {} | jobSeekers: {} | recruiters: {} | jobs: {} | applications: {}",
                totalUsers, jobSeekers, recruiters, totalJobs, totalApplications);

        return Map.of(
                "totalUsers", totalUsers,
                "jobSeekers", jobSeekers,
                "recruiters", recruiters,
                "totalJobs", totalJobs,
                "totalApplications", totalApplications
        );
    }
}