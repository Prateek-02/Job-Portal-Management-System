package com.jobportal.authservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobportal.authservice.dto.request.LoginRequest;
import com.jobportal.authservice.dto.request.RegisterRequest;
import com.jobportal.authservice.dto.request.UpdateProfileRequest;
import com.jobportal.authservice.dto.response.AuthResponse;
import com.jobportal.authservice.dto.response.UserResponse;
import com.jobportal.authservice.enums.UserRole;
import com.jobportal.authservice.security.JwtUtil;
import com.jobportal.authservice.security.UserDetailsServiceImpl;
import com.jobportal.authservice.service.AuthService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.jobportal.authservice.exception.DuplicateEmailException;
import com.jobportal.authservice.exception.UserNotFoundException;
import com.jobportal.authservice.exception.InvalidCredentialsException;
import com.jobportal.authservice.exception.UnauthorizedException;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    // REGISTER
    @Test
    void testRegister() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setName("Prateek");
        request.setEmail("test@gmail.com");
        request.setPassword("123456");
        request.setRole(UserRole.JOB_SEEKER);

        AuthResponse response = new AuthResponse(
                null, 1L, "Prateek", "test@gmail.com",
                UserRole.JOB_SEEKER, "Registration successful!"
        );

        when(authService.register(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("test@gmail.com"));
    }

    // LOGIN
    @Test
    void testLogin() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@gmail.com");
        request.setPassword("123456");

        AuthResponse response = new AuthResponse(
                "token", 1L, "Prateek", "test@gmail.com",
                UserRole.JOB_SEEKER, "Login successful!"
        );

        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@gmail.com"));
    }

    // GET PROFILE
    @Test
    void testGetProfile() throws Exception {
        UserResponse user = new UserResponse();
        user.setId(1L);
        user.setEmail("test@gmail.com");

        when(authService.getUserById(1L)).thenReturn(user);

        mockMvc.perform(get("/api/auth/profile")
                        .header("X-User-Id", "1")) // FIXED: String instead of Long
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@gmail.com"));
    }

    // GET ALL USERS
    @Test
    void testGetAllUsers() throws Exception {
        UserResponse user = new UserResponse();
        user.setId(1L);
        user.setEmail("test@gmail.com");

        when(authService.getAllUsers()).thenReturn(List.of(user));

        mockMvc.perform(get("/api/auth/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").value("test@gmail.com"));
    }

    // GET USER BY ID
    @Test
    void testGetUserById() throws Exception {
        UserResponse user = new UserResponse();
        user.setId(1L);
        user.setEmail("test@gmail.com");

        when(authService.getUserById(1L)).thenReturn(user);

        mockMvc.perform(get("/api/auth/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@gmail.com"));
    }

    // UPDATE PROFILE
    @Test
    void testUpdateProfile() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setName("Updated");

        UserResponse response = new UserResponse();
        response.setName("Updated");

        when(authService.updateProfile(anyLong(), any(UpdateProfileRequest.class)))
                .thenReturn(response);

        mockMvc.perform(put("/api/auth/users/profile")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated"));
    }

    // UPLOAD PROFILE IMAGE
    @Test
    void testUploadProfileImage() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "image",
                "test.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                "image".getBytes()
        );

        UserResponse response = new UserResponse();
        response.setId(1L);

        // FIXED: use matchers instead of exact object
        when(authService.uploadProfileImage(anyLong(), any()))
                .thenReturn(response);

        mockMvc.perform(multipart("/api/auth/users/1/profile-image")
                        .file(file)
                        .with(request -> {
                            request.setMethod("POST"); // ensure correct method
                            return request;
                        }))
                .andExpect(status().isOk());
    }

    // ERROR TESTS

    @Test
    void testRegister_DuplicateEmail() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setName("Prateek");
        request.setEmail("test@gmail.com");
        request.setPassword("123456");
        request.setRole(UserRole.JOB_SEEKER);

        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new DuplicateEmailException("Email already registered"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testRegister_AsAdmin() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setName("Admin");
        request.setEmail("admin@gmail.com");
        request.setPassword("123456");
        request.setRole(UserRole.ADMIN);

        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new UnauthorizedException("Admin registration is not allowed!"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testLogin_UserNotFound() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("nonexistent@gmail.com");
        request.setPassword("123456");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new UserNotFoundException("User not found with email"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void testLogin_InvalidCredentials() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@gmail.com");
        request.setPassword("wrongpassword");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new InvalidCredentialsException("Invalid email or password!"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testGetUserById_NotFound() throws Exception {
        when(authService.getUserById(anyLong()))
                .thenThrow(new UserNotFoundException("User not found with id"));

        mockMvc.perform(get("/api/auth/users/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testUpdateProfile_UserNotFound() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setName("Updated");

        when(authService.updateProfile(anyLong(), any(UpdateProfileRequest.class)))
                .thenThrow(new UserNotFoundException("User not found with id"));

        mockMvc.perform(put("/api/auth/users/profile")
                        .header("X-User-Id", "999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void testUploadProfileImage_UserNotFound() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "image",
                "test.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                "image".getBytes()
        );

        when(authService.uploadProfileImage(anyLong(), any()))
                .thenThrow(new UserNotFoundException("User not found with id"));

        mockMvc.perform(multipart("/api/auth/users/999/profile-image")
                        .file(file)
                        .with(request -> {
                            request.setMethod("POST");
                            return request;
                        }))
                .andExpect(status().isNotFound());
    }
}