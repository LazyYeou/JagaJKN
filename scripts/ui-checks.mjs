import { execSync } from "node:child_process";

// Isolate mutating regression suites from the demo database.
const url = new URL(process.env.M1_TEST_DATABASE_URL ?? process.env.DATABASE_URL);
if (!process.env.M1_TEST_DATABASE_URL) {
  if (!["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error("Configure a dedicated test database explicitly for non-local hosts.");
  url.pathname = "/jagajkn_m1_test";
}
if (url.pathname !== "/jagajkn_m1_test") throw new Error("UI regression tests require jagajkn_m1_test.");
const env = { ...process.env, DATABASE_URL: url.toString(), M1_TEST_DATABASE_URL: url.toString(), DEMO_MODE: "true", DEMO_ENVIRONMENT: "approved", NEXT_BUILD_DIR: ".next-e2e" };
for (const script of process.argv.slice(2)) {
  if (!/^[a-z0-9:-]+$/.test(script)) throw new Error("Invalid package script name");
  console.log(`Running ${script} on dedicated test database`);
  execSync(`${process.platform === "win32" ? "npm.cmd" : "npm"} run ${script}`, { env, stdio: "inherit" });
}
