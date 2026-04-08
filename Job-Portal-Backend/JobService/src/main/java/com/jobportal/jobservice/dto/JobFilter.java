package com.jobportal.jobservice.dto;

import lombok.Data;
import java.util.List;

@Data
public class JobFilter {
    private String title;
    private String location;
    private String companyName;
    private Double minSalary;
    private Double maxSalary;
    private Integer minExperience;
    private Integer maxExperience;
    private List<String> skills;
}
