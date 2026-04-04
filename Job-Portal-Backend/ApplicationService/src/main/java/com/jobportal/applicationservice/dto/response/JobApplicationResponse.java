package com.jobportal.applicationservice.dto.response;

import java.time.LocalDateTime;
import com.jobportal.applicationservice.enums.ApplicationStatus;
import lombok.Data;

@Data
public class JobApplicationResponse {
    private Long id;
    private Long userId;
    private Long jobId;
    private String resumeUrl;
    private ApplicationStatus status;
    private LocalDateTime appliedAt;

    // User details
    private String applicantName;
    private String applicantEmail;

    // Job details
    private String jobTitle;
    private String companyName;
}