package com.jobportal.authservice.dto.response;

import com.jobportal.authservice.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {

    private String token;
    private String name;
    private String email;
    private UserRole role;
    private String message;
}