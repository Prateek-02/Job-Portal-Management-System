package com.jobportal.authservice.service;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.jobportal.authservice.dto.request.LoginRequest;
import com.jobportal.authservice.dto.request.RegisterRequest;
import com.jobportal.authservice.dto.request.UpdateProfileRequest;
import com.jobportal.authservice.dto.response.AuthResponse;
import com.jobportal.authservice.dto.response.UserResponse;
import com.jobportal.authservice.entity.User;
import com.jobportal.authservice.enums.UserRole;
import com.jobportal.authservice.exception.DuplicateEmailException;
import com.jobportal.authservice.exception.InvalidCredentialsException;
import com.jobportal.authservice.exception.UnauthorizedException;
import com.jobportal.authservice.exception.UserNotFoundException;
import com.jobportal.authservice.repository.UserRepository;
import com.jobportal.authservice.security.JwtUtil;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ModelMapper modelMapper;

    // REGISTER
    @Override
    public AuthResponse register(RegisterRequest request) {

        log.info("Register service called | email: {} | role: {}",
                request.getEmail(), request.getRole());

        if (request.getRole() == UserRole.ADMIN) {
            log.warn("Attempt to register ADMIN user | email: {}", request.getEmail());
            throw new UnauthorizedException("Admin registration is not allowed!");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Duplicate email registration attempt | email: {}", request.getEmail());
            throw new DuplicateEmailException(
                    "Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(request.getRole())
                .build();

        User savedUser = userRepository.save(user);

        log.info("User saved successfully | userId: {} | email: {}",
                savedUser.getId(), savedUser.getEmail());

        return new AuthResponse(
                null,
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getRole(),
                "Registration successful!"
        );
    }

    // LOGIN
    @Override
    public AuthResponse login(LoginRequest request) {

        log.info("Login service called | email: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.error("User not found during login | email: {}", request.getEmail());
                    return new UserNotFoundException(
                            "User not found with email: " + request.getEmail());
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Invalid login attempt | email: {}", request.getEmail());
            throw new InvalidCredentialsException("Invalid email or password!");
        }

        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getId(),
                user.getRole().name()
        );

        log.info("Login successful | userId: {}", user.getId());
        log.debug("JWT generated for user | userId: {}", user.getId());

        return new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                "Login successful!"
        );
    }

    // UPLOAD PROFILE IMAGE
    @Override
    public UserResponse uploadProfileImage(Long userId,
                                           MultipartFile file) throws IOException {

        log.info("Uploading profile image | userId: {} | fileName: {}",
                userId, file.getOriginalFilename());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found for image upload | userId: {}", userId);
                    return new UserNotFoundException(
                            "User not found with id: " + userId);
                });

        String imageUrl = cloudinaryService.uploadProfileImage(file);

        user.setProfileImageUrl(imageUrl);
        User updated = userRepository.save(user);

        log.info("Profile image updated successfully | userId: {}", userId);

        return modelMapper.map(updated, UserResponse.class);
    }

    // UPDATE PROFILE
    @Override
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {

        log.info("Update profile service called | userId: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found for profile update | userId: {}", userId);
                    return new UserNotFoundException(
                            "User not found with id: " + userId);
                });

        if (request.getName() != null) user.setName(request.getName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getBio() != null) user.setBio(request.getBio());
        if (request.getLocation() != null) user.setLocation(request.getLocation());
        if (request.getSkills() != null) user.setSkills(request.getSkills());

        User updatedUser = userRepository.save(user);

        log.info("Profile updated successfully | userId: {}", userId);

        return modelMapper.map(updatedUser, UserResponse.class);
    }

    // GET ALL USERS
    @Override
    public List<UserResponse> getAllUsers() {

        log.info("Fetching all users");

        List<UserResponse> users = userRepository.findAll()
                .stream()
                .map(user -> modelMapper.map(user, UserResponse.class))
                .collect(Collectors.toList());

        log.debug("Total users fetched: {}", users.size());

        return users;
    }

    // GET USER BY ID
    @Override
    public UserResponse getUserById(Long id) {

        log.info("Fetching user by ID | userId: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("User not found | userId: {}", id);
                    return new UserNotFoundException(
                            "User not found with id: " + id);
                });

        return modelMapper.map(user, UserResponse.class);
    }

    // DELETE USER
    @Override
    public void deleteUser(Long id) {

        log.info("Deleting user | userId: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("User not found for deletion | userId: {}", id);
                    return new UserNotFoundException(
                            "User not found with id: " + id);
                });

        userRepository.delete(user);

        log.info("User deleted successfully | userId: {}", id);
    }
}

