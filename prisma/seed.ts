import { Prisma } from "@prisma/client";
import { prisma } from "../src/repositories/prisma";
import { resetAndSeedDemoData } from "../src/demo/seed-data";
import { demoModeEnabled } from "../src/demo/environment";

async function main() {
  if (!demoModeEnabled()) {
    throw new Error("Refusing to seed/reset database: demo mode must be enabled and production environment approved.");
  }

  const summary = await prisma.$transaction((tx) => resetAndSeedDemoData(tx));
  console.info("Synthetic demo seed completed", summary);
}

main()
  .catch((error: unknown) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`Demo seed failed (${error.code}).`);
    } else if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("Demo seed failed.");
    }
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
