package com.jobportal.adminservice.client;

import com.jobportal.adminservice.dto.response.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "auth-service")
public interface AuthServiceClient {

    @GetMapping("/api/auth/users")
    List<UserResponse> getAllUsers();

    @GetMapping("/api/auth/users/{id}")
    UserResponse getUserById(@PathVariable Long id);

    @DeleteMapping("/api/auth/users/{id}")
    void deleteUser(@PathVariable Long id);
}
