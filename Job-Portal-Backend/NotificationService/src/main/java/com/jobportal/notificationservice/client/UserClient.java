package com.jobportal.notificationservice.client;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

import com.jobportal.notificationservice.dto.UserResponse;

@FeignClient(name = "auth-service")
public interface UserClient {

    @GetMapping("/api/auth/users")
    List<UserResponse> getAllUsers(@RequestHeader("X-Internal-Secret") String secret);
}