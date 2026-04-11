package com.jobportal.authservice.event;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class UserDeleteEventTest {

    @Test
    void testUserDeleteEvent() {
        UserDeleteEvent event1 = new UserDeleteEvent();
        event1.setUserId(1L);
        event1.setRole("USER");
        event1.setStatus("PENDING");
        event1.setFailureReason("none");

        assertThat(event1.getUserId()).isEqualTo(1L);
        assertThat(event1.getRole()).isEqualTo("USER");
        assertThat(event1.getStatus()).isEqualTo("PENDING");
        assertThat(event1.getFailureReason()).isEqualTo("none");

        UserDeleteEvent event2 = new UserDeleteEvent(1L, "USER", "PENDING", "none");
        UserDeleteEvent event3 = new UserDeleteEvent(2L, "ADMIN", "COMPLETED", null);

        // Test Equals and HashCode
        assertThat(event1).isEqualTo(event2);
        assertThat(event1).isNotEqualTo(event3);
        assertThat(event1.hashCode()).isEqualTo(event2.hashCode());
        assertThat(event1.hashCode()).isNotEqualTo(event3.hashCode());

        // Test ToString
        assertThat(event1.toString()).contains("userId=1");

        // Null and different object checks for Equals
        assertThat(event1.equals(null)).isFalse();
        assertThat(event1.equals(new Object())).isFalse();
        
        // Constructor and Getters/Setters
        UserDeleteEvent empty = new UserDeleteEvent();
        empty.setUserId(null);
        assertThat(empty.getUserId()).isNull();
    }
}
