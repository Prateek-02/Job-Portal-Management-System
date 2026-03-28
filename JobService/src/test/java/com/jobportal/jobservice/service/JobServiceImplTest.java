package com.jobportal.jobservice.service;

import com.jobportal.jobservice.dto.JobRequestDto;
import com.jobportal.jobservice.dto.JobResponseDto;
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
    private JobRequestDto jobRequestDto;
    private JobResponseDto jobResponseDto;
    private Job job;

    @BeforeEach
    void setUp() {

        // Job Request
        jobRequestDto = new JobRequestDto();
        jobRequestDto.setTitle("Backend Developer");
        jobRequestDto.setCompanyName("Google");
        jobRequestDto.setLocation("Bangalore");
        jobRequestDto.setSalary(1500000.0);
        jobRequestDto.setExperience(3);
        jobRequestDto.setDescription(
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
        jobResponseDto = new JobResponseDto();
        jobResponseDto.setId(1L);
        jobResponseDto.setTitle("Backend Developer");
        jobResponseDto.setCompanyName("Google");
        jobResponseDto.setLocation("Bangalore");
        jobResponseDto.setSalary(1500000.0);
        jobResponseDto.setExperience(3);
        jobResponseDto.setRecruiterId(1L);
    }

    // CREATE JOB TESTS

    @Test
    void createJob_Success() {
        // Arrange
        when(modelMapper.map(any(JobRequestDto.class),
                eq(Job.class))).thenReturn(job);
        when(jobRepository.save(any(Job.class)))
                .thenReturn(job);
        when(modelMapper.map(any(Job.class),
                eq(JobResponseDto.class)))
                .thenReturn(jobResponseDto);

        // Act
        JobResponseDto response =
                jobService.createJob(jobRequestDto, 1L,
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
                jobService.createJob(jobRequestDto,
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
                eq(JobResponseDto.class)))
                .thenReturn(jobResponseDto);

        // Act
        JobResponseDto response = jobService.getJobById(1L);

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
                .map(any(JobRequestDto.class), any(Job.class));

        when(jobRepository.save(any(Job.class)))
                .thenReturn(job);
        when(modelMapper.map(any(Job.class),
                eq(JobResponseDto.class)))
                .thenReturn(jobResponseDto);

        // Act
        JobResponseDto response =
                jobService.updateJob(1L, jobRequestDto, 1L);

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
                jobService.updateJob(1L, jobRequestDto, 2L))
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
                jobService.updateJob(999L, jobRequestDto, 1L))
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
}
