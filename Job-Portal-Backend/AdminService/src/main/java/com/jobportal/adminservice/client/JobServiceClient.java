package com.jobportal.adminservice.client;

import com.jobportal.adminservice.dto.response.JobResponse;
import com.jobportal.adminservice.dto.response.PageResponse;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "job-service")
public interface JobServiceClient {

    @GetMapping("/api/jobs")
    PageResponse<JobResponse> getAllJobs(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int page,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "10") int size,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "createdAt") String sortBy,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "desc") String direction);

    @GetMapping("/api/jobs/{id}")
    JobResponse getJobById(@PathVariable Long id);

    @org.springframework.web.bind.annotation.PostMapping("/api/jobs/search")
    PageResponse<JobResponse> searchJobs(
            @org.springframework.web.bind.annotation.RequestBody Object filter,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int page,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "10") int size,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "createdAt") String sortBy,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "desc") String direction);
}