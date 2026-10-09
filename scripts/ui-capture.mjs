import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.UI_BASE_URL ?? "http://127.0.0.1:3000";
const stage = process.env.UI_CAPTURE_STAGE ?? "before";
if (!["before", "after", "refined"].includes(stage)) throw new Error("Invalid capture stage.");
const output = `test-results/ui-redesign/${stage}`;
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 } });
    const page = await context.newPage();
    page.setDefaultTimeout(15_000);
    const cases = [
      [null, "/login", "login"],
      ["user-auditor", "/auditor", "auditor"],
      ["user-auditor", "/auditor/companies/company-a", "company"],
      ["user-hr-b", "/hr", "hr"],
      ["user-hr-b", "/hr/workers/worker-b-001", "hr-evidence"],
      ["user-worker-a", "/worker", "worker"],
      ["user-worker-a", "/worker/contract", "contract"],
      ["user-worker-a", "/worker/contributions", "contributions"],
      ["user-worker-a", "/worker/report", "report"],
      [null, "/demo", "operator"],
    ];
    for (const [userId, route, name] of cases) {
      if (userId) {
        const response = await context.request.post(`${baseURL}/api/demo/session`, { data: { userId } });
        if (!response.ok()) throw new Error(`Seeded sign-in returned HTTP ${response.status()}.`);
      } else {
        await context.clearCookies();
      }
      await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle", timeout: 30_000 });
      await page.screenshot({ path: `${output}/${name}-${width}.png`, fullPage: true });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      console.info(`${stage}: ${name} ${width}px; page overflow=${overflow}`);
    }
    await context.close();
  }
} finally { await browser.close(); }
