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
    java.util.List<JobResponse> getJobsByRecruiter(@PathVariable Long recruiterId);
}
