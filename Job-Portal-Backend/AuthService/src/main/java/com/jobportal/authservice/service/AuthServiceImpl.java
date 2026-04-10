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
import com.jobportal.authservice.dto.request.RefreshTokenRequest;
import com.jobportal.authservice.dto.response.LoginResponse;
import com.jobportal.authservice.dto.response.RegisterResponse;
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

    @Autowired
    private EmailService emailService;

    // REGISTER
    @Override
    public RegisterResponse register(RegisterRequest request) {

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

        return new RegisterResponse(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getRole(),
                "Registration successful!"
        );
    }

    // LOGIN
    @Override
    public LoginResponse login(LoginRequest request) {

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

        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        log.info("Login successful | userId: {}", user.getId());
        log.debug("JWT tokens generated for user | userId: {}", user.getId());

        return new LoginResponse(
                token,
                refreshToken,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                "Login successful!"
        );
    }

    // REFRESH TOKEN
    @Override
    public LoginResponse refreshToken(RefreshTokenRequest request) {
        String requestRefreshToken = request.getRefreshToken();
        
        try {
            // Validate refresh token and extract email
            String email = jwtUtil.extractEmail(requestRefreshToken);
            
            // Check if token is strictly valid according to JwtUtil
            if (!jwtUtil.validateToken(requestRefreshToken, email)) {
                throw new UnauthorizedException("Invalid or expired refresh token");
            }

            // Look up user to ensure they still exist and get updated details
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));

            // Generate new token pair
            String newAccessToken = jwtUtil.generateToken(
                    user.getEmail(),
                    user.getId(),
                    user.getRole().name()
            );
            
            String newRefreshToken = jwtUtil.generateRefreshToken(user.getEmail());

            log.info("Token refreshed successfully | userId: {}", user.getId());

            return new LoginResponse(
                    newAccessToken,
                    newRefreshToken,
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getRole(),
                    "Token refreshed successfully!"
            );

        } catch (Exception e) {
            log.warn("Failed to refresh token: {}", e.getMessage());
            throw new UnauthorizedException("Invalid or expired refresh token!");
        }
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
    public com.jobportal.authservice.dto.response.PageResponse<UserResponse> getAllUsers(int page, int size, String sortBy, String direction) {

        log.info("Fetching all users | page: {} | size: {}", page, size);

        org.springframework.data.domain.Sort sort = direction.equalsIgnoreCase("desc") ?
                org.springframework.data.domain.Sort.by(sortBy).descending() :
                org.springframework.data.domain.Sort.by(sortBy).ascending();

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, sort);

        org.springframework.data.domain.Page<User> pageData = userRepository.findAll(pageable);

        List<UserResponse> content = pageData.getContent().stream()
                .map(user -> modelMapper.map(user, UserResponse.class))
                .collect(Collectors.toList());

        log.debug("Users fetched | page: {} | total: {}", page, pageData.getTotalElements());

        return com.jobportal.authservice.dto.response.PageResponse.<UserResponse>builder()
                .content(content)
                .pageNumber(pageData.getNumber())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .last(pageData.isLast())
                .first(pageData.isFirst())
                .empty(pageData.isEmpty())
                .build();
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

    // FORGOT PASSWORD
    @Override
    public void forgotPassword(com.jobportal.authservice.dto.request.ForgotPasswordRequest request) {
        log.info("Forgot password requested for email: {}", request.getEmail());
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + request.getEmail()));

        // Generate 6-digit OTP
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        
        user.setResetToken(otp);
        user.setResetTokenExpiry(java.time.LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        emailService.sendPasswordResetOTP(user.getEmail(), otp);
    }

    // RESET PASSWORD
    @Override
    public void resetPassword(com.jobportal.authservice.dto.request.ResetPasswordRequest request) {
        log.info("Reset password attempt for email: {}", request.getEmail());
        
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + request.getEmail()));

        if (user.getResetToken() == null || !user.getResetToken().equals(request.getOtp())) {
            throw new UnauthorizedException("Invalid or incorrect OTP");
        }

        if (user.getResetTokenExpiry().isBefore(java.time.LocalDateTime.now())) {
            throw new UnauthorizedException("OTP has expired");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
        
        log.info("Password successfully reset for user: {}", user.getEmail());
    }
}

