import { EvidenceDataStatus } from "@prisma/client";

export const P5_REPORT_THRESHOLD = 3;

export type ThresholdedReportCount = {
  operational: true;
  eligibleReportCount: number | null;
  dataStatus: EvidenceDataStatus;
};

export function thresholdCompanyReportCount(count: number): ThresholdedReportCount {
  if (!Number.isSafeInteger(count) || count < 0) throw new Error("Report aggregate count is invalid.");
  return {
    operational: true,
    eligibleReportCount: count >= P5_REPORT_THRESHOLD ? count : null,
    dataStatus: EvidenceDataStatus.EVALUATED,
  };
}
