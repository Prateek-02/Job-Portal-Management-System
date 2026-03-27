package com.jobportal.jobservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobportal.jobservice.dto.JobFilterDto;
import com.jobportal.jobservice.dto.JobRequestDto;
import com.jobportal.jobservice.dto.JobResponseDto;
import com.jobportal.jobservice.service.JobService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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

    	JobRequestDto request = new JobRequestDto();
    	request.setTitle("Software Engineer");
    	request.setCompanyName("Google");
    	request.setDescription("Good job");
    	request.setLocation("Bangalore");
    	request.setExperience(2);
    	request.setSalary(50000.0);

        JobResponseDto response = new JobResponseDto();
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

        JobResponseDto job = new JobResponseDto();
        job.setId(1L);

        when(jobService.getAllJobs(0, 10, "createdAt", "desc"))
                .thenReturn(new PageImpl<>(List.of(job)));

        mockMvc.perform(get("/api/jobs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1));
    }

    // GET JOB BY ID
    @Test
    void testGetJobById() throws Exception {

        JobResponseDto job = new JobResponseDto();
        job.setId(1L);

        when(jobService.getJobById(1L)).thenReturn(job);

        mockMvc.perform(get("/api/jobs/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    // UPDATE JOB
    @Test
    void testUpdateJob() throws Exception {

        JobRequestDto request = new JobRequestDto();
        request.setTitle("Updated Job");
        request.setCompanyName("Google");
        request.setDescription("Good job");
        request.setLocation("Bangalore");
        request.setExperience(2);
        request.setSalary(50000.0);

        JobResponseDto response = new JobResponseDto();
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

        JobFilterDto filter = new JobFilterDto();

        JobResponseDto job = new JobResponseDto();
        job.setId(1L);

        when(jobService.searchJobs(filter, 0, 10, "createdAt", "desc"))
                .thenReturn(new PageImpl<>(List.of(job)));

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
}

