package com.jobportal.jobservice.config;

import org.junit.jupiter.api.Test;
import org.modelmapper.ModelMapper;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class AppConfigTest {

    private final AppConfig appConfig = new AppConfig();

    @Test
    void modelMapper_ReturnsValidInstance() {
        ModelMapper mapper = appConfig.modelMapper();
        assertThat(mapper).isNotNull();
    }

    @Test
    void cacheManager_ReturnsValidInstance() {
        RedisConnectionFactory factory = mock(RedisConnectionFactory.class);
        RedisCacheManager cacheManager = appConfig.cacheManager(factory);
        assertThat(cacheManager).isNotNull();
    }
}
