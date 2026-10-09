import { UserRole } from "@prisma/client";
import type { SessionActor } from "@/auth/authorization";
import { AuthorizationError, requireRole } from "@/auth/authorization";
import { prisma } from "@/repositories/prisma";
import { latestReconciliation } from "@/services/p3-reconcile";

export async function getWorkerContributionTimeline(actor: SessionActor | null) {
  const worker = requireRole(actor, UserRole.WORKER);
  if (!worker.workerId || !worker.companyId) throw new AuthorizationError(403, "Worker scope is missing.");
  const deductions = await prisma.deductionRecord.findMany({
    where: { workerId: worker.workerId, companyId: worker.companyId },
    orderBy: { period: "desc" },
    select: { period: true, employeeOnePercentAmount: true, sourceTag: true },
  });
  const periods = [...new Set(deductions.map((row) => row.period))];
  const results = await Promise.all(periods.map((period) => latestReconciliation(worker.companyId!, period)));
  const byPeriod = new Map(periods.map((period, index) => [period, results[index]]));

  return {
    contributions: deductions.map((deduction) => {
      const result = byPeriod.get(deduction.period);
      return {
        period: deduction.period,
        employeeOnePercentAmount: deduction.employeeOnePercentAmount,
        deductionSource: deduction.sourceTag,
        companyPeriodReconciliation: result ? {
          status: result.status,
          reason: result.reason,
          delta: result.delta,
          evaluationAsOf: result.evaluationAsOf,
          calculatedAt: result.calculatedAt,
          sourceLabel: result.confirmation?.sourceType === "MOCK_BPJS" ? "Sumber: Simulasi BPJS" : null,
          sourceType: result.confirmation?.sourceType ?? null,
        } : {
          status: "UNVERIFIED" as const,
          reason: "Pencocokan perusahaan-periode belum tersedia; belum dapat diverifikasi.",
          delta: null,
          evaluationAsOf: null,
          calculatedAt: null,
          sourceLabel: null,
          sourceType: null,
        },
      };
    }),
    disclaimer: "Status ini merupakan pencocokan data pada tingkat perusahaan dan periode; bukan bukti pembayaran individual.",
  };
}
