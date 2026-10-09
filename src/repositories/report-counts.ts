import type { Prisma } from "@prisma/client";
import { thresholdCompanyReportCount } from "@/domain/reports";

export async function thresholdedCompanyReportCount(
  tx: Prisma.TransactionClient,
  companyId: string,
  period: string,
) {
  const aggregateCount = await tx.anonymousReport.count({ where: { companyId, period } });
  return thresholdCompanyReportCount(aggregateCount);
}
