package com.jobportal.adminservice.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class JobResponse {
    private Long id;
    private String title;
    private String companyName;
    private String location;
    private Double salary;
    private Integer experience;
    private String description;
    private Long recruiterId;
    private LocalDateTime createdAt;
}
