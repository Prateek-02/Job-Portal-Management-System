package com.jobportal.jobservice.exceptions;

import com.jobportal.jobservice.dto.response.ErrorResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.context.request.WebRequest;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTest {

    @InjectMocks
    private GlobalExceptionHandler exceptionHandler;

    @Mock
    private WebRequest webRequest;

    @BeforeEach
    void setUp() {
        when(webRequest.getDescription(false)).thenReturn("uri=/api/test");
    }

    @Test
    void handleJobNotFound() {
        JobNotFoundException ex = new JobNotFoundException("Job missing");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleJobNotFound(ex, webRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().getErrorCode()).isEqualTo("JOB_NOT_FOUND");
        assertThat(response.getBody().getMessage()).isEqualTo("Job missing");
        assertThat(response.getBody().getPath()).isEqualTo("/api/test");
    }

    @Test
    void handleUnauthorized() {
        UnauthorizedException ex = new UnauthorizedException("Not allowed");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleUnauthorized(ex, webRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody().getErrorCode()).isEqualTo("UNAUTHORIZED_ACCESS");
        assertThat(response.getBody().getMessage()).isEqualTo("Not allowed");
        assertThat(response.getBody().getPath()).isEqualTo("/api/test");
    }

    @Test
    void handleValidation() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        
        FieldError fieldError = new FieldError("objectName", "title", "must not be blank");
        when(bindingResult.getFieldErrors()).thenReturn(Collections.singletonList(fieldError));
        when(ex.getBindingResult()).thenReturn(bindingResult);

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleValidation(ex, webRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getErrorCode()).isEqualTo("VALIDATION_ERROR");
        assertThat(response.getBody().getErrors()).containsEntry("title", "must not be blank");
    }

    @Test
    void handleGeneral() {
        Exception ex = new Exception("Server went down");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleGeneral(ex, webRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().getErrorCode()).isEqualTo("INTERNAL_SERVER_ERROR");
        assertThat(response.getBody().getMessage()).isEqualTo("Server went down");
        assertThat(response.getBody().getPath()).isEqualTo("/api/test");
    }
}
