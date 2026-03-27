package com.jobportal.applicationservice.service;

import com.jobportal.applicationservice.dto.request.ApplicationRequest;
import com.jobportal.applicationservice.dto.response.ApplicationResponse;
import com.jobportal.applicationservice.dto.response.JobApplicationResponse;
import com.jobportal.applicationservice.enums.ApplicationStatus;

import java.util.List;

public interface ApplicationService {

    ApplicationResponse applyForJob(ApplicationRequest request, Long userId, String role, String resumeUrl);

    List<ApplicationResponse> getUserApplications(Long userId, String role);

    List<JobApplicationResponse> getJobApplications(Long jobId, String role, Long recruiterId);

    ApplicationResponse updateStatus(Long applicationId, ApplicationStatus status, Long recruiterId, String role);

    void deleteUserApplications(Long userId);

    void deleteJobApplications(Long jobId);

    Long getTotalApplications();
}