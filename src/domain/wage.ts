import { CoverageState, EvidenceDataStatus, WageRuleCode } from "@prisma/client";
import { selectContractForPeriod, type ContractClosureDate, type EffectiveContract } from "@/domain/contracts";
import { previousPeriods } from "@/domain/period";

export type WagePayrollEvidence = {
  period: string;
  baseWageReported: number;
  fixedAllowanceReported: number;
  variableAllowanceReported: number;
};

export type WageAttendanceEvidence = {
  period: string;
  actualHours: number;
  overtimeHours: number;
};

export type WageContractEvidence = EffectiveContract & {
  baseWage: number;
  fixedAllowance: number;
};

export type WageWorkerEvidence = {
  workerId: string;
  contracts: WageContractEvidence[];
  closures: ContractClosureDate[];
  payroll: WagePayrollEvidence[];
  attendance: WageAttendanceEvidence[];
};

export type WageRuleResult = {
  ruleCode: WageRuleCode;
  triggered: boolean;
  affectedWorkerCount: number;
  dataStatus: EvidenceDataStatus;
  explanation: string;
};

export type WageEvaluationResult = {
  period: string;
  expectedWorkerCount: number;
  attendanceRecordCount: number;
  payrollRecordCount: number;
  coveredContractCount: number;
  rollingWindowComplete: boolean;
  coverageState: CoverageState;
  indicators: [WageRuleResult, WageRuleResult];
};

function byPeriod<T extends { period: string }>(items: T[], period: string) {
  return items.find((item) => item.period === period);
}

export function evaluateWageEvidence(period: string, workers: WageWorkerEvidence[]): WageEvaluationResult {
  const rollingPeriods = previousPeriods(period, 3);
  let currentAttendanceCount = 0;
  let currentPayrollCount = 0;
  let coveredContractCount = 0;
  let fixedRuleComplete = workers.length > 0;
  let rollingRuleComplete = workers.length > 0;
  let fixedDifferenceCount = 0;
  let recurringVariableCount = 0;

  for (const worker of workers) {
    const contract = selectContractForPeriod(worker.contracts, worker.closures, period);
    const payroll = byPeriod(worker.payroll, period);
    const attendance = byPeriod(worker.attendance, period);
    if (contract) coveredContractCount += 1;
    if (payroll) currentPayrollCount += 1;
    if (attendance) currentAttendanceCount += 1;

    if (!contract || !payroll) {
      fixedRuleComplete = false;
    } else if (
      payroll.baseWageReported !== contract.baseWage
      || payroll.fixedAllowanceReported !== contract.fixedAllowance
    ) {
      fixedDifferenceCount += 1;
    }

    const threePayroll = rollingPeriods.map((rollingPeriod) => byPeriod(worker.payroll, rollingPeriod));
    const threeAttendance = rollingPeriods.map((rollingPeriod) => byPeriod(worker.attendance, rollingPeriod));
    if (threePayroll.some((row) => !row) || threeAttendance.some((row) => !row)) {
      rollingRuleComplete = false;
      continue;
    }

    const allowances = threePayroll.map((row) => row!.variableAllowanceReported);
    const hours = threeAttendance.map((row) => [row!.actualHours, row!.overtimeHours] as const);
    const hasPositiveRepeatedAllowance = allowances[0]! > 0 && allowances.every((amount) => amount === allowances[0]);
    const hasStableAttendance = hours.every((value) => value[0] === hours[0]![0] && value[1] === hours[0]![1]);
    if (hasPositiveRepeatedAllowance && hasStableAttendance) recurringVariableCount += 1;
  }

  const fixedStatus = fixedRuleComplete ? EvidenceDataStatus.EVALUATED : EvidenceDataStatus.INSUFFICIENT_DATA;
  const rollingStatus = rollingRuleComplete ? EvidenceDataStatus.EVALUATED : EvidenceDataStatus.INSUFFICIENT_DATA;
  const fixedExplanation = fixedRuleComplete
    ? fixedDifferenceCount > 0
      ? `Terdapat perbedaan komponen upah tetap terhadap kontrak efektif ${period}; perlu verifikasi.`
      : `Komponen upah tetap pada ${period} cocok dengan kontrak efektif untuk pekerja yang dievaluasi.`
    : `Sebagian bukti kontrak efektif atau payroll belum lengkap pada ${period}; hasil pengamatan bersifat provisional.`;
  const recurringExplanation = rollingRuleComplete
    ? recurringVariableCount > 0
      ? `Teramati pola tunjangan variabel positif yang sama selama tiga bulan dengan presensi stabil; sinyal tinjauan saja.`
      : `Tidak ditemukan pola tunjangan variabel positif berulang pada tiga bulan dengan presensi stabil.`
    : `Belum cukup data payroll dan presensi untuk mengevaluasi pola tiga bulan berturut-turut.`;

  const overallComplete = workers.length > 0
    && currentAttendanceCount === workers.length
    && currentPayrollCount === workers.length
    && coveredContractCount === workers.length
    && rollingRuleComplete;

  return {
    period,
    expectedWorkerCount: workers.length,
    attendanceRecordCount: currentAttendanceCount,
    payrollRecordCount: currentPayrollCount,
    coveredContractCount,
    rollingWindowComplete: rollingRuleComplete,
    coverageState: overallComplete ? CoverageState.COMPLETE : CoverageState.INCOMPLETE,
    indicators: [
      {
        ruleCode: WageRuleCode.P2_FIXED_COMPONENT_CONTRACT_DIFFERENCE,
        triggered: fixedDifferenceCount > 0,
        affectedWorkerCount: fixedDifferenceCount,
        dataStatus: fixedStatus,
        explanation: fixedExplanation,
      },
      {
        ruleCode: WageRuleCode.P2_RECURRING_VARIABLE_COMPONENT,
        triggered: recurringVariableCount > 0,
        affectedWorkerCount: recurringVariableCount,
        dataStatus: rollingStatus,
        explanation: recurringExplanation,
      },
    ],
  };
}
