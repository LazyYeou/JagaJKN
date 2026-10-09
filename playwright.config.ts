import { defineConfig, devices } from "@playwright/test";

const configuredTestDatabaseUrl = process.env.M1_TEST_DATABASE_URL;
if (!configuredTestDatabaseUrl || process.env.DEMO_MODE !== "true") {
  throw new Error("E2E tests require M1_TEST_DATABASE_URL and DEMO_MODE=true.");
}
const testDatabaseUrlObject = new URL(configuredTestDatabaseUrl);
const testDatabaseName = testDatabaseUrlObject.pathname.replace(/^\//, "").split("?")[0];
if (testDatabaseName !== "jagajkn_m1_test") {
  throw new Error("E2E tests may only mutate the dedicated jagajkn_m1_test database.");
}
testDatabaseUrlObject.searchParams.set("connect_timeout", "5");
const testDatabaseUrl = testDatabaseUrlObject.toString();
if (!process.env.SESSION_SECRET || Buffer.byteLength(process.env.SESSION_SECRET) < 32) {
  throw new Error("E2E test SESSION_SECRET must be configured with at least 32 bytes.");
}
if (!process.env.DEMO_OPERATOR_KEY || Buffer.byteLength(process.env.DEMO_OPERATOR_KEY) < 32) {
  throw new Error("E2E test DEMO_OPERATOR_KEY must be configured with at least 32 bytes.");
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: "http://127.0.0.1:3101",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3101",
    url: "http://127.0.0.1:3101/api/demo/accounts",
    reuseExistingServer: false,
    timeout: 15_000,
    env: {
      DATABASE_URL: testDatabaseUrl,
      M1_TEST_DATABASE_URL: testDatabaseUrl,
      DEMO_MODE: "true",
      DEMO_ENVIRONMENT: "approved",
      SESSION_SECRET: process.env.SESSION_SECRET,
      DEMO_OPERATOR_KEY: process.env.DEMO_OPERATOR_KEY,
      NEXT_BUILD_DIR: ".next-e2e",
      NODE_ENV: "production",
    },
  },
});
