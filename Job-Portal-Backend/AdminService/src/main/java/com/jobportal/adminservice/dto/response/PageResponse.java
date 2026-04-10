package com.jobportal.adminservice.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class PageResponse<T> {
    private List<T> content;
    private int totalPages;
    private long totalElements;
    private int size;
    private int number;
    private boolean last;
    private boolean first;
    private boolean empty;
}
