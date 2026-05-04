package com.jobportal.authservice.service;

import java.io.IOException;


import org.springframework.web.multipart.MultipartFile;

import com.jobportal.authservice.dto.request.LoginRequest;
import com.jobportal.authservice.dto.request.RegisterRequest;
import com.jobportal.authservice.dto.request.UpdateProfileRequest;
import com.jobportal.authservice.dto.request.RefreshTokenRequest;
import com.jobportal.authservice.dto.request.ForgotPasswordRequest;
import com.jobportal.authservice.dto.request.ResetPasswordRequest;

import com.jobportal.authservice.dto.response.LoginResponse;
import com.jobportal.authservice.dto.response.RegisterResponse;
import com.jobportal.authservice.dto.response.UserResponse;
import com.jobportal.authservice.dto.response.PageResponse;

public interface AuthService {

    // Register new user
    RegisterResponse register(RegisterRequest request);

    // Login user
    LoginResponse login(LoginRequest request);
    
    // Refresh token
    LoginResponse refreshToken(RefreshTokenRequest request);
    
    // Upload profile image
    UserResponse uploadProfileImage(Long userId,MultipartFile file) throws IOException;
    
    // Update Profile
    UserResponse updateProfile(Long userId, UpdateProfileRequest request);

    // Get all users
    PageResponse<UserResponse> getAllUsers(int page, int size, String sortBy, String direction);

    // Get user by ID
    UserResponse getUserById(Long id);

    // Delete user
    void deleteUser(Long id);

    // Password reset
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
}