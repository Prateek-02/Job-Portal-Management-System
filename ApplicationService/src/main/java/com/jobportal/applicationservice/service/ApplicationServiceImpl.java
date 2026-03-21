package com.jobportal.applicationservice.service;

import com.jobportal.applicationservice.client.JobClient;
import com.jobportal.applicationservice.client.UserClient;
import com.jobportal.applicationservice.dto.request.ApplicationRequest;
import com.jobportal.applicationservice.dto.response.ApplicationResponse;
import com.jobportal.applicationservice.dto.response.JobApplicationResponse;
import com.jobportal.applicationservice.dto.response.JobResponse;
import com.jobportal.applicationservice.dto.response.UserResponse;
import com.jobportal.applicationservice.entity.JobApplication;
import com.jobportal.applicationservice.enums.ApplicationStatus;
import com.jobportal.applicationservice.exception.ApplicationNotFoundException;
import com.jobportal.applicationservice.exception.DuplicateApplicationException;
import com.jobportal.applicationservice.exception.UnauthorizedException;
import com.jobportal.applicationservice.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApplicationServiceImpl implements ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final ModelMapper modelMapper;
    private final UserClient userClient;
    private final JobClient jobClient;

    // =====================================================
    // APPLY FOR JOB
    // =====================================================
    @Override
    public ApplicationResponse applyForJob(
            ApplicationRequest request, Long userId, String role) {

        // Step 1: Check role is JOB_SEEKER
        if (!role.equalsIgnoreCase("JOB_SEEKER")) {
            throw new UnauthorizedException(
                    "Access Denied! Only Job Seekers can apply for jobs.");
        }

        // Step 2: Verify job exists in Job Service
        try {
            jobClient.getJobById(request.getJobId());
        } catch (Exception e) {
            throw new RuntimeException(
                    "Job not found with id: " + request.getJobId());
        }

        // Step 3: Check duplicate application
        if (applicationRepository.existsByUserIdAndJobId(
                userId, request.getJobId())) {
            throw new DuplicateApplicationException(
                    "You have already applied for this job!");
        }

        // Step 4: Build and save application
        JobApplication application = new JobApplication();
        application.setUserId(userId);
        application.setJobId(request.getJobId());
        application.setResumeUrl(request.getResumeUrl());

        JobApplication saved = applicationRepository.save(application);
        return modelMapper.map(saved, ApplicationResponse.class);
    }

    // =====================================================
    // GET USER APPLICATIONS
    // =====================================================
    @Override
    public List<ApplicationResponse> getUserApplications(
            Long userId, String role) {

        // Check role is JOB_SEEKER
        if (!role.equalsIgnoreCase("JOB_SEEKER")) {
            throw new UnauthorizedException(
                    "Access Denied! Only Job Seekers can view their applications.");
        }

        return applicationRepository.findByUserId(userId)
                .stream()
                .map(app -> {
                    ApplicationResponse response =
                            modelMapper.map(app, ApplicationResponse.class);

                    // Fetch job details
                    try {
                        JobResponse job =
                                jobClient.getJobById(app.getJobId());
                        response.setJob(job);
                    } catch (Exception e) {
                        JobResponse job = new JobResponse();
                        job.setTitle("Job no longer available");
                        job.setCompanyName("N/A");
                        job.setLocation("N/A");
                        response.setJob(job);
                    }

                    return response;
                })
                .collect(Collectors.toList());
    }

    // =====================================================
    // GET JOB APPLICATIONS
    // =====================================================
    @Override
    public List<JobApplicationResponse> getJobApplications(
            Long jobId, String role) {

        // Check role is RECRUITER
        if (!role.equalsIgnoreCase("RECRUITER")) {
            throw new UnauthorizedException(
                    "Access Denied! Only Recruiters can view job applicants.");
        }

        return applicationRepository.findByJobId(jobId)
                .stream()
                .map(app -> {
                    JobApplicationResponse response =
                            new JobApplicationResponse();
                    response.setId(app.getId());
                    response.setUserId(app.getUserId());
                    response.setJobId(app.getJobId());
                    response.setResumeUrl(app.getResumeUrl());
                    response.setStatus(app.getStatus());
                    response.setAppliedAt(app.getAppliedAt());

                    // Fetch user details
                    try {
                        UserResponse user =
                                userClient.getUserById(app.getUserId());
                        response.setApplicantName(user.getName());
                        response.setApplicantEmail(user.getEmail());
                    } catch (Exception e) {
                        response.setApplicantName("N/A");
                        response.setApplicantEmail("N/A");
                    }

                    return response;
                })
                .collect(Collectors.toList());
    }

    // =====================================================
    // UPDATE APPLICATION STATUS
    // =====================================================
    @Override
    public ApplicationResponse updateStatus(Long applicationId,
            ApplicationStatus status, Long recruiterId, String role) {

        // Check role is RECRUITER
        if (!role.equalsIgnoreCase("RECRUITER")) {
            throw new UnauthorizedException(
                    "Access Denied! Only Recruiters can update application status.");
        }

        JobApplication application = applicationRepository
                .findById(applicationId)
                .orElseThrow(() -> new ApplicationNotFoundException(
                        "Application not found with id: "
                                + applicationId));

        application.setStatus(status);
        JobApplication updated = applicationRepository.save(application);
        return modelMapper.map(updated, ApplicationResponse.class);
    }

    // =====================================================
    // DELETE USER APPLICATIONS
    // =====================================================
    @Override
    public void deleteUserApplications(Long userId) {
        applicationRepository.deleteByUserId(userId);
    }

    // =====================================================
    // DELETE JOB APPLICATIONS
    // =====================================================
    @Override
    public void deleteJobApplications(Long jobId) {
        applicationRepository.deleteByJobId(jobId);
    }
    
    //=====================================================
    // GET ALL APPLICATIONS
    // =====================================================
    @Override
    public Long getTotalApplications() {
        return applicationRepository.count();
    }
}