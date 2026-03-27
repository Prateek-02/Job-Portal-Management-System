package com.jobportal.adminservice.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
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

    @Value("${internal.secret}")
    private String internalSecret;

    @Override
    public List<UserResponse> getAllUsers() {

        log.info("Fetching all users from AuthService");

        List<UserResponse> users =
                authServiceClient.getAllUsers(internalSecret);

        log.debug("Users fetched | count: {}", users.size());

        return users;
    }

    @Override
    public UserResponse getUserById(Long id) {

        log.info("Fetching user by ID | userId: {}", id);

        UserResponse user =
                authServiceClient.getUserById(id, internalSecret);

        log.info("User fetched successfully | userId: {}", id);

        return user;
    }

    @Override
    public void deleteUser(Long id) {

        log.info("Starting USER DELETE SAGA | userId: {}", id);

        UserResponse user =
                authServiceClient.getUserById(id, internalSecret);

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
                jobServiceClient.getAllJobs();

        log.debug("Jobs fetched successfully");

        return jobs;
    }

    @Override
    public JobResponse getJobById(Long id) {

        log.info("Fetching job by ID | jobId: {}", id);

        JobResponse job =
                jobServiceClient.getJobById(id);

        log.info("Job fetched successfully | jobId: {}", id);

        return job;
    }

    @Override
    public Map<String, Object> getReports() {

        log.info("Generating platform reports");

        List<UserResponse> users =
                authServiceClient.getAllUsers(internalSecret);

        long totalUsers = users.size();
        long jobSeekers = users.stream()
                .filter(u -> u.getRole().equalsIgnoreCase("JOB_SEEKER"))
                .count();
        long recruiters = users.stream()
                .filter(u -> u.getRole().equalsIgnoreCase("RECRUITER"))
                .count();

        PageResponse jobsPage = jobServiceClient.getAllJobs();
        long totalJobs = jobsPage.getTotalElements();

        Long totalApplications =
                applicationServiceClient.getTotalApplications();

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