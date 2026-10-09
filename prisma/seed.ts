import { Prisma } from "@prisma/client";
import { prisma } from "../src/repositories/prisma";
import { resetAndSeedDemoData } from "../src/demo/seed-data";
import { demoModeEnabled } from "../src/demo/environment";
import { DEMO_SEED_TRANSACTION_OPTIONS } from "../src/demo/seed-transaction";

async function main() {
  if (!demoModeEnabled()) {
    throw new Error("Refusing to seed/reset database: demo mode must be enabled and production environment approved.");
  }

  const startedAt = performance.now();
  const summary = await prisma.$transaction(
    (tx) => resetAndSeedDemoData(tx),
    DEMO_SEED_TRANSACTION_OPTIONS,
  );
  console.info("Synthetic demo seed completed", summary);
  console.info(`Seed completed in ${Math.round(performance.now() - startedAt)}ms.`);
}

main()
  .catch((error: unknown) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`Demo seed failed (${error.code}): ${error.message}`);
      if (error.meta) console.error("Prisma error metadata:", error.meta);
    } else if (error instanceof Error) {
      console.error(error.stack ?? error.message);
    } else {
      console.error("Demo seed failed.");
    }
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
