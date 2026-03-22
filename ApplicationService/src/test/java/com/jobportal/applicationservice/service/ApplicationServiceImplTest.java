package com.jobportal.applicationservice.service;

import com.jobportal.applicationservice.client.JobClient;
import com.jobportal.applicationservice.client.UserClient;
import com.jobportal.applicationservice.dto.request.ApplicationRequest;
import com.jobportal.applicationservice.dto.response.ApplicationResponse;
import com.jobportal.applicationservice.dto.response.JobResponse;
import com.jobportal.applicationservice.dto.response.UserResponse;
import com.jobportal.applicationservice.entity.JobApplication;
import com.jobportal.applicationservice.enums.ApplicationStatus;
import com.jobportal.applicationservice.exception.ApplicationNotFoundException;
import com.jobportal.applicationservice.exception.DuplicateApplicationException;
import com.jobportal.applicationservice.exception.UnauthorizedException;
import com.jobportal.applicationservice.repository.ApplicationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceImplTest {

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private UserClient userClient;

    @Mock
    private JobClient jobClient;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private ApplicationServiceImpl applicationService;

    private ApplicationRequest applicationRequest;
    private ApplicationResponse applicationResponse;
    private JobApplication jobApplication;
    private UserResponse userResponse;
    private JobResponse jobResponse;

    // resumeUrl for testing
    private static final String RESUME_URL =
            "https://cloudinary.com/resume.pdf";

    @BeforeEach
    void setUp() {

        applicationRequest = new ApplicationRequest();
        applicationRequest.setJobId(1L);

        jobApplication = new JobApplication();
        jobApplication.setId(1L);
        jobApplication.setUserId(1L);
        jobApplication.setJobId(1L);
        jobApplication.setResumeUrl(RESUME_URL);
        jobApplication.setStatus(ApplicationStatus.APPLIED);
        jobApplication.setAppliedAt(LocalDateTime.now());

        applicationResponse = new ApplicationResponse();
        applicationResponse.setId(1L);
        applicationResponse.setUserId(1L);
        applicationResponse.setStatus(ApplicationStatus.APPLIED);

        userResponse = new UserResponse();
        userResponse.setId(1L);
        userResponse.setName("Priya Singh");
        userResponse.setEmail("priya@gmail.com");
        userResponse.setRole("JOB_SEEKER");

        jobResponse = new JobResponse();
        jobResponse.setId(1L);
        jobResponse.setTitle("Backend Developer");
        jobResponse.setCompanyName("Google");
        jobResponse.setLocation("Bangalore");
        jobResponse.setRecruiterId(2L);
    }

    // APPLY FOR JOB TESTS

    @Test
    void applyForJob_Success() {
        // Arrange
        when(jobClient.getJobById(anyLong()))
                .thenReturn(jobResponse);
        when(applicationRepository
                .existsByUserIdAndJobId(anyLong(), anyLong()))
                .thenReturn(false);
        when(applicationRepository.save(
                any(JobApplication.class)))
                .thenReturn(jobApplication);
        when(modelMapper.map(any(JobApplication.class),
                eq(ApplicationResponse.class)))
                .thenReturn(applicationResponse);
        when(userClient.getUserById(anyLong()))
                .thenReturn(userResponse);

        // Act
        ApplicationResponse response =
                applicationService.applyForJob(
                        applicationRequest, 1L,
                        "JOB_SEEKER", RESUME_URL); // ← added resumeUrl

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getStatus())
                .isEqualTo(ApplicationStatus.APPLIED);
        assertThat(response.getUserId()).isEqualTo(1L);
        assertThat(response.getId()).isEqualTo(1L);

        verify(applicationRepository, times(1))
                .save(any(JobApplication.class));
    }

    @Test
    void applyForJob_NotJobSeeker_ThrowsException() {
        // Act & Assert
        assertThatThrownBy(() ->
                applicationService.applyForJob(
                        applicationRequest, 1L,
                        "RECRUITER", RESUME_URL)) // ← added resumeUrl
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining(
                        "Only Job Seekers can apply");

        verify(applicationRepository, never())
                .save(any(JobApplication.class));
    }

    @Test
    void applyForJob_JobNotFound_ThrowsException() {
        // Arrange
        when(jobClient.getJobById(anyLong()))
                .thenThrow(new RuntimeException("Job not found"));

        // Act & Assert
        assertThatThrownBy(() ->
                applicationService.applyForJob(
                        applicationRequest, 1L,
                        "JOB_SEEKER", RESUME_URL)) // ← added resumeUrl
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Job not found");

        verify(applicationRepository, never())
                .save(any(JobApplication.class));
    }

    @Test
    void applyForJob_DuplicateApplication_ThrowsException() {
        // Arrange
        when(jobClient.getJobById(anyLong()))
                .thenReturn(jobResponse);
        when(applicationRepository
                .existsByUserIdAndJobId(anyLong(), anyLong()))
                .thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() ->
                applicationService.applyForJob(
                        applicationRequest, 1L,
                        "JOB_SEEKER", RESUME_URL)) // ← added resumeUrl
                .isInstanceOf(DuplicateApplicationException.class)
                .hasMessageContaining(
                        "You have already applied");

        verify(applicationRepository, never())
                .save(any(JobApplication.class));
    }

    // UPDATE STATUS TESTS

    @Test
    void updateStatus_Success() {
        // Arrange
        when(applicationRepository.findById(anyLong()))
                .thenReturn(Optional.of(jobApplication));
        when(applicationRepository.save(
                any(JobApplication.class)))
                .thenReturn(jobApplication);
        when(modelMapper.map(any(JobApplication.class),
                eq(ApplicationResponse.class)))
                .thenReturn(applicationResponse);
        when(jobClient.getJobById(anyLong()))
                .thenReturn(jobResponse);
        when(userClient.getUserById(anyLong()))
                .thenReturn(userResponse);

        // Act
        ApplicationResponse response =
                applicationService.updateStatus(
                        1L, ApplicationStatus.SHORTLISTED,
                        1L, "RECRUITER");

        // Assert
        assertThat(response).isNotNull();

        verify(applicationRepository, times(1))
                .save(any(JobApplication.class));
    }

    @Test
    void updateStatus_NotRecruiter_ThrowsException() {
        // Act & Assert
        assertThatThrownBy(() ->
                applicationService.updateStatus(
                        1L, ApplicationStatus.SHORTLISTED,
                        1L, "JOB_SEEKER"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining(
                        "Only Recruiters can update");

        verify(applicationRepository, never())
                .save(any(JobApplication.class));
    }

    @Test
    void updateStatus_ApplicationNotFound_ThrowsException() {
        // Arrange
        when(applicationRepository.findById(anyLong()))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() ->
                applicationService.updateStatus(
                        999L, ApplicationStatus.SHORTLISTED,
                        1L, "RECRUITER"))
                .isInstanceOf(ApplicationNotFoundException.class)
                .hasMessageContaining(
                        "Application not found with id");

        verify(applicationRepository, never())
                .save(any(JobApplication.class));
    }

    // DELETE TESTS

    @Test
    void deleteUserApplications_Success() {
        applicationService.deleteUserApplications(1L);
        verify(applicationRepository, times(1))
                .deleteByUserId(1L);
    }

    @Test
    void deleteJobApplications_Success() {
        applicationService.deleteJobApplications(1L);
        verify(applicationRepository, times(1))
                .deleteByJobId(1L);
    }
}