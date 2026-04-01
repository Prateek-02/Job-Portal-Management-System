package com.jobportal.applicationservice.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.function.Supplier;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.cloud.client.circuitbreaker.CircuitBreaker;
import org.springframework.cloud.client.circuitbreaker.CircuitBreakerFactory;
import org.springframework.test.util.ReflectionTestUtils;

import com.jobportal.applicationservice.client.JobClient;
import com.jobportal.applicationservice.client.UserClient;
import com.jobportal.applicationservice.dto.request.ApplicationRequest;
import com.jobportal.applicationservice.dto.response.*;
import com.jobportal.applicationservice.entity.JobApplication;
import com.jobportal.applicationservice.enums.ApplicationStatus;
import com.jobportal.applicationservice.exception.*;
import com.jobportal.applicationservice.repository.ApplicationRepository;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceImplTest {

    @Mock private ApplicationRepository repository;
    @Mock private ModelMapper mapper;
    @Mock private UserClient userClient;
    @Mock private JobClient jobClient;
    @Mock private RabbitTemplate rabbitTemplate;
    @Mock private CircuitBreakerFactory<?, ?> cbFactory;
    @Mock private CircuitBreaker cb;

    @InjectMocks
    private ApplicationServiceImpl service;

    private ApplicationRequest request;
    private JobApplication entity;
    private ApplicationResponse response;
    private UserResponse user;
    private JobResponse job;

    private static final String SECRET = "test-secret";
    private static final String RESUME = "resume-url";

    @BeforeEach
    void setup() {

        ReflectionTestUtils.setField(service, "internalSecret", SECRET);

        // ✅ Circuit breaker mock
        when(cbFactory.create(anyString())).thenReturn(cb);
        @SuppressWarnings("unchecked")
        Supplier<Object> supplier = any(Supplier.class);
        when(cb.run(supplier, any()))
                .thenAnswer(inv -> ((Supplier<?>) inv.getArgument(0)).get());

        request = new ApplicationRequest();
        request.setJobId(1L);

        entity = new JobApplication();
        entity.setId(1L);
        entity.setUserId(1L);
        entity.setJobId(1L);
        entity.setUserName("Test");
        entity.setUserEmail("test@mail.com");
        entity.setStatus(ApplicationStatus.APPLIED);
        entity.setAppliedAt(LocalDateTime.now());

        response = new ApplicationResponse();
        response.setId(1L);
        response.setUserId(1L);

        user = new UserResponse();
        user.setId(1L);
        user.setName("Test");
        user.setEmail("test@mail.com");

        job = new JobResponse();
        job.setId(1L);
        job.setRecruiterId(1L);
    }

    // ================= SUCCESS =================

    @Test
    void applyForJob_success() {

        when(jobClient.getJobById(1L)).thenReturn(job);
        when(userClient.getUserById(anyLong(), anyString())).thenReturn(user);
        when(repository.existsByUserIdAndJobId(1L, 1L)).thenReturn(false);
        when(repository.save(any())).thenReturn(entity);
        when(mapper.map(any(), eq(ApplicationResponse.class))).thenReturn(response);

        ApplicationResponse res =
                service.applyForJob(request, 1L, "JOB_SEEKER", RESUME);

        assertThat(res).isNotNull();

        verify(repository).save(any());
        verify(rabbitTemplate).convertAndSend(anyString(), any(Object.class)); // ✅ FIXED
    }

    @Test
    void updateStatus_success() {

        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(mapper.map(any(), eq(ApplicationResponse.class))).thenReturn(response);
        when(jobClient.getJobById(anyLong())).thenReturn(job);
        when(userClient.getUserById(anyLong(), anyString())).thenReturn(user);

        ApplicationResponse res =
                service.updateStatus(1L, ApplicationStatus.SHORTLISTED, 1L, "RECRUITER");

        assertThat(res).isNotNull();

        verify(repository).save(any());
        verify(rabbitTemplate).convertAndSend(anyString(), any(Object.class)); // ✅ FIXED
    }

    @Test
    void deleteUser_success() {
        service.deleteUserApplications(1L);
        verify(repository).deleteByUserId(1L);
    }

    @Test
    void deleteJob_success() {
        service.deleteJobApplications(1L);
        verify(repository).deleteByJobId(1L);
    }

    @Test
    void count_success() {
        when(repository.count()).thenReturn(10L);
        assertThat(service.getTotalApplications()).isEqualTo(10L);
    }

    // ================= FAILURES =================

    @Test
    void apply_notJobSeeker() {
        assertThatThrownBy(() ->
                service.applyForJob(request, 1L, "RECRUITER", RESUME))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void apply_duplicate() {
        when(jobClient.getJobById(1L)).thenReturn(job);
        when(repository.existsByUserIdAndJobId(1L, 1L)).thenReturn(true);

        assertThatThrownBy(() ->
                service.applyForJob(request, 1L, "JOB_SEEKER", RESUME))
                .isInstanceOf(DuplicateApplicationException.class);
    }

    @Test
    void apply_jobNotFound() {
        when(jobClient.getJobById(1L))
                .thenThrow(new RuntimeException("Job not found"));

        assertThatThrownBy(() ->
                service.applyForJob(request, 1L, "JOB_SEEKER", RESUME))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void update_notRecruiter() {
        assertThatThrownBy(() ->
                service.updateStatus(1L, ApplicationStatus.SHORTLISTED, 1L, "JOB_SEEKER"))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void update_notFound() {
        when(repository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                service.updateStatus(1L, ApplicationStatus.SHORTLISTED, 1L, "RECRUITER"))
                .isInstanceOf(ApplicationNotFoundException.class);
    }

    // ================= GET USER APPLICATIONS =================

    @Test
    void getUserApplications_success() {
        when(repository.findByUserId(1L)).thenReturn(java.util.List.of(entity));
        when(mapper.map(any(), eq(ApplicationResponse.class))).thenReturn(response);
        when(jobClient.getJobById(anyLong())).thenReturn(job);

        java.util.List<ApplicationResponse> res = service.getUserApplications(1L, "JOB_SEEKER");

        assertThat(res).hasSize(1);
        verify(repository).findByUserId(1L);
    }

    @Test
    void getUserApplications_notJobSeeker() {
        assertThatThrownBy(() ->
                service.getUserApplications(1L, "RECRUITER"))
                .isInstanceOf(UnauthorizedException.class);
    }

    // ================= GET JOB APPLICATIONS =================

    @Test
    void getJobApplications_success() {
        when(repository.findByJobId(1L)).thenReturn(java.util.List.of(entity));
        when(mapper.map(any(), eq(com.jobportal.applicationservice.dto.response.JobApplicationResponse.class)))
                .thenReturn(new com.jobportal.applicationservice.dto.response.JobApplicationResponse());
        when(jobClient.getJobById(1L)).thenReturn(job);
        when(userClient.getUserById(1L, SECRET)).thenReturn(user);

        java.util.List<com.jobportal.applicationservice.dto.response.JobApplicationResponse> res =
                service.getJobApplications(1L, "RECRUITER", 1L);

        assertThat(res).isNotEmpty();
        verify(repository).findByJobId(1L);
    }

    @Test
    void getJobApplications_unauthorized() {
        assertThatThrownBy(() ->
                service.getJobApplications(1L, "JOB_SEEKER", 1L))
                .isInstanceOf(UnauthorizedException.class);
    }
}