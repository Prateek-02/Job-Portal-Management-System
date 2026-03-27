package com.jobportal.adminservice.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
@CrossOrigin(origins = "*")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers(
            @RequestHeader("X-User-Role") String role) {

        log.info("Get all users API called | role: {}", role);

        if (!role.equalsIgnoreCase("ADMIN")) {
            log.warn("Unauthorized access to getAllUsers | role: {}", role);
            throw new UnauthorizedException(
                    "Access Denied! Only Admin can manage users.");
        }

        List<UserResponse> users = adminService.getAllUsers();

        log.debug("Users fetched successfully | count: {}", users.size());

        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUserById(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String role) {

        log.info("Get user by ID API called | userId: {} | role: {}", id, role);

        if (!role.equalsIgnoreCase("ADMIN")) {
            log.warn("Unauthorized access to getUserById | userId: {} | role: {}", id, role);
            throw new UnauthorizedException(
                    "Access Denied! Only Admin can manage users.");
        }

        UserResponse response = adminService.getUserById(id);

        log.info("User fetched successfully | userId: {}", id);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String role) {

        log.info("Delete user API called | userId: {} | role: {}", id, role);

        if (!role.equalsIgnoreCase("ADMIN")) {
            log.warn("Unauthorized delete attempt | userId: {} | role: {}", id, role);
            throw new UnauthorizedException(
                    "Access Denied! Only Admin can delete users.");
        }

        adminService.deleteUser(id);

        log.info("User delete saga initiated | userId: {}", id);

        return ResponseEntity.accepted().body(
                Map.of("message", "User deletion process started"));
    }

    @GetMapping("/jobs")
    public ResponseEntity<PageResponse> getAllJobs(
            @RequestHeader("X-User-Role") String role) {

        log.info("Get all jobs API called | role: {}", role);

        if (!role.equalsIgnoreCase("ADMIN")) {
            log.warn("Unauthorized access to getAllJobs | role: {}", role);
            throw new UnauthorizedException(
                    "Access Denied! Only Admin can manage jobs.");
        }

        PageResponse response = adminService.getAllJobs();

        log.debug("Jobs fetched successfully");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/jobs/{id}")
    public ResponseEntity<JobResponse> getJobById(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String role) {

        log.info("Get job by ID API called | jobId: {} | role: {}", id, role);

        if (!role.equalsIgnoreCase("ADMIN")) {
            log.warn("Unauthorized access to getJobById | jobId: {} | role: {}", id, role);
            throw new UnauthorizedException(
                    "Access Denied! Only Admin can manage jobs.");
        }

        JobResponse response = adminService.getJobById(id);

        log.info("Job fetched successfully | jobId: {}", id);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/reports")
    public ResponseEntity<Map<String, Object>> getReports(
            @RequestHeader("X-User-Role") String role) {

        log.info("Get reports API called | role: {}", role);

        if (!role.equalsIgnoreCase("ADMIN")) {
            log.warn("Unauthorized access to reports | role: {}", role);
            throw new UnauthorizedException(
                    "Access Denied! Only Admin can view reports.");
        }

        Map<String, Object> reports = adminService.getReports();

        log.debug("Reports fetched successfully");

        return ResponseEntity.ok(reports);
    }
}

