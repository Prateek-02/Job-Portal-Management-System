package com.jobportal.apigateway.ratelimit;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class RateLimitConfigTest {

    @Test
    @SuppressWarnings("all")
    void testLombokMethods() {
        RateLimitConfig config1 = new RateLimitConfig(100, 60, true, true, true);
        RateLimitConfig config2 = new RateLimitConfig(100, 60, true, true, true);
        RateLimitConfig config3 = new RateLimitConfig(200, 60, false, false, false);

        // Equals and HashCode
        assertThat(config1).isEqualTo(config1); // Identity check
        assertThat(config1).isEqualTo(config2);
        assertThat(config1).isNotEqualTo(config3);
        assertThat(config1).isNotEqualTo(null);
        assertThat(config1).isNotEqualTo(new Object());
        assertThat(config1.hashCode()).isEqualTo(config2.hashCode());
        assertThat(config1.hashCode()).isNotEqualTo(config3.hashCode());
        
        // canEqual
        assertThat(config1.canEqual(config2)).isTrue();
        assertThat(config1.canEqual(new Object())).isFalse();

        // toString
        String toString = config1.toString();
        assertThat(toString).contains("maxRequests=100", "timeWindowSeconds=60", "enableUserIdLimit=true");
        
        // Field permutations for equals
        RateLimitConfig c4 = new RateLimitConfig(100, 60, true, true, true);
        c4.setMaxRequests(999);
        assertThat(config1).isNotEqualTo(c4);
        
        c4 = new RateLimitConfig(100, 99, true, true, true);
        assertThat(config1).isNotEqualTo(c4);
        
        c4 = new RateLimitConfig(100, 60, false, true, true);
        assertThat(config1).isNotEqualTo(c4);

        c4 = new RateLimitConfig(100, 60, true, false, true);
        assertThat(config1).isNotEqualTo(c4);

        c4 = new RateLimitConfig(100, 60, true, true, false);
        assertThat(config1).isNotEqualTo(c4);
    }

    @Test
    void defaultConfig_ReturnsStandardValues() {
        RateLimitConfig config = RateLimitConfig.defaultConfig();
        assertThat(config.getMaxRequests()).isEqualTo(100);
        assertThat(config.getTimeWindowSeconds()).isEqualTo(60);
        assertThat(config.isEnableUserIdLimit()).isTrue();
        assertThat(config.isEnableIpLimit()).isTrue();
        assertThat(config.isEnableApiKeyLimit()).isTrue();
    }

    @Test
    void custom_ReturnsValues() {
        RateLimitConfig config = RateLimitConfig.custom(50, 30);
        assertThat(config.getMaxRequests()).isEqualTo(50);
        assertThat(config.getTimeWindowSeconds()).isEqualTo(30);
    }
    
    @Test
    void gettersAndSetters() {
        RateLimitConfig config = new RateLimitConfig();
        config.setMaxRequests(10);
        config.setTimeWindowSeconds(20);
        config.setEnableUserIdLimit(false);
        config.setEnableIpLimit(false);
        config.setEnableApiKeyLimit(false);
        
        assertThat(config.getMaxRequests()).isEqualTo(10);
        assertThat(config.getTimeWindowSeconds()).isEqualTo(20);
        assertThat(config.isEnableUserIdLimit()).isFalse();
        assertThat(config.isEnableIpLimit()).isFalse();
        assertThat(config.isEnableApiKeyLimit()).isFalse();
    }
}
