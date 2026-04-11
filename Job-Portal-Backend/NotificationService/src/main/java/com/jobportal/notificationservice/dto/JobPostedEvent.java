package com.jobportal.notificationservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// Sent by Job Service when job is created
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobPostedEvent {
    private String jobTitle;
    private String companyName;
    private String location;
    private Double salary;
    private Integer experience;
}
