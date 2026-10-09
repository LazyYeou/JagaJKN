import { Prisma, RiskLevel } from "@prisma/client";
import { calculateCompanyRisk, DEMO_EVALUATION_AS_OF, RISK_RULE_VERSION, type P2IndicatorInput, type P3RiskInput } from "@/domain/risk";
import { assertPeriod } from "@/domain/period";
import { NotFoundError } from "@/domain/errors";
import { nextSnapshotTimestamp } from "@/domain/timestamps";
import { thresholdedCompanyReportCount } from "@/repositories/report-counts";
import { evaluateP1IndicatorsInTransaction } from "@/services/p1-indicators";
import { evaluateWageCompanyPeriodInTransaction } from "@/services/p2-wage";
import { reconcileCompanyPeriodInTransaction } from "@/services/p3-reconcile";
import { prisma } from "@/repositories/prisma";

export async function evaluateCompanyRiskInTransaction(
  tx: Prisma.TransactionClient,
  companyId: string,
  period: string,
  evaluationAsOf = new Date(DEMO_EVALUATION_AS_OF),
  computedAt = new Date(),
) {
  assertPeriod(period);
  const company = await tx.company.findUnique({ where: { id: companyId }, select: { id: true } });
  if (!company) throw new NotFoundError("Perusahaan tidak ditemukan.");

  const [p1, p2, p3, p5] = await Promise.all([
    evaluateP1IndicatorsInTransaction(tx, companyId, period),
    evaluateWageCompanyPeriodInTransaction(tx, companyId, period, computedAt),
    reconcileCompanyPeriodInTransaction(tx, companyId, period, evaluationAsOf, computedAt),
    thresholdedCompanyReportCount(tx, companyId, period),
  ]);

  const p2Indicators: P2IndicatorInput[] = p2.indicators.map((indicator) => ({
    ruleCode: indicator.ruleCode,
    triggered: indicator.triggered,
    affectedWorkerCount: indicator.affectedWorkerCount,
    dataStatus: indicator.dataStatus,
    explanation: indicator.explanation,
  }));
  const p3Input: P3RiskInput = {
    status: p3.status,
    deductionSum: p3.deductionSum,
    deductionRecordCount: p3.deductionRecordCount,
    comparableConfirmedSum: p3.comparableConfirmedSum,
    delta: p3.delta,
    comparisonBasis: p3.comparisonBasis,
    confirmationId: p3.confirmationId,
    reason: p3.reason,
  };
  const calculation = calculateCompanyRisk({
    p1StatusFeedback: p1.statusFeedback,
    p1RapidStatusChanges: p1.rapidStatusChanges,
    p2Coverage: p2.coverageState,
    p2Indicators,
    p3: p3Input,
    p5,
  });

  const previousAssessment = await tx.riskAssessment.findFirst({
    where: { companyId, period },
    orderBy: [{ computedAt: "desc" }, { id: "desc" }],
    select: { computedAt: true },
  });
  const sourceSnapshotTime = Math.max(computedAt.getTime(), p2.evaluatedAt.getTime(), p3.calculatedAt.getTime());
  const actualComputedAt = nextSnapshotTimestamp(
    new Date(sourceSnapshotTime),
    previousAssessment?.computedAt ?? null,
  );

  return tx.riskAssessment.create({
    data: {
      companyId,
      period,
      score: calculation.score,
      riskLevel: calculation.riskLevel,
      coverageState: calculation.coverageState,
      ruleVersion: RISK_RULE_VERSION,
      evaluationAsOf,
      p2EvaluationId: p2.id,
      p3ReconciliationId: p3.id,
      p5EligibleReportCount: p5.eligibleReportCount,
      computedAt: actualComputedAt,
      indicators: {
        create: calculation.indicators.map((indicator) => ({
          ruleCode: indicator.ruleCode,
          processCode: indicator.processCode,
          categoryCode: indicator.categoryCode,
          categoryWeight: indicator.categoryWeight,
          scoreContribution: indicator.scoreContribution,
          triggered: indicator.triggered,
          explanation: indicator.explanation,
          evidenceSummary: indicator.evidenceSummary,
          dataStatus: indicator.dataStatus,
        })),
      },
    },
    include: { indicators: { orderBy: [{ processCode: "asc" }, { ruleCode: "asc" }] } },
  });
}

export async function recalculateRiskForPeriod(
  period: string,
  evaluationAsOf = new Date(DEMO_EVALUATION_AS_OF),
  computedAt = new Date(),
) {
  assertPeriod(period);
  return prisma.$transaction(async (tx) => {
    const companies = await tx.company.findMany({ select: { id: true }, orderBy: { externalCode: "asc" } });
    const assessments = [];
    for (const company of companies) {
      assessments.push(await evaluateCompanyRiskInTransaction(
        tx,
        company.id,
        period,
        evaluationAsOf,
        computedAt,
      ));
    }
    const latestComputedAt = assessments.reduce(
      (latest, assessment) => assessment.computedAt > latest ? assessment.computedAt : latest,
      computedAt,
    );
    return {
      period,
      evaluationAsOf,
      computedAt: latestComputedAt,
      counts: {
        assessed: assessments.length,
        high: assessments.filter((assessment) => assessment.riskLevel === RiskLevel.HIGH).length,
        medium: assessments.filter((assessment) => assessment.riskLevel === RiskLevel.MEDIUM).length,
        low: assessments.filter((assessment) => assessment.riskLevel === RiskLevel.LOW).length,
        insufficientData: assessments.filter((assessment) => assessment.riskLevel === RiskLevel.INSUFFICIENT_DATA).length,
      },
      assessments: assessments.map((assessment) => ({
        companyId: assessment.companyId,
        score: assessment.score,
        riskLevel: assessment.riskLevel,
        coverageState: assessment.coverageState,
        assessmentId: assessment.id,
        computedAt: assessment.computedAt,
      })),
    };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
