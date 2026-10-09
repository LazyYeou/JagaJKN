import type { Prisma } from "@prisma/client";

const expectedConfirmationAt: Record<string, string> = {
  "company-a:2026-09": "2026-10-05T00:00:00.000Z",
  "company-b:2026-09": "2026-10-05T00:00:00.000Z",
  "company-c:2026-08": "2026-09-10T00:00:00.000Z",
  "company-c:2026-09": "2026-10-05T00:00:00.000Z",
  "company-d:2026-09": "2026-10-05T00:00:00.000Z",
  "company-e:2026-09": "2026-10-05T00:00:00.000Z",
};

export function mockConfirmationExpectedAt(companyId: string, period: string) {
  const configured = expectedConfirmationAt[`${companyId}:${period}`];
  return configured ? new Date(configured) : null;
}

export async function readMockBpjsEmployeeShare(
  tx: Prisma.TransactionClient,
  companyId: string,
  period: string,
) {
  return tx.depositConfirmation.findUnique({
    where: { companyId_period: { companyId, period } },
    select: {
      id: true,
      companyId: true,
      period: true,
      confirmedEmployeeShareAmount: true,
      confirmedAt: true,
      sourceType: true,
    },
  });
}
