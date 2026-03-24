package com.jobportal.adminservice.service;

import com.jobportal.adminservice.client.ApplicationServiceClient;
import com.jobportal.adminservice.client.AuthServiceClient;
import com.jobportal.adminservice.client.JobServiceClient;
import com.jobportal.adminservice.dto.response.JobResponse;
import com.jobportal.adminservice.dto.response.PageResponse;
import com.jobportal.adminservice.dto.response.UserResponse;
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

    @InjectMocks
    private AdminServiceImpl adminService;

    private UserResponse jobSeeker;
    private UserResponse recruiter;
    private UserResponse admin;
    private JobResponse jobResponse;
    private PageResponse pageResponse;
    private List<UserResponse> users;

    // Internal secret for testing
    private static final String INTERNAL_SECRET =
            "jobportal-internal-secret-2024";

    @BeforeEach
    void setUp() {

        // Inject internal secret value
        ReflectionTestUtils.setField(
                adminService,
                "internalSecret",
                INTERNAL_SECRET);

        // Job Seeker
        jobSeeker = new UserResponse();
        jobSeeker.setId(1L);
        jobSeeker.setName("Priya Singh");
        jobSeeker.setEmail("priya2@gmail.com");
        jobSeeker.setRole("JOB_SEEKER");

        // Recruiter
        recruiter = new UserResponse();
        recruiter.setId(2L);
        recruiter.setName("Rahul Sharma");
        recruiter.setEmail("rahul1@gmail.com");
        recruiter.setRole("RECRUITER");

        // Admin
        admin = new UserResponse();
        admin.setId(3L);
        admin.setName("Super Admin");
        admin.setEmail("admin@jobportal.com");
        admin.setRole("ADMIN");

        // Users list
        users = Arrays.asList(jobSeeker, recruiter, admin);

        // Job Response
        jobResponse = new JobResponse();
        jobResponse.setId(1L);
        jobResponse.setTitle("Backend Developer");
        jobResponse.setCompanyName("Google");
        jobResponse.setLocation("Bangalore");

        // Page Response
        pageResponse = new PageResponse();
        pageResponse.setTotalElements(5);
        pageResponse.setTotalPages(1);
    }

    // GET ALL USERS TESTS

    @Test
    void getAllUsers_Success() {
        // Arrange
        when(authServiceClient.getAllUsers(anyString()))
                .thenReturn(users);

        // Act
        List<UserResponse> response =
                adminService.getAllUsers();

        // Assert
        assertThat(response).isNotNull();
        assertThat(response).hasSize(3);
        assertThat(response.get(0).getName())
                .isEqualTo("Priya Singh");
        assertThat(response.get(1).getName())
                .isEqualTo("Rahul Sharma");

        // Verify
        verify(authServiceClient, times(1))
                .getAllUsers(INTERNAL_SECRET);
    }

    // GET USER BY ID TESTS

    @Test
    void getUserById_Success() {
        // Arrange
        when(authServiceClient.getUserById(
                anyLong(), anyString()))
                .thenReturn(jobSeeker);

        // Act
        UserResponse response =
                adminService.getUserById(1L);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getName())
                .isEqualTo("Priya Singh");
        assertThat(response.getRole())
                .isEqualTo("JOB_SEEKER");

        // Verify
        verify(authServiceClient, times(1))
                .getUserById(1L, INTERNAL_SECRET);
    }

    // DELETE USER TESTS

    @Test
    void deleteUser_JobSeeker_Success() {
        // Arrange
        when(authServiceClient.getUserById(
                anyLong(), anyString()))
                .thenReturn(jobSeeker);

        // Act
        adminService.deleteUser(1L);

        // Verify applications deleted
        verify(applicationServiceClient, times(1))
                .deleteUserApplications(1L);

        // Verify jobs NOT deleted
        verify(jobServiceClient, never())
                .deleteRecruiterJobs(anyLong());

        // Verify user deleted
        verify(authServiceClient, times(1))
                .deleteUser(1L, INTERNAL_SECRET);
    }

    @Test
    void deleteUser_Recruiter_Success() {
        // Arrange
        when(authServiceClient.getUserById(
                anyLong(), anyString()))
                .thenReturn(recruiter);

        // Act
        adminService.deleteUser(2L);

        // Verify applications deleted
        verify(applicationServiceClient, times(1))
                .deleteUserApplications(2L);

        // Verify jobs deleted
        verify(jobServiceClient, times(1))
                .deleteRecruiterJobs(2L);

        // Verify user deleted
        verify(authServiceClient, times(1))
                .deleteUser(2L, INTERNAL_SECRET);
    }

    // GET ALL JOBS TESTS

    @Test
    void getAllJobs_Success() {
        // Arrange
        when(jobServiceClient.getAllJobs())
                .thenReturn(pageResponse);

        // Act
        PageResponse response = adminService.getAllJobs();

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getTotalElements())
                .isEqualTo(5);

        // Verify
        verify(jobServiceClient, times(1)).getAllJobs();
    }

    // GET JOB BY ID TESTS

    @Test
    void getJobById_Success() {
        // Arrange
        when(jobServiceClient.getJobById(anyLong()))
                .thenReturn(jobResponse);

        // Act
        JobResponse response = adminService.getJobById(1L);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getTitle())
                .isEqualTo("Backend Developer");
        assertThat(response.getCompanyName())
                .isEqualTo("Google");

        // Verify
        verify(jobServiceClient, times(1))
                .getJobById(1L);
    }

    // GET REPORTS TESTS

    @Test
    void getReports_Success() {
        // Arrange
        when(authServiceClient.getAllUsers(anyString()))
                .thenReturn(users);
        when(jobServiceClient.getAllJobs())
                .thenReturn(pageResponse);
        when(applicationServiceClient.getTotalApplications())
                .thenReturn(10L);

        // Act
        Map<String, Object> reports =
                adminService.getReports();

        // Assert
        assertThat(reports).isNotNull();
        assertThat(reports.get("totalUsers"))
                .isEqualTo(3L);
        assertThat(reports.get("jobSeekers"))
                .isEqualTo(1L);
        assertThat(reports.get("recruiters"))
                .isEqualTo(1L);
        assertThat(reports.get("totalJobs"))
                .isEqualTo(5L);
        assertThat(reports.get("totalApplications"))
                .isEqualTo(10L);

        // Verify
        verify(authServiceClient, times(1))
                .getAllUsers(INTERNAL_SECRET);
        verify(jobServiceClient, times(1))
                .getAllJobs();
        verify(applicationServiceClient, times(1))
                .getTotalApplications();
    }
}