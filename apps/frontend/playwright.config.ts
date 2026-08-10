import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  outputDir: '../../test-results/runtime2',
  timeout: 600_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['line'],
    ['json', { outputFile: '../../test-results/runtime2/report.json' }],
  ],
  use: {
    baseURL: process.env.RUNTIME_FRONTEND_URL ?? 'http://127.0.0.1:4173',
    ...devices['Desktop Chrome'],
    screenshot: { mode: 'only-on-failure', fullPage: true },
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command:
      'VITE_API_URL=' +
      (process.env.RUNTIME_API_URL ?? 'http://127.0.0.1:3000') +
      ' pnpm dev --host 127.0.0.1 --port 4173',
    url: process.env.RUNTIME_FRONTEND_URL ?? 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120_000,
  },
})
