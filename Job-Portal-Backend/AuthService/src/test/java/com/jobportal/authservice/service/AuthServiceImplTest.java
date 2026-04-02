package com.jobportal.authservice.service;

import com.jobportal.authservice.dto.request.LoginRequest;
import com.jobportal.authservice.dto.request.RegisterRequest;
import com.jobportal.authservice.dto.response.LoginResponse;
import com.jobportal.authservice.dto.response.RegisterResponse;
import com.jobportal.authservice.entity.User;
import com.jobportal.authservice.enums.UserRole;
import com.jobportal.authservice.exception.DuplicateEmailException;
import com.jobportal.authservice.exception.InvalidCredentialsException;
import com.jobportal.authservice.exception.UnauthorizedException;
import com.jobportal.authservice.exception.UserNotFoundException;
import com.jobportal.authservice.repository.UserRepository;
import com.jobportal.authservice.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

        // Mocks — fake versions of dependencies
        @Mock
        private UserRepository userRepository;

        @Mock
        private PasswordEncoder passwordEncoder;

        @Mock
        private JwtUtil jwtUtil;

        @Mock
        private ModelMapper modelMapper;

        // InjectMocks — class we are testing
        @InjectMocks
        private AuthServiceImpl authService;

        // Test Data — setup before each test
        private RegisterRequest registerRequest;
        private LoginRequest loginRequest;
        private User user;

        @BeforeEach
        void setUp() {

                // Register request
                registerRequest = new RegisterRequest();
                registerRequest.setName("Priya Singh");
                registerRequest.setEmail("priya@gmail.com");
                registerRequest.setPassword("priya123");
                registerRequest.setPhone("9876543210");
                registerRequest.setRole(UserRole.JOB_SEEKER);

                // Login request
                loginRequest = new LoginRequest();
                loginRequest.setEmail("priya@gmail.com");
                loginRequest.setPassword("priya123");

                // User object
                user = new User();
                user.setId(1L);
                user.setName("Priya Singh");
                user.setEmail("priya@gmail.com");
                user.setPassword("hashedPassword");
                user.setRole(UserRole.JOB_SEEKER);
                user.setPhone("9876543210");
        }

        // REGISTER TESTS

        @Test
        void register_Success() {
                // Arrange
                when(userRepository.existsByEmail(anyString()))
                                .thenReturn(false);
                when(passwordEncoder.encode(anyString()))
                                .thenReturn("hashedPassword");
                when(userRepository.save(any(User.class)))
                                .thenReturn(user);

                // Act
                RegisterResponse response = authService.register(registerRequest);

                // Assert
                assertThat(response).isNotNull();
                assertThat(response.getUserId())
                                .isEqualTo(1L);
                assertThat(response.getEmail())
                                .isEqualTo("priya@gmail.com");
                assertThat(response.getRole())
                                .isEqualTo(UserRole.JOB_SEEKER);
                assertThat(response.getMessage())
                                .isEqualTo("Registration successful!");

                // Verify save was called once
                verify(userRepository, times(1))
                                .save(any(User.class));
                verify(jwtUtil, never())
                                .generateToken(anyString(),
                                                anyLong(), anyString());
        }

        @Test
        void register_DuplicateEmail_ThrowsException() {
                // Arrange
                when(userRepository.existsByEmail(anyString()))
                                .thenReturn(true);

                // Act & Assert
                assertThatThrownBy(() -> authService.register(registerRequest))
                                .isInstanceOf(DuplicateEmailException.class)
                                .hasMessageContaining(
                                                "Email already registered");

                // Verify save was never called
                verify(userRepository, never())
                                .save(any(User.class));
        }

        @Test
        void register_AsAdmin_ThrowsException() {
                // Arrange
                registerRequest.setRole(UserRole.ADMIN);

                // Act & Assert
                assertThatThrownBy(() -> authService.register(registerRequest))
                                .isInstanceOf(UnauthorizedException.class)
                                .hasMessageContaining(
                                                "Admin registration is not allowed!");

                // Verify save was never called
                verify(userRepository, never())
                                .save(any(User.class));
        }

        // LOGIN TESTS

        @Test
        void login_Success() {
                // Arrange
                when(userRepository.findByEmail(anyString()))
                                .thenReturn(Optional.of(user));
                when(passwordEncoder.matches(anyString(), anyString()))
                                .thenReturn(true);
                when(jwtUtil.generateToken(anyString(),
                                anyLong(), anyString()))
                                .thenReturn("mockToken");

                // Act
                LoginResponse response = authService.login(loginRequest);

                // Assert
                assertThat(response).isNotNull();
                assertThat(response.getUserId())
                                .isEqualTo(1L);
                assertThat(response.getEmail())
                                .isEqualTo("priya@gmail.com");
                assertThat(response.getMessage())
                                .isEqualTo("Login successful!");

                // Verify token was generated
                verify(jwtUtil, times(1))
                                .generateToken(anyString(),
                                                anyLong(), anyString());
        }

        @Test
        void login_UserNotFound_ThrowsException() {
                // Arrange
                when(userRepository.findByEmail(anyString()))
                                .thenReturn(Optional.empty());

                // Act & Assert
                assertThatThrownBy(() -> authService.login(loginRequest))
                                .isInstanceOf(UserNotFoundException.class)
                                .hasMessageContaining(
                                                "User not found with email");

                // Verify token was never generated
                verify(jwtUtil, never())
                                .generateToken(anyString(),
                                                anyLong(), anyString());
        }

        @Test
        void login_WrongPassword_ThrowsException() {
                // Arrange
                when(userRepository.findByEmail(anyString()))
                                .thenReturn(Optional.of(user));
                when(passwordEncoder.matches(anyString(), anyString()))
                                .thenReturn(false);

                // Act & Assert
                assertThatThrownBy(() -> authService.login(loginRequest))
                                .isInstanceOf(InvalidCredentialsException.class)
                                .hasMessageContaining(
                                                "Invalid email or password");

                // Verify token was never generated
                verify(jwtUtil, never())
                                .generateToken(anyString(),
                                                anyLong(), anyString());
        }

        // DELETE USER TESTS

        @Test
        void deleteUser_Success() {
                // Arrange
                when(userRepository.findById(anyLong()))
                                .thenReturn(Optional.of(user));

                // Act
                authService.deleteUser(1L);

                // Verify delete was called
                verify(userRepository, times(1))
                                .delete(any(User.class));
        }

        @Test
        void deleteUser_NotFound_ThrowsException() {
                // Arrange
                when(userRepository.findById(anyLong()))
                                .thenReturn(Optional.empty());

                // Act & Assert
                assertThatThrownBy(() -> authService.deleteUser(1L))
                                .isInstanceOf(UserNotFoundException.class)
                                .hasMessageContaining(
                                                "User not found with id");

                // Verify delete was never called
                verify(userRepository, never())
                                .delete(any(User.class));
        }

        // GET USER BY ID TESTS

        @Test
        void getUserById_Success() {
                // Arrange
                com.jobportal.authservice.dto.response.UserResponse userResponse = new com.jobportal.authservice.dto.response.UserResponse();
                userResponse.setId(1L);
                userResponse.setEmail("priya@gmail.com");

                when(userRepository.findById(anyLong()))
                                .thenReturn(Optional.of(user));
                when(modelMapper.map(any(User.class),
                                eq(com.jobportal.authservice.dto.response.UserResponse.class)))
                                .thenReturn(userResponse);

                // Act
                com.jobportal.authservice.dto.response.UserResponse response = authService.getUserById(1L);

                // Assert
                assertThat(response).isNotNull();
                assertThat(response.getId()).isEqualTo(1L);
                assertThat(response.getEmail()).isEqualTo("priya@gmail.com");
        }

        @Test
        void getUserById_NotFound_ThrowsException() {
                // Arrange
                when(userRepository.findById(anyLong()))
                                .thenReturn(Optional.empty());

                // Act & Assert
                assertThatThrownBy(() -> authService.getUserById(999L))
                                .isInstanceOf(UserNotFoundException.class);
        }

        // UPDATE PROFILE TESTS

        @Test
        void updateProfile_Success() {
                // Arrange
                com.jobportal.authservice.dto.request.UpdateProfileRequest updateRequest = new com.jobportal.authservice.dto.request.UpdateProfileRequest();
                updateRequest.setName("Updated Name");
                updateRequest.setPhone("9999999999");
                updateRequest.setBio("Updated bio");
                updateRequest.setLocation("Mumbai");

                com.jobportal.authservice.dto.response.UserResponse userResponse = new com.jobportal.authservice.dto.response.UserResponse();
                userResponse.setId(1L);
                userResponse.setName("Updated Name");

                when(userRepository.findById(anyLong()))
                                .thenReturn(Optional.of(user));
                when(userRepository.save(any(User.class)))
                                .thenReturn(user);
                when(modelMapper.map(any(User.class),
                                eq(com.jobportal.authservice.dto.response.UserResponse.class)))
                                .thenReturn(userResponse);

                // Act
                com.jobportal.authservice.dto.response.UserResponse response = authService.updateProfile(1L,
                                updateRequest);

                // Assert
                assertThat(response).isNotNull();
                verify(userRepository, times(1)).save(any(User.class));
        }

        @Test
        void updateProfile_UserNotFound_ThrowsException() {
                // Arrange
                com.jobportal.authservice.dto.request.UpdateProfileRequest updateRequest = new com.jobportal.authservice.dto.request.UpdateProfileRequest();

                when(userRepository.findById(anyLong()))
                                .thenReturn(Optional.empty());

                // Act & Assert
                assertThatThrownBy(() -> authService.updateProfile(1L, updateRequest))
                                .isInstanceOf(UserNotFoundException.class);

                // Verify save was never called
                verify(userRepository, never()).save(any(User.class));
        }

        // GET ALL USERS TESTS

        @Test
        void getAllUsers_Success() {
                // Arrange
                java.util.List<User> users = java.util.List.of(user);
                com.jobportal.authservice.dto.response.UserResponse userResponse = new com.jobportal.authservice.dto.response.UserResponse();

                when(userRepository.findAll())
                                .thenReturn(users);
                when(modelMapper.map(any(User.class),
                                eq(com.jobportal.authservice.dto.response.UserResponse.class)))
                                .thenReturn(userResponse);

                // Act
                java.util.List<com.jobportal.authservice.dto.response.UserResponse> response = authService
                                .getAllUsers();

                // Assert
                assertThat(response).isNotNull();
                assertThat(response.size()).isEqualTo(1);
                verify(userRepository, times(1)).findAll();
        }
}