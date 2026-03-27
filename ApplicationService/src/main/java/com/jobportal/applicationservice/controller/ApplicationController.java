package com.jobportal.applicationservice.controller;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.jobportal.applicationservice.dto.request.ApplicationRequest;
import com.jobportal.applicationservice.dto.response.ApplicationResponse;
import com.jobportal.applicationservice.dto.response.JobApplicationResponse;
import com.jobportal.applicationservice.enums.ApplicationStatus;
import com.jobportal.applicationservice.service.ApplicationService;
import com.jobportal.applicationservice.service.CloudinaryService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ApplicationController {

    private final ApplicationService service;
    private final CloudinaryService cloudinaryService;

    // APPLY FOR JOB
    @PostMapping(value = "/apply", consumes = "multipart/form-data")
    public ResponseEntity<ApplicationResponse> applyForJobs(
            @RequestParam("jobId") Long jobId,
            @RequestParam("resume") MultipartFile resume,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") String role)
            throws IOException {

        log.info("Apply job API called | jobId: {} | userId: {} | role: {} | fileName: {}",
                jobId, userId, role, resume.getOriginalFilename());

        String resumeUrl = cloudinaryService.uploadResume(resume);

        log.debug("Resume uploaded to Cloudinary | userId: {} | url: {}", userId, resumeUrl);

        ApplicationRequest request = new ApplicationRequest();
        request.setJobId(jobId);

        ApplicationResponse response =
                service.applyForJob(request, userId, role, resumeUrl);

        log.info("Application submitted successfully | jobId: {} | userId: {}",
                jobId, userId);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // VIEW USER APPLICATIONS
    @GetMapping("/user/viewApplications")
    public ResponseEntity<List<ApplicationResponse>> getUserApplications(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") String role) {

        log.info("Fetch user applications API called | userId: {} | role: {}", userId, role);

        List<ApplicationResponse> applications =
                service.getUserApplications(userId, role);

        log.debug("User applications fetched | userId: {} | count: {}",
                userId, applications.size());

        return ResponseEntity.ok(applications);
    }

    // VIEW JOB APPLICATIONS (Recruiter)
    @GetMapping("/jobApplications/{jobId}")
    public ResponseEntity<List<JobApplicationResponse>> getJobApplications(
            @PathVariable Long jobId,
            @RequestHeader("X-User-Id") Long recruiterId,
            @RequestHeader("X-User-Role") String role) {

        log.info("Fetch job applications API called | jobId: {} | recruiterId: {} | role: {}",
                jobId, recruiterId, role);

        List<JobApplicationResponse> applications =
                service.getJobApplications(jobId, role, recruiterId);

        log.debug("Job applications fetched | jobId: {} | count: {}",
                jobId, applications.size());

        return ResponseEntity.ok(applications);
    }

    // UPDATE APPLICATION STATUS
    @PatchMapping("/jobApplication/{id}/status")
    public ResponseEntity<ApplicationResponse> updatedStatus(
            @PathVariable Long id,
            @RequestParam ApplicationStatus status,
            @RequestHeader("X-User-Id") Long recruiterId,
            @RequestHeader("X-User-Role") String role) {

        log.info("Update application status API called | applicationId: {} | status: {} | recruiterId: {}",
                id, status, recruiterId);

        ApplicationResponse response =
                service.updateStatus(id, status, recruiterId, role);

        log.info("Application status updated | applicationId: {} | status: {}",
                id, status);

        return ResponseEntity.ok(response);
    }

    // DELETE JOB APPLICATIONS (still needed when job is deleted)
    @DeleteMapping("/job/{jobId}")
    public ResponseEntity<Map<String, String>> deleteJobApplications(
            @PathVariable Long jobId) {

        log.info("Delete job applications API called | jobId: {}", jobId);

        service.deleteJobApplications(jobId);

        log.info("All applications deleted for jobId: {}", jobId);

        return ResponseEntity.ok(
                Map.of("message", "All applications for job deleted successfully!"));
    }

    // GET TOTAL APPLICATION COUNT
    @GetMapping("/count")
    public ResponseEntity<Long> getTotalApplications() {

        log.info("Get total applications count API called");

        Long count = service.getTotalApplications();

        log.debug("Total applications count: {}", count);

        return ResponseEntity.ok(count);
    }
}