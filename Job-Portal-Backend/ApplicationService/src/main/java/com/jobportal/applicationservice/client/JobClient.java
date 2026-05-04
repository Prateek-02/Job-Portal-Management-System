package com.jobportal.applicationservice.client;

import com.jobportal.applicationservice.dto.response.JobResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import com.jobportal.applicationservice.dto.response.PageResponse;

@FeignClient(name = "job-service")
public interface JobClient {

    @GetMapping("/api/jobs/{id}")
    JobResponse getJobById(@PathVariable Long id);

    @GetMapping("/api/jobs/recruiter/{recruiterId}")
    PageResponse<JobResponse> getJobsByRecruiter(
        @PathVariable Long recruiterId,
        @RequestHeader("X-User-Id") Long userId,
        @RequestHeader("X-User-Role") String role,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "1000") int size,
        @RequestParam(defaultValue = "createdAt") String sortBy,
        @RequestParam(defaultValue = "desc") String direction
    );
}
