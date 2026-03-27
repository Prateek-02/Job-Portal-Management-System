package com.jobportal.applicationservice.dto.response;

import java.time.LocalDateTime;

import com.jobportal.applicationservice.enums.ApplicationStatus;

import lombok.Data;

@Data
public class ApplicationResponse {
	private Long id;
	private Long userId;
	private String userName;
	private String userEmail;
	private String resumeUrl;
	private ApplicationStatus status;
	private LocalDateTime appliedAt;
	
	// Job details as object
    private JobResponse job;
}
