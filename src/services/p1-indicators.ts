import { Prisma } from "@prisma/client";
import { buildP1RapidStatusIndicator, buildP1StatusFeedbackIndicator } from "@/domain/p1";
import { selectContractForPeriod } from "@/domain/contracts";
import { assertPeriod, previousPeriods } from "@/domain/period";
import { NotFoundError } from "@/domain/errors";
import { prisma } from "@/repositories/prisma";

export async function evaluateP1IndicatorsInTransaction(
  tx: Prisma.TransactionClient,
  companyId: string,
  period: string,
) {
  assertPeriod(period);
  const company = await tx.company.findUnique({ where: { id: companyId }, select: { id: true } });
  if (!company) throw new NotFoundError("Perusahaan tidak ditemukan.");

  const workers = await tx.worker.findMany({
    where: { companyId },
    select: {
      id: true,
      contracts: {
        select: {
          id: true,
          workerId: true,
          versionNo: true,
          effectiveFrom: true,
          effectiveTo: true,
          employmentType: true,
          closure: { select: { effectiveTo: true } },
          feedback: { where: { status: "SUBMITTED", category: "STATUS_WORK_ARRANGEMENT_DISPUTE" }, select: { id: true } },
        },
      },
    },
  });

  let coveredContractCount = 0;
  let affectedWorkerCount = 0;
  let completeHistoryWorkerCount = 0;
  let rapidStatusWorkerCount = 0;
  const historyPeriods = previousPeriods(period, 3);
  for (const worker of workers) {
    const versions = worker.contracts.map(({ closure: _closure, feedback: _feedback, ...version }) => version);
    const closures = worker.contracts.flatMap((version) => version.closure
      ? [{ contractVersionId: version.id, effectiveTo: version.closure.effectiveTo }]
      : []);
    const effective = selectContractForPeriod(versions, closures, period);
    if (!effective) continue;
    coveredContractCount += 1;
    const hasQualifyingFeedback = worker.contracts.some((version) =>
      version.id === effective.id && version.feedback.length > 0);
    if (hasQualifyingFeedback) affectedWorkerCount += 1;

    const history = historyPeriods.map((historyPeriod) =>
      selectContractForPeriod(versions, closures, historyPeriod));
    if (history.every((version) => version !== null)) {
      completeHistoryWorkerCount += 1;
      let classificationChanges = 0;
      for (let index = 1; index < history.length; index += 1) {
        if (history[index - 1]!.employmentType !== history[index]!.employmentType) classificationChanges += 1;
      }
      if (classificationChanges >= 2) rapidStatusWorkerCount += 1;
    }
  }

  return {
    statusFeedback: buildP1StatusFeedbackIndicator(period, workers.length, coveredContractCount, affectedWorkerCount),
    rapidStatusChanges: buildP1RapidStatusIndicator(period, workers.length, completeHistoryWorkerCount, rapidStatusWorkerCount),
  };
}

export async function evaluateP1StatusFeedbackInTransaction(
  tx: Prisma.TransactionClient,
  companyId: string,
  period: string,
) {
  const indicators = await evaluateP1IndicatorsInTransaction(tx, companyId, period);
  return indicators.statusFeedback;
}

export async function evaluateP1StatusFeedback(companyId: string, period: string) {
  return prisma.$transaction((tx) => evaluateP1StatusFeedbackInTransaction(tx, companyId, period));
}

export async function evaluateP1Indicators(companyId: string, period: string) {
  return prisma.$transaction((tx) => evaluateP1IndicatorsInTransaction(tx, companyId, period));
}
