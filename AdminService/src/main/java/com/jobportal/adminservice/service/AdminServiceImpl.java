package com.jobportal.adminservice.service;

import com.jobportal.adminservice.client.ApplicationServiceClient;
import com.jobportal.adminservice.client.AuthServiceClient;
import com.jobportal.adminservice.client.JobServiceClient;
import com.jobportal.adminservice.dto.response.JobResponse;
import com.jobportal.adminservice.dto.response.PageResponse;
import com.jobportal.adminservice.dto.response.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final AuthServiceClient authServiceClient;
    private final JobServiceClient jobServiceClient;
    private final ApplicationServiceClient applicationServiceClient;

    // =====================================================
    // USER MANAGEMENT
    // =====================================================
    @Override
    public List<UserResponse> getAllUsers() {
        return authServiceClient.getAllUsers();
    }

    @Override
    public UserResponse getUserById(Long id) {
        return authServiceClient.getUserById(id);
    }

    @Override
    public void deleteUser(Long id) {

        // Step 1: Get user details to check role
        UserResponse user = authServiceClient.getUserById(id);

        // Step 2: Delete all applications of this user
        applicationServiceClient.deleteUserApplications(id);

        // Step 3: If recruiter → delete all their jobs too
        if (user.getRole().equalsIgnoreCase("RECRUITER")) {
            jobServiceClient.deleteRecruiterJobs(id);
        }

        // Step 4: Delete user from Auth Service
        authServiceClient.deleteUser(id);
    }

    // =====================================================
    // JOB MANAGEMENT
    // =====================================================
    @Override
    public PageResponse getAllJobs() {
        return jobServiceClient.getAllJobs();
    }

    @Override
    public JobResponse getJobById(Long id) {
        return jobServiceClient.getJobById(id);
    }

    // =====================================================
    // PLATFORM ANALYTICS
    // =====================================================
    @Override
    public Map<String, Object> getReports() {

        // Get all users from Auth Service
        List<UserResponse> users =
                authServiceClient.getAllUsers();

        // Count users by role
        long totalUsers = users.size();
        long jobSeekers = users.stream()
                .filter(u -> u.getRole()
                        .equalsIgnoreCase("JOB_SEEKER"))
                .count();
        long recruiters = users.stream()
                .filter(u -> u.getRole()
                        .equalsIgnoreCase("RECRUITER"))
                .count();

        // Get total jobs from Job Service
        PageResponse jobsPage = jobServiceClient.getAllJobs();
        long totalJobs = jobsPage.getTotalElements();

        // Get total applications from Application Service
        Long totalApplications =
                applicationServiceClient.getTotalApplications();

        return Map.of(
                "totalUsers", totalUsers,
                "jobSeekers", jobSeekers,
                "recruiters", recruiters,
                "totalJobs", totalJobs,
                "totalApplications", totalApplications
        );
    }
}
