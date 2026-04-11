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
        private PageResponse<JobResponse> jobPageResponse;
        private PageResponse<UserResponse> userPageResponse;

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

                userPageResponse = new PageResponse<>();
                userPageResponse.setContent(users);
                userPageResponse.setTotalElements(users.size());

                jobPageResponse = new PageResponse<>();
                jobPageResponse.setTotalElements(5);
        }

        @Test
        void getAllUsers_Success() {
                when(authServiceClient.getAllUsers(anyString(), anyInt(), anyInt(), anyString(), anyString()))
                                .thenReturn(userPageResponse);

                PageResponse<UserResponse> response = adminService.getAllUsers(0, 10, "id", "desc");

                assertThat(response.getContent()).hasSize(2);

                verify(authServiceClient).getAllUsers(INTERNAL_SECRET, 0, 10, "id", "desc");
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
                when(jobServiceClient.getAllJobs(anyInt(), anyInt(), anyString(), anyString()))
                                .thenReturn(jobPageResponse);

                PageResponse<JobResponse> response = adminService.getAllJobs(0, 10, "createdAt", "desc");

                assertThat(response.getTotalElements()).isEqualTo(5);

                verify(jobServiceClient).getAllJobs(0, 10, "createdAt", "desc");
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
                when(authServiceClient.getAllUsers(anyString(), anyInt(), anyInt(), anyString(), anyString()))
                                .thenReturn(userPageResponse);

                when(jobServiceClient.getAllJobs(anyInt(), anyInt(), anyString(), anyString()))
                                .thenReturn(jobPageResponse);

                when(applicationServiceClient.getTotalApplications())
                                .thenReturn(10L);

                Map<String, Object> reports = adminService.getReports();

                assertThat(reports.get("totalUsers")).isEqualTo(2L);
                assertThat(reports.get("totalJobs")).isEqualTo(5L);
                assertThat(reports.get("totalApplications")).isEqualTo(10L);

                verify(authServiceClient).getAllUsers(eq(INTERNAL_SECRET), eq(0), eq(1000), eq("id"), eq("desc"));
                verify(jobServiceClient).getAllJobs(eq(0), eq(1000), eq("createdAt"), eq("desc"));
                verify(applicationServiceClient).getTotalApplications();
        }
}