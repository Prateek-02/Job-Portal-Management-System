package com.jobportal.jobservice.exceptions;

public class JobNotFoundException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public JobNotFoundException(String message) {
        super(message);
    }
}
