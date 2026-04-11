package com.jobportal.notificationservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// Sent by Application Service when someone applies
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobAppliedEvent {
    private String recruiterEmail;
    private String applicantName;
    private String applicantEmail;
    private String jobTitle;
    private String companyName;
}
