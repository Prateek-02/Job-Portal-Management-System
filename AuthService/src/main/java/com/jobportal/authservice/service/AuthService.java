package com.jobportal.authservice.service;

import com.jobportal.authservice.dto.request.LoginRequest;
import com.jobportal.authservice.dto.request.RegisterRequest;
import com.jobportal.authservice.dto.response.AuthResponse;
import com.jobportal.authservice.entity.User;
import com.jobportal.authservice.exception.DuplicateEmailException;
import com.jobportal.authservice.exception.InvalidCredentialsException;
import com.jobportal.authservice.exception.UserNotFoundException;
import com.jobportal.authservice.repository.UserRepository;
import com.jobportal.authservice.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    // =====================================================
    // REGISTER
    // =====================================================
    public AuthResponse register(RegisterRequest request) {

        // Step 1: Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException(
                    "Email already registered: " + request.getEmail());
        }

        // Step 2: Build user object
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(request.getRole())
                .build();

        // Step 3: Save user to database
        User savedUser = userRepository.save(user);

        // Step 4: Generate JWT token
        String token = jwtUtil.generateToken(savedUser.getEmail());

        // Step 5: Return response
        return new AuthResponse(
                token,
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getRole(),
                "Registration successful!"
        );
    }

    // =====================================================
    // LOGIN
    // =====================================================
    public AuthResponse login(LoginRequest request) {

        // Step 1: Check if user exists
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException(
                        "User not found with email: " + request.getEmail()));

        // Step 2: Check if password matches
        if (!passwordEncoder.matches(
                request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException(
                    "Invalid email or password!");
        }

        // Step 3: Generate JWT token
        String token = jwtUtil.generateToken(user.getEmail());

        // Step 4: Return response
        return new AuthResponse(
                token,
                user.getName(),
                user.getEmail(),
                user.getRole(),
                "Login successful!"
        );
    }
}
