package com.jobportal.adminservice.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class PageResponse {
    private List<JobResponse> content;
    private int totalPages;
    private long totalElements;
    private int size;
    private int number;
    private boolean last;
}
