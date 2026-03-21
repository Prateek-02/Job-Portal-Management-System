package com.jobportal.applicationservice.controller;

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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.jobportal.applicationservice.dto.request.ApplicationRequest;
import com.jobportal.applicationservice.dto.response.ApplicationResponse;
import com.jobportal.applicationservice.dto.response.JobApplicationResponse;
import com.jobportal.applicationservice.enums.ApplicationStatus;
import com.jobportal.applicationservice.service.ApplicationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ApplicationController {

    private final ApplicationService service;

    // =====================================================
    // POST /api/applications/apply
    // Job Seeker applies for a job
    // =====================================================
    @PostMapping("/apply")
    public ResponseEntity<ApplicationResponse> applyForJobs(
            @Valid @RequestBody ApplicationRequest request,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") String role) {

        ApplicationResponse response =
                service.applyForJob(request, userId, role);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // =====================================================
    // GET /api/applications/user/viewApplications
    // Job Seeker views their own applications
    // =====================================================
    @GetMapping("/user/viewApplications")
    public ResponseEntity<List<ApplicationResponse>> getUserApplications(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") String role) {

        List<ApplicationResponse> applications =
                service.getUserApplications(userId, role);
        return ResponseEntity.ok(applications);
    }

    // =====================================================
    // GET /api/applications/jobApplications/{jobId}
    // Recruiter views all applicants for a job
    // =====================================================
    @GetMapping("/jobApplications/{jobId}")
    public ResponseEntity<List<JobApplicationResponse>> getJobApplications(
            @PathVariable Long jobId,
            @RequestHeader("X-User-Role") String role) {

        List<JobApplicationResponse> applications =
                service.getJobApplications(jobId, role);
        return ResponseEntity.ok(applications);
    }

    // =====================================================
    // PATCH /api/applications/jobApplication/{id}/status
    // Recruiter updates application status
    // =====================================================
    @PatchMapping("/jobApplication/{id}/status")
    public ResponseEntity<ApplicationResponse> updatedStatus(
            @PathVariable Long id,
            @RequestParam ApplicationStatus status,
            @RequestHeader("X-User-Id") Long recruiterId,
            @RequestHeader("X-User-Role") String role) {

        ApplicationResponse response =
                service.updateStatus(id, status, recruiterId, role);
        return ResponseEntity.ok(response);
    }

    // =====================================================
    // DELETE /api/applications/user/{userId}
    // Called by Admin Service when deleting a user
    // =====================================================
    @DeleteMapping("/user/{userId}")
    public ResponseEntity<Map<String, String>> deleteUserApplications(
            @PathVariable Long userId) {
        service.deleteUserApplications(userId);
        return ResponseEntity.ok(
                Map.of("message",
                        "All applications of user deleted successfully!"));
    }

    // =====================================================
    // DELETE /api/applications/job/{jobId}
    // Called by Admin Service when deleting a job
    // =====================================================
    @DeleteMapping("/job/{jobId}")
    public ResponseEntity<Map<String, String>> deleteJobApplications(
            @PathVariable Long jobId) {
        service.deleteJobApplications(jobId);
        return ResponseEntity.ok(
                Map.of("message",
                        "All applications for job deleted successfully!"));
    }
    
    // GET /api/applications/count
    @GetMapping("/count")
    public ResponseEntity<Long> getTotalApplications() {
        return ResponseEntity.ok(service.getTotalApplications());
    }
}