import { Prisma, UserRole } from "@prisma/client";
import type { SessionActor } from "@/auth/authorization";
import { AuthorizationError, requireRole, workerLookupWhere } from "@/auth/authorization";
import { ConflictError, InputValidationError, NotFoundError } from "@/domain/errors";
import { selectContractForPeriod } from "@/domain/contracts";
import { assertPeriod } from "@/domain/period";
import { prisma } from "@/repositories/prisma";
import { latestReconciliation, reconcileCompanyPeriodInTransaction } from "@/services/p3-reconcile";
import { evaluateWageCompanyPeriodInTransaction, latestWageEvaluation } from "@/services/p2-wage";

const MAX_INTEGER = 2_147_483_647;
const MAX_BATCH_ROWS = 500;

type Row = Record<string, unknown>;

function asObject(value: unknown): Row {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new InputValidationError("Isi permintaan harus berupa object JSON.");
  }
  return value as Row;
}

function id(value: unknown, field: string) {
  if (typeof value !== "string" || value.length < 1 || value.length > 100) {
    throw new InputValidationError(`${field} tidak valid.`);
  }
  return value;
}

function nonNegativeInteger(value: unknown, field: string) {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > MAX_INTEGER) {
    throw new InputValidationError(`${field} harus bilangan bulat non-negatif.`);
  }
  return value as number;
}

function parseBatch(inputValue: unknown, requiredFields: string[]) {
  const input = asObject(inputValue);
  assertPeriod(input.period);
  if (!Array.isArray(input.records) || input.records.length < 1 || input.records.length > MAX_BATCH_ROWS) {
    throw new InputValidationError(`records harus berisi 1-${MAX_BATCH_ROWS} baris.`);
  }
  const workerIds = new Set<string>();
  const records = input.records.map((value, index) => {
    const row = asObject(value);
    const workerId = id(row.workerId, `records[${index}].workerId`);
    if (workerIds.has(workerId)) throw new ConflictError(`Pekerja ${workerId} tercantum lebih dari sekali.`);
    workerIds.add(workerId);
    const parsed: Row = { workerId };
    for (const field of requiredFields) parsed[field] = nonNegativeInteger(row[field], field);
    return parsed;
  });
  return { period: input.period, records };
}

function hrCompany(actor: SessionActor | null) {
  const hr = requireRole(actor, UserRole.HR);
  if (!hr.companyId) throw new AuthorizationError(403, "Company scope is missing.");
  return hr;
}

export async function importAttendance(actor: SessionActor | null, rawInput: unknown) {
  const hr = hrCompany(actor);
  const batch = parseBatch(rawInput, ["actualHours", "overtimeHours"]);
  const workerIds = batch.records.map((row) => row.workerId as string);
  return prisma.$transaction(async (tx) => {
    const workers = await tx.worker.findMany({ where: { companyId: hr.companyId!, id: { in: workerIds } }, select: { id: true } });
    if (workers.length !== workerIds.length) throw new NotFoundError("Pekerja tidak ditemukan di perusahaan Anda.");
    for (const row of batch.records) {
      await tx.attendanceRecord.upsert({
        where: { workerId_period: { workerId: row.workerId as string, period: batch.period } },
        create: {
          id: `attendance-${row.workerId}-${batch.period}`,
          workerId: row.workerId as string,
          period: batch.period,
          actualHours: row.actualHours as number,
          overtimeHours: row.overtimeHours as number,
          sourceTag: "Synthetic / Demo",
        },
        update: {
          actualHours: row.actualHours as number,
          overtimeHours: row.overtimeHours as number,
          sourceTag: "Synthetic / Demo",
        },
      });
    }
    const evaluation = await evaluateWageCompanyPeriodInTransaction(tx, hr.companyId!, batch.period);
    return { persistedCount: workerIds.length, evaluation };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function importPayroll(actor: SessionActor | null, rawInput: unknown) {
  const hr = hrCompany(actor);
  const batch = parseBatch(rawInput, [
    "baseWageReported",
    "fixedAllowanceReported",
    "variableAllowanceReported",
    "reportedContributionBase",
  ]);
  const workerIds = batch.records.map((row) => row.workerId as string);
  return prisma.$transaction(async (tx) => {
    const workers = await tx.worker.findMany({ where: { companyId: hr.companyId!, id: { in: workerIds } }, select: { id: true } });
    if (workers.length !== workerIds.length) throw new NotFoundError("Pekerja tidak ditemukan di perusahaan Anda.");
    for (const row of batch.records) {
      await tx.payrollRecord.upsert({
        where: { workerId_period: { workerId: row.workerId as string, period: batch.period } },
        create: {
          id: `payroll-${row.workerId}-${batch.period}`,
          workerId: row.workerId as string,
          period: batch.period,
          baseWageReported: row.baseWageReported as number,
          fixedAllowanceReported: row.fixedAllowanceReported as number,
          variableAllowanceReported: row.variableAllowanceReported as number,
          reportedContributionBase: row.reportedContributionBase as number,
          sourceTag: "Synthetic / Demo",
        },
        update: {
          baseWageReported: row.baseWageReported as number,
          fixedAllowanceReported: row.fixedAllowanceReported as number,
          variableAllowanceReported: row.variableAllowanceReported as number,
          reportedContributionBase: row.reportedContributionBase as number,
          sourceTag: "Synthetic / Demo",
        },
      });
    }
    const evaluation = await evaluateWageCompanyPeriodInTransaction(tx, hr.companyId!, batch.period);
    return { persistedCount: workerIds.length, evaluation };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function importDeductions(actor: SessionActor | null, rawInput: unknown) {
  const hr = hrCompany(actor);
  const batch = parseBatch(rawInput, ["employeeOnePercentAmount"]);
  const workerIds = batch.records.map((row) => row.workerId as string);
  return prisma.$transaction(async (tx) => {
    const workers = await tx.worker.findMany({
      where: { companyId: hr.companyId!, id: { in: workerIds } },
      select: { id: true, companyId: true },
    });
    if (workers.length !== workerIds.length) throw new NotFoundError("Pekerja tidak ditemukan di perusahaan Anda.");
    for (const row of batch.records) {
      await tx.deductionRecord.upsert({
        where: { workerId_period: { workerId: row.workerId as string, period: batch.period } },
        create: {
          id: `deduction-${row.workerId}-${batch.period}`,
          workerId: row.workerId as string,
          companyId: hr.companyId!,
          period: batch.period,
          employeeOnePercentAmount: row.employeeOnePercentAmount as number,
          sourceTag: "Synthetic / Demo",
        },
        update: {
          companyId: hr.companyId!,
          employeeOnePercentAmount: row.employeeOnePercentAmount as number,
          sourceTag: "Synthetic / Demo",
        },
      });
    }
    const reconciliation = await reconcileCompanyPeriodInTransaction(tx, hr.companyId!, batch.period);
    return { persistedCount: workerIds.length, reconciliation };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function getHrWorkerEvidence(actor: SessionActor | null, workerId: string, period: string) {
  const hr = hrCompany(actor);
  assertPeriod(period);
  const where = workerLookupWhere(hr, workerId);
  const worker = await prisma.worker.findFirst({
    where: where!,
    select: {
      id: true,
      attendance: { where: { period }, select: { actualHours: true, overtimeHours: true, sourceTag: true } },
      payroll: {
        where: { period },
        select: {
          baseWageReported: true,
          fixedAllowanceReported: true,
          variableAllowanceReported: true,
          reportedContributionBase: true,
          sourceTag: true,
        },
      },
      deductions: { where: { period, companyId: hr.companyId! }, select: { employeeOnePercentAmount: true, sourceTag: true } },
      contracts: {
        select: {
          id: true,
          workerId: true,
          versionNo: true,
          effectiveFrom: true,
          effectiveTo: true,
          employmentType: true,
          baseWage: true,
          fixedAllowance: true,
          expectedHoursPerMonth: true,
          closure: { select: { effectiveTo: true } },
        },
      },
    },
  });
  if (!worker) throw new NotFoundError("Pekerja tidak ditemukan di perusahaan Anda.");

  const versions = worker.contracts.map(({ closure: _closure, ...version }) => version);
  const closures = worker.contracts.flatMap((version) => version.closure
    ? [{ contractVersionId: version.id, effectiveTo: version.closure.effectiveTo }]
    : []);
  const effectiveContract = selectContractForPeriod(versions, closures, period);
  const [wageEvaluation, reconciliation] = await Promise.all([
    latestWageEvaluation(hr.companyId!, period),
    latestReconciliation(hr.companyId!, period),
  ]);

  return {
    period,
    effectiveContract,
    attendance: worker.attendance[0] ?? null,
    payroll: worker.payroll[0] ?? null,
    deduction: worker.deductions[0] ?? null,
    wageEvaluation: wageEvaluation ? {
      coverageState: wageEvaluation.coverageState,
      evaluatedAt: wageEvaluation.evaluatedAt,
      indicators: wageEvaluation.indicators.map((indicator) => ({
        ruleCode: indicator.ruleCode,
        triggered: indicator.triggered,
        dataStatus: indicator.dataStatus,
        explanation: indicator.explanation,
      })),
    } : null,
    reconciliation,
  };
}
