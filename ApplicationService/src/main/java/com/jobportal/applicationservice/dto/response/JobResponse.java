package com.jobportal.applicationservice.dto.response;

import lombok.Data;

@Data
public class JobResponse {
    private Long id;
    private String title;
    private String companyName;
    private String location;
}