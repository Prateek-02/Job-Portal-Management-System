package com.jobportal.adminservice.service;

import com.jobportal.adminservice.dto.response.JobResponse;
import com.jobportal.adminservice.dto.response.PageResponse;
import com.jobportal.adminservice.dto.response.UserResponse;

import java.util.List;
import java.util.Map;

public interface AdminService {

    // User Management
    List<UserResponse> getAllUsers();
    UserResponse getUserById(Long id);
    void deleteUser(Long id);

    // Job Management
    PageResponse getAllJobs();
    JobResponse getJobById(Long id);

    // Reports
    Map<String, Object> getReports();
}
