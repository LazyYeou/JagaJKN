import { CoverageState, EvidenceDataStatus, ProcessCode, RiskLevel, UserRole } from "@prisma/client";
import type { SessionActor } from "@/auth/authorization";
import { requireRole } from "@/auth/authorization";
import { NotFoundError } from "@/domain/errors";
import { assertPeriod } from "@/domain/period";
import { prisma } from "@/repositories/prisma";

const riskRank: Record<RiskLevel, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
  INSUFFICIENT_DATA: 3,
};

const explanationCopy = "Indikator risiko dan hasil pencocokan merupakan sinyal awal untuk diverifikasi auditor; bukan pembuktian fraud atau penetapan kewajiban hukum.";

function indicatorDto(indicator: {
  ruleCode: string;
  processCode: ProcessCode;
  categoryCode: string;
  categoryWeight: number;
  scoreContribution: number;
  triggered: boolean;
  explanation: string;
  evidenceSummary: string;
  dataStatus: string;
}) {
  return {
    ruleCode: indicator.ruleCode,
    processCode: indicator.processCode,
    categoryCode: indicator.categoryCode,
    categoryWeight: indicator.categoryWeight,
    scoreContribution: indicator.scoreContribution,
    triggered: indicator.triggered,
    explanation: indicator.explanation,
    evidenceSummary: indicator.evidenceSummary,
    dataStatus: indicator.dataStatus,
  };
}

function missingProcesses(indicators: Array<{ ruleCode: string; processCode: ProcessCode; dataStatus: string }>) {
  const p1 = indicators.find((indicator) => indicator.ruleCode === "P1_WORKER_STATUS_DISPUTE");
  const p2 = indicators.filter((indicator) => indicator.processCode === ProcessCode.P2);
  const p3 = indicators.find((indicator) => indicator.processCode === ProcessCode.P3);
  const missing: ProcessCode[] = [];
  if (!p1 || p1.dataStatus !== EvidenceDataStatus.EVALUATED) missing.push(ProcessCode.P1);
  if (p2.length !== 2 || p2.some((indicator) => indicator.dataStatus !== EvidenceDataStatus.EVALUATED)) missing.push(ProcessCode.P2);
  if (!p3 || p3.dataStatus !== EvidenceDataStatus.EVALUATED) missing.push(ProcessCode.P3);
  return missing;
}

function assessmentDto(assessment: {
  id: string;
  period: string;
  score: number;
  riskLevel: RiskLevel;
  coverageState: CoverageState;
  ruleVersion: string;
  evaluationAsOf: Date;
  computedAt: Date;
  p5EligibleReportCount: number | null;
  indicators: Array<{
    ruleCode: string;
    processCode: ProcessCode;
    categoryCode: string;
    categoryWeight: number;
    scoreContribution: number;
    triggered: boolean;
    explanation: string;
    evidenceSummary: string;
    dataStatus: string;
  }>;
}) {
  const indicators = assessment.indicators.map(indicatorDto);
  return {
    id: assessment.id,
    period: assessment.period,
    score: assessment.score,
    riskLevel: assessment.riskLevel,
    coverageState: assessment.coverageState,
    missingProcesses: missingProcesses(indicators),
    ruleVersion: assessment.ruleVersion,
    evaluationAsOf: assessment.evaluationAsOf,
    computedAt: assessment.computedAt,
    eligibleP5ReportCount: assessment.p5EligibleReportCount,
    indicators,
    explanation: explanationCopy,
  };
}

export async function getAuditorLeaderboard(actor: SessionActor | null, period: string) {
  requireRole(actor, UserRole.AUDITOR);
  assertPeriod(period);
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      externalCode: true,
      _count: { select: { workers: true } },
      riskAssessments: {
        where: { period },
        orderBy: [{ computedAt: "desc" }, { id: "desc" }],
        take: 1,
        include: { indicators: { orderBy: [{ processCode: "asc" }, { ruleCode: "asc" }] } },
      },
    },
    orderBy: { externalCode: "asc" },
  });

  const rows = companies.map((company) => {
    const latest = company.riskAssessments[0];
    if (!latest) {
      return {
        id: company.id,
        name: company.name,
        externalCode: company.externalCode,
        workerCount: company._count.workers,
        assessment: null,
        score: null,
        riskLevel: RiskLevel.INSUFFICIENT_DATA,
        coverageState: CoverageState.INCOMPLETE,
        missingProcesses: [ProcessCode.P1, ProcessCode.P2, ProcessCode.P3],
        triggeredIndicators: [],
        notAssessed: true,
      };
    }
    const assessment = assessmentDto(latest);
    return {
      id: company.id,
      name: company.name,
      externalCode: company.externalCode,
      workerCount: company._count.workers,
      assessment,
      score: assessment.score,
      riskLevel: assessment.riskLevel,
      coverageState: assessment.coverageState,
      missingProcesses: assessment.missingProcesses,
      triggeredIndicators: assessment.indicators.filter((indicator) => indicator.triggered),
      notAssessed: false,
    };
  });

  const complete = rows.filter((row) => row.assessment && row.coverageState === CoverageState.COMPLETE)
    .sort((left, right) => riskRank[left.riskLevel] - riskRank[right.riskLevel]
      || (right.score ?? 0) - (left.score ?? 0)
      || left.externalCode.localeCompare(right.externalCode));
  const incomplete = rows.filter((row) => !row.assessment || row.coverageState === CoverageState.INCOMPLETE)
    .sort((left, right) => left.externalCode.localeCompare(right.externalCode));

  return {
    period,
    companiesAssessed: rows.filter((row) => row.assessment !== null).length,
    highRiskCount: complete.filter((row) => row.riskLevel === RiskLevel.HIGH).length,
    mediumRiskCount: complete.filter((row) => row.riskLevel === RiskLevel.MEDIUM).length,
    lowRiskCount: complete.filter((row) => row.riskLevel === RiskLevel.LOW).length,
    incompleteCount: incomplete.length,
    priorityCompanies: complete,
    incompleteCompanies: incomplete,
  };
}

export async function getAuditorCompanyRisk(actor: SessionActor | null, companyId: string, period: string) {
  requireRole(actor, UserRole.AUDITOR);
  assertPeriod(period);
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, externalCode: true },
  });
  if (!company) throw new NotFoundError("Perusahaan tidak ditemukan.");

  const assessments = await prisma.riskAssessment.findMany({
    where: { companyId, period },
    orderBy: [{ computedAt: "desc" }, { id: "desc" }],
    take: 10,
    include: { indicators: { orderBy: [{ processCode: "asc" }, { ruleCode: "asc" }] } },
  });
  if (assessments.length === 0) throw new NotFoundError("Penilaian belum tersedia untuk periode ini.");

  return {
    company,
    current: assessmentDto(assessments[0]!),
    history: assessments.map(assessmentDto),
  };
}
