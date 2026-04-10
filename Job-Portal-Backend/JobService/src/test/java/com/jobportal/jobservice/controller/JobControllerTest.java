package com.jobportal.jobservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobportal.jobservice.dto.JobFilter;
import com.jobportal.jobservice.dto.request.JobRequest;
import com.jobportal.jobservice.dto.response.JobResponse;
import com.jobportal.jobservice.service.JobService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;

import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.jobportal.jobservice.exceptions.JobNotFoundException;
import com.jobportal.jobservice.exceptions.UnauthorizedException;

@WebMvcTest(JobController.class)
@AutoConfigureMockMvc(addFilters = false)
class JobControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JobService jobService;

    @Autowired
    private ObjectMapper objectMapper;

    // CREATE JOB
    @Test
    void testCreateJob() throws Exception {

    	JobRequest request = new JobRequest();
    	request.setTitle("Software Engineer");
    	request.setCompanyName("Google");
    	request.setDescription("Good job");
    	request.setLocation("Bangalore");
    	request.setExperience(2);
    	request.setSalary(50000.0);

        JobResponse response = new JobResponse();
        response.setId(1L);
        response.setTitle("Software Engineer");

        when(jobService.createJob(request, 1L, "RECRUITER"))
                .thenReturn(response);

        mockMvc.perform(post("/api/jobs")
                        .header("X-User-Id", 1L)
                        .header("X-User-Role", "RECRUITER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    // GET ALL JOBS
    @Test
    void testGetAllJobs() throws Exception {

        JobResponse job = new JobResponse();
        job.setId(1L);

        com.jobportal.jobservice.dto.response.PageResponse<JobResponse> pageResponse = new com.jobportal.jobservice.dto.response.PageResponse<>();
        pageResponse.setContent(List.of(job));

        when(jobService.getAllJobs(0, 10, "createdAt", "desc"))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/jobs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1));
    }

    // GET JOB BY ID
    @Test
    void testGetJobById() throws Exception {

        JobResponse job = new JobResponse();
        job.setId(1L);

        when(jobService.getJobById(1L)).thenReturn(job);

        mockMvc.perform(get("/api/jobs/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    // UPDATE JOB
    @Test
    void testUpdateJob() throws Exception {

        JobRequest request = new JobRequest();
        request.setTitle("Updated Job");
        request.setCompanyName("Google");
        request.setDescription("Good job");
        request.setLocation("Bangalore");
        request.setExperience(2);
        request.setSalary(50000.0);

        JobResponse response = new JobResponse();
        response.setId(1L);
        response.setTitle("Updated Job");

        when(jobService.updateJob(1L, request, 1L))
                .thenReturn(response);

        mockMvc.perform(put("/api/jobs/1")
                        .header("X-User-Id", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Job"));
    }

    // DELETE JOB
    @Test
    void testDeleteJob() throws Exception {

        doNothing().when(jobService).deleteJob(1L, 1L);

        mockMvc.perform(delete("/api/jobs/1")
                        .header("X-User-Id", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message")
                        .value("Job deleted successfully!"));
    }

    // SEARCH JOBS
    @Test
    void testSearchJobs() throws Exception {

        JobFilter filter = new JobFilter();

        JobResponse job = new JobResponse();
        job.setId(1L);

        com.jobportal.jobservice.dto.response.PageResponse<JobResponse> pageResponse = new com.jobportal.jobservice.dto.response.PageResponse<>();
        pageResponse.setContent(List.of(job));

        when(jobService.searchJobs(filter, 0, 10, "createdAt", "desc"))
                .thenReturn(pageResponse);

        mockMvc.perform(post("/api/jobs/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(filter)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1));
    }

    // DELETE RECRUITER JOBS
    @Test
    void testDeleteRecruiterJobs() throws Exception {

        doNothing().when(jobService).deleteRecruiterJobs(1L);

        mockMvc.perform(delete("/api/jobs/recruiter/1"))
                .andExpect(status().isNoContent());
    }

    // ERROR TESTS

    @Test
    void testCreateJob_Unauthorized() throws Exception {

        JobRequest request = new JobRequest();
        request.setTitle("Software Engineer");
        request.setCompanyName("Google");

        doThrow(new UnauthorizedException("Only recruiters can post jobs"))
                .when(jobService).createJob(request, 1L, "JOB_SEEKER");

        mockMvc.perform(post("/api/jobs")
                        .header("X-User-Id", 1L)
                        .header("X-User-Role", "JOB_SEEKER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetJobById_NotFound() throws Exception {

        when(jobService.getJobById(999L))
                .thenThrow(new JobNotFoundException("Job not found with id: 999"));

        mockMvc.perform(get("/api/jobs/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testUpdateJob_Unauthorized() throws Exception {

        JobRequest request = new JobRequest();
        request.setTitle("Updated Job");

        doThrow(new UnauthorizedException("You are not allowed to update this job"))
                .when(jobService).updateJob(1L, request, 2L);

        mockMvc.perform(put("/api/jobs/1")
                        .header("X-User-Id", 2L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUpdateJob_NotFound() throws Exception {

        JobRequest request = new JobRequest();
        request.setTitle("Updated Job");

        doThrow(new JobNotFoundException("Job not found with id: 999"))
                .when(jobService).updateJob(999L, request, 1L);

        mockMvc.perform(put("/api/jobs/999")
                        .header("X-User-Id", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void testDeleteJob_Unauthorized() throws Exception {

        doThrow(new UnauthorizedException("You are not allowed to delete this job"))
                .when(jobService).deleteJob(1L, 2L);

        mockMvc.perform(delete("/api/jobs/1")
                        .header("X-User-Id", 2L))
                .andExpect(status().isForbidden());
    }

    @Test
    void testDeleteJob_NotFound() throws Exception {

        doThrow(new JobNotFoundException("Job not found with id: 999"))
                .when(jobService).deleteJob(999L, 1L);

        mockMvc.perform(delete("/api/jobs/999")
                        .header("X-User-Id", 1L))
                .andExpect(status().isNotFound());
    }

    @Test
    void testSearchJobs_WithFilters() throws Exception {

        JobFilter filter = new JobFilter();
        filter.setTitle("Developer");
        filter.setLocation("Bangalore");

        JobResponse job = new JobResponse();
        job.setId(1L);
        job.setTitle("Developer");

        com.jobportal.jobservice.dto.response.PageResponse<JobResponse> pageResponse = new com.jobportal.jobservice.dto.response.PageResponse<>();
        pageResponse.setContent(List.of(job));

        when(jobService.searchJobs(any(JobFilter.class), eq(0), eq(10), eq("createdAt"), eq("desc")))
                .thenReturn(pageResponse);

        mockMvc.perform(post("/api/jobs/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(filter)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Developer"));
    }

    @Test
    void testGetAllJobs_WithPagination() throws Exception {

        JobResponse job1 = new JobResponse();
        job1.setId(1L);
        job1.setTitle("Job 1");

        JobResponse job2 = new JobResponse();
        job2.setId(2L);
        job2.setTitle("Job 2");

        com.jobportal.jobservice.dto.response.PageResponse<JobResponse> pageResponse = new com.jobportal.jobservice.dto.response.PageResponse<>();
        pageResponse.setContent(List.of(job1, job2));
        pageResponse.setPageNumber(1);
        pageResponse.setPageSize(5);
        pageResponse.setTotalElements(2);

        when(jobService.getAllJobs(1, 5, "salary", "asc"))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/jobs?page=1&size=5&sortBy=salary&direction=asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pageNumber").value(1))
                .andExpect(jsonPath("$.pageSize").value(5))
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void testCreateJob_MissingTitle() throws Exception {

        JobRequest request = new JobRequest();
        // Title is missing
        request.setCompanyName("Google");
        request.setDescription("Good job");
        request.setLocation("Bangalore");

        mockMvc.perform(post("/api/jobs")
                        .header("X-User-Id", 1L)
                        .header("X-User-Role", "RECRUITER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}

