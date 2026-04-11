package com.jobportal.jobservice.event;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class UserDeleteEventTest {

    @Test
    void testConstructorsAndGettersSetters() {
        UserDeleteEvent event1 = new UserDeleteEvent();
        event1.setUserId(1L);
        event1.setRole("RECRUITER");
        event1.setStatus("PENDING");
        event1.setFailureReason("N/A");

        assertThat(event1.getUserId()).isEqualTo(1L);
        assertThat(event1.getRole()).isEqualTo("RECRUITER");
        assertThat(event1.getStatus()).isEqualTo("PENDING");
        assertThat(event1.getFailureReason()).isEqualTo("N/A");

        UserDeleteEvent event2 = new UserDeleteEvent(1L, "RECRUITER", "PENDING", "N/A");
        assertThat(event2.getUserId()).isEqualTo(1L);
        assertThat(event2.getRole()).isEqualTo("RECRUITER");
        assertThat(event2.getStatus()).isEqualTo("PENDING");
        assertThat(event2.getFailureReason()).isEqualTo("N/A");
        
        assertThat(event1).isEqualTo(event2);
        assertThat(event1.hashCode()).isEqualTo(event2.hashCode());
        assertThat(event1.toString()).contains("1");
        
        event2.setRole("JOB_SEEKER");
        assertThat(event1).isNotEqualTo(event2);
    }
}
