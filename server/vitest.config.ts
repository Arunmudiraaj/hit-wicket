import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        /**
         * Use 'forks' pool for ESM support.
         * Each test file runs in an isolated worker process — gameManager singleton
         * is fresh per file, no cross-file state bleed.
         */
        pool: 'forks',

        /**
         * Global setup file: mocks auth.ts and persistence.ts to prevent
         * any Postgres connections or DB writes during tests.
         */
        setupFiles: ['./tests/setup.ts'],

        /** Per-test timeout (fake timers make async ops fast, but allow headroom) */
        testTimeout: 15_000,

        /** beforeAll/afterAll hook timeout (test server start/stop) */
        hookTimeout: 15_000,
    },
});
