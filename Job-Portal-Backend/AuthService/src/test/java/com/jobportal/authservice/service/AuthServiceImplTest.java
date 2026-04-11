package com.jobportal.authservice.service;

import com.jobportal.authservice.dto.request.*;
import com.jobportal.authservice.dto.response.LoginResponse;
import com.jobportal.authservice.dto.response.RegisterResponse;
import com.jobportal.authservice.dto.response.UserResponse;
import com.jobportal.authservice.entity.User;
import com.jobportal.authservice.enums.UserRole;
import com.jobportal.authservice.exception.*;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private EmailService emailService;

    @Mock
    private CloudinaryService cloudinaryService;

    @InjectMocks
    private AuthServiceImpl authService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setName("Priya");
        user.setEmail("priya@gmail.com");
        user.setPassword("hashed");
        user.setRole(UserRole.JOB_SEEKER);
        user.setPhone("1234567890");
        user.setBio("Bio");
        user.setLocation("Loc");
        user.setSkills("Skills");
    }

    @Test
    void register_Success() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Priya");
        request.setEmail("priya@gmail.com");
        request.setPassword("pass");
        request.setRole(UserRole.JOB_SEEKER);

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenReturn(user);

        RegisterResponse response = authService.register(request);
        assertThat(response.getUserId()).isEqualTo(1L);
    }

    @Test
    void register_DuplicateEmail_ThrowsException() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("priya@gmail.com");
        when(userRepository.existsByEmail(anyString())).thenReturn(true);
        assertThatThrownBy(() -> authService.register(request)).isInstanceOf(DuplicateEmailException.class);
    }

    @Test
    void register_Admin_ThrowsException() {
        RegisterRequest request = new RegisterRequest();
        request.setRole(UserRole.ADMIN);
        assertThatThrownBy(() -> authService.register(request)).isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void login_Success() {
        LoginRequest request = new LoginRequest();
        request.setEmail("priya@gmail.com");
        request.setPassword("pass");

        when(userRepository.findByEmail("priya@gmail.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pass", "hashed")).thenReturn(true);
        when(jwtUtil.generateToken(anyString(), anyLong(), anyString())).thenReturn("at");
        when(jwtUtil.generateRefreshToken(anyString())).thenReturn("rt");

        LoginResponse response = authService.login(request);
        assertThat(response.getAccessToken()).isEqualTo("at");
    }

    @Test
    void login_UserNotFound_ThrowsException() {
        LoginRequest request = new LoginRequest();
        request.setEmail("priya@gmail.com");
        when(userRepository.findByEmail("priya@gmail.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> authService.login(request)).isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void login_WrongPassword_ThrowsException() {
        LoginRequest request = new LoginRequest();
        request.setEmail("priya@gmail.com");
        request.setPassword("wrong");

        when(userRepository.findByEmail("priya@gmail.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);
        assertThatThrownBy(() -> authService.login(request)).isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void refreshToken_Success() {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("rt");

        when(jwtUtil.extractEmail("rt")).thenReturn("priya@gmail.com");
        when(jwtUtil.validateToken("rt", "priya@gmail.com")).thenReturn(true);
        when(userRepository.findByEmail("priya@gmail.com")).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken(anyString(), anyLong(), anyString())).thenReturn("nat");
        when(jwtUtil.generateRefreshToken(anyString())).thenReturn("nrt");

        LoginResponse response = authService.refreshToken(request);
        assertThat(response.getAccessToken()).isEqualTo("nat");
    }

    @Test
    void refreshToken_Invalid_ThrowsException() {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("bad");
        when(jwtUtil.extractEmail("bad")).thenThrow(new RuntimeException());
        assertThatThrownBy(() -> authService.refreshToken(request)).isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void refreshToken_ValidationFails_ThrowsException() {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("rt");
        when(jwtUtil.extractEmail("rt")).thenReturn("e");
        when(jwtUtil.validateToken("rt", "e")).thenReturn(false);
        assertThatThrownBy(() -> authService.refreshToken(request)).isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void refreshToken_UserNotFound_ThrowsException() {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("rt");
        when(jwtUtil.extractEmail("rt")).thenReturn("e");
        when(jwtUtil.validateToken("rt", "e")).thenReturn(true);
        when(userRepository.findByEmail("e")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> authService.refreshToken(request)).isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void uploadProfileImage_Success() throws IOException {
        MultipartFile file = mock(MultipartFile.class);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cloudinaryService.uploadProfileImage(file)).thenReturn("url");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(modelMapper.map(any(), any())).thenReturn(new UserResponse());

        authService.uploadProfileImage(1L, file);
        verify(userRepository).save(any());
    }

    @Test
    void uploadProfileImage_UserNotFound_ThrowsException() throws IOException {
        MultipartFile file = mock(MultipartFile.class);
        when(file.getOriginalFilename()).thenReturn("test.jpg");
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> authService.uploadProfileImage(1L, file)).isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void updateProfile_AllFields_Success() {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setName("N");
        request.setPhone("P");
        request.setBio("B");
        request.setLocation("L");
        request.setSkills("S");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(modelMapper.map(any(), any())).thenReturn(new UserResponse());

        authService.updateProfile(1L, request);
        verify(userRepository).save(argThat(u -> 
            u.getName().equals("N") && u.getPhone().equals("P") && u.getBio().equals("B") && 
            u.getLocation().equals("L") && u.getSkills().equals("S")
        ));
    }

    @Test
    void updateProfile_Partial_Success() {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setPhone("999");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(modelMapper.map(any(), any())).thenReturn(new UserResponse());

        authService.updateProfile(1L, request);
        verify(userRepository).save(argThat(u -> u.getName().equals("Priya") && u.getPhone().equals("999")));
    }

    @Test
    void updateProfile_UserNotFound_ThrowsException() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> authService.updateProfile(1L, new UpdateProfileRequest())).isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void getAllUsers_Desc_Success() {
        Page<User> page = new PageImpl<>(List.of(user));
        when(userRepository.findAll(any(Pageable.class))).thenReturn(page);
        when(modelMapper.map(any(), any())).thenReturn(new UserResponse());

        authService.getAllUsers(0, 10, "id", "desc");
        verify(userRepository).findAll(any(Pageable.class));
    }

    @Test
    void getAllUsers_Asc_Success() {
        Page<User> page = new PageImpl<>(List.of(user));
        when(userRepository.findAll(any(Pageable.class))).thenReturn(page);
        when(modelMapper.map(any(), any())).thenReturn(new UserResponse());

        authService.getAllUsers(0, 10, "id", "asc");
        verify(userRepository).findAll(any(Pageable.class));
    }

    @Test
    void getUserById_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(modelMapper.map(any(), any())).thenReturn(new UserResponse());
        authService.getUserById(1L);
    }

    @Test
    void getUserById_NotFound_ThrowsException() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> authService.getUserById(1L)).isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void deleteUser_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        authService.deleteUser(1L);
        verify(userRepository).delete(any());
    }

    @Test
    void deleteUser_NotFound_ThrowsException() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> authService.deleteUser(1L)).isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void forgotPassword_Success() {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("priya@gmail.com");
        when(userRepository.findByEmail("priya@gmail.com")).thenReturn(Optional.of(user));
        authService.forgotPassword(request);
        verify(userRepository).save(any());
    }

    @Test
    void forgotPassword_NotFound_ThrowsException() {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("priya@gmail.com");
        when(userRepository.findByEmail("priya@gmail.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> authService.forgotPassword(request)).isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void resetPassword_UserNotFound_ThrowsException() {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setEmail("priya@gmail.com");
        when(userRepository.findByEmail("priya@gmail.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> authService.resetPassword(request)).isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void resetPassword_Success() {
        user.setResetToken("123456");
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(5));
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setEmail("priya@gmail.com");
        request.setOtp("123456");
        request.setNewPassword("np");

        when(userRepository.findByEmail("priya@gmail.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(anyString())).thenReturn("enp");

        authService.resetPassword(request);
        verify(userRepository).save(any());
    }

    @Test
    void resetPassword_InvalidOtp_ThrowsException() {
        user.setResetToken("1");
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setEmail("priya@gmail.com");
        request.setOtp("2");
        when(userRepository.findByEmail("priya@gmail.com")).thenReturn(Optional.of(user));
        assertThatThrownBy(() -> authService.resetPassword(request)).isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void resetPassword_Expired_ThrowsException() {
        user.setResetToken("123456");
        user.setResetTokenExpiry(LocalDateTime.now().minusMinutes(1));
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setEmail("priya@gmail.com");
        request.setOtp("123456");
        when(userRepository.findByEmail("priya@gmail.com")).thenReturn(Optional.of(user));
        assertThatThrownBy(() -> authService.resetPassword(request)).isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void resetPassword_NullToken_ThrowsException() {
        user.setResetToken(null);
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setEmail("priya@gmail.com");
        request.setOtp("123456");
        when(userRepository.findByEmail("priya@gmail.com")).thenReturn(Optional.of(user));
        assertThatThrownBy(() -> authService.resetPassword(request)).isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void updateProfile_MinimalFields_Success() {
        UpdateProfileRequest request = new UpdateProfileRequest();
        // All fields null

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(modelMapper.map(any(), any())).thenReturn(new UserResponse());

        authService.updateProfile(1L, request);
        verify(userRepository).save(argThat(u -> 
            u.getName().equals("Priya") && u.getPhone().equals("1234567890") && 
            u.getBio().equals("Bio") && u.getLocation().equals("Loc") && 
            u.getSkills().equals("Skills")
        ));
    }
}