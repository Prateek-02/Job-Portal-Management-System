package com.jobportal.applicationservice.dto.response;

import lombok.Data;

@Data
public class JobResponse {
    private Long id;
    private String title;
    private String companyName;
    private Double salary;
    private String location;
    private Long recruiterId;
    private String jobType;
}