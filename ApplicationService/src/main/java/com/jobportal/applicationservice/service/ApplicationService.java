package com.jobportal.applicationservice.service;

import com.jobportal.applicationservice.dto.request.ApplicationRequest;
import com.jobportal.applicationservice.dto.response.ApplicationResponse;
import com.jobportal.applicationservice.dto.response.JobApplicationResponse;
import com.jobportal.applicationservice.enums.ApplicationStatus;

import java.util.List;

public interface ApplicationService {

    // Job Seeker applies for a job
    ApplicationResponse applyForJob(
            ApplicationRequest request, Long userId, String role);

    // Job Seeker views their own applications
    List<ApplicationResponse> getUserApplications(
            Long userId, String role);

    // Recruiter views all applicants for a job
    List<JobApplicationResponse> getJobApplications(
            Long jobId, String role);

    // Recruiter updates application status
    ApplicationResponse updateStatus(Long applicationId,
            ApplicationStatus status, Long recruiterId, String role);

    // Delete all applications by userId
    void deleteUserApplications(Long userId);

    // Delete all applications by jobId
    void deleteJobApplications(Long jobId);
    
    // Get all applications
    Long getTotalApplications();
}