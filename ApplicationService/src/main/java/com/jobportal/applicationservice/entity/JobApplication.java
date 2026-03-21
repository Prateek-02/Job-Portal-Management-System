package com.jobportal.applicationservice.entity;

import java.time.LocalDateTime;

import com.jobportal.applicationservice.enums.ApplicationStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name="applications", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id","job_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor

public class JobApplication {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@Column(name = "user_id", nullable = false)
	private Long userId;
	
	@Column(name = "job_id",nullable = false)
	private Long jobId;
	
	private String resumeUrl;
	
	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private ApplicationStatus status;
	
	
	@Column(name = "applied_at")
	private LocalDateTime appliedAt;
	
	@PrePersist
	protected void onCreate() {
		this.appliedAt = LocalDateTime.now();
		if(this.status == null) {
			this.status = ApplicationStatus.APPLIED;
		}
	}
	
}
