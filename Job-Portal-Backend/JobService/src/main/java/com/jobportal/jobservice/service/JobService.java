package com.jobportal.jobservice.service;

import com.jobportal.jobservice.dto.JobFilter;
import com.jobportal.jobservice.dto.request.JobRequest;
import com.jobportal.jobservice.dto.response.JobResponse;
import com.jobportal.jobservice.dto.response.PageResponse;

public interface JobService {
    JobResponse createJob(JobRequest dto, Long recruiterId, String role);
    
    PageResponse<JobResponse> getAllJobs(int page, int size, String sortBy, String direction);
    
    JobResponse getJobById(Long id);
    
    JobResponse updateJob(Long id, JobRequest dto, Long recruiterId);
    
    void deleteJob(Long id, Long recruiterId);
    
    PageResponse<JobResponse> searchJobs(JobFilter filter, int page, int size, String sortBy, String direction);
    
    // Delete all jobs by recruiterId
    void deleteRecruiterJobs(Long recruiterId);
    
    PageResponse<JobResponse> getJobsByRecruiter(Long recruiterId, Long requesterId, String role, int page, int size, String sortBy, String direction);

    com.jobportal.jobservice.dto.response.MarketStatsResponse getMarketPulseStats();
}
