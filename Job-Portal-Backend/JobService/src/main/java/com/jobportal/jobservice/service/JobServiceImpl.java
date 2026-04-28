package com.jobportal.jobservice.service;

import org.modelmapper.ModelMapper;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.jobportal.jobservice.config.RabbitMQConfig;
import com.jobportal.jobservice.dto.JobFilter;
import com.jobportal.jobservice.dto.JobDeletedEvent;
import com.jobportal.jobservice.dto.JobPostedEvent;
import com.jobportal.jobservice.dto.request.JobRequest;
import com.jobportal.jobservice.dto.response.JobResponse;
import com.jobportal.jobservice.entity.Job;
import com.jobportal.jobservice.exceptions.JobNotFoundException;
import com.jobportal.jobservice.exceptions.UnauthorizedException;
import com.jobportal.jobservice.repository.JobRepository;
import com.jobportal.jobservice.specification.JobSpecification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.jobportal.jobservice.dto.response.PageResponse;
import com.jobportal.jobservice.dto.response.MarketStatsResponse;
import com.jobportal.jobservice.dto.response.SkillStatResponse;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobServiceImpl implements JobService {

    private final JobRepository jobRepository;
    private final ModelMapper modelMapper;
    private final RabbitTemplate rabbitTemplate;

    private <T, E> PageResponse<T> convertToPageResponse(Page<E> pageData, Class<T> responseType) {
        List<T> content = pageData.getContent().stream()
                .map(entity -> modelMapper.map(entity, responseType))
                .collect(Collectors.toList());

        return PageResponse.<T>builder()
                .content(content)
                .pageNumber(pageData.getNumber())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .last(pageData.isLast())
                .first(pageData.isFirst())
                .empty(pageData.isEmpty())
                .build();
    }

    @Override
    @CacheEvict(value = "jobs", allEntries = true)
    public JobResponse createJob(JobRequest dto,
                                   Long recruiterId, String role) {

        log.info("Create job | recruiterId: {} | role: {} | title: {}",
                recruiterId, role, dto.getTitle());

        if (!role.equalsIgnoreCase("RECRUITER")) {
            log.warn("Unauthorized create job | recruiterId: {} | role: {}",
                    recruiterId, role);
            throw new UnauthorizedException("Only recruiters can post jobs");
        }

        Job job = modelMapper.map(dto, Job.class);
        job.setRecruiterId(recruiterId);

        Job saved = jobRepository.save(job);

        log.info("Job saved | jobId: {}", saved.getId());

        try {
            JobPostedEvent event = new JobPostedEvent(
                    saved.getTitle(),
                    saved.getCompanyName(),
                    saved.getLocation(),
                    saved.getSalary(),
                    saved.getExperience()
            );

            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.JOB_POSTED_QUEUE, event);

            log.info("Job event published | jobId: {}", saved.getId());

        } catch (Exception e) {
            log.error("Job event publish failed | jobId: {}", saved.getId(), e);
        }

        return modelMapper.map(saved, JobResponse.class);
    }

    @Override
    public PageResponse<JobResponse> getAllJobs(int page, int size,
                                           String sortBy, String direction) {

        log.info("Get jobs | page: {} | size: {} | sortBy: {} | direction: {}",
                page, size, sortBy, direction);

        Sort sort = direction.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() :
                Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Job> result = jobRepository.findAll(pageable);

        log.debug("Jobs fetched | count: {}", result.getNumberOfElements());

        return convertToPageResponse(result, JobResponse.class);
    }

    @Override
    @Cacheable(value = "jobs", key = "#id")
    public JobResponse getJobById(Long id) {

        log.info("Get job | jobId: {}", id);

        Job job = jobRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Job not found | jobId: {}", id);
                    return new JobNotFoundException("Job not found with id: " + id);
                });

        return modelMapper.map(job, JobResponse.class);
    }

    @Override
    @CacheEvict(value = "jobs", key = "#id")
    public JobResponse updateJob(Long id,
                                   JobRequest dto, Long recruiterId) {

        log.info("Update job | jobId: {} | recruiterId: {}", id, recruiterId);

        Job job = jobRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Job not found for update | jobId: {}", id);
                    return new JobNotFoundException("Job not found with id: " + id);
                });

        if (!job.getRecruiterId().equals(recruiterId)) {
            log.warn("Unauthorized update | jobId: {} | recruiterId: {}",
                    id, recruiterId);
            throw new UnauthorizedException("You are not allowed to update this job");
        }

        modelMapper.map(dto, job);
        Job updated = jobRepository.save(job);

        log.info("Job updated | jobId: {}", updated.getId());

        return modelMapper.map(updated, JobResponse.class);
    }

    @Override
    @CacheEvict(value = "jobs", key = "#id")
    public void deleteJob(Long id, Long recruiterId) {

        log.info("Delete job | jobId: {} | recruiterId: {}", id, recruiterId);

        Job job = jobRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Job not found for delete | jobId: {}", id);
                    return new JobNotFoundException("Job not found with id: " + id);
                });

        if (!job.getRecruiterId().equals(recruiterId)) {
            log.warn("Unauthorized delete | jobId: {} | recruiterId: {}",
                    id, recruiterId);
            throw new UnauthorizedException("You are not allowed to delete this job");
        }

        jobRepository.delete(job);
        log.info("Job deleted from database | jobId: {}", id);

        // Publish Job Deleted event for other services to sync
        try {
            JobDeletedEvent event = new JobDeletedEvent(id);
            rabbitTemplate.convertAndSend(RabbitMQConfig.JOB_DELETED_QUEUE, event);
            log.info("Job deleted event published | jobId: {}", id);
        } catch (Exception e) {
            log.error("Failed to publish job deleted event | jobId: {}", id, e);
        }
    }

    @Override
    public PageResponse<JobResponse> searchJobs(JobFilter filter,
                                           int page, int size,
                                           String sortBy, String direction) {

        log.info("Search jobs | page: {} | size: {} | filter: {}",
                page, size, filter);

        Sort sort = direction.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() :
                Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Job> result = jobRepository.findAll(
                JobSpecification.getFilteredJobs(filter), pageable);

        log.debug("Search result count: {}", result.getNumberOfElements());

        return convertToPageResponse(result, JobResponse.class);
    }

    @Override
    @CacheEvict(value = "jobs", allEntries = true)
    public void deleteRecruiterJobs(Long recruiterId) {

        log.info("Delete recruiter jobs | recruiterId: {}", recruiterId);

        jobRepository.deleteByRecruiterId(recruiterId);

        log.info("Recruiter jobs deleted | recruiterId: {}", recruiterId);
    }

    @Override
    public PageResponse<JobResponse> getJobsByRecruiter(Long recruiterId, Long requesterId, String role, int page, int size, String sortBy, String direction) {
        log.info("Fetching jobs for recruiter | recruiterId: {} | requesterId: {} | role: {} | page: {}", 
                recruiterId, requesterId, role, page);

        // Security Check: Only the recruiter themselves or an ADMIN can view this private list
        if (!role.equalsIgnoreCase("ADMIN") && !recruiterId.equals(requesterId)) {
            log.warn("Unauthorized access to recruiter jobs | recruiterId: {} | requesterId: {} | role: {}", 
                    recruiterId, requesterId, role);
            throw new UnauthorizedException("Access Denied! You can only view your own jobs.");
        }
        
        Sort sort = direction.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() :
                Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Job> result = jobRepository.findByRecruiterId(recruiterId, pageable);
        
        return convertToPageResponse(result, JobResponse.class);
    }

    @Override
    public MarketStatsResponse getMarketPulseStats() {
        log.info("Calculating Job Market Pulse stats from database");
        List<Job> allJobs = jobRepository.findAll();

        if (allJobs.isEmpty()) {
            return MarketStatsResponse.builder()
                    .averageSalary(0.0)
                    .salaryGrowthYoy(0.0)
                    .salaryTrend(Arrays.asList(10.0, 10.0, 10.0, 10.0, 10.0))
                    .demandTrend(Arrays.asList(5.0, 5.0, 5.0, 5.0, 5.0))
                    .topSkills(Collections.emptyList())
                    .marketDemandStatus("Stable")
                    .build();
        }

        double avgSalary = allJobs.stream().mapToDouble(Job::getSalary).average().orElse(0.0);

        // Aggregate Top 3 Skills
        Map<String, Long> skillCounts = allJobs.stream()
                .filter(j -> j.getSkills() != null)
                .flatMap(j -> j.getSkills().stream())
                .collect(Collectors.groupingBy(s -> s, Collectors.counting()));

        long totalSkillMentions = skillCounts.values().stream().mapToLong(Long::longValue).sum();

        List<SkillStatResponse> topSkills = skillCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(3)
                .map(entry -> new SkillStatResponse(
                        entry.getKey(), 
                        (double) Math.round((entry.getValue() * 100.0) / (totalSkillMentions > 0 ? totalSkillMentions : 1))
                ))
                .collect(Collectors.toList());

        // Dynamic Calculation for YoY Salary Growth
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneYearAgo = now.minusYears(1);
        LocalDateTime twoYearsAgo = now.minusYears(2);

        double avgSalaryCurrentYear = allJobs.stream()
                .filter(j -> j.getCreatedAt() != null && j.getCreatedAt().isAfter(oneYearAgo))
                .mapToDouble(Job::getSalary)
                .average()
                .orElse(avgSalary); // Fallback to overall average if no jobs in last 12 months

        double avgSalaryPrevYear = allJobs.stream()
                .filter(j -> j.getCreatedAt() != null && j.getCreatedAt().isAfter(twoYearsAgo) && j.getCreatedAt().isBefore(oneYearAgo))
                .mapToDouble(Job::getSalary)
                .average()
                .orElse(0.0);

        double salaryGrowth = 0.0;
        if (avgSalaryPrevYear > 0) {
            salaryGrowth = ((avgSalaryCurrentYear - avgSalaryPrevYear) / avgSalaryPrevYear) * 100;
            // Round to 1 decimal place
            salaryGrowth = Math.round(salaryGrowth * 10.0) / 10.0;
        }

        // Simple Trend Generation (Mocking historical trend points from existing data distribution for sparkline)
        // In a real app, this would be a GROUP BY month query.
        List<Double> salaryTrend = Arrays.asList(
            avgSalary * 0.92, avgSalary * 0.95, avgSalary * 0.93, avgSalary * 0.98, avgSalary
        );
        List<Double> demandTrend = Arrays.asList(
            (double)allJobs.size() * 0.4, (double)allJobs.size() * 0.7, (double)allJobs.size() * 0.5, (double)allJobs.size() * 0.9, (double)allJobs.size()
        );

        return MarketStatsResponse.builder()
                .averageSalary(avgSalary)
                .salaryGrowthYoy(salaryGrowth)
                .salaryTrend(salaryTrend)
                .demandTrend(demandTrend)
                .topSkills(topSkills)
                .marketDemandStatus(allJobs.size() > 50 ? "High" : "Moderate")
                .build();
    }
}

