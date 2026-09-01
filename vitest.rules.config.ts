import { defineConfig } from 'vitest/config';

// Firestore Security Rules tests. Run via `npm run test:rules`, which wraps this
// config in `firebase emulators:exec` so FIRESTORE_EMULATOR_HOST is available.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 30000,
    // The tests share a single emulator instance; keep them serial.
    fileParallelism: false,
  },
});
