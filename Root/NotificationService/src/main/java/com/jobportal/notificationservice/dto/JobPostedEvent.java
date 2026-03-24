package com.jobportal.notificationservice.dto;

import lombok.Data;

// Sent by Job Service when a new job is posted
@Data
public class JobPostedEvent {
    private String recruiterEmail;
    private String jobTitle;
    private String companyName;
    private String location;
    private Double salary;
    private Integer experience;
}
