package com.jobportal.applicationservice.service;

import com.jobportal.applicationservice.dto.request.ApplicationRequest;
import com.jobportal.applicationservice.dto.response.ApplicationResponse;
import com.jobportal.applicationservice.dto.response.JobApplicationResponse;
import com.jobportal.applicationservice.enums.ApplicationStatus;
import com.jobportal.applicationservice.dto.response.PageResponse;

public interface ApplicationService {

    ApplicationResponse applyForJob(ApplicationRequest request, Long userId, String role, String resumeUrl);

    PageResponse<ApplicationResponse> getUserApplications(Long userId, String role, int page, int size, String sortBy, String direction);

    PageResponse<JobApplicationResponse> getJobApplications(Long jobId, String role, Long recruiterId, int page, int size, String sortBy, String direction);

    ApplicationResponse updateStatus(Long applicationId, ApplicationStatus status, Long recruiterId, String role);

    void deleteUserApplications(Long userId);

    void deleteJobApplications(Long jobId);

    Long getTotalApplications();

    PageResponse<JobApplicationResponse> getAllApplicationsForRecruiter(Long recruiterId, String role, int page, int size, String sortBy, String direction);
}