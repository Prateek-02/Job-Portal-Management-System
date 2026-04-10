package com.jobportal.jobservice.repository;

import com.jobportal.jobservice.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;



@Repository
public interface JobRepository extends JpaRepository<Job, Long>,
        JpaSpecificationExecutor<Job> {

    // ✅ Check if jobs exist for recruiter (required for Saga idempotency)
    boolean existsByRecruiterId(Long recruiterId);

    org.springframework.data.domain.Page<Job> findByRecruiterId(Long recruiterId, org.springframework.data.domain.Pageable pageable);

    // Delete all jobs by recruiterId
    void deleteByRecruiterId(Long recruiterId);
}