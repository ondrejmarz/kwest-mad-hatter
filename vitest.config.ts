import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Unit + component tests. Rules tests run under vitest.rules.config.ts against the emulator.
// Component tests opt into jsdom per-file with a `// @vitest-environment jsdom` docblock.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    exclude: ['tests/rules/**', 'node_modules/**', 'dist/**', 'dev-dist/**'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**'],
      exclude: ['src/domain/**/__tests__/**'],
      reporter: ['text', 'html'],
      // The domain layer is the heart of the app — hold it to full branch coverage (spec 15.10).
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
});
