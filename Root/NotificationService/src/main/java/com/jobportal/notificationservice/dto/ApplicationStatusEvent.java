package com.jobportal.notificationservice.dto;

import lombok.Data;

// Sent by Application Service when status changes
@Data
public class ApplicationStatusEvent {
    private String applicantEmail;
    private String applicantName;
    private String jobTitle;
    private String companyName;
    private String status;
}
