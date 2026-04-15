package com.jobportal.authservice.controller;

import java.io.IOException;
import java.util.Map;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;

import com.jobportal.authservice.dto.request.LoginRequest;
import com.jobportal.authservice.dto.request.ForgotPasswordRequest;
import com.jobportal.authservice.dto.request.RegisterRequest;
import com.jobportal.authservice.dto.request.RefreshTokenRequest;
import com.jobportal.authservice.dto.request.ResetPasswordRequest;
import com.jobportal.authservice.dto.request.UpdateProfileRequest;
import com.jobportal.authservice.dto.response.LoginResponse;
import com.jobportal.authservice.dto.response.PageResponse;
import com.jobportal.authservice.dto.response.RegisterResponse;
import com.jobportal.authservice.dto.response.UserResponse;
import com.jobportal.authservice.service.AuthService;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/auth")

public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        log.info("Register API called | email: {}", request.getEmail());

        RegisterResponse response = authService.register(request);

        log.info("User registered successfully | email: {}", request.getEmail());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request) {

        log.info("Login API called | email: {}", request.getEmail());

        LoginResponse response = authService.login(request);

        log.info("Login successful | email: {}", request.getEmail());

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        log.info("Refresh token API called");
        LoginResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/users/{id}/profile-image",
            consumes = "multipart/form-data")
    public ResponseEntity<UserResponse> uploadProfileImage(
            @PathVariable Long id,
            @RequestParam("image") MultipartFile image)
            throws IOException {

        log.info("Upload profile image API called | userId: {} | fileName: {}",
                id, image.getOriginalFilename());

        UserResponse response = authService.uploadProfileImage(id, image);

        log.info("Profile image uploaded successfully | userId: {}", id);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getMyProfile(
            @RequestHeader("X-User-Id") Long userId) {

        log.info("Fetch profile API called | userId: {}", userId);

        UserResponse response = authService.getUserById(userId);

        log.info("Profile fetched successfully | userId: {}", userId);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/users")
    public ResponseEntity<PageResponse<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        log.info("Fetch all users API called | page: {} | size: {}", page, size);

        PageResponse<UserResponse> response = 
                authService.getAllUsers(page, size, sortBy, direction);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUserById(
            @PathVariable Long id) {

        log.info("Fetch user by ID API called | userId: {}", id);

        UserResponse response = authService.getUserById(id);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/users/profile")
    public ResponseEntity<UserResponse> updateProfile(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody UpdateProfileRequest request) {

        log.info("Update profile API called | userId: {}", userId);

        UserResponse response =
                authService.updateProfile(userId, request);

        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        log.info("Forgot password API called | email: {}", request.getEmail());
        authService.forgotPassword(request);
        return ResponseEntity.ok(Map.of("message", "If your email is registered, you will receive a reset link."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        log.info("Reset password API called");
        authService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Password successfully reset. You can now login."));
    }
}