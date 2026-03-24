package com.jobportal.applicationservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import com.jobportal.applicationservice.dto.response.UserResponse;

@FeignClient(name = "auth-service")
public interface UserClient {

    @GetMapping("/api/auth/users/{id}")
    UserResponse getUserById(@PathVariable Long id,@RequestHeader("X-Internal-Secret")String secret);
}
