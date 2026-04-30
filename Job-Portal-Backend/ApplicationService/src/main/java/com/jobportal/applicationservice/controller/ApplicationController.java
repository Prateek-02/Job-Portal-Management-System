package com.jobportal.applicationservice.controller;

import java.io.IOException;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

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
import com.jobportal.applicationservice.dto.response.PageResponse;
import com.jobportal.applicationservice.enums.ApplicationStatus;
import com.jobportal.applicationservice.service.ApplicationService;
import com.jobportal.applicationservice.service.CloudinaryService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor

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
    public ResponseEntity<PageResponse<ApplicationResponse>> getUserApplications(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "appliedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        log.info("Fetch user applications API called | userId: {} | role: {} | page: {}", userId, role, page);

        PageResponse<ApplicationResponse> response =
                service.getUserApplications(userId, role, page, size, sortBy, direction);

        return ResponseEntity.ok(response);
    }

    // VIEW JOB APPLICATIONS (Recruiter)
    @GetMapping("/jobApplications/{jobId}")
    public ResponseEntity<PageResponse<JobApplicationResponse>> getJobApplications(
            @PathVariable Long jobId,
            @RequestHeader("X-User-Id") Long recruiterId,
            @RequestHeader("X-User-Role") String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "appliedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        log.info("Fetch job applications API called | jobId: {} | recruiterId: {} | page: {}",
                jobId, recruiterId, page);

        PageResponse<JobApplicationResponse> response =
                service.getJobApplications(jobId, role, recruiterId, page, size, sortBy, direction);

        return ResponseEntity.ok(response);
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

    @GetMapping("/count")
    public ResponseEntity<Long> getTotalApplications() {

        log.info("Total applications count requested internally.");

        Long count = service.getTotalApplications();

        log.debug("Total applications count: {}", count);

        return ResponseEntity.ok(count);
    }

    @GetMapping("/status-counts")
    public ResponseEntity<java.util.Map<String, Long>> getCountByStatus() {
        log.info("Status-wise application counts requested internally.");
        return ResponseEntity.ok(service.getCountByStatus());
    }

    // VIEW ALL APPLICATIONS (Recruiter)
    @GetMapping("/recruiter")
    public ResponseEntity<PageResponse<JobApplicationResponse>> getAllApplicationsForRecruiter(
            @RequestHeader("X-User-Id") Long recruiterId,
            @RequestHeader("X-User-Role") String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "appliedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        
        log.info("Fetch all recruiter applications API called | recruiterId: {} | role: {} | page: {}", recruiterId, role, page);
        
        PageResponse<JobApplicationResponse> response = service.getAllApplicationsForRecruiter(recruiterId, role, page, size, sortBy, direction);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/check/{jobId}")
    public ResponseEntity<Boolean> hasApplied(@PathVariable Long jobId, @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.hasApplied(userId, jobId));
    }
}