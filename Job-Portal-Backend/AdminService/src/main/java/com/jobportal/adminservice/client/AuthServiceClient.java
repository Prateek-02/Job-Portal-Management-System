package com.jobportal.adminservice.client;



import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import com.jobportal.adminservice.dto.response.UserResponse;

@FeignClient(name = "auth-service")
public interface AuthServiceClient {

    @GetMapping("/api/auth/users")
    com.jobportal.adminservice.dto.response.PageResponse<UserResponse> getAllUsers(
            @RequestHeader("X-Internal-Secret") String secret,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int page,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "10") int size,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "id") String sortBy,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "desc") String direction);

    @GetMapping("/api/auth/users/{id}")
    UserResponse getUserById(@PathVariable Long id,
                            @RequestHeader("X-Internal-Secret") String secret);
}