import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Read-only visual review: creates sessions, never resets or edits source data.
const phase = process.argv[2] ?? "after";
const baseURL = "http://127.0.0.1:3102";
const output = `artifacts/ui-review-${phase}`;
await mkdir(output, { recursive: true });
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3102"], {
  env: { ...process.env, NEXT_BUILD_DIR: ".next-ux", DEMO_ENVIRONMENT: "approved" }, stdio: "ignore",
});
let browser;
try {
  for (let attempt = 0; attempt < 90; attempt++) {
    try { if ((await fetch(`${baseURL}/api/demo/accounts`)).ok) break; } catch {}
    if (attempt === 89) throw new Error("Visual review server unavailable");
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(90000);
  const accounts = (await (await context.request.get("/api/demo/accounts")).json()).accounts;
  const routes = [
    [null, "/login", "login"],
    ["AUDITOR", "/auditor?period=2026-09", "auditor"],
    ["AUDITOR", "/auditor/companies/company-a?period=2026-09", "company-a"],
    ["AUDITOR", "/auditor/companies/company-c?period=2026-09", "company-c"],
    ["HR", "/hr", "hr"],
    ["HR", "/hr/workers/worker-a-001?period=2026-09", "hr-detail"],
    ["WORKER", "/worker", "worker"],
    ["WORKER", "/worker/contract?period=2026-09", "contract"],
    ["WORKER", "/worker/contributions", "contributions"],
    ["WORKER", "/worker/report", "report"],
    [null, "/demo", "demo"],
    [null, "/missing-ui-route", "not-found"],
  ];
  const findings = [];
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const [role, route, name] of routes) {
      if (role) {
        const account = accounts.find(a => a.role === role && (role !== "HR" || a.companyName === "PT Sentra Karya Nusantara"));
        const response = await context.request.post("/api/demo/session", { data: { userId: account.id } });
        if (!response.ok()) throw new Error(`Sign-in failed: ${role}`);
      }
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);
      if (name === "login") await page.getByRole("button", { name: /Auditor Demo/ }).waitFor();
      await page.screenshot({ path: `${output}/${name}-${width}.png`, fullPage: true });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      const axe = await new AxeBuilder({ page }).analyze();
      console.log(`${phase} ${name} ${width}: overflow=${overflow}; axe=${axe.violations.map(v => v.id).join(",") || "pass"}`);
      if (overflow || axe.violations.length) findings.push(`${name} ${width}`);
    }
  }
  if (phase !== "before" && findings.length) throw new Error(`UI review failed: ${findings.join(", ")}`);
} finally {
  await browser?.close();
  if (process.platform === "win32") spawn("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
  else server.kill();
}
