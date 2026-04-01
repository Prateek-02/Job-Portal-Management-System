package com.jobportal.adminservice.exception;

import feign.FeignException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import com.jobportal.adminservice.dto.response.ErrorResponse;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(
            UnauthorizedException ex, WebRequest request) {
        return buildErrorResponse(ex.getMessage(), "UNAUTHORIZED_ACCESS", 
                HttpStatus.FORBIDDEN, request);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntime(
            RuntimeException ex, WebRequest request) {
        String msg = ex.getMessage();
        String errorCode = "INTERNAL_SERVER_ERROR";
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        
        if (msg != null && msg.toLowerCase().contains("not found")) {
            errorCode = "RESOURCE_NOT_FOUND";
            status = HttpStatus.NOT_FOUND;
        }
        
        return buildErrorResponse(msg, errorCode, status, request);
    }

    @ExceptionHandler(FeignException.NotFound.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            FeignException.NotFound ex, WebRequest request) {
        return buildErrorResponse(ex.getMessage(), "RESOURCE_NOT_FOUND", 
                HttpStatus.NOT_FOUND, request);
    }

    @ExceptionHandler(FeignException.class)
    public ResponseEntity<ErrorResponse> handleFeignException(
            FeignException ex, WebRequest request) {
        return buildErrorResponse(ex.getMessage(), "EXTERNAL_SERVICE_ERROR", 
                HttpStatus.BAD_REQUEST, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(
            Exception ex, WebRequest request) {
        return buildErrorResponse(ex.getMessage(), "INTERNAL_SERVER_ERROR", 
                HttpStatus.INTERNAL_SERVER_ERROR, request);
    }

    private ResponseEntity<ErrorResponse> buildErrorResponse(
            String message, String errorCode, 
            HttpStatus status, WebRequest request) {
        
        ErrorResponse errorResponse = ErrorResponse.builder()
                .status(status.value())
                .message(message)
                .errorCode(errorCode)
                .timestamp(LocalDateTime.now())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();
        
        return ResponseEntity.status(status).body(errorResponse);
    }
}
