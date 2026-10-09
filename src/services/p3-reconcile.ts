import { Prisma } from "@prisma/client";
import { decideReconciliation } from "@/domain/reconciliation";
import { assertPeriod } from "@/domain/period";
import { NotFoundError } from "@/domain/errors";
import { nextSnapshotTimestamp } from "@/domain/timestamps";
import { mockConfirmationExpectedAt, readMockBpjsEmployeeShare } from "@/integrations/mock-bpjs";
import { prisma } from "@/repositories/prisma";

export async function reconcileCompanyPeriodInTransaction(
  tx: Prisma.TransactionClient,
  companyId: string,
  period: string,
  evaluationAsOf = new Date(),
  computedAt = new Date(),
) {
  assertPeriod(period);
  const company = await tx.company.findUnique({
    where: { id: companyId },
    select: { id: true, _count: { select: { workers: true } } },
  });
  if (!company) throw new NotFoundError("Perusahaan tidak ditemukan.");

  const previousResult = await tx.reconciliationResult.findFirst({
    where: { companyId, period },
    orderBy: [{ calculatedAt: "desc" }, { id: "desc" }],
    select: { calculatedAt: true },
  });
  const snapshotTime = nextSnapshotTimestamp(computedAt, previousResult?.calculatedAt ?? null);

  const [deductions, confirmation] = await Promise.all([
    tx.deductionRecord.findMany({
      where: { companyId, period },
      select: { workerId: true, companyId: true, period: true, employeeOnePercentAmount: true, worker: { select: { companyId: true } } },
    }),
    readMockBpjsEmployeeShare(tx, companyId, period),
  ]);

  const decision = decideReconciliation({
    companyId,
    period,
    expectedWorkerCount: company._count.workers,
    deductions: deductions.map((row) => ({
      ...row,
      workerCompanyId: row.worker.companyId,
      employeeOnePercentAmount: row.employeeOnePercentAmount,
    })),
    confirmation: confirmation ? {
      ...confirmation,
      sourceType: confirmation.sourceType,
    } : null,
    confirmationExpectedAt: mockConfirmationExpectedAt(companyId, period),
    evaluatedAt: evaluationAsOf,
  });

  return tx.reconciliationResult.create({
    data: {
      companyId,
      period,
      status: decision.status,
      deductionSum: decision.deductionSum,
      deductionRecordCount: decision.deductionRecordCount,
      comparableConfirmedSum: decision.comparableConfirmedSum,
      delta: decision.delta,
      comparisonBasis: decision.comparisonBasis,
      confirmationId: decision.confirmationId,
      reason: decision.reason,
      confirmationExpectedAt: mockConfirmationExpectedAt(companyId, period),
      evaluationAsOf,
      calculatedAt: snapshotTime,
    },
  });
}

export async function reconcileCompanyPeriod(
  companyId: string,
  period: string,
  evaluationAsOf = new Date(),
  computedAt = new Date(),
) {
  return prisma.$transaction((tx) => reconcileCompanyPeriodInTransaction(tx, companyId, period, evaluationAsOf, computedAt));
}

export async function latestReconciliation(companyId: string, period: string) {
  assertPeriod(period);
  return prisma.reconciliationResult.findFirst({
    where: { companyId, period },
    orderBy: [{ calculatedAt: "desc" }, { id: "desc" }],
    select: {
      status: true,
      deductionSum: true,
      deductionRecordCount: true,
      comparableConfirmedSum: true,
      delta: true,
      comparisonBasis: true,
      confirmationExpectedAt: true,
      evaluationAsOf: true,
      calculatedAt: true,
      reason: true,
      confirmation: { select: { sourceType: true, sourceTag: true, reference: true } },
    },
  });
}
