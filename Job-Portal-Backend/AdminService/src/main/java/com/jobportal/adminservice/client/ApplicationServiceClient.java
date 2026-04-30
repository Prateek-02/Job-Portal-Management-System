package com.jobportal.adminservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "application-service")
public interface ApplicationServiceClient {

    @GetMapping("/api/applications/count")
    Long getTotalApplications();

    @GetMapping("/api/applications/status-counts")
    java.util.Map<String, Long> getStatusCounts();
}