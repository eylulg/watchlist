import { defineConfig, devices } from '@playwright/test';

const PORT = 3210;
const MOCK_PORT = 4010;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node e2e/mock-tmdb/server.ts',
      url: `http://127.0.0.1:${String(MOCK_PORT)}/3/movie/popular`,
      env: { MOCK_TMDB_PORT: String(MOCK_PORT) },
      reuseExistingServer: !isCI,
    },
    {
      // A production build, so the suite tests what ships. TMDB is the mock above, never the real API.
      command: `npm run build && npx next start -p ${String(PORT)}`,
      url: `http://localhost:${String(PORT)}/en/settings`,
      env: {
        TMDB_API_KEY: 'e2e-placeholder-key',
        TMDB_API_BASE_URL: `http://127.0.0.1:${String(MOCK_PORT)}/3`,
      },
      timeout: 240_000,
      reuseExistingServer: !isCI,
    },
  ],
});
