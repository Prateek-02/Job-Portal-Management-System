package com.jobportal.adminservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "application-service")
public interface ApplicationServiceClient {

    @DeleteMapping("/api/applications/user/{userId}")
    void deleteUserApplications(@PathVariable Long userId);
    
    @GetMapping("/api/applications/count")
    Long getTotalApplications();
}
