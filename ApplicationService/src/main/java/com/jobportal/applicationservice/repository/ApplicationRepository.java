package com.jobportal.applicationservice.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jobportal.applicationservice.entity.JobApplication;

@Repository
public interface ApplicationRepository extends JpaRepository<JobApplication,Long>{
	// Get all applications by user
	List<JobApplication> findByUserId(Long userId);
	
	//Get All applications for a job
	List<JobApplication> findByJobId(Long jobId);
	
	// Check if user already applied for a job
	boolean existsByUserIdAndJobId(Long userId,Long jobId);
	
	// Delete all applications by userId
    void deleteByUserId(Long userId);

    // Delete all applications by jobId
    void deleteByJobId(Long jobId);
    
    // Count all applications
    long count();  
	
}
