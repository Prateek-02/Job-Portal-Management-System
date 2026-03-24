package com.jobportal.authservice.controller;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.jobportal.authservice.dto.request.LoginRequest;
import com.jobportal.authservice.dto.request.RegisterRequest;
import com.jobportal.authservice.dto.request.UpdateProfileRequest;
import com.jobportal.authservice.dto.response.AuthResponse;
import com.jobportal.authservice.dto.response.UserResponse;
import com.jobportal.authservice.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    // POST /api/auth/register
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(response);
    }
    
 // POST /api/auth/users/{id}/profile-image
    @PostMapping(value = "/users/{id}/profile-image",consumes = "multipart/form-data")
    public ResponseEntity<UserResponse> uploadProfileImage(
            @PathVariable Long id,
            @RequestParam("image") MultipartFile image)
            throws IOException {

        UserResponse response = authService.uploadProfileImage(id, image);
        return ResponseEntity.ok(response);
    }

    // GET /api/auth/profile
    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getMyProfile(@RequestHeader("X-User-Id") Long userId) {
        
        // We reuse the existing getUserById logic since we have the ID from the header
        UserResponse response = authService.getUserById(userId);
        return ResponseEntity.ok(response);
    }
    
    // GET /api/auth/users(protected for admin only)
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    // GET /api/auth/users/{id}
    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(authService.getUserById(id));
    }
    
    // PUT /api/auth/users/profile
    @PutMapping("/users/profile")
    public ResponseEntity<UserResponse> updateProfile(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody UpdateProfileRequest request) {
        
        UserResponse response = authService.updateProfile(userId, request);
        return ResponseEntity.ok(response);
    }

    // DELETE /api/auth/users/{id}
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        authService.deleteUser(id);
        return ResponseEntity.ok(
                Map.of("message", "User deleted successfully!"));
    }
}