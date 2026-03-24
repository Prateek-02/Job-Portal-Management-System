package com.jobportal.adminservice.client;

import com.jobportal.adminservice.dto.response.JobResponse;
import com.jobportal.adminservice.dto.response.PageResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "job-service")
public interface JobServiceClient {

    @GetMapping("/api/jobs")
    PageResponse getAllJobs();

    @GetMapping("/api/jobs/{id}")
    JobResponse getJobById(@PathVariable Long id);

    @DeleteMapping("/api/jobs/recruiter/{recruiterId}")
    void deleteRecruiterJobs(@PathVariable Long recruiterId);
}
