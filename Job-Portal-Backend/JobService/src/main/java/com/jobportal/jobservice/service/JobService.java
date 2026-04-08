package com.jobportal.jobservice.service;

import com.jobportal.jobservice.dto.JobFilter;
import com.jobportal.jobservice.dto.request.JobRequest;
import com.jobportal.jobservice.dto.response.JobResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface JobService {
    JobResponse createJob(JobRequest dto, Long recruiterId, String role);
    
    Page<JobResponse> getAllJobs(int page, int size, String sortBy, String direction);
    
    JobResponse getJobById(Long id);
    
    JobResponse updateJob(Long id, JobRequest dto, Long recruiterId);
    
    void deleteJob(Long id, Long recruiterId);
    
    Page<JobResponse> searchJobs(JobFilter filter, int page, int size, String sortBy, String direction);
    
    // Delete all jobs by recruiterId
    void deleteRecruiterJobs(Long recruiterId);
    
    List<JobResponse> getJobsByRecruiter(Long recruiterId);

    com.jobportal.jobservice.dto.response.MarketStatsResponse getMarketPulseStats();
}
