package com.jobportal.jobservice.controller;

import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.jobportal.jobservice.dto.JobFilterDto;
import com.jobportal.jobservice.dto.JobRequestDto;
import com.jobportal.jobservice.dto.JobResponseDto;
import com.jobportal.jobservice.service.JobService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class JobController {

    private final JobService jobService;

    @PostMapping
    public ResponseEntity<JobResponseDto> createJob(
            @Valid @RequestBody JobRequestDto dto,
            @RequestHeader("X-User-Id") Long recruiterId,
            @RequestHeader("X-User-Role") String role) {

        log.info("Create Job API | recruiterId: {} | role: {} | title: {}",
                recruiterId, role, dto.getTitle());

        JobResponseDto response =
                jobService.createJob(dto, recruiterId, role);

        log.info("Job created | jobId: {} | recruiterId: {}",
                response.getId(), recruiterId);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<Page<JobResponseDto>> getAllJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        log.info("Get jobs | page: {} | size: {} | sortBy: {} | direction: {}",
                page, size, sortBy, direction);

        Page<JobResponseDto> response =
                jobService.getAllJobs(page, size, sortBy, direction);

        log.debug("Jobs fetched | count: {}", response.getNumberOfElements());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobResponseDto> getJobById(@PathVariable Long id) {

        log.info("Get job | jobId: {}", id);

        JobResponseDto response = jobService.getJobById(id);

        log.info("Job fetched | jobId: {}", id);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobResponseDto> updateJob(
            @PathVariable Long id,
            @Valid @RequestBody JobRequestDto dto,
            @RequestHeader("X-User-Id") Long recruiterId) {

        log.info("Update job | jobId: {} | recruiterId: {}", id, recruiterId);

        JobResponseDto response =
                jobService.updateJob(id, dto, recruiterId);

        log.info("Job updated | jobId: {}", id);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteJob(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long recruiterId) {

        log.info("Delete job | jobId: {} | recruiterId: {}", id, recruiterId);

        jobService.deleteJob(id, recruiterId);

        log.info("Job deleted | jobId: {}", id);

        return ResponseEntity.ok(
                Map.of("message", "Job deleted successfully!"));
    }

    @PostMapping("/search")
    public ResponseEntity<Page<JobResponseDto>> searchJobs(
            @RequestBody JobFilterDto filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        log.info("Search jobs | page: {} | size: {} | filter: {}",
                page, size, filter);

        Page<JobResponseDto> response =
                jobService.searchJobs(filter, page, size, sortBy, direction);

        log.debug("Search result count: {}", response.getNumberOfElements());

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/recruiter/{recruiterId}")
    public ResponseEntity<Void> deleteRecruiterJobs(
            @PathVariable Long recruiterId) {

        log.info("Delete recruiter jobs | recruiterId: {}", recruiterId);

        jobService.deleteRecruiterJobs(recruiterId);

        log.info("Recruiter jobs deleted | recruiterId: {}", recruiterId);

        return ResponseEntity.noContent().build();
    }
}

