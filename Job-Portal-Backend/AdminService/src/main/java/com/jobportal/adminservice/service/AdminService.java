package com.jobportal.adminservice.service;

import com.jobportal.adminservice.dto.response.JobResponse;
import com.jobportal.adminservice.dto.response.PageResponse;
import com.jobportal.adminservice.dto.response.UserResponse;


import java.util.Map;

public interface AdminService {

    // User Management
    PageResponse<UserResponse> getAllUsers(int page, int size, String sortBy, String direction);
    UserResponse getUserById(Long id);
    void deleteUser(Long id);

    // Job Management
    PageResponse<JobResponse> getAllJobs(int page, int size, String sortBy, String direction);
    JobResponse getJobById(Long id);

    // Reports
    Map<String, Object> getReports();
}
