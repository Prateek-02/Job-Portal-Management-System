package com.jobportal.applicationservice.dto.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ApplicationStatusEvent {
    private String applicantEmail;
    private String applicantName;
    private String jobTitle;
    private String companyName;
    private String status;
}