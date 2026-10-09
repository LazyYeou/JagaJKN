import { PrismaClient } from "@prisma/client";

// Safe read-only probe: no environment values or connection strings are displayed.
const prisma = new PrismaClient({ log: [{ emit: "event", level: "error" }] });
prisma.$on("error", event => console.error("Prisma error event:", event.message));
const defaultBudget = process.argv.includes("--default-budget");
let queriesCompleted = 0;
let startedAt = 0;
try {
  await prisma.$connect();
  console.log("Prisma connection succeeded.");
  startedAt = performance.now();
  await prisma.$transaction(async tx => {
    for (let query = 0; query < (defaultBudget ? 50 : 1); query++) {
      await tx.$executeRaw`SELECT 1`;
      queriesCompleted++;
    }
  }, defaultBudget ? undefined : { maxWait: 10_000, timeout: 120_000 });
  console.log(`Prisma interactive transaction succeeded: ${queriesCompleted} read-only probes in ${Math.round(performance.now() - startedAt)}ms.`);
} catch (error) {
  const details = {
    name: error instanceof Error ? error.name : undefined,
    code: typeof error === "object" && error !== null && "code" in error ? error.code : undefined,
    message: error instanceof Error ? error.message : "Unknown Prisma error",
    meta: typeof error === "object" && error !== null && "meta" in error ? error.meta : undefined,
  };
  console.error("Prisma diagnostic failed:", JSON.stringify(details, null, 2));
  if (startedAt) console.error(`Elapsed: ${Math.round(performance.now() - startedAt)}ms; completed read-only probes: ${queriesCompleted}.`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
