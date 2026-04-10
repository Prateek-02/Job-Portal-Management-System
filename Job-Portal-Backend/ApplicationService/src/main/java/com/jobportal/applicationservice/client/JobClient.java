package com.jobportal.applicationservice.client;

import com.jobportal.applicationservice.dto.response.JobResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "job-service")
public interface JobClient {

    @GetMapping("/api/jobs/{id}")
    JobResponse getJobById(@PathVariable Long id);

    @GetMapping("/api/jobs/recruiter/{recruiterId}")
    com.jobportal.applicationservice.dto.response.PageResponse<JobResponse> getJobsByRecruiter(
        @PathVariable Long recruiterId,
        @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int page,
        @org.springframework.web.bind.annotation.RequestParam(defaultValue = "1000") int size,
        @org.springframework.web.bind.annotation.RequestParam(defaultValue = "createdAt") String sortBy,
        @org.springframework.web.bind.annotation.RequestParam(defaultValue = "desc") String direction
    );
}
