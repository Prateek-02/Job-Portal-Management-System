package com.jobportal.adminservice.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDeleteEvent {

    private Long userId;
    private String role;          
    private String status;        
    private String failureReason; 
}