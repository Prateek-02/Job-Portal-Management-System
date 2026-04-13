import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,           // Injects describe, it, expect, beforeEach, etc. globally
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      enabled: true,
      provider: 'istanbul',
      reporter: ['text', 'html', 'html-spa', 'lcov'],
      exclude: [
        '**/*.html',
        'src/**/*.spec.ts',
        'src/test-setup.ts',
        'src/main.ts',
        'src/app/core/mocks/**'
      ],
      clean: true,
      reportsDirectory: './coverage/job-portal-frontend'
    }
  },
});
