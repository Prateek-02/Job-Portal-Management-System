package com.jobportal.jobservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class JobRequestDto {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Company name is required")
    private String companyName;

    @NotBlank(message = "Location is required")
    private String location;

    @NotNull(message = "Salary is required")
    private Double salary;

    @NotNull(message = "Experience is required")
    private Integer experience;

    @NotBlank(message = "Description is required")
    private String description;
}
