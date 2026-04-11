package com.jobportal.authservice.enums;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class UserRoleTest {

    @Test
    void testUserRoleEnum() {
        assertThat(UserRole.valueOf("JOB_SEEKER")).isEqualTo(UserRole.JOB_SEEKER);
        assertThat(UserRole.valueOf("RECRUITER")).isEqualTo(UserRole.RECRUITER);
        assertThat(UserRole.valueOf("ADMIN")).isEqualTo(UserRole.ADMIN);
        assertThat(UserRole.values()).hasSize(3);
    }
}
