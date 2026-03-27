package com.jobportal.authservice.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;

import com.jobportal.authservice.dto.request.LoginRequest;
import com.jobportal.authservice.dto.request.RegisterRequest;
import com.jobportal.authservice.dto.request.UpdateProfileRequest;
import com.jobportal.authservice.dto.response.AuthResponse;
import com.jobportal.authservice.dto.response.UserResponse;
import com.jobportal.authservice.service.AuthService;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        log.info("Register API called | email: {}", request.getEmail());

        AuthResponse response = authService.register(request);

        log.info("User registered successfully | email: {}", request.getEmail());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {

        log.info("Login API called | email: {}", request.getEmail());

        AuthResponse response = authService.login(request);

        log.info("Login successful | email: {}", request.getEmail());

        return ResponseEntity.status(HttpStatus.OK).body(response);
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
    public ResponseEntity<List<UserResponse>> getAllUsers() {

        log.info("Fetch all users API called");

        List<UserResponse> users = authService.getAllUsers();

        return ResponseEntity.ok(users);
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
}