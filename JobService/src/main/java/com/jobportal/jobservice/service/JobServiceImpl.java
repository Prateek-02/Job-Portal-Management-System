package com.jobportal.jobservice.service;

import com.jobportal.jobservice.dto.JobFilterDto;
import com.jobportal.jobservice.dto.JobRequestDto;
import com.jobportal.jobservice.dto.JobResponseDto;
import com.jobportal.jobservice.entity.Job;
import com.jobportal.jobservice.exceptions.JobNotFoundException;
import com.jobportal.jobservice.exceptions.UnauthorizedException;
import com.jobportal.jobservice.repository.JobRepository;
import com.jobportal.jobservice.specification.JobSpecification;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class JobServiceImpl implements JobService {

    private final JobRepository jobRepository;
    private final ModelMapper modelMapper;

    @Override
    public JobResponseDto createJob(JobRequestDto dto, Long recruiterId, String role) {
        if (!role.equalsIgnoreCase("RECRUITER")) {
            throw new UnauthorizedException("Only recruiters can post jobs");
        }
        Job job = modelMapper.map(dto, Job.class);
        job.setRecruiterId(recruiterId);
        Job saved = jobRepository.save(job);
        return modelMapper.map(saved, JobResponseDto.class);
    }

    @Override
    public Page<JobResponseDto> getAllJobs(int page, int size, String sortBy, String direction) {
        Sort sort = direction.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return jobRepository.findAll(pageable)
                .map(job -> modelMapper.map(job, JobResponseDto.class));
    }

    @Override
    public JobResponseDto getJobById(Long id) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new JobNotFoundException("Job not found with id: " + id));
        return modelMapper.map(job, JobResponseDto.class);
    }

    @Override
    public JobResponseDto updateJob(Long id, JobRequestDto dto, Long recruiterId) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new JobNotFoundException("Job not found with id: " + id));
        if (!job.getRecruiterId().equals(recruiterId)) {
            throw new UnauthorizedException("You are not allowed to update this job");
        }
        modelMapper.map(dto, job);
        return modelMapper.map(jobRepository.save(job), JobResponseDto.class);
    }

    @Override
    public void deleteJob(Long id, Long recruiterId) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new JobNotFoundException("Job not found with id: " + id));
        if (!job.getRecruiterId().equals(recruiterId)) {
            throw new UnauthorizedException("You are not allowed to delete this job");
        }
        jobRepository.delete(job);
    }

    @Override
    public Page<JobResponseDto> searchJobs(JobFilterDto filter, int page, int size,
                                            String sortBy, String direction) {
        Sort sort = direction.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return jobRepository.findAll(JobSpecification.getFilteredJobs(filter), pageable)
                .map(job -> modelMapper.map(job, JobResponseDto.class));
    }
}
