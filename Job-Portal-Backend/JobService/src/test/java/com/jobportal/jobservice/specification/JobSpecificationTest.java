package com.jobportal.jobservice.specification;

import com.jobportal.jobservice.dto.JobFilter;
import com.jobportal.jobservice.entity.Job;
import jakarta.persistence.criteria.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.util.Arrays;
import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobSpecificationTest {

    @Mock
    private Root<Job> root;

    @Mock
    private CriteriaQuery<?> query;

    @Mock
    private CriteriaBuilder cb;

    @Mock
    private Path<Object> path;
    
    @Mock
    private Path<String> stringPath;

    @Mock
    private Expression<String> lowerExpression;

    @Mock
    private Predicate predicate;

    @Mock
    private Path<Double> doublePath;

    @Mock
    private Path<Integer> intPath;

    @BeforeEach
    void setUp() {
        lenient().when(cb.and(any(Predicate[].class))).thenReturn(predicate);
    }

    @Test
    void getFilteredJobs_EmptyFilter_ReturnsNoPredicates() {
        JobFilter filter = new JobFilter();

        Specification<Job> spec = JobSpecification.getFilteredJobs(filter);
        Predicate result = spec.toPredicate(root, query, cb);

        assertThat(result).isEqualTo(predicate);
        verify(cb).and(new Predicate[0]); // empty array passed
    }

    @Test
    @SuppressWarnings("unchecked")
    void getFilteredJobs_AllFieldsFilter_BuildsPredicates() {
        JobFilter filter = new JobFilter();
        filter.setTitle("Java");
        filter.setLocation("Remote");
        filter.setCompanyName("Tech");
        filter.setMinSalary(50000.0);
        filter.setMaxSalary(150000.0);
        filter.setMinExperience(2);
        filter.setMaxExperience(5);
        filter.setSkills(Arrays.asList("Spring", "AWS"));

        // Title mock
        when(root.get("title")).thenReturn(path);
        when(cb.lower((Expression<String>) any())).thenReturn(lowerExpression);
        when(cb.like(lowerExpression, "%java%")).thenReturn(predicate);

        // Location mock
        when(root.get("location")).thenReturn(path);
        when(cb.like(lowerExpression, "%remote%")).thenReturn(predicate);

        // CompanyName mock
        when(root.get("companyName")).thenReturn(path);
        when(cb.like(lowerExpression, "%tech%")).thenReturn(predicate);

        // Salary constraint mocks
        when(root.<Double>get("salary")).thenReturn(doublePath);
        when(cb.greaterThanOrEqualTo(eq((Expression<Double>)doublePath), eq(50000.0))).thenReturn(predicate);
        when(cb.lessThanOrEqualTo(eq((Expression<Double>)doublePath), eq(150000.0))).thenReturn(predicate);

        // Experience constraint mocks
        when(root.<Integer>get("experience")).thenReturn(intPath);
        when(cb.greaterThanOrEqualTo(eq((Expression<Integer>)intPath), eq(2))).thenReturn(predicate);
        when(cb.lessThanOrEqualTo(eq((Expression<Integer>)intPath), eq(5))).thenReturn(predicate);

        // Skills mock
        when(root.get("skills")).thenReturn(path);
        when(cb.isMember(eq("Spring"), any(Expression.class))).thenReturn(predicate);
        when(cb.isMember(eq("AWS"), any(Expression.class))).thenReturn(predicate);

        Specification<Job> spec = JobSpecification.getFilteredJobs(filter);
        Predicate result = spec.toPredicate(root, query, cb);

        assertThat(result).isNotNull();
        // 1 title + 1 location + 1 company + 2 salary + 2 exp + 2 skills = 9 predicates
        verify(cb, times(1)).and(any(Predicate[].class)); 
    }

    @Test
    void getFilteredJobs_EmptyStrings_IgnoresPredicates() {
        JobFilter filter = new JobFilter();
        filter.setTitle("");
        filter.setLocation("");
        filter.setCompanyName("");
        filter.setSkills(Collections.emptyList());

        Specification<Job> spec = JobSpecification.getFilteredJobs(filter);
        Predicate result = spec.toPredicate(root, query, cb);

        assertThat(result).isEqualTo(predicate);
        verify(cb).and(new Predicate[0]); 
    }

    @Test
    void testConstructor() {
        new JobSpecification();
    }
}
