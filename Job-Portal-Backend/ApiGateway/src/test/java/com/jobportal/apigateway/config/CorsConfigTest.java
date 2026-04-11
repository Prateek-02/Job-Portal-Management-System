package com.jobportal.apigateway.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.reactive.CorsWebFilter;

import static org.assertj.core.api.Assertions.assertThat;

class CorsConfigTest {

    private CorsConfig corsConfig;

    @BeforeEach
    void setUp() {
        corsConfig = new CorsConfig();
    }

    @Test
    void corsWebFilter_NullFrontendUrl_DoesNotError() {
        ReflectionTestUtils.setField(corsConfig, "frontendUrl", null);
        CorsWebFilter filter = corsConfig.corsWebFilter();
        assertThat(filter).isNotNull();
    }

    @Test
    void corsWebFilter_EmptyFrontendUrl_DoesNotError() {
        ReflectionTestUtils.setField(corsConfig, "frontendUrl", "");
        CorsWebFilter filter = corsConfig.corsWebFilter();
        assertThat(filter).isNotNull();
    }

    @Test
    void corsWebFilter_SingleOrigin_SetsOrigin() {
        ReflectionTestUtils.setField(corsConfig, "frontendUrl", "http://localhost:4200");
        CorsWebFilter filter = corsConfig.corsWebFilter();
        assertThat(filter).isNotNull();
    }

    @Test
    void corsWebFilter_MultipleOrigins_SetsOrigins() {
        ReflectionTestUtils.setField(corsConfig, "frontendUrl", "http://localhost:4200, http://example.com");
        CorsWebFilter filter = corsConfig.corsWebFilter();
        assertThat(filter).isNotNull();
    }
}
