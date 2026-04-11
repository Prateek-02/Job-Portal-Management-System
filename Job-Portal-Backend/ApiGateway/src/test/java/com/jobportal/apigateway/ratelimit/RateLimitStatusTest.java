package com.jobportal.apigateway.ratelimit;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class RateLimitStatusTest {

    @Test
    @SuppressWarnings("all")
    void testLombokMethods() {
        RateLimitStatus status1 = new RateLimitStatus(true, 5, 10, 5, 1000L);
        RateLimitStatus status2 = new RateLimitStatus(true, 5, 10, 5, 1000L);
        RateLimitStatus status3 = new RateLimitStatus(false, 11, 10, 0, 1000L);

        // Equals and HashCode
        assertThat(status1).isEqualTo(status1); // Identity check
        assertThat(status1).isEqualTo(status2);
        assertThat(status1).isNotEqualTo(status3);
        assertThat(status1).isNotEqualTo(null);
        assertThat(status1).isNotEqualTo(new Object());
        assertThat(status1.hashCode()).isEqualTo(status2.hashCode());
        assertThat(status1.hashCode()).isNotEqualTo(status3.hashCode());
        
        // canEqual
        assertThat(status1.canEqual(status2)).isTrue();
        assertThat(status1.canEqual(new Object())).isFalse();

        // toString
        String toString = status1.toString();
        assertThat(toString).contains("allowed=true", "currentCount=5", "maxAllowed=10");
        
        // Field permutations for equals (systematic check)
        RateLimitStatus s4 = new RateLimitStatus(true, 5, 10, 5, 1000L);
        s4.setAllowed(false);
        assertThat(status1).isNotEqualTo(s4);
        
        s4 = new RateLimitStatus(true, 99, 10, 5, 1000L);
        assertThat(status1).isNotEqualTo(s4);
        
        s4 = new RateLimitStatus(true, 5, 99, 5, 1000L);
        assertThat(status1).isNotEqualTo(s4);

        s4 = new RateLimitStatus(true, 5, 10, 99, 1000L);
        assertThat(status1).isNotEqualTo(s4);
        
        s4 = new RateLimitStatus(true, 5, 10, 5, 9999L);
        assertThat(status1).isNotEqualTo(s4);
    }

    @Test
    void allowed_CreatesCorrectStatus() {
        RateLimitStatus status = RateLimitStatus.allowed(5, 10, 123456789L);
        assertThat(status.isAllowed()).isTrue();
        assertThat(status.getCurrentCount()).isEqualTo(5);
        assertThat(status.getMaxAllowed()).isEqualTo(10);
        assertThat(status.getRemainingRequests()).isEqualTo(5);
        assertThat(status.getResetTime()).isEqualTo(123456789L);
    }

    @Test
    void denied_CreatesCorrectStatus() {
        RateLimitStatus status = RateLimitStatus.denied(11, 10, 123456789L);
        assertThat(status.isAllowed()).isFalse();
        assertThat(status.getCurrentCount()).isEqualTo(11);
        assertThat(status.getMaxAllowed()).isEqualTo(10);
        assertThat(status.getRemainingRequests()).isEqualTo(0);
        assertThat(status.getResetTime()).isEqualTo(123456789L);
    }
    
    @Test
    void gettersAndSetters() {
        RateLimitStatus status = new RateLimitStatus();
        status.setAllowed(true);
        status.setCurrentCount(1);
        status.setMaxAllowed(100);
        status.setRemainingRequests(99);
        status.setResetTime(5000L);
        
        assertThat(status.isAllowed()).isTrue();
        assertThat(status.getCurrentCount()).isEqualTo(1);
        assertThat(status.getMaxAllowed()).isEqualTo(100);
        assertThat(status.getRemainingRequests()).isEqualTo(99);
        assertThat(status.getResetTime()).isEqualTo(5000L);
    }
}
