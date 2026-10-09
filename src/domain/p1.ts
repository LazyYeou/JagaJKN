import { EvidenceDataStatus } from "@prisma/client";

export const P1_STATUS_FEEDBACK_DISPUTE = "STATUS_FEEDBACK_DISPUTE" as const;
export const P1_WORKER_STATUS_DISPUTE = "P1_WORKER_STATUS_DISPUTE" as const;
export const P1_RAPID_STATUS_VERSION_CHANGES = "P1_RAPID_STATUS_VERSION_CHANGES" as const;

export type P1StatusFeedbackIndicator = {
  processCode: "P1";
  ruleCode: typeof P1_WORKER_STATUS_DISPUTE;
  weightedRuleCode: typeof P1_STATUS_FEEDBACK_DISPUTE;
  period: string;
  triggered: boolean;
  affectedWorkerCount: number;
  dataStatus: EvidenceDataStatus;
  explanation: string;
};

export type P1RapidStatusIndicator = {
  processCode: "P1";
  ruleCode: typeof P1_RAPID_STATUS_VERSION_CHANGES;
  period: string;
  triggered: boolean;
  affectedWorkerCount: number;
  dataStatus: EvidenceDataStatus;
  explanation: string;
};

export function buildP1StatusFeedbackIndicator(
  period: string,
  expectedWorkerCount: number,
  coveredContractCount: number,
  affectedWorkerCount: number,
): P1StatusFeedbackIndicator {
  const dataStatus = expectedWorkerCount > 0 && coveredContractCount === expectedWorkerCount
    ? EvidenceDataStatus.EVALUATED
    : EvidenceDataStatus.INSUFFICIENT_DATA;
  return {
    processCode: "P1",
    ruleCode: P1_WORKER_STATUS_DISPUTE,
    weightedRuleCode: P1_STATUS_FEEDBACK_DISPUTE,
    period,
    triggered: affectedWorkerCount > 0,
    affectedWorkerCount,
    dataStatus,
    explanation: affectedWorkerCount > 0
      ? `Feedback terkait klasifikasi hubungan kerja terdeteksi pada kontrak efektif ${period}; ini laporan pekerja, bukan penetapan hukum.`
      : dataStatus === EvidenceDataStatus.EVALUATED
        ? `Tidak ada feedback status kerja yang memenuhi kriteria pada kontrak efektif ${period}.`
        : `Cakupan kontrak efektif belum cukup untuk memastikan status feedback pada ${period}.`,
  };
}

export function buildP1RapidStatusIndicator(
  period: string,
  expectedWorkerCount: number,
  completeHistoryWorkerCount: number,
  affectedWorkerCount: number,
): P1RapidStatusIndicator {
  const dataStatus = expectedWorkerCount > 0 && completeHistoryWorkerCount === expectedWorkerCount
    ? EvidenceDataStatus.EVALUATED
    : EvidenceDataStatus.INSUFFICIENT_DATA;
  return {
    processCode: "P1",
    ruleCode: P1_RAPID_STATUS_VERSION_CHANGES,
    period,
    triggered: affectedWorkerCount > 0,
    affectedWorkerCount,
    dataStatus,
    explanation: affectedWorkerCount > 0
      ? `Ada dua atau lebih perubahan klasifikasi efektif dalam tiga bulan hingga ${period}; konteks tinjauan informasional, bukan pelanggaran.`
      : dataStatus === EvidenceDataStatus.EVALUATED
        ? `Tidak teramati dua atau lebih perubahan klasifikasi dalam tiga bulan hingga ${period}.`
        : `Riwayat kontrak belum cukup untuk mengevaluasi perubahan klasifikasi tiga bulan hingga ${period}.`,
  };
}
