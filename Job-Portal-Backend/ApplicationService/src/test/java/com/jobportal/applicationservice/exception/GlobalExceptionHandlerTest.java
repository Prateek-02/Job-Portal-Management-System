package com.jobportal.applicationservice.exception;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Collections;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.context.request.WebRequest;

import com.jobportal.applicationservice.dto.response.ErrorResponse;

import feign.FeignException;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler globalExceptionHandler;
    private WebRequest webRequest;

    @BeforeEach
    void setUp() {
        globalExceptionHandler = new GlobalExceptionHandler();
        webRequest = mock(WebRequest.class);
        when(webRequest.getDescription(false)).thenReturn("uri=/test");
    }

    @Test
    void handleApplicationNotFound_Returns404() {
        ApplicationNotFoundException ex = new ApplicationNotFoundException("Not found");
        ResponseEntity<ErrorResponse> response = globalExceptionHandler.handleApplicationNotFound(ex, webRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().getErrorCode()).isEqualTo("APPLICATION_NOT_FOUND");
    }

    @Test
    void handleDuplicateApplication_Returns409() {
        DuplicateApplicationException ex = new DuplicateApplicationException("Duplicate");
        ResponseEntity<ErrorResponse> response = globalExceptionHandler.handleDuplicateApplication(ex, webRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().getErrorCode()).isEqualTo("DUPLICATE_APPLICATION");
    }

    @Test
    void handleUnauthorized_Returns403() {
        UnauthorizedException ex = new UnauthorizedException("Unauthorized");
        ResponseEntity<ErrorResponse> response = globalExceptionHandler.handleUnauthorized(ex, webRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody().getErrorCode()).isEqualTo("UNAUTHORIZED_ACCESS");
    }

    @Test
    void handleFeignNotFound_Returns404() {
        FeignException.NotFound ex = mock(FeignException.NotFound.class);
        when(ex.getMessage()).thenReturn("Feign not found");
        
        ResponseEntity<ErrorResponse> response = globalExceptionHandler.handleFeignNotFound(ex, webRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().getErrorCode()).isEqualTo("RESOURCE_NOT_FOUND");
    }

    @Test
    void handleRuntime_WithNotFoundMessage_Returns404() {
        RuntimeException ex = new RuntimeException("Something not found");
        ResponseEntity<ErrorResponse> response = globalExceptionHandler.handleRuntime(ex, webRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().getErrorCode()).isEqualTo("RESOURCE_NOT_FOUND");
    }

    @Test
    void handleRuntime_General_Returns500() {
        RuntimeException ex = new RuntimeException("Generic error");
        ResponseEntity<ErrorResponse> response = globalExceptionHandler.handleRuntime(ex, webRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().getErrorCode()).isEqualTo("INTERNAL_SERVER_ERROR");
    }

    @Test
    void handleValidation_Returns400() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("object", "field", "message");
        
        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(Collections.singletonList(fieldError));

        ResponseEntity<ErrorResponse> response = globalExceptionHandler.handleValidation(ex, webRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getErrorCode()).isEqualTo("VALIDATION_ERROR");
        assertThat(response.getBody().getErrors()).containsKey("field");
    }

    @Test
    void handleGeneral_Returns500() {
        Exception ex = new Exception("General ex");
        ResponseEntity<ErrorResponse> response = globalExceptionHandler.handleGeneral(ex, webRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().getErrorCode()).isEqualTo("INTERNAL_SERVER_ERROR");
    }

    @Test
    void handleRuntime_NullMessage_Returns500() {
        RuntimeException ex = new RuntimeException((String) null);
        ResponseEntity<ErrorResponse> response = globalExceptionHandler.handleRuntime(ex, webRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().getErrorCode()).isEqualTo("INTERNAL_SERVER_ERROR");
    }
}
