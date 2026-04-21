package com.jobportal.jobservice.service;

import com.jobportal.jobservice.config.RabbitMQConfig;
import com.jobportal.jobservice.dto.JobFilter;
import com.jobportal.jobservice.dto.JobPostedEvent;
import com.jobportal.jobservice.dto.request.JobRequest;
import com.jobportal.jobservice.dto.response.JobResponse;
import com.jobportal.jobservice.dto.response.MarketStatsResponse;
import com.jobportal.jobservice.dto.response.PageResponse;
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
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobServiceImplTest {

    @Mock
    private JobRepository jobRepository;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private JobServiceImpl jobService;

    private Job job;
    private JobRequest jobRequest;
    private JobResponse jobResponse;

    @BeforeEach
    void setUp() {
        job = new Job();
        job.setId(1L);
        job.setTitle("Software Engineer");
        job.setCompanyName("Tech Corp");
        job.setLocation("Remote");
        job.setSalary(100000.0);
        job.setExperience(3);
        job.setRecruiterId(200L);
        job.setSkills(Arrays.asList("Java", "Spring Boot"));

        jobRequest = new JobRequest();
        jobRequest.setTitle("Software Engineer");
        
        jobResponse = new JobResponse();
        jobResponse.setId(1L);
        jobResponse.setTitle("Software Engineer");
    }

    @Test
    void createJob_Success() {
        when(modelMapper.map(jobRequest, Job.class)).thenReturn(job);
        when(jobRepository.save(any(Job.class))).thenReturn(job);
        when(modelMapper.map(job, JobResponse.class)).thenReturn(jobResponse);

        JobResponse response = jobService.createJob(jobRequest, 200L, "RECRUITER");

        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Software Engineer");
        verify(rabbitTemplate, times(1)).convertAndSend(eq(RabbitMQConfig.JOB_POSTED_QUEUE), any(JobPostedEvent.class));
    }

    @Test
    void createJob_RabbitMQError_DoesNotThrowException() {
        when(modelMapper.map(jobRequest, Job.class)).thenReturn(job);
        when(jobRepository.save(any(Job.class))).thenReturn(job);
        when(modelMapper.map(job, JobResponse.class)).thenReturn(jobResponse);
        
        // Simulating an exception thrown internally by RabbitTemplate
        doThrow(new RuntimeException("RabbitMQ Connection Failed"))
                .when(rabbitTemplate).convertAndSend(eq(RabbitMQConfig.JOB_POSTED_QUEUE), any(JobPostedEvent.class));

        // The method should complete successfully despite the exception
        JobResponse response = jobService.createJob(jobRequest, 200L, "RECRUITER");
        assertThat(response).isNotNull();
    }

    @Test
    void createJob_UnauthorizedRole_ThrowsException() {
        assertThatThrownBy(() -> jobService.createJob(jobRequest, 200L, "USER"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Only recruiters can post jobs");
    }

    @Test
    void getAllJobs_Desc_Success() {
        Page<Job> page = new PageImpl<>(List.of(job));
        when(jobRepository.findAll(any(Pageable.class))).thenReturn(page);
        when(modelMapper.map(any(Job.class), eq(JobResponse.class))).thenReturn(jobResponse);

        PageResponse<JobResponse> result = jobService.getAllJobs(0, 10, "id", "desc");

        assertThat(result.getContent()).hasSize(1);
        verify(jobRepository).findAll(any(Pageable.class));
    }

    @Test
    void getAllJobs_Asc_Success() {
        Page<Job> page = new PageImpl<>(List.of(job));
        when(jobRepository.findAll(any(Pageable.class))).thenReturn(page);
        when(modelMapper.map(any(Job.class), eq(JobResponse.class))).thenReturn(jobResponse);

        PageResponse<JobResponse> result = jobService.getAllJobs(0, 10, "id", "asc");

        assertThat(result.getContent()).hasSize(1);
        verify(jobRepository).findAll(any(Pageable.class));
    }

    @Test
    void getJobById_Success() {
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));
        when(modelMapper.map(job, JobResponse.class)).thenReturn(jobResponse);

        JobResponse response = jobService.getJobById(1L);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
    }

    @Test
    void getJobById_NotFound_ThrowsException() {
        when(jobRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> jobService.getJobById(1L))
                .isInstanceOf(JobNotFoundException.class);
    }

    @Test
    void updateJob_Success() {
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));
        when(jobRepository.save(any(Job.class))).thenReturn(job);
        lenient().doNothing().when(modelMapper).map(any(JobRequest.class), any(Job.class));
        when(modelMapper.map(any(Job.class), eq(JobResponse.class))).thenReturn(jobResponse);

        JobResponse response = jobService.updateJob(1L, jobRequest, 200L);

        assertThat(response).isNotNull();
        verify(modelMapper).map(jobRequest, job);
    }

    @Test
    void updateJob_JobNotFound_ThrowsException() {
        when(jobRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> jobService.updateJob(1L, jobRequest, 200L))
                .isInstanceOf(JobNotFoundException.class);
    }

    @Test
    void updateJob_Unauthorized_ThrowsException() {
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));
        assertThatThrownBy(() -> jobService.updateJob(1L, jobRequest, 300L))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void deleteJob_Success() {
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));
        jobService.deleteJob(1L, 200L);
        verify(jobRepository, times(1)).delete(job);
    }

    @Test
    void deleteJob_JobNotFound_ThrowsException() {
        when(jobRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> jobService.deleteJob(1L, 200L))
                .isInstanceOf(JobNotFoundException.class);
    }

    @Test
    void deleteJob_Unauthorized_ThrowsException() {
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));
        assertThatThrownBy(() -> jobService.deleteJob(1L, 300L))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @SuppressWarnings("unchecked")
    void searchJobs_Desc_Success() {
        JobFilter filter = new JobFilter();
        Page<Job> page = new PageImpl<>(List.of(job));
        when(jobRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        when(modelMapper.map(any(Job.class), eq(JobResponse.class))).thenReturn(jobResponse);

        PageResponse<JobResponse> result = jobService.searchJobs(filter, 0, 10, "id", "desc");

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    @SuppressWarnings("unchecked")
    void searchJobs_Asc_Success() {
        JobFilter filter = new JobFilter();
        Page<Job> page = new PageImpl<>(List.of(job));
        when(jobRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        when(modelMapper.map(any(Job.class), eq(JobResponse.class))).thenReturn(jobResponse);

        PageResponse<JobResponse> result = jobService.searchJobs(filter, 0, 10, "id", "asc");
        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void deleteRecruiterJobs_Success() {
        jobService.deleteRecruiterJobs(200L);
        verify(jobRepository, times(1)).deleteByRecruiterId(200L);
    }

    @Test
    void getJobsByRecruiter_Desc_Success() {
        Page<Job> page = new PageImpl<>(List.of(job));
        when(jobRepository.findByRecruiterId(eq(200L), any(Pageable.class))).thenReturn(page);
        when(modelMapper.map(any(Job.class), eq(JobResponse.class))).thenReturn(jobResponse);

        PageResponse<JobResponse> result = jobService.getJobsByRecruiter(200L, 200L, "RECRUITER", 0, 10, "id", "desc");
        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getJobsByRecruiter_Asc_Success() {
        Page<Job> page = new PageImpl<>(List.of(job));
        when(jobRepository.findByRecruiterId(eq(200L), any(Pageable.class))).thenReturn(page);
        when(modelMapper.map(any(Job.class), eq(JobResponse.class))).thenReturn(jobResponse);

        PageResponse<JobResponse> result = jobService.getJobsByRecruiter(200L, 200L, "RECRUITER", 0, 10, "id", "asc");
        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getJobsByRecruiter_Unauthorized_ThrowsException() {
        assertThatThrownBy(() -> jobService.getJobsByRecruiter(200L, 300L, "RECRUITER", 0, 10, "id", "desc"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Access Denied! You can only view your own jobs.");
    }

    @Test
    void getJobsByRecruiter_AdminSuccess() {
        Page<Job> page = new PageImpl<>(List.of(job));
        when(jobRepository.findByRecruiterId(eq(200L), any(Pageable.class))).thenReturn(page);
        when(modelMapper.map(any(Job.class), eq(JobResponse.class))).thenReturn(jobResponse);

        PageResponse<JobResponse> result = jobService.getJobsByRecruiter(200L, 300L, "ADMIN", 0, 10, "id", "desc");
        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getMarketPulseStats_NoJobs_ReturnsZeros() {
        when(jobRepository.findAll()).thenReturn(new ArrayList<>());
        MarketStatsResponse response = jobService.getMarketPulseStats();

        assertThat(response.getAverageSalary()).isEqualTo(0.0);
        assertThat(response.getTopSkills()).isEmpty();
    }

    @Test
    void getMarketPulseStats_WithJobs_CalculatesCorrectly() {
        Job job2 = new Job();
        job2.setSalary(200000.0);
        job2.setSkills(Arrays.asList("Java", "AWS"));
        
        Job job3 = new Job();
        // job with no skills explicitly set
        job3.setSalary(0.0); // should pull average down
        
        when(jobRepository.findAll()).thenReturn(Arrays.asList(job, job2, job3));

        MarketStatsResponse response = jobService.getMarketPulseStats();

        assertThat(response.getAverageSalary()).isEqualTo(100000.0); // (100000+200000+0) / 3
        assertThat(response.getTopSkills()).isNotEmpty();
        assertThat(response.getSalaryTrend()).hasSize(5);
        assertThat(response.getDemandTrend()).hasSize(5);
    }
    
    @Test
    void getMarketPulseStats_NoSkills_UsesFallbackDivision() {
        Job noSkillJob = new Job();
        noSkillJob.setSalary(0.0);
        noSkillJob.setSkills(new ArrayList<>());
        when(jobRepository.findAll()).thenReturn(Arrays.asList(noSkillJob));
        MarketStatsResponse response = jobService.getMarketPulseStats();
        assertThat(response.getTopSkills()).isEmpty();
    }
}
