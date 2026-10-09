import { ReconciliationStatus } from "@prisma/client";

export type DeductionEvidence = {
  workerId: string;
  workerCompanyId: string;
  companyId: string;
  period: string;
  employeeOnePercentAmount: number;
};

export type EmployeeShareConfirmation = {
  id: string;
  companyId: string;
  period: string;
  confirmedEmployeeShareAmount: number | null;
  confirmedAt: Date | null;
  sourceType: string;
};

export type ReconciliationInput = {
  companyId: string;
  period: string;
  expectedWorkerCount: number;
  deductions: DeductionEvidence[];
  confirmation: EmployeeShareConfirmation | null;
  confirmationExpectedAt: Date | null;
  evaluatedAt: Date;
};

export type ReconciliationDecision = {
  status: ReconciliationStatus;
  deductionSum: number;
  deductionRecordCount: number;
  comparableConfirmedSum: number | null;
  delta: number | null;
  comparisonBasis: string | null;
  confirmationId: string | null;
  reason: string;
};

function deductionsAreComplete(input: ReconciliationInput) {
  if (input.expectedWorkerCount < 1 || input.deductions.length !== input.expectedWorkerCount) return false;
  const workers = new Set<string>();
  return input.deductions.every((record) => {
    if (record.companyId !== input.companyId
      || record.workerCompanyId !== input.companyId
      || record.period !== input.period) return false;
    if (!Number.isSafeInteger(record.employeeOnePercentAmount) || record.employeeOnePercentAmount < 0) return false;
    if (workers.has(record.workerId)) return false;
    workers.add(record.workerId);
    return true;
  });
}

export function isWithinReconciliationTolerance(delta: number, deductionSum: number) {
  if (!Number.isSafeInteger(delta) || !Number.isSafeInteger(deductionSum) || deductionSum < 0) return false;
  const absoluteDelta = BigInt(Math.abs(delta));
  return absoluteDelta <= BigInt(1_000) || absoluteDelta * BigInt(100) <= BigInt(deductionSum);
}

export function decideReconciliation(input: ReconciliationInput): ReconciliationDecision {
  const deductionRecordCount = input.deductions.length;
  const deductionSum = input.deductions.reduce((sum, record) => sum + record.employeeOnePercentAmount, 0);
  const completeDeductions = deductionsAreComplete(input);
  const confirmation = input.confirmation;
  const matchingCompanyPeriodConfirmation = confirmation
    && confirmation.companyId === input.companyId
    && confirmation.period === input.period
    && confirmation.sourceType === "MOCK_BPJS";
  const confirmedForScenario = matchingCompanyPeriodConfirmation
    && confirmation.confirmedAt !== null
    && confirmation.confirmedAt <= input.evaluatedAt;

  if (!confirmedForScenario) {
    const pending = input.confirmationExpectedAt !== null
      && input.evaluatedAt < input.confirmationExpectedAt;
    return {
      status: pending ? ReconciliationStatus.PENDING : ReconciliationStatus.UNVERIFIED,
      deductionSum,
      deductionRecordCount,
      comparableConfirmedSum: null,
      delta: null,
      comparisonBasis: null,
      confirmationId: matchingCompanyPeriodConfirmation ? confirmation.id : null,
      reason: pending
        ? "Konfirmasi simulasi belum diharapkan tersedia untuk periode ini; status menunggu konfirmasi."
        : "Konfirmasi bagian iuran pekerja belum tersedia untuk periode ini; pencocokan belum dapat diverifikasi.",
    };
  }

  if (!completeDeductions) {
    return {
      status: ReconciliationStatus.UNVERIFIED,
      deductionSum,
      deductionRecordCount,
      comparableConfirmedSum: null,
      delta: null,
      comparisonBasis: null,
      confirmationId: confirmation.id,
      reason: "Data potongan iuran pekerja 1% belum lengkap untuk perusahaan dan periode ini.",
    };
  }

  if (confirmation.confirmedEmployeeShareAmount === null
    || !Number.isSafeInteger(confirmation.confirmedEmployeeShareAmount)
    || confirmation.confirmedEmployeeShareAmount < 0) {
    return {
      status: ReconciliationStatus.UNVERIFIED,
      deductionSum,
      deductionRecordCount,
      comparableConfirmedSum: null,
      delta: null,
      comparisonBasis: null,
      confirmationId: confirmation.id,
      reason: "Konfirmasi simulasi tidak mencantumkan jumlah iuran pekerja 1% yang dapat dibandingkan.",
    };
  }

  const comparableConfirmedSum = confirmation.confirmedEmployeeShareAmount;
  const delta = comparableConfirmedSum - deductionSum;
  const matched = isWithinReconciliationTolerance(delta, deductionSum);
  return {
    status: matched ? ReconciliationStatus.MATCHED : ReconciliationStatus.MISMATCH,
    deductionSum,
    deductionRecordCount,
    comparableConfirmedSum,
    delta,
    comparisonBasis: "EMPLOYEE_SHARE_1_PERCENT",
    confirmationId: confirmation.id,
    reason: matched
      ? "Total potongan pekerja 1% dan konfirmasi simulasi untuk iuran pekerja 1% cocok dalam batas selisih yang diperbolehkan."
      : "Ditemukan selisih antara total potongan pekerja 1% dan jumlah konfirmasi simulasi; perlu verifikasi.",
  };
}
