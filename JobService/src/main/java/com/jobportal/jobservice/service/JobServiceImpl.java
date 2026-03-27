package com.jobportal.jobservice.service;

import org.modelmapper.ModelMapper;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.jobportal.jobservice.config.RabbitMQConfig;
import com.jobportal.jobservice.dto.JobFilterDto;
import com.jobportal.jobservice.dto.JobPostedEvent;
import com.jobportal.jobservice.dto.JobRequestDto;
import com.jobportal.jobservice.dto.JobResponseDto;
import com.jobportal.jobservice.entity.Job;
import com.jobportal.jobservice.exceptions.JobNotFoundException;
import com.jobportal.jobservice.exceptions.UnauthorizedException;
import com.jobportal.jobservice.repository.JobRepository;
import com.jobportal.jobservice.specification.JobSpecification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobServiceImpl implements JobService {

    private final JobRepository jobRepository;
    private final ModelMapper modelMapper;
    private final RabbitTemplate rabbitTemplate;

    @Override
    public JobResponseDto createJob(JobRequestDto dto,
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

        return modelMapper.map(saved, JobResponseDto.class);
    }

    @Override
    public Page<JobResponseDto> getAllJobs(int page, int size,
                                          String sortBy, String direction) {

        log.info("Get jobs | page: {} | size: {} | sortBy: {} | direction: {}",
                page, size, sortBy, direction);

        Sort sort = direction.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() :
                Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<JobResponseDto> result = jobRepository.findAll(pageable)
                .map(job -> modelMapper.map(job, JobResponseDto.class));

        log.debug("Jobs fetched | count: {}", result.getNumberOfElements());

        return result;
    }

    @Override
    public JobResponseDto getJobById(Long id) {

        log.info("Get job | jobId: {}", id);

        Job job = jobRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Job not found | jobId: {}", id);
                    return new JobNotFoundException("Job not found with id: " + id);
                });

        return modelMapper.map(job, JobResponseDto.class);
    }

    @Override
    public JobResponseDto updateJob(Long id,
                                   JobRequestDto dto, Long recruiterId) {

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

        return modelMapper.map(updated, JobResponseDto.class);
    }

    @Override
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

        log.info("Job deleted | jobId: {}", id);
    }

    @Override
    public Page<JobResponseDto> searchJobs(JobFilterDto filter,
                                          int page, int size,
                                          String sortBy, String direction) {

        log.info("Search jobs | page: {} | size: {} | filter: {}",
                page, size, filter);

        Sort sort = direction.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() :
                Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<JobResponseDto> result = jobRepository.findAll(
                JobSpecification.getFilteredJobs(filter), pageable)
                .map(job -> modelMapper.map(job, JobResponseDto.class));

        log.debug("Search result count: {}", result.getNumberOfElements());

        return result;
    }

    @Override
    public void deleteRecruiterJobs(Long recruiterId) {

        log.info("Delete recruiter jobs | recruiterId: {}", recruiterId);

        jobRepository.deleteByRecruiterId(recruiterId);

        log.info("Recruiter jobs deleted | recruiterId: {}", recruiterId);
    }
}

