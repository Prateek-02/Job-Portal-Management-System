package com.jobportal.adminservice.client;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import com.jobportal.adminservice.dto.response.UserResponse;

@FeignClient(name = "auth-service")
public interface AuthServiceClient {

    @GetMapping("/api/auth/users")
    List<UserResponse> getAllUsers(@RequestHeader("X-Internal-Secret") String secret);

    @GetMapping("/api/auth/users/{id}")
    UserResponse getUserById(@PathVariable Long id,
                            @RequestHeader("X-Internal-Secret") String secret);
}