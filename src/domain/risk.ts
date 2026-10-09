import { CoverageState, EvidenceDataStatus, ProcessCode, ReconciliationStatus, RiskLevel, WageRuleCode } from "@prisma/client";
import { P1_RAPID_STATUS_VERSION_CHANGES, P1_STATUS_FEEDBACK_DISPUTE, P1_WORKER_STATUS_DISPUTE, type P1RapidStatusIndicator, type P1StatusFeedbackIndicator } from "@/domain/p1";
import { type ThresholdedReportCount } from "@/domain/reports";

export const RISK_RULE_VERSION = "demo-v1";
export const DEMO_EVALUATION_AS_OF = "2026-10-09T09:00:00.000Z";

export const RISK_WEIGHTS = {
  [P1_STATUS_FEEDBACK_DISPUTE]: 25,
  WAGE_COMPONENT_INCONSISTENCY: 30,
  CONTRIBUTION_DELTA: 35,
  REPORT_CLUSTER: 10,
} as const;

export type RiskIndicatorInput = {
  ruleCode: string;
  processCode: ProcessCode;
  categoryCode: string;
  categoryWeight: number;
  triggered: boolean;
  scoreContribution: number;
  dataStatus: EvidenceDataStatus;
  explanation: string;
  evidenceSummary: string;
};

export type P2IndicatorInput = {
  ruleCode: WageRuleCode;
  triggered: boolean;
  affectedWorkerCount: number;
  dataStatus: EvidenceDataStatus;
  explanation: string;
};

export type P3RiskInput = {
  status: ReconciliationStatus;
  deductionSum: number;
  deductionRecordCount: number;
  comparableConfirmedSum: number | null;
  delta: number | null;
  comparisonBasis: string | null;
  confirmationId: string | null;
  reason: string;
};

export type RiskAssessmentInput = {
  p1StatusFeedback: P1StatusFeedbackIndicator;
  p1RapidStatusChanges: P1RapidStatusIndicator;
  p2Coverage: CoverageState | null;
  p2Indicators: P2IndicatorInput[];
  p3: P3RiskInput | null;
  p5: ThresholdedReportCount;
};

export type RiskCalculation = {
  score: number;
  riskLevel: RiskLevel;
  coverageState: CoverageState;
  missingProcesses: ProcessCode[];
  indicators: RiskIndicatorInput[];
};

export function riskLevelForScore(score: number, coverageState: CoverageState) {
  if (coverageState === CoverageState.INCOMPLETE) return RiskLevel.INSUFFICIENT_DATA;
  if (score >= 50) return RiskLevel.HIGH;
  if (score >= 20) return RiskLevel.MEDIUM;
  return RiskLevel.LOW;
}

function safeP2Indicator(indicators: P2IndicatorInput[], ruleCode: WageRuleCode) {
  return indicators.find((indicator) => indicator.ruleCode === ruleCode);
}

export function calculateCompanyRisk(input: RiskAssessmentInput): RiskCalculation {
  const p1Complete = input.p1StatusFeedback.dataStatus === EvidenceDataStatus.EVALUATED;
  const p2Complete = input.p2Coverage === CoverageState.COMPLETE;
  const p3Complete = input.p3 !== null
    && (input.p3.status === ReconciliationStatus.MATCHED || input.p3.status === ReconciliationStatus.MISMATCH)
    && input.p3.comparisonBasis === "EMPLOYEE_SHARE_1_PERCENT"
    && input.p3.comparableConfirmedSum !== null
    && input.p3.delta !== null;
  const missingProcesses: ProcessCode[] = [];
  if (!p1Complete) missingProcesses.push(ProcessCode.P1);
  if (!p2Complete) missingProcesses.push(ProcessCode.P2);
  if (!p3Complete) missingProcesses.push(ProcessCode.P3);
  const coverageState = missingProcesses.length === 0 ? CoverageState.COMPLETE : CoverageState.INCOMPLETE;

  const p2Fixed = safeP2Indicator(input.p2Indicators, WageRuleCode.P2_FIXED_COMPONENT_CONTRACT_DIFFERENCE);
  const p2Variable = safeP2Indicator(input.p2Indicators, WageRuleCode.P2_RECURRING_VARIABLE_COMPONENT);
  const p2Triggered = Boolean(p2Fixed?.triggered || p2Variable?.triggered);
  const p3Triggered = Boolean(
    input.p3?.status === ReconciliationStatus.MISMATCH
    && input.p3.comparisonBasis === "EMPLOYEE_SHARE_1_PERCENT"
    && input.p3.comparableConfirmedSum !== null
    && input.p3.delta !== null,
  );
  const p5EligibleCount = input.p5.eligibleReportCount;
  const p5Triggered = input.p5.operational && p5EligibleCount !== null && p5EligibleCount >= 3;

  const score = (input.p1StatusFeedback.triggered ? RISK_WEIGHTS.STATUS_FEEDBACK_DISPUTE : 0)
    + (p2Triggered ? RISK_WEIGHTS.WAGE_COMPONENT_INCONSISTENCY : 0)
    + (p3Triggered ? RISK_WEIGHTS.CONTRIBUTION_DELTA : 0)
    + (p5Triggered ? RISK_WEIGHTS.REPORT_CLUSTER : 0);

  const p2ContributionRule = p2Fixed?.triggered ? p2Fixed.ruleCode : p2Variable?.triggered ? p2Variable.ruleCode : null;
  const indicators: RiskIndicatorInput[] = [
    {
      ruleCode: P1_WORKER_STATUS_DISPUTE,
      processCode: ProcessCode.P1,
      categoryCode: P1_STATUS_FEEDBACK_DISPUTE,
      categoryWeight: RISK_WEIGHTS.STATUS_FEEDBACK_DISPUTE,
      triggered: input.p1StatusFeedback.triggered,
      scoreContribution: input.p1StatusFeedback.triggered ? RISK_WEIGHTS.STATUS_FEEDBACK_DISPUTE : 0,
      dataStatus: input.p1StatusFeedback.dataStatus,
      explanation: input.p1StatusFeedback.explanation,
      evidenceSummary: input.p1StatusFeedback.triggered ? "Klarifikasi kontrak diterima; rincian dan identitas pekerja dibatasi." : "Belum ada klarifikasi pada kontrak yang diperiksa.",
    },
    {
      ruleCode: P1_RAPID_STATUS_VERSION_CHANGES,
      processCode: ProcessCode.P1,
      categoryCode: "P1_REVIEW_CONTEXT",
      categoryWeight: 0,
      triggered: input.p1RapidStatusChanges.triggered,
      scoreContribution: 0,
      dataStatus: input.p1RapidStatusChanges.dataStatus,
      explanation: input.p1RapidStatusChanges.explanation,
      evidenceSummary: "Informasi tambahan mengenai kontrak; tidak menambah skor.",
    },
    ...([
      [WageRuleCode.P2_FIXED_COMPONENT_CONTRACT_DIFFERENCE, p2Fixed],
      [WageRuleCode.P2_RECURRING_VARIABLE_COMPONENT, p2Variable],
    ] as const).map(([ruleCode, indicator]) => ({
      ruleCode,
      processCode: ProcessCode.P2,
      categoryCode: "WAGE_COMPONENT_INCONSISTENCY",
      categoryWeight: RISK_WEIGHTS.WAGE_COMPONENT_INCONSISTENCY,
      triggered: indicator?.triggered ?? false,
      scoreContribution: indicator?.triggered && indicator.ruleCode === p2ContributionRule
        ? RISK_WEIGHTS.WAGE_COMPONENT_INCONSISTENCY
        : 0,
      dataStatus: indicator?.dataStatus ?? EvidenceDataStatus.INSUFFICIENT_DATA,
      explanation: indicator?.explanation ?? "Pemeriksaan kesesuaian upah belum dapat dilakukan karena bukti belum cukup.",
      evidenceSummary: indicator?.triggered
        ? "Indikasi berasal dari perbandingan total data perusahaan; rincian data pekerja tidak ditampilkan."
        : "Ringkasan bukti tingkat perusahaan untuk periode ini.",
    })),
    {
      ruleCode: "P3_CONFIRMED_EMPLOYEE_SHARE_DELTA",
      processCode: ProcessCode.P3,
      categoryCode: "CONTRIBUTION_DELTA",
      categoryWeight: RISK_WEIGHTS.CONTRIBUTION_DELTA,
      triggered: p3Triggered,
      scoreContribution: p3Triggered ? RISK_WEIGHTS.CONTRIBUTION_DELTA : 0,
      dataStatus: p3Complete ? EvidenceDataStatus.EVALUATED : EvidenceDataStatus.INSUFFICIENT_DATA,
      explanation: input.p3?.reason ?? "Rekonsiliasi belum tersedia untuk periode ini.",
      evidenceSummary: p3Complete
         ? `Total konfirmasi iuran pekerja 1% Rp${input.p3!.comparableConfirmedSum!.toLocaleString("id-ID")} dibanding total potongan Rp${input.p3!.deductionSum.toLocaleString("id-ID")}.`
         : "Bukti pembanding iuran pekerja 1% belum cukup; selisih belum dapat dihitung.",
    },
    {
      ruleCode: "P5_REPORT_COUNT_THRESHOLD",
      processCode: ProcessCode.P5,
      categoryCode: "REPORT_CLUSTER",
      categoryWeight: RISK_WEIGHTS.REPORT_CLUSTER,
      triggered: p5Triggered,
      scoreContribution: p5Triggered ? RISK_WEIGHTS.REPORT_CLUSTER : 0,
      dataStatus: input.p5.dataStatus,
      explanation: p5Triggered
        ? "Jumlah minimum laporan pekerja terpenuhi; laporan hanya digunakan sebagai sinyal awal untuk pemeriksaan."
        : "Belum ada jumlah laporan yang mencapai batas untuk ditampilkan.",
      evidenceSummary: p5Triggered
        ? `${p5EligibleCount} laporan mencapai batas penayangan; identitas dan isi laporan tidak ditampilkan.`
        : "Jumlah laporan di bawah batas tidak ditampilkan atau digunakan dalam penilaian.",
    },
  ];

  return {
    score,
    riskLevel: riskLevelForScore(score, coverageState),
    coverageState,
    missingProcesses,
    indicators,
  };
}
