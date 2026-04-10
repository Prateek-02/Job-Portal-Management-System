package com.jobportal.adminservice.controller;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.jobportal.adminservice.dto.response.JobResponse;
import com.jobportal.adminservice.dto.response.PageResponse;
import com.jobportal.adminservice.dto.response.UserResponse;
import com.jobportal.adminservice.exception.UnauthorizedException;
import com.jobportal.adminservice.service.AdminService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // USER MANAGEMENT
    @GetMapping("/users")
    public ResponseEntity<PageResponse<UserResponse>> getAllUsers(
            @RequestHeader("X-User-Role") String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        log.info("Fetch all users requested | role: {} | page: {} | size: {}", role, page, size);

        if (!role.equalsIgnoreCase("ADMIN")) {
            log.warn("Unauthorized access to getAllUsers | role: {}", role);
            throw new UnauthorizedException("Access Denied! Only Admin can manage users.");
        }

        PageResponse<UserResponse> response =
                adminService.getAllUsers(page, size, sortBy, direction);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUserById(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String role) {

        log.info("Fetch user by id requested | id: {} | role: {}", id, role);

        if (!role.equalsIgnoreCase("ADMIN")) {
            log.warn("Unauthorized access to getUserById | userId: {} | role: {}", id, role);
            throw new UnauthorizedException("Access Denied! Only Admin can manage users.");
        }

        UserResponse user = adminService.getUserById(id);

        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String role) {

        log.info("Delete user saga requested | id: {} | role: {}", id, role);

        if (!role.equalsIgnoreCase("ADMIN")) {
            log.warn("Unauthorized delete attempt | userId: {} | role: {}", id, role);
            throw new UnauthorizedException("Access Denied! Only Admin can delete users.");
        }

        adminService.deleteUser(id);

        log.info("User delete saga initiated | userId: {}", id);

        return ResponseEntity.accepted().body(
                Map.of("message", "User deletion process started"));
    }

    // JOB MANAGEMENT
    @GetMapping("/jobs")
    public ResponseEntity<PageResponse<JobResponse>> getAllJobs(
            @RequestHeader("X-User-Role") String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        log.info("Fetch all jobs requested | role: {} | page: {} | size: {}", role, page, size);

        if (!role.equalsIgnoreCase("ADMIN")) {
            log.warn("Unauthorized access to getAllJobs | role: {}", role);
            throw new UnauthorizedException("Access Denied! Only Admin can manage jobs.");
        }

        PageResponse<JobResponse> response =
                adminService.getAllJobs(page, size, sortBy, direction);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/jobs/{id}")
    public ResponseEntity<JobResponse> getJobById(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String role) {

        log.info("Fetch job by id requested | id: {} | role: {}", id, role);

        if (!role.equalsIgnoreCase("ADMIN")) {
            log.warn("Unauthorized access to getJobById | jobId: {} | role: {}", id, role);
            throw new UnauthorizedException("Access Denied! Only Admin can manage jobs.");
        }

        JobResponse job = adminService.getJobById(id);

        return ResponseEntity.ok(job);
    }

    // REPORTS
    @GetMapping("/reports")
    public ResponseEntity<Map<String, Object>> getReports(
            @RequestHeader("X-User-Role") String role) {

        log.info("Generating reports check | role: {}", role);

        if (role == null || !role.contains("ADMIN")) {
            log.warn("Reports access denied | role: {}", role);
            throw new UnauthorizedException(
                    "Access Denied! Your current role (" + role + ") is not authorized for reports.");
        }

        Map<String, Object> reports = adminService.getReports();

        log.debug("Reports fetched successfully");

        return ResponseEntity.ok(reports);
    }

    @GetMapping("/public/stats")
    public ResponseEntity<Map<String, Object>> getPublicStats() {
        log.info("Fetching public platform stats");
        Map<String, Object> reports = adminService.getReports();
        log.debug("Public stats fetched successfully");
        return ResponseEntity.ok(reports);
    }
}
