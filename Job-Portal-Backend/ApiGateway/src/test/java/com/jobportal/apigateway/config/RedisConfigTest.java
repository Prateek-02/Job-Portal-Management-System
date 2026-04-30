package com.jobportal.apigateway.config;

import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class RedisConfigTest {

    @Test
    void redisTemplate_CreatesTemplate() {
        RedisConfig config = new RedisConfig();
        RedisConnectionFactory factory = mock(RedisConnectionFactory.class);
        
        RedisTemplate<String, Object> template = config.redisTemplate(factory);
        
        assertThat(template).isNotNull();
        assertThat(template.getConnectionFactory()).isEqualTo(factory);
    }
}
