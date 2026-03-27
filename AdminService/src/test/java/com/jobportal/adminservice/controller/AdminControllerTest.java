package com.jobportal.adminservice.controller;

import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.List;
import java.util.Map;

import com.jobportal.adminservice.dto.response.JobResponse;
import com.jobportal.adminservice.dto.response.PageResponse;
import com.jobportal.adminservice.dto.response.UserResponse;
import com.jobportal.adminservice.service.AdminService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.*;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AdminController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminService adminService;

    // GET ALL USERS
    @Test
    void testGetAllUsers() throws Exception {

        UserResponse user = new UserResponse();
        user.setId(1L);

        when(adminService.getAllUsers()).thenReturn(List.of(user));

        mockMvc.perform(get("/api/admin/users")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    // GET USER BY ID
    @Test
    void testGetUserById() throws Exception {

        UserResponse user = new UserResponse();
        user.setId(1L);

        when(adminService.getUserById(1L)).thenReturn(user);

        mockMvc.perform(get("/api/admin/users/1")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    // DELETE USER
    @Test
    void testDeleteUser() throws Exception {

        doNothing().when(adminService).deleteUser(1L);

        mockMvc.perform(delete("/api/admin/users/1")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message")
                        .value("User deleted successfully!"));
    }

    // GET ALL JOBS
    @Test
    void testGetAllJobs() throws Exception {

        PageResponse response = new PageResponse();

        when(adminService.getAllJobs()).thenReturn(response);

        mockMvc.perform(get("/api/admin/jobs")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk());
    }

    // GET JOB BY ID
    @Test
    void testGetJobById() throws Exception {

        JobResponse job = new JobResponse();
        job.setId(1L);

        when(adminService.getJobById(1L)).thenReturn(job);

        mockMvc.perform(get("/api/admin/jobs/1")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    // GET REPORTS
    @Test
    void testGetReports() throws Exception {

        Map<String, Object> reports = Map.of(
                "totalUsers", 10,
                "totalJobs", 5
        );

        when(adminService.getReports()).thenReturn(reports);

        mockMvc.perform(get("/api/admin/reports")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").value(10));
    }

    // ❌ UNAUTHORIZED TEST (VERY IMPORTANT)
    @Test
    void testUnauthorizedAccess() throws Exception {

        mockMvc.perform(get("/api/admin/users")
                        .header("X-User-Role", "USER"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error")
                        .value("Access Denied! Only Admin can manage users."));
    }
}

