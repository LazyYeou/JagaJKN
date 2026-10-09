import { Prisma } from "@prisma/client";
import { DEMO_EVALUATION_AS_OF } from "@/domain/risk";
import { prisma } from "@/repositories/prisma";
import { evaluateCompanyRiskInTransaction } from "@/services/p4-risk";

export type EvidenceRecomputeSummary = {
  companies: number;
  wageEvaluations: number;
  reconciliations: number;
  riskAssessments: number;
};

export async function recomputeExistingEvidence(): Promise<EvidenceRecomputeSummary> {
  const companies = await prisma.company.findMany({ select: { id: true }, orderBy: { externalCode: "asc" } });
  let wageEvaluations = 0;
  let reconciliations = 0;
  let riskAssessments = 0;

  for (const company of companies) {
    const [attendance, payroll, deductions, confirmations] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: { worker: { companyId: company.id } },
        select: { period: true }, distinct: ["period"],
      }),
      prisma.payrollRecord.findMany({
        where: { worker: { companyId: company.id } },
        select: { period: true }, distinct: ["period"],
      }),
      prisma.deductionRecord.findMany({ where: { companyId: company.id }, select: { period: true }, distinct: ["period"] }),
      prisma.depositConfirmation.findMany({ where: { companyId: company.id }, select: { period: true }, distinct: ["period"] }),
    ]);
    const periods = [...new Set([...attendance, ...payroll, ...deductions, ...confirmations].map((row) => row.period))].sort();

    for (const period of periods) {
      await prisma.$transaction(async (tx) => {
        await evaluateCompanyRiskInTransaction(
          tx,
          company.id,
          period,
          new Date(DEMO_EVALUATION_AS_OF),
          new Date(),
        );
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      wageEvaluations += 1;
      reconciliations += 1;
      riskAssessments += 1;
    }
  }

  return { companies: companies.length, wageEvaluations, reconciliations, riskAssessments };
}
