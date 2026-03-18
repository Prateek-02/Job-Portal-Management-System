package com.jobportal.jobservice.service;

import com.jobportal.jobservice.dto.JobFilterDto;
import com.jobportal.jobservice.dto.JobRequestDto;
import com.jobportal.jobservice.dto.JobResponseDto;
import org.springframework.data.domain.Page;

public interface JobService {
    JobResponseDto createJob(JobRequestDto dto, Long recruiterId, String role);
    Page<JobResponseDto> getAllJobs(int page, int size, String sortBy, String direction);
    JobResponseDto getJobById(Long id);
    JobResponseDto updateJob(Long id, JobRequestDto dto, Long recruiterId);
    void deleteJob(Long id, Long recruiterId);
    Page<JobResponseDto> searchJobs(JobFilterDto filter, int page, int size, String sortBy, String direction);
}
