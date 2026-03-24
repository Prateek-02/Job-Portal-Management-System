package com.jobportal.authservice.service;

import java.io.IOException;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.jobportal.authservice.dto.request.LoginRequest;
import com.jobportal.authservice.dto.request.RegisterRequest;
import com.jobportal.authservice.dto.request.UpdateProfileRequest;
import com.jobportal.authservice.dto.response.AuthResponse;
import com.jobportal.authservice.dto.response.UserResponse;

public interface AuthService {

    // Register new user
    AuthResponse register(RegisterRequest request);

    // Login user
    AuthResponse login(LoginRequest request);
    
    // Upload profile image
    UserResponse uploadProfileImage(Long userId,MultipartFile file) throws IOException;
    
    // Update Profile
    UserResponse updateProfile(Long userId, UpdateProfileRequest request);

    // Get all users
    List<UserResponse> getAllUsers();

    // Get user by ID
    UserResponse getUserById(Long id);

    // Delete user
    void deleteUser(Long id);
}