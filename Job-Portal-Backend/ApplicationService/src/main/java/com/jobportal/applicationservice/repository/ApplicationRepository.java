package com.jobportal.applicationservice.repository;



import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jobportal.applicationservice.entity.JobApplication;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.jobportal.applicationservice.enums.ApplicationStatus;

@Repository
public interface ApplicationRepository extends JpaRepository<JobApplication, Long> {

    // Get all applications by user
    Page<JobApplication> findByUserId(Long userId, Pageable pageable);

    // Get all applications for a job
    Page<JobApplication> findByJobId(Long jobId, Pageable pageable);

    // Check if user already applied for a job
    boolean existsByUserIdAndJobId(Long userId, Long jobId);

    //  REQUIRED for Saga (Idempotency check)
    boolean existsByUserId(Long userId);

    // Delete all applications by userId
    void deleteByUserId(Long userId);

    // Delete all applications by jobId
    void deleteByJobId(Long jobId);

    // Count by status
    long countByStatus(ApplicationStatus status);
}