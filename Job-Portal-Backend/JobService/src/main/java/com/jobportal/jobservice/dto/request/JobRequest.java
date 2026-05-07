package com.jobportal.jobservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import java.util.List;

@Data
public class JobRequest {

    @NotBlank(message = "Title is required")
    @Pattern(regexp = "^[a-zA-Z\\s]+$", message = "Job title should not contain numbers or special characters")
    private String title;

    @NotBlank(message = "Company name is required")
    private String companyName;

    @NotBlank(message = "Location is required")
    private String location;

    @NotNull(message = "Salary is required")
    private Double salary;

    @NotNull(message = "Experience is required")
    private Integer experience;

    @NotBlank(message = "Job type is required")
    private String jobType;

    @NotBlank(message = "Description is required")
    private String description;

    private List<String> skills;
}
