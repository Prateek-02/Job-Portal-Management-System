package com.jobportal.jobservice.controller;

import com.jobportal.jobservice.dto.JobFilterDto;
import com.jobportal.jobservice.dto.JobRequestDto;
import com.jobportal.jobservice.dto.JobResponseDto;
import com.jobportal.jobservice.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class JobController {

    private final JobService jobService;

    // POST /api/jobs
    @PostMapping
    public ResponseEntity<JobResponseDto> createJob(
            @Valid @RequestBody JobRequestDto dto,
            @RequestHeader("X-User-Id") Long recruiterId,
            @RequestHeader("X-User-Role") String role) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(jobService.createJob(dto, recruiterId, role));
    }

    // GET /api/jobs
    @GetMapping
    public ResponseEntity<Page<JobResponseDto>> getAllJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        return ResponseEntity.ok(jobService.getAllJobs(page, size, sortBy, direction));
    }

    // GET /api/jobs/{id}
    @GetMapping("/{id}")
    public ResponseEntity<JobResponseDto> getJobById(@PathVariable Long id) {
        return ResponseEntity.ok(jobService.getJobById(id));
    }

    // PUT /api/jobs/{id}
    @PutMapping("/{id}")
    public ResponseEntity<JobResponseDto> updateJob(
            @PathVariable Long id,
            @Valid @RequestBody JobRequestDto dto,
            @RequestHeader("X-User-Id") Long recruiterId) {
        return ResponseEntity.ok(jobService.updateJob(id, dto, recruiterId));
    }

    // DELETE /api/jobs/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJob(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long recruiterId) {
        jobService.deleteJob(id, recruiterId);
        return ResponseEntity.noContent().build();
    }

    // POST /api/jobs/search
    @PostMapping("/search")
    public ResponseEntity<Page<JobResponseDto>> searchJobs(
            @RequestBody JobFilterDto filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        return ResponseEntity.ok(jobService.searchJobs(filter, page, size, sortBy, direction));
    }
}
