package com.jobportal.authservice.service;

import com.jobportal.authservice.dto.request.LoginRequest;
import com.jobportal.authservice.dto.request.RegisterRequest;
import com.jobportal.authservice.dto.response.AuthResponse;
import com.jobportal.authservice.dto.response.UserResponse;

import java.util.List;

public interface AuthService {

    // Register new user
    AuthResponse register(RegisterRequest request);

    // Login user
    AuthResponse login(LoginRequest request);

    // Get all users
    List<UserResponse> getAllUsers();

    // Get user by ID
    UserResponse getUserById(Long id);

    // Delete user
    void deleteUser(Long id);
}