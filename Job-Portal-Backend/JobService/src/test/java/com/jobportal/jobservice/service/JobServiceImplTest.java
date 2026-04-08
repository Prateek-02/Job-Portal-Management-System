package com.jobportal.jobservice.service;

import com.jobportal.jobservice.dto.request.JobRequest;
import com.jobportal.jobservice.dto.response.JobResponse;
import com.jobportal.jobservice.entity.Job;
import com.jobportal.jobservice.exceptions.JobNotFoundException;
import com.jobportal.jobservice.exceptions.UnauthorizedException;
import com.jobportal.jobservice.repository.JobRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobServiceImplTest {

   
    // Mocks
    @Mock
    private JobRepository jobRepository;

    @Mock
    private ModelMapper modelMapper;


    // InjectMocks — class we are testing
    @InjectMocks
    private JobServiceImpl jobService;


    // Test Data
    private JobRequest JobRequest;
    private JobResponse JobResponse;
    private Job job;

    @BeforeEach
    void setUp() {

        // Job Request
        JobRequest = new JobRequest();
        JobRequest.setTitle("Backend Developer");
        JobRequest.setCompanyName("Google");
        JobRequest.setLocation("Bangalore");
        JobRequest.setSalary(1500000.0);
        JobRequest.setExperience(3);
        JobRequest.setDescription(
                "Looking for Java developer");

        // Job Entity
        job = new Job();
        job.setId(1L);
        job.setTitle("Backend Developer");
        job.setCompanyName("Google");
        job.setLocation("Bangalore");
        job.setSalary(1500000.0);
        job.setExperience(3);
        job.setDescription("Looking for Java developer");
        job.setRecruiterId(1L);
        job.setCreatedAt(LocalDateTime.now());

        // Job Response
        JobResponse = new JobResponse();
        JobResponse.setId(1L);
        JobResponse.setTitle("Backend Developer");
        JobResponse.setCompanyName("Google");
        JobResponse.setLocation("Bangalore");
        JobResponse.setSalary(1500000.0);
        JobResponse.setExperience(3);
        JobResponse.setRecruiterId(1L);
    }

    // CREATE JOB TESTS

    @Test
    void createJob_Success() {
        // Arrange
        when(modelMapper.map(any(JobRequest.class),
                eq(Job.class))).thenReturn(job);
        when(jobRepository.save(any(Job.class)))
                .thenReturn(job);
        when(modelMapper.map(any(Job.class),
                eq(JobResponse.class)))
                .thenReturn(JobResponse);

        // Act
        JobResponse response =
                jobService.createJob(JobRequest, 1L,
                        "RECRUITER");

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getTitle())
                .isEqualTo("Backend Developer");
        assertThat(response.getCompanyName())
                .isEqualTo("Google");

        // Verify save was called
        verify(jobRepository, times(1))
                .save(any(Job.class));
    }

    @Test
    void createJob_NotRecruiter_ThrowsException() {
        // Act & Assert
        assertThatThrownBy(() ->
                jobService.createJob(JobRequest,
                        1L, "JOB_SEEKER"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining(
                        "Only recruiters can post jobs");

        // Verify save was never called
        verify(jobRepository, never())
                .save(any(Job.class));
    }

    // GET JOB BY ID TESTS

    @Test
    void getJobById_Success() {
        // Arrange
        when(jobRepository.findById(anyLong()))
                .thenReturn(Optional.of(job));
        when(modelMapper.map(any(Job.class),
                eq(JobResponse.class)))
                .thenReturn(JobResponse);

        // Act
        JobResponse response = jobService.getJobById(1L);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getTitle())
                .isEqualTo("Backend Developer");
    }

    @Test
    void getJobById_NotFound_ThrowsException() {
        // Arrange
        when(jobRepository.findById(anyLong()))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() ->
                jobService.getJobById(999L))
                .isInstanceOf(JobNotFoundException.class)
                .hasMessageContaining("Job not found with id");
    }

    // UPDATE JOB TESTS

    @Test
    void updateJob_Success() {
        // Arrange
        when(jobRepository.findById(anyLong()))
                .thenReturn(Optional.of(job));

        // ← Add this — mock the map(dto, job) call
        doNothing().when(modelMapper)
                .map(any(JobRequest.class), any(Job.class));

        when(jobRepository.save(any(Job.class)))
                .thenReturn(job);
        when(modelMapper.map(any(Job.class),
                eq(JobResponse.class)))
                .thenReturn(JobResponse);

        // Act
        JobResponse response =
                jobService.updateJob(1L, JobRequest, 1L);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getTitle())
                .isEqualTo("Backend Developer");

        // Verify save was called
        verify(jobRepository, times(1))
                .save(any(Job.class));
    }

    @Test
    void updateJob_Unauthorized_ThrowsException() {
        // Arrange — job belongs to recruiter 1
        // but recruiter 2 is trying to update
        when(jobRepository.findById(anyLong()))
                .thenReturn(Optional.of(job));

        // Act & Assert
        assertThatThrownBy(() ->
                jobService.updateJob(1L, JobRequest, 2L))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining(
                        "You are not allowed to update");

        // Verify save was never called
        verify(jobRepository, never())
                .save(any(Job.class));
    }

    @Test
    void updateJob_NotFound_ThrowsException() {
        // Arrange
        when(jobRepository.findById(anyLong()))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() ->
                jobService.updateJob(999L, JobRequest, 1L))
                .isInstanceOf(JobNotFoundException.class)
                .hasMessageContaining("Job not found with id");
    }

  
    // DELETE JOB TESTS

    @Test
    void deleteJob_Success() {
        // Arrange
        when(jobRepository.findById(anyLong()))
                .thenReturn(Optional.of(job));

        // Act
        jobService.deleteJob(1L, 1L);

        // Verify delete was called
        verify(jobRepository, times(1))
                .delete(any(Job.class));
    }

    @Test
    void deleteJob_Unauthorized_ThrowsException() {
        // Arrange — job belongs to recruiter 1
        // but recruiter 2 is trying to delete
        when(jobRepository.findById(anyLong()))
                .thenReturn(Optional.of(job));

        // Act & Assert
        assertThatThrownBy(() ->
                jobService.deleteJob(1L, 2L))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining(
                        "You are not allowed to delete");

        // Verify delete was never called
        verify(jobRepository, never())
                .delete(any(Job.class));
    }

    @Test
    void deleteJob_NotFound_ThrowsException() {
        // Arrange
        when(jobRepository.findById(anyLong()))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() ->
                jobService.deleteJob(999L, 1L))
                .isInstanceOf(JobNotFoundException.class)
                .hasMessageContaining("Job not found with id");
    }

    // GET ALL JOBS TESTS

    @Test
    void getAllJobs_Success() {
        // Arrange
        Job job1 = new Job();
        job1.setId(1L);
        job1.setTitle("Backend Developer");
        
        Job job2 = new Job();
        job2.setId(2L);
        job2.setTitle("Frontend Developer");

        when(jobRepository.findAll(any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(java.util.Arrays.asList(job1, job2)));
        
        when(modelMapper.map(any(Job.class), eq(JobResponse.class)))
                .thenAnswer(invocation -> {
                    Job j = invocation.getArgument(0);
                    JobResponse dto = new JobResponse();
                    dto.setId(j.getId());
                    dto.setTitle(j.getTitle());
                    return dto;
                });

        // Act
        org.springframework.data.domain.Page<JobResponse> response =
                jobService.getAllJobs(0, 10, "createdAt", "desc");

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getNumberOfElements()).isEqualTo(2);
        assertThat(response.getContent().get(0).getId()).isEqualTo(1L);
    }

    @Test
    void getAllJobs_Ascending() {
        // Arrange
        when(jobRepository.findAll(any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(java.util.Collections.emptyList()));
        
        when(modelMapper.map(any(Job.class), eq(JobResponse.class)))
                .thenReturn(new JobResponse());

        // Act
        org.springframework.data.domain.Page<JobResponse> response =
                jobService.getAllJobs(0, 10, "createdAt", "asc");

        // Assert
        assertThat(response).isNotNull();
        verify(jobRepository, times(1)).findAll(any(org.springframework.data.domain.Pageable.class));
    }

    // SEARCH JOBS TESTS

    @Test
    @SuppressWarnings("unchecked")
    void searchJobs_Success() {
        // Arrange
        com.jobportal.jobservice.dto.JobFilter filter = new com.jobportal.jobservice.dto.JobFilter();
        
        Job job = new Job();
        job.setId(1L);
        job.setTitle("Java Developer");
        job.setLocation("Bangalore");

        when(jobRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), 
                any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(java.util.Arrays.asList(job)));
        
        when(modelMapper.map(any(Job.class), eq(JobResponse.class)))
                .thenReturn(JobResponse);

        // Act
        org.springframework.data.domain.Page<JobResponse> response =
                jobService.searchJobs(filter, 0, 10, "createdAt", "desc");

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getNumberOfElements()).isEqualTo(1);
        
        verify(jobRepository, times(1)).findAll(any(org.springframework.data.jpa.domain.Specification.class), 
                any(org.springframework.data.domain.Pageable.class));
    }

    // DELETE RECRUITER JOBS TESTS

    @Test
    void deleteRecruiterJobs_Success() {
        // Act
        jobService.deleteRecruiterJobs(1L);

        // Verify deleteByRecruiterId was called
        verify(jobRepository, times(1)).deleteByRecruiterId(1L);
    }
}
