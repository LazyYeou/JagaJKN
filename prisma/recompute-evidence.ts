import { Prisma } from "@prisma/client";
import { demoModeEnabled } from "../src/demo/environment";
import { prisma } from "../src/repositories/prisma";
import { recomputeExistingEvidence } from "../src/services/evidence-recompute";

async function main() {
  if (!demoModeEnabled()) {
    throw new Error("Refusing to recompute evidence: demo mode must be enabled and production environment approved.");
  }
  const summary = await recomputeExistingEvidence();
  console.info("Synthetic evidence snapshots appended", summary);
}

main()
  .catch((error: unknown) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`Evidence recompute failed (${error.code}).`);
    } else if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("Evidence recompute failed.");
    }
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
