package com.jobportal.applicationservice.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.Supplier;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

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
    @SuppressWarnings("unchecked")
    void setup() {
        ReflectionTestUtils.setField(service, "internalSecret", SECRET);

        // Wire circuit breaker to pass-through (invoke the supplier directly, but handle fallbacks on error)
        lenient().when(cbFactory.create(anyString())).thenReturn(cb);
        lenient().doAnswer(inv -> {
            Supplier<?> supplier = inv.getArgument(0);
            Function<Throwable, ?> fallback = inv.getArgument(1);
            try {
                return supplier.get();
            } catch (Throwable t) {
                return fallback.apply(t);
            }
        }).when(cb).run(any(Supplier.class), any(Function.class));

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

    // ── APPLY FOR JOB ─────────────────────────────────────────────────

    @Test
    void applyForJob_success() {
        when(jobClient.getJobById(1L)).thenReturn(job);
        when(userClient.getUserById(anyLong(), anyString())).thenReturn(user);
        when(repository.existsByUserIdAndJobId(1L, 1L)).thenReturn(false);
        when(repository.save(any())).thenReturn(entity);
        when(mapper.map(any(), eq(ApplicationResponse.class))).thenReturn(response);

        ApplicationResponse res = service.applyForJob(request, 1L, "JOB_SEEKER", RESUME);

        assertThat(res).isNotNull();
        verify(repository).save(any());
        verify(rabbitTemplate).convertAndSend(anyString(), any(Object.class));
    }

    @Test
    void apply_notJobSeeker_ThrowsUnauthorized() {
        assertThatThrownBy(() ->
                service.applyForJob(request, 1L, "RECRUITER", RESUME))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void apply_duplicate_ThrowsDuplicateException() {
        when(jobClient.getJobById(1L)).thenReturn(job);
        when(repository.existsByUserIdAndJobId(1L, 1L)).thenReturn(true);

        assertThatThrownBy(() ->
                service.applyForJob(request, 1L, "JOB_SEEKER", RESUME))
                .isInstanceOf(DuplicateApplicationException.class);
    }

    @Test
    void apply_jobNotFound_ThrowsRuntimeException() {
        when(jobClient.getJobById(1L)).thenThrow(new RuntimeException("Job not found"));

        assertThatThrownBy(() ->
                service.applyForJob(request, 1L, "JOB_SEEKER", RESUME))
                .isInstanceOf(RuntimeException.class);
    }

    // ── UPDATE STATUS ─────────────────────────────────────────────────

    @Test
    void updateStatus_success() {
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(mapper.map(any(), eq(ApplicationResponse.class))).thenReturn(response);
        when(jobClient.getJobById(anyLong())).thenReturn(job);
        when(userClient.getUserById(anyLong(), anyString())).thenReturn(user);

        ApplicationResponse res =
                service.updateStatus(1L, ApplicationStatus.UNDER_REVIEW, 1L, "RECRUITER");

        assertThat(res).isNotNull();
        verify(repository).save(any());
        verify(rabbitTemplate).convertAndSend(anyString(), any(Object.class));
    }

    @Test
    void update_notRecruiter_ThrowsUnauthorized() {
        assertThatThrownBy(() ->
                service.updateStatus(1L, ApplicationStatus.UNDER_REVIEW, 1L, "JOB_SEEKER"))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void update_applicationNotFound_ThrowsNotFoundException() {
        when(repository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                service.updateStatus(1L, ApplicationStatus.UNDER_REVIEW, 1L, "RECRUITER"))
                .isInstanceOf(ApplicationNotFoundException.class);
    }

    @Test
    void updateStatus_wrongRecruiter_ThrowsUnauthorized() {
        // Job belongs to recruiter 99, but recruiter 1 is trying to update
        JobResponse jobOwnedByOther = new JobResponse();
        jobOwnedByOther.setId(1L);
        jobOwnedByOther.setRecruiterId(99L);

        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(jobClient.getJobById(anyLong())).thenReturn(jobOwnedByOther);

        assertThatThrownBy(() ->
                service.updateStatus(1L, ApplicationStatus.UNDER_REVIEW, 1L, "RECRUITER"))
                .isInstanceOf(UnauthorizedException.class);
    }

    // ── DELETE ────────────────────────────────────────────────────────

    @Test
    void deleteUserApplications_success() {
        service.deleteUserApplications(1L);
        verify(repository).deleteByUserId(1L);
    }

    @Test
    void deleteJobApplications_success() {
        service.deleteJobApplications(1L);
        verify(repository).deleteByJobId(1L);
    }

    // ── COUNT ─────────────────────────────────────────────────────────

    @Test
    void getTotalApplications_success() {
        when(repository.count()).thenReturn(10L);
        assertThat(service.getTotalApplications()).isEqualTo(10L);
    }

    // ── GET USER APPLICATIONS ─────────────────────────────────────────

    @Test
    void getUserApplications_success() {
        Page<JobApplication> pageArgs = new PageImpl<>(java.util.List.of(entity));
        when(repository.findByUserId(eq(1L), any(Pageable.class))).thenReturn(pageArgs);
        when(mapper.map(any(), eq(ApplicationResponse.class))).thenReturn(response);
        when(jobClient.getJobById(anyLong())).thenReturn(job);

        PageResponse<ApplicationResponse> res =
                service.getUserApplications(1L, "JOB_SEEKER", 0, 10, "appliedAt", "desc");

        assertThat(res.getContent()).hasSize(1);
        verify(repository).findByUserId(eq(1L), any(Pageable.class));
    }

    @Test
    void getUserApplications_notJobSeeker_ThrowsUnauthorized() {
        assertThatThrownBy(() ->
                service.getUserApplications(1L, "RECRUITER", 0, 10, "appliedAt", "desc"))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void getUserApplications_jobNotFound_SetsDefaultJobInfo() {
        // When the job fetch fails
        Page<JobApplication> pageArgs = new PageImpl<>(java.util.List.of(entity));
        when(repository.findByUserId(eq(1L), any(Pageable.class))).thenReturn(pageArgs);
        when(mapper.map(any(), eq(ApplicationResponse.class))).thenReturn(response);
        lenient().when(jobClient.getJobById(anyLong())).thenThrow(new RuntimeException("Job failed"));

        PageResponse<ApplicationResponse> res =
                service.getUserApplications(1L, "JOB_SEEKER", 0, 10, "appliedAt", "desc");

        assertThat(res.getContent()).hasSize(1);
        assertThat(res.getContent().get(0).getJob().getTitle()).isEqualTo("Job no longer available");
    }

    // ── GET JOB APPLICATIONS ──────────────────────────────────────────

    @Test
    void getJobApplications_success() {
        Page<JobApplication> pageArgs = new PageImpl<>(java.util.List.of(entity));
        when(repository.findByJobId(eq(1L), any(Pageable.class))).thenReturn(pageArgs);
        when(jobClient.getJobById(1L)).thenReturn(job);
        when(userClient.getUserById(1L, SECRET)).thenReturn(user);

        PageResponse<JobApplicationResponse> res =
                service.getJobApplications(1L, "RECRUITER", 1L, 0, 10, "appliedAt", "desc");

        assertThat(res.getContent()).isNotEmpty();
        verify(repository).findByJobId(eq(1L), any(Pageable.class));
    }

    @Test
    void getJobApplications_AscSort() {
        Page<JobApplication> pageArgs = new PageImpl<>(java.util.List.of(entity));
        when(repository.findByJobId(eq(1L), any(Pageable.class))).thenReturn(pageArgs);
        when(jobClient.getJobById(1L)).thenReturn(job);
        when(userClient.getUserById(1L, SECRET)).thenReturn(user);

        PageResponse<JobApplicationResponse> res =
                service.getJobApplications(1L, "RECRUITER", 1L, 0, 10, "appliedAt", "asc");

        assertThat(res.getContent()).isNotEmpty();
    }

    @Test
    void getJobApplications_userNotFound_SetsDefaultUserInfo() {
        Page<JobApplication> pageArgs = new PageImpl<>(java.util.List.of(entity));
        when(repository.findByJobId(eq(1L), any(Pageable.class))).thenReturn(pageArgs);
        when(jobClient.getJobById(1L)).thenReturn(job);
        lenient().when(userClient.getUserById(anyLong(), anyString())).thenThrow(new RuntimeException("User failed"));

        PageResponse<JobApplicationResponse> res =
                service.getJobApplications(1L, "RECRUITER", 1L, 0, 10, "appliedAt", "desc");

        assertThat(res.getContent().get(0).getApplicantName()).isEqualTo("N/A");
    }

    @Test
    void getJobApplications_notRecruiter_ThrowsUnauthorized() {
        assertThatThrownBy(() ->
                service.getJobApplications(1L, "JOB_SEEKER", 1L, 0, 10, "appliedAt", "desc"))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void getJobApplications_wrongRecruiter_ThrowsUnauthorized() {
        // Job belongs to recruiter 99, but recruiter 1 is requesting
        JobResponse jobOwnedByOther = new JobResponse();
        jobOwnedByOther.setId(1L);
        jobOwnedByOther.setRecruiterId(99L);

        when(jobClient.getJobById(1L)).thenReturn(jobOwnedByOther);

        assertThatThrownBy(() ->
                service.getJobApplications(1L, "RECRUITER", 1L, 0, 10, "appliedAt", "desc"))
                .isInstanceOf(UnauthorizedException.class);
    }

    // ── RECRUITER ALL APPLICATIONS ───────────────────────────────────

    @Test
    void getAllApplicationsForRecruiter_success() {
        PageResponse<JobResponse> jobPage = new PageResponse<>();
        jobPage.setContent(java.util.List.of(job));
        when(jobClient.getJobsByRecruiter(1L, 1L, "RECRUITER", 0, 1000, "createdAt", "desc")).thenReturn(jobPage);

        JobApplication entity2 = new JobApplication();
        entity2.setId(2L);
        entity2.setAppliedAt(LocalDateTime.now().minusDays(1));
        
        Page<JobApplication> appPage = new PageImpl<>(java.util.List.of(entity, entity2));
        when(repository.findByJobId(eq(1L), any(Pageable.class))).thenReturn(appPage);
        when(jobClient.getJobById(1L)).thenReturn(job);
        when(userClient.getUserById(anyLong(), anyString())).thenReturn(user);

        PageResponse<JobApplicationResponse> res =
                service.getAllApplicationsForRecruiter(1L, "RECRUITER", 0, 10, "appliedAt", "desc");

        assertThat(res.getContent()).hasSize(2);
        // Ensure sorting logic was hit
    }

    @Test
    void getAllApplicationsForRecruiter_AscSort() {
        PageResponse<JobResponse> jobPage = new PageResponse<>();
        jobPage.setContent(java.util.List.of(job));
        when(jobClient.getJobsByRecruiter(1L, 1L, "RECRUITER", 0, 1000, "createdAt", "desc")).thenReturn(jobPage);

        Page<JobApplication> appPage = new PageImpl<>(java.util.List.of(entity));
        when(repository.findByJobId(eq(1L), any(Pageable.class))).thenReturn(appPage);
        when(jobClient.getJobById(1L)).thenReturn(job);
        when(userClient.getUserById(anyLong(), anyString())).thenReturn(user);

        PageResponse<JobApplicationResponse> res =
                service.getAllApplicationsForRecruiter(1L, "RECRUITER", 0, 10, "appliedAt", "asc");

        assertThat(res.getContent()).isNotEmpty();
        assertThat(res.isFirst()).isTrue();
    }

    @Test
    void getAllApplicationsForRecruiter_SecondPage() {
        PageResponse<JobResponse> jobPage = new PageResponse<>();
        jobPage.setContent(java.util.List.of(job));
        when(jobClient.getJobsByRecruiter(1L, 1L, "RECRUITER", 0, 1000, "createdAt", "desc")).thenReturn(jobPage);

        Page<JobApplication> appPage = new PageImpl<>(java.util.List.of(entity, entity));
        when(repository.findByJobId(eq(1L), any(Pageable.class))).thenReturn(appPage);
        when(jobClient.getJobById(1L)).thenReturn(job);
        when(userClient.getUserById(anyLong(), anyString())).thenReturn(user);

        // Page 1 (second page), size 1
        PageResponse<JobApplicationResponse> res =
                service.getAllApplicationsForRecruiter(1L, "RECRUITER", 1, 1, "appliedAt", "desc");

        assertThat(res.isFirst()).isFalse();
        assertThat(res.isLast()).isTrue();
    }

    @Test
    void getAllApplicationsForRecruiter_NotLastPage() {
        PageResponse<JobResponse> jobPage = new PageResponse<>();
        jobPage.setContent(java.util.List.of(job));
        when(jobClient.getJobsByRecruiter(1L, 1L, "RECRUITER", 0, 1000, "createdAt", "desc")).thenReturn(jobPage);

        Page<JobApplication> appPage = new PageImpl<>(java.util.List.of(entity, entity));
        when(repository.findByJobId(eq(1L), any(Pageable.class))).thenReturn(appPage);
        when(jobClient.getJobById(1L)).thenReturn(job);
        when(userClient.getUserById(anyLong(), anyString())).thenReturn(user);

        // Page 0, size 1, 2 total -> totalPages 2. last = (0 >= 1) = false.
        PageResponse<JobApplicationResponse> res =
                service.getAllApplicationsForRecruiter(1L, "RECRUITER", 0, 1, "appliedAt", "desc");

        assertThat(res.isLast()).isFalse();
    }

    @Test
    void getAllApplicationsForRecruiter_notRecruiter_ThrowsUnauthorized() {
        assertThatThrownBy(() ->
                service.getAllApplicationsForRecruiter(1L, "JOB_SEEKER", 0, 10, "appliedAt", "desc"))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void getAllApplicationsForRecruiter_FetchAppsError_SwallowsErrorAndContinues() {
        PageResponse<JobResponse> jobPage = new PageResponse<>();
        jobPage.setContent(java.util.List.of(job));
        when(jobClient.getJobsByRecruiter(1L, 1L, "RECRUITER", 0, 1000, "createdAt", "desc")).thenReturn(jobPage);

        // Simulate an error when fetching applications for one of the jobs
        when(jobClient.getJobById(1L)).thenThrow(new RuntimeException("Fetch failed"));

        PageResponse<JobApplicationResponse> res =
                service.getAllApplicationsForRecruiter(1L, "RECRUITER", 0, 10, "appliedAt", "desc");

        // Should return empty list but not crash
        assertThat(res.getContent()).isEmpty();
    }

    // ── CIRCUIT BREAKER & FALLBACKS ──────────────────────────────────

    @Test
    void fetchUser_NotFound_ThrowsRuntimeException() {
        feign.FeignException.NotFound fe = mock(feign.FeignException.NotFound.class);
        when(fe.status()).thenReturn(404);
        
        when(userClient.getUserById(anyLong(), anyString())).thenThrow(fe);

        assertThatThrownBy(() -> service.applyForJob(request, 1L, "JOB_SEEKER", RESUME))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void fetchUser_InternalError_ThrowsGenericException() {
        feign.FeignException fe = mock(feign.FeignException.class);
        when(fe.status()).thenReturn(500);
        
        when(userClient.getUserById(anyLong(), anyString())).thenThrow(fe);

        assertThatThrownBy(() -> service.applyForJob(request, 1L, "JOB_SEEKER", RESUME))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("AuthService unavailable");
    }

    @Test
    void fetchJob_NotFound_ThrowsRuntimeException() {
        feign.FeignException.NotFound fe = mock(feign.FeignException.NotFound.class);
        when(fe.status()).thenReturn(404);
        
        when(jobClient.getJobById(anyLong())).thenThrow(fe);

        assertThatThrownBy(() -> service.applyForJob(request, 1L, "JOB_SEEKER", RESUME))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Job not found");
    }

    @Test
    void fetchJob_InternalError_ThrowsGenericException() {
        feign.FeignException fe = mock(feign.FeignException.class);
        when(fe.status()).thenReturn(500);
        
        when(jobClient.getJobById(anyLong())).thenThrow(fe);

        assertThatThrownBy(() -> service.applyForJob(request, 1L, "JOB_SEEKER", RESUME))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("JobService unavailable");
    }

    @Test
    void apply_EventPublishError_SwallowsException() {
        when(jobClient.getJobById(1L)).thenReturn(job);
        when(userClient.getUserById(anyLong(), anyString())).thenReturn(user);
        when(repository.existsByUserIdAndJobId(1L, 1L)).thenReturn(false);
        when(repository.save(any())).thenReturn(entity);
        when(mapper.map(any(), eq(ApplicationResponse.class))).thenReturn(response);
        
        // Throw error on rabbit call
        doThrow(new RuntimeException("Rabbit down")).when(rabbitTemplate).convertAndSend(anyString(), any(Object.class));

        ApplicationResponse res = service.applyForJob(request, 1L, "JOB_SEEKER", RESUME);

        assertThat(res).isNotNull();
        // Method should finish successfully despite rabbit error
        verify(rabbitTemplate).convertAndSend(anyString(), any(Object.class));
    }

    @Test
    void updateStatus_EventPublishError_SwallowsException() {
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenReturn(entity);
        when(mapper.map(any(), eq(ApplicationResponse.class))).thenReturn(response);
        when(jobClient.getJobById(anyLong())).thenReturn(job);
        when(userClient.getUserById(anyLong(), anyString())).thenReturn(user);

        doThrow(new RuntimeException("Rabbit down")).when(rabbitTemplate).convertAndSend(anyString(), any(Object.class));

        ApplicationResponse res =
                service.updateStatus(1L, ApplicationStatus.UNDER_REVIEW, 1L, "RECRUITER");

        assertThat(res).isNotNull();
        verify(rabbitTemplate).convertAndSend(anyString(), any(Object.class));
    }
    @Test
    void getUserApplications_AscSort() {
        Page<JobApplication> pageArgs = new PageImpl<>(java.util.List.of(entity));
        when(repository.findByUserId(eq(1L), any(Pageable.class))).thenReturn(pageArgs);
        when(mapper.map(any(), eq(ApplicationResponse.class))).thenReturn(response);
        when(jobClient.getJobById(1L)).thenReturn(job);

        PageResponse<ApplicationResponse> res =
                service.getUserApplications(1L, "JOB_SEEKER", 0, 10, "appliedAt", "asc");

        assertThat(res.getContent()).isNotEmpty();
    }
}