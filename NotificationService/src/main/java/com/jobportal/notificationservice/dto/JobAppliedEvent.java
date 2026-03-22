package com.jobportal.notificationservice.dto;

import lombok.Data;

// Sent by Application Service when a job seeker applies
@Data
public class JobAppliedEvent {
    private String recruiterEmail;
    private String applicantName;
    private String applicantEmail;
    private String jobTitle;
    private String companyName;
}
