package com.jobportal.apigateway.filter;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class FilterConfigTest {

    @Test
    void authenticationFilterConfig_Initialization() {
        AuthenticationFilter.Config config = new AuthenticationFilter.Config();
        assertThat(config).isNotNull();
    }

    @Test
    void rateLimitingFilterConfig_Initialization() {
        RateLimitingFilter.Config config = new RateLimitingFilter.Config();
        assertThat(config).isNotNull();
    }
}
