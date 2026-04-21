package com.jobportal.jobservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobportal.jobservice.dto.JobFilter;
import com.jobportal.jobservice.dto.request.JobRequest;
import com.jobportal.jobservice.dto.response.JobResponse;
import com.jobportal.jobservice.dto.response.MarketStatsResponse;
import com.jobportal.jobservice.dto.response.PageResponse;
import com.jobportal.jobservice.service.JobService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(JobController.class)
class JobControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private JobService jobService;

    private JobRequest jobRequest;
    private JobResponse jobResponse;

    @BeforeEach
    void setUp() {
        jobRequest = new JobRequest();
        jobRequest.setTitle("Software Engineer");
        jobRequest.setCompanyName("Tech Corp");
        jobRequest.setLocation("Remote");
        jobRequest.setSalary(100000.0);
        jobRequest.setExperience(3);
        jobRequest.setDescription("Job Desc");
        jobRequest.setSkills(Collections.singletonList("Java"));

        jobResponse = new JobResponse();
        jobResponse.setId(1L);
        jobResponse.setTitle("Software Engineer");
    }

    @Test
    void createJob_Success() throws Exception {
        when(jobService.createJob(any(JobRequest.class), eq(200L), eq("RECRUITER")))
                .thenReturn(jobResponse);

        mockMvc.perform(post("/api/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(jobRequest))
                        .header("X-User-Id", 200L)
                        .header("X-User-Role", "RECRUITER"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Software Engineer"));
    }

    @Test
    void getAllJobs_Success() throws Exception {
        PageResponse<JobResponse> pageResponse = PageResponse.<JobResponse>builder()
                .content(Collections.singletonList(jobResponse))
                .build();

        when(jobService.getAllJobs(0, 10, "createdAt", "desc")).thenReturn(pageResponse);

        mockMvc.perform(get("/api/jobs")
                        .param("page", "0")
                        .param("size", "10")
                        .param("sortBy", "createdAt")
                        .param("direction", "desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("Software Engineer"));
    }

    @Test
    void getJobById_Success() throws Exception {
        when(jobService.getJobById(1L)).thenReturn(jobResponse);

        mockMvc.perform(get("/api/jobs/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void updateJob_Success() throws Exception {
        when(jobService.updateJob(eq(1L), any(JobRequest.class), eq(200L))).thenReturn(jobResponse);

        mockMvc.perform(put("/api/jobs/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(jobRequest))
                        .header("X-User-Id", 200L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void deleteJob_Success() throws Exception {
        mockMvc.perform(delete("/api/jobs/{id}", 1L)
                        .header("X-User-Id", 200L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Job deleted successfully!"));

        verify(jobService).deleteJob(1L, 200L);
    }

    @Test
    void searchJobs_Success() throws Exception {
        JobFilter filter = new JobFilter();
        PageResponse<JobResponse> pageResponse = PageResponse.<JobResponse>builder()
                .content(Collections.singletonList(jobResponse))
                .build();

        when(jobService.searchJobs(any(JobFilter.class), eq(0), eq(10), eq("createdAt"), eq("desc")))
                .thenReturn(pageResponse);

        mockMvc.perform(post("/api/jobs/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(filter))
                        .param("page", "0")
                        .param("size", "10")
                        .param("sortBy", "createdAt")
                        .param("direction", "desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1));
    }

    @Test
    void deleteRecruiterJobs_Success() throws Exception {
        mockMvc.perform(delete("/api/jobs/recruiter/{recruiterId}", 200L))
                .andExpect(status().isNoContent());

        verify(jobService).deleteRecruiterJobs(200L);
    }

    @Test
    void getJobsByRecruiter_Success() throws Exception {
        PageResponse<JobResponse> pageResponse = PageResponse.<JobResponse>builder()
                .content(Collections.singletonList(jobResponse))
                .build();

        when(jobService.getJobsByRecruiter(eq(200L), eq(200L), eq("RECRUITER"), eq(0), eq(10), eq("createdAt"), eq("desc")))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/jobs/recruiter/{recruiterId}", 200L)
                        .header("X-User-Id", 200L)
                        .header("X-User-Role", "RECRUITER")
                        .param("page", "0")
                        .param("size", "10")
                        .param("sortBy", "createdAt")
                        .param("direction", "desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1));
    }

    @Test
    void getMarketPulseStats_Success() throws Exception {
        MarketStatsResponse statsResponse = MarketStatsResponse.builder().averageSalary(50000.0).build();
        when(jobService.getMarketPulseStats()).thenReturn(statsResponse);

        mockMvc.perform(get("/api/jobs/stats/market-pulse"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.averageSalary").value(50000.0));
    }
}
