package com.jobportal.jobservice.repository;

import com.jobportal.jobservice.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;



@Repository
public interface JobRepository extends JpaRepository<Job, Long>,
        JpaSpecificationExecutor<Job> {

    boolean existsByRecruiterId(Long recruiterId);

    Page<Job> findByRecruiterId(Long recruiterId, Pageable pageable);

    // Delete all jobs by recruiterId
    void deleteByRecruiterId(Long recruiterId);
}