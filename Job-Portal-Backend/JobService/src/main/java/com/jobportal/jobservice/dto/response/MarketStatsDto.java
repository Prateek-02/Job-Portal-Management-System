package com.jobportal.jobservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MarketStatsDto {
    private Double averageSalary;
    private Double salaryGrowthYoy;
    private List<Double> salaryTrend; // Last 5-6 data points for sparkline
    private List<Double> demandTrend; // Last 5-6 data points for sparkline
    private List<SkillStatDto> topSkills;
    private String marketDemandStatus; // "Low", "Medium", "High", "Peaking"
}
