package com.jobportal.jobservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class JobPostedEvent {
    private String jobTitle;
    private String companyName;
    private String location;
    private Double salary;
    private Integer experience;
}