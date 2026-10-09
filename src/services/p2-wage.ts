import { CoverageState, EvidenceDataStatus, Prisma, WageRuleCode } from "@prisma/client";
import { evaluateWageEvidence, type WageWorkerEvidence } from "@/domain/wage";
import { assertPeriod, previousPeriods } from "@/domain/period";
import { NotFoundError } from "@/domain/errors";
import { nextSnapshotTimestamp } from "@/domain/timestamps";
import { prisma } from "@/repositories/prisma";

export const P2_RULE_VERSION = "p2-demo-v1";

export async function evaluateWageCompanyPeriodInTransaction(
  tx: Prisma.TransactionClient,
  companyId: string,
  period: string,
  evaluatedAt = new Date(),
) {
  assertPeriod(period);
  const company = await tx.company.findUnique({
    where: { id: companyId },
    select: { id: true },
  });
  if (!company) throw new NotFoundError("Perusahaan tidak ditemukan.");

  const previousEvaluation = await tx.wageEvaluation.findFirst({
    where: { companyId, period },
    orderBy: [{ evaluatedAt: "desc" }, { id: "desc" }],
    select: { evaluatedAt: true },
  });
  const snapshotTime = nextSnapshotTimestamp(evaluatedAt, previousEvaluation?.evaluatedAt ?? null);

  const workers = await tx.worker.findMany({
    where: { companyId },
    select: {
      id: true,
      contracts: {
        select: {
          id: true,
          workerId: true,
          versionNo: true,
          effectiveFrom: true,
          effectiveTo: true,
          baseWage: true,
          fixedAllowance: true,
          closure: { select: { effectiveTo: true } },
        },
      },
    },
    orderBy: { workerCode: "asc" },
  });
  const workerIds = workers.map((worker) => worker.id);
  const periods = previousPeriods(period, 3);
  const [payroll, attendance] = await Promise.all([
    tx.payrollRecord.findMany({
      where: { workerId: { in: workerIds }, period: { in: periods } },
      select: { workerId: true, period: true, baseWageReported: true, fixedAllowanceReported: true, variableAllowanceReported: true },
    }),
    tx.attendanceRecord.findMany({
      where: { workerId: { in: workerIds }, period: { in: periods } },
      select: { workerId: true, period: true, actualHours: true, overtimeHours: true },
    }),
  ]);

  const evidence: WageWorkerEvidence[] = workers.map((worker) => ({
    workerId: worker.id,
    contracts: worker.contracts.map((contract) => ({
      id: contract.id,
      workerId: contract.workerId,
      versionNo: contract.versionNo,
      effectiveFrom: contract.effectiveFrom,
      effectiveTo: contract.effectiveTo,
      baseWage: contract.baseWage,
      fixedAllowance: contract.fixedAllowance,
    })),
    closures: worker.contracts.flatMap((contract) => contract.closure
      ? [{ contractVersionId: contract.id, effectiveTo: contract.closure.effectiveTo }]
      : []),
    payroll: payroll.filter((row) => row.workerId === worker.id),
    attendance: attendance.filter((row) => row.workerId === worker.id),
  }));
  const result = evaluateWageEvidence(period, evidence);

  const evaluation = await tx.wageEvaluation.create({
    data: {
      companyId,
      period,
      ruleVersion: P2_RULE_VERSION,
      coverageState: result.coverageState,
      expectedWorkerCount: result.expectedWorkerCount,
      attendanceRecordCount: result.attendanceRecordCount,
      payrollRecordCount: result.payrollRecordCount,
      coveredContractCount: result.coveredContractCount,
      rollingWindowComplete: result.rollingWindowComplete,
      evaluatedAt: snapshotTime,
      indicators: {
        create: result.indicators.map((indicator) => ({
          ruleCode: indicator.ruleCode,
          triggered: indicator.triggered,
          affectedWorkerCount: indicator.affectedWorkerCount,
          dataStatus: indicator.dataStatus,
          explanation: indicator.explanation,
        })),
      },
    },
    include: { indicators: { orderBy: { ruleCode: "asc" } } },
  });
  return evaluation;
}

export async function evaluateWageCompanyPeriod(companyId: string, period: string, evaluatedAt = new Date()) {
  return prisma.$transaction((tx) => evaluateWageCompanyPeriodInTransaction(tx, companyId, period, evaluatedAt));
}

export async function latestWageEvaluation(companyId: string, period: string) {
  assertPeriod(period);
  const evaluation = await prisma.wageEvaluation.findFirst({
    where: { companyId, period },
    orderBy: [{ evaluatedAt: "desc" }, { id: "desc" }],
    include: { indicators: { orderBy: { ruleCode: "asc" } } },
  });
  return evaluation;
}

export function p2StatusText(status: EvidenceDataStatus) {
  return status === EvidenceDataStatus.EVALUATED ? "DIEVALUASI" : "BUKTI_BELUM_CUKUP";
}

export function p2RuleLabel(rule: WageRuleCode) {
  return rule === WageRuleCode.P2_FIXED_COMPONENT_CONTRACT_DIFFERENCE
    ? "Perbedaan komponen tetap dengan kontrak"
    : "Tunjangan variabel positif berulang dengan presensi stabil";
}
