package com.jobportal.adminservice.controller;

import com.jobportal.adminservice.dto.response.JobResponse;
import com.jobportal.adminservice.dto.response.PageResponse;
import com.jobportal.adminservice.dto.response.UserResponse;
import com.jobportal.adminservice.exception.UnauthorizedException;
import com.jobportal.adminservice.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final AdminService adminService;

    // =====================================================
    // USER MANAGEMENT
    // =====================================================

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers(
            @RequestHeader("X-User-Role") String role) {

        if (!role.equalsIgnoreCase("ADMIN")) {
            throw new UnauthorizedException(
                    "Access Denied! Only Admin can manage users.");
        }
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUserById(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String role) {

        if (!role.equalsIgnoreCase("ADMIN")) {
            throw new UnauthorizedException(
                    "Access Denied! Only Admin can manage users.");
        }
        return ResponseEntity.ok(adminService.getUserById(id));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String role) {

        if (!role.equalsIgnoreCase("ADMIN")) {
            throw new UnauthorizedException(
                    "Access Denied! Only Admin can delete users.");
        }
        adminService.deleteUser(id);
        return ResponseEntity.ok(
                Map.of("message", "User deleted successfully!"));
    }

    // =====================================================
    // JOB MANAGEMENT
    // =====================================================

    @GetMapping("/jobs")
    public ResponseEntity<PageResponse> getAllJobs(
            @RequestHeader("X-User-Role") String role) {

        if (!role.equalsIgnoreCase("ADMIN")) {
            throw new UnauthorizedException(
                    "Access Denied! Only Admin can manage jobs.");
        }
        return ResponseEntity.ok(adminService.getAllJobs());
    }

    @GetMapping("/jobs/{id}")
    public ResponseEntity<JobResponse> getJobById(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String role) {

        if (!role.equalsIgnoreCase("ADMIN")) {
            throw new UnauthorizedException(
                    "Access Denied! Only Admin can manage jobs.");
        }
        return ResponseEntity.ok(adminService.getJobById(id));
    }

    // =====================================================
    // PLATFORM ANALYTICS
    // =====================================================

    @GetMapping("/reports")
    public ResponseEntity<Map<String, Object>> getReports(
            @RequestHeader("X-User-Role") String role) {

        if (!role.equalsIgnoreCase("ADMIN")) {
            throw new UnauthorizedException(
                    "Access Denied! Only Admin can view reports.");
        }
        return ResponseEntity.ok(adminService.getReports());
    }
}