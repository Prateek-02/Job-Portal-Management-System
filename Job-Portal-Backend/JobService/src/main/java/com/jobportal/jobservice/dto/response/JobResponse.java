package com.jobportal.jobservice.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

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
    private Boolean isSaved;
    private List<String> skills;
}
