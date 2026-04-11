package com.jobportal.authservice.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;

import static org.mockito.Mockito.*;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class JwtAuthFilterTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private UserDetailsServiceImpl userDetailsService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthFilter jwtAuthFilter;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        ReflectionTestUtils.setField(jwtAuthFilter, "internalSecret", "test-internal-secret");
    }

    @Test
    void doFilterInternal_SwaggerPath_ContinuesChain() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/swagger-ui/index.html");

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        verify(jwtUtil, never()).extractEmail(anyString());
    }

    @Test
    void doFilterInternal_ApiDocsPath_ContinuesChain() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/v3/api-docs");

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void doFilterInternal_SwaggerHtmlPath_ContinuesChain() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/swagger-ui.html");

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void doFilterInternal_WebjarsPath_ContinuesChain() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/webjars/some-resource");

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void doFilterInternal_InternalSecret_ContinuesChain() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/auth/users");
        when(request.getHeader("X-Internal-Secret")).thenReturn("test-internal-secret");

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        verify(jwtUtil, never()).extractEmail(anyString());
    }

    @Test
    void doFilterInternal_InvalidInternalSecret_ContinuesNormally() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/auth/users");
        when(request.getHeader("X-Internal-Secret")).thenReturn("wrong-secret");

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void doFilterInternal_ValidJwt_SetsAuthentication() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/auth/profile");
        when(request.getHeader("Authorization")).thenReturn("Bearer valid-token");
        when(jwtUtil.extractEmail("valid-token")).thenReturn("test@example.com");

        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("test@example.com");
        when(userDetails.getPassword()).thenReturn("password");
        when(userDetails.getAuthorities()).thenReturn(java.util.Collections.emptyList());
        
        when(userDetailsService.loadUserByUsername("test@example.com")).thenReturn(userDetails);
        when(jwtUtil.validateToken("valid-token", "test@example.com")).thenReturn(true);

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        assert SecurityContextHolder.getContext().getAuthentication() != null;
    }

    @Test
    void doFilterInternal_InvalidJwt_DoesNotSetAuthentication() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/auth/profile");
        when(request.getHeader("Authorization")).thenReturn("Bearer invalid-token");
        when(jwtUtil.extractEmail("invalid-token")).thenReturn("test@example.com");

        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("test@example.com");
        when(userDetailsService.loadUserByUsername("test@example.com")).thenReturn(userDetails);
        when(jwtUtil.validateToken("invalid-token", "test@example.com")).thenReturn(false);

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        assert SecurityContextHolder.getContext().getAuthentication() == null;
    }

    @Test
    void doFilterInternal_NoAuthHeader_ContinuesChain() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/auth/profile");
        when(request.getHeader("Authorization")).thenReturn(null);

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        assert SecurityContextHolder.getContext().getAuthentication() == null;
    }

    @Test
    void doFilterInternal_InvalidAuthHeaderFormat_ContinuesChain() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/auth/profile");
        when(request.getHeader("Authorization")).thenReturn("Basic user:pass");

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        assert SecurityContextHolder.getContext().getAuthentication() == null;
    }

    @Test
    void doFilterInternal_AlreadyAuthenticated_SkipsProcessing() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/auth/profile");
        when(request.getHeader("Authorization")).thenReturn("Bearer token");
        when(jwtUtil.extractEmail("token")).thenReturn("test@example.com");

        // Set an existing authentication
        org.springframework.security.core.Authentication existingAuth = mock(org.springframework.security.core.Authentication.class);
        SecurityContextHolder.getContext().setAuthentication(existingAuth);

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        // UserDetailsService should NOT be called because already authenticated
        verify(userDetailsService, never()).loadUserByUsername(anyString());
        assert SecurityContextHolder.getContext().getAuthentication() == existingAuth;
    }
}
