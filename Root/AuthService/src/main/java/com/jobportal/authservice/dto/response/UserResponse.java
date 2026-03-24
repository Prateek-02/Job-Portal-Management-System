package com.jobportal.authservice.dto.response;

import com.jobportal.authservice.enums.UserRole;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private UserRole role;
    private String profileImageUrl;
    private String bio;
    private String skills;
    private String location;
    private LocalDateTime createdAt;
    
    
}