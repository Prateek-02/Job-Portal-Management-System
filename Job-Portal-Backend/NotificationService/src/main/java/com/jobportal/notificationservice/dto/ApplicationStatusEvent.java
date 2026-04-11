package com.jobportal.notificationservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// Sent by Application Service when status changes
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationStatusEvent {
    private String applicantEmail;
    private String applicantName;
    private String jobTitle;
    private String companyName;
    private String status;
}
