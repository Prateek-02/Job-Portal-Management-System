package com.jobportal.adminservice.service;

import com.jobportal.adminservice.client.ApplicationServiceClient;
import com.jobportal.adminservice.client.AuthServiceClient;
import com.jobportal.adminservice.client.JobServiceClient;
import com.jobportal.adminservice.dto.response.JobResponse;
import com.jobportal.adminservice.dto.response.PageResponse;
import com.jobportal.adminservice.dto.response.UserResponse;
import com.jobportal.adminservice.event.UserDeleteEvent;
import com.jobportal.adminservice.producer.UserDeleteProducer;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceImplTest {

    @Mock
    private AuthServiceClient authServiceClient;

    @Mock
    private JobServiceClient jobServiceClient;

    @Mock
    private ApplicationServiceClient applicationServiceClient;

    @Mock
    private UserDeleteProducer userDeleteProducer;

    @InjectMocks
    private AdminServiceImpl adminService;

    private UserResponse jobSeeker;
    private UserResponse recruiter;
    private List<UserResponse> users;
    private JobResponse jobResponse;
    private PageResponse pageResponse;

    private static final String INTERNAL_SECRET = "test-secret";

    @BeforeEach
    void setUp() {

        ReflectionTestUtils.setField(
                adminService,
                "internalSecret",
                INTERNAL_SECRET);

        jobSeeker = new UserResponse();
        jobSeeker.setId(1L);
        jobSeeker.setRole("JOB_SEEKER");

        recruiter = new UserResponse();
        recruiter.setId(2L);
        recruiter.setRole("RECRUITER");

        users = Arrays.asList(jobSeeker, recruiter);

        jobResponse = new JobResponse();
        jobResponse.setId(1L);

        pageResponse = new PageResponse();
        pageResponse.setTotalElements(5);
    }

    @Test
    void getAllUsers_Success() {
        when(authServiceClient.getAllUsers(anyString()))
                .thenReturn(users);

        List<UserResponse> response = adminService.getAllUsers();

        assertThat(response).hasSize(2);

        verify(authServiceClient).getAllUsers(INTERNAL_SECRET);
    }

    @Test
    void getUserById_Success() {
        when(authServiceClient.getUserById(anyLong(), anyString()))
                .thenReturn(jobSeeker);

        UserResponse response = adminService.getUserById(1L);

        assertThat(response.getId()).isEqualTo(1L);

        verify(authServiceClient).getUserById(1L, INTERNAL_SECRET);
    }

    @Test
    void deleteUser_SagaTriggered() {
        when(authServiceClient.getUserById(anyLong(), anyString()))
                .thenReturn(recruiter);

        adminService.deleteUser(2L);

        verify(userDeleteProducer).startSaga(any(UserDeleteEvent.class));
    }

    @Test
    void getAllJobs_Success() {
        when(jobServiceClient.getAllJobs())
                .thenReturn(pageResponse);

        PageResponse response = adminService.getAllJobs();

        assertThat(response.getTotalElements()).isEqualTo(5);

        verify(jobServiceClient).getAllJobs();
    }

    @Test
    void getJobById_Success() {
        when(jobServiceClient.getJobById(anyLong()))
                .thenReturn(jobResponse);

        JobResponse response = adminService.getJobById(1L);

        assertThat(response.getId()).isEqualTo(1L);

        verify(jobServiceClient).getJobById(1L);
    }

    @Test
    void getReports_Success() {
        when(authServiceClient.getAllUsers(anyString()))
                .thenReturn(users);

        when(jobServiceClient.getAllJobs())
                .thenReturn(pageResponse);

        when(applicationServiceClient.getTotalApplications())
                .thenReturn(10L);

        Map<String, Object> reports = adminService.getReports();

        assertThat(reports.get("totalUsers")).isEqualTo(2L);
        assertThat(reports.get("totalJobs")).isEqualTo(5L);
        assertThat(reports.get("totalApplications")).isEqualTo(10L);

        verify(authServiceClient).getAllUsers(INTERNAL_SECRET);
        verify(jobServiceClient).getAllJobs();
        verify(applicationServiceClient).getTotalApplications();
    }
}