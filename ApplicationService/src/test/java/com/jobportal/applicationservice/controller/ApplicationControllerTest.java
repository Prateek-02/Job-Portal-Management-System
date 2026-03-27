package com.jobportal.applicationservice.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import com.jobportal.applicationservice.dto.response.ApplicationResponse;
import com.jobportal.applicationservice.dto.response.JobApplicationResponse;
import com.jobportal.applicationservice.enums.ApplicationStatus;
import com.jobportal.applicationservice.service.ApplicationService;
import com.jobportal.applicationservice.service.CloudinaryService;

@WebMvcTest(ApplicationController.class)
@AutoConfigureMockMvc(addFilters = false)
class ApplicationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ApplicationService service;

    @MockBean
    private CloudinaryService cloudinaryService; // ✅ IMPORTANT FIX



    // APPLY JOB (MULTIPART)
    @Test
    void testApplyForJob() throws Exception {

        MockMultipartFile file = new MockMultipartFile(
                "resume",
                "resume.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "dummy content".getBytes()
        );

        when(cloudinaryService.uploadResume(any()))
                .thenReturn("http://cloudinary/resume.pdf"); // ✅ REQUIRED

        ApplicationResponse response = new ApplicationResponse();
        response.setId(1L);

        when(service.applyForJob(any(), eq(1L), eq("JOB_SEEKER"), any()))
                .thenReturn(response);

        mockMvc.perform(multipart("/api/applications/apply")
                        .file(file)
                        .param("jobId", "1")
                        .header("X-User-Id", 1L)
                        .header("X-User-Role", "JOB_SEEKER"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    // GET USER APPLICATIONS
    @Test
    void testGetUserApplications() throws Exception {

        ApplicationResponse response = new ApplicationResponse();
        response.setId(1L);

        when(service.getUserApplications(1L, "JOB_SEEKER"))
                .thenReturn(List.of(response));

        mockMvc.perform(get("/api/applications/user/viewApplications")
                        .header("X-User-Id", 1L)
                        .header("X-User-Role", "JOB_SEEKER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    // GET JOB APPLICATIONS
    @Test
    void testGetJobApplications() throws Exception {

        JobApplicationResponse response = new JobApplicationResponse();
        response.setId(1L);

        when(service.getJobApplications(1L, "RECRUITER", 10L))
                .thenReturn(List.of(response));

        mockMvc.perform(get("/api/applications/jobApplications/1")
                        .header("X-User-Id", 10L)
                        .header("X-User-Role", "RECRUITER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    // UPDATE STATUS
    @Test
    void testUpdateStatus() throws Exception {

        ApplicationResponse response = new ApplicationResponse();
        response.setId(1L);

        when(service.updateStatus(1L, ApplicationStatus.SHORTLISTED, 10L, "RECRUITER"))
                .thenReturn(response);

        mockMvc.perform(patch("/api/applications/jobApplication/1/status")
                        .param("status", "SHORTLISTED")
                        .header("X-User-Id", 10L)
                        .header("X-User-Role", "RECRUITER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    // DELETE USER APPLICATIONS
    @Test
    void testDeleteUserApplications() throws Exception {

        doNothing().when(service).deleteUserApplications(1L);

        mockMvc.perform(delete("/api/applications/user/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message")
                        .value("All applications of user deleted successfully!"));
    }

    // DELETE JOB APPLICATIONS
    @Test
    void testDeleteJobApplications() throws Exception {

        doNothing().when(service).deleteJobApplications(1L);

        mockMvc.perform(delete("/api/applications/job/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message")
                        .value("All applications for job deleted successfully!"));
    }

    // GET TOTAL APPLICATION COUNT
    @Test
    void testGetTotalApplications() throws Exception {

        when(service.getTotalApplications()).thenReturn(5L);

        mockMvc.perform(get("/api/applications/count"))
                .andExpect(status().isOk())
                .andExpect(content().string("5"));
    }
}

