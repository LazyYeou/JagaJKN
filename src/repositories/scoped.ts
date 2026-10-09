import { UserRole } from "@prisma/client";
import type { SessionActor } from "@/auth/authorization";
import { AuthorizationError, companyWorkerListWhere, requireRole, workerLookupWhere } from "@/auth/authorization";
import { prisma } from "@/repositories/prisma";

const workerListSelect = {
  id: true,
  workerCode: true,
  displayName: true,
} as const;

export async function listWorkersForHr(actor: SessionActor | null) {
  const where = companyWorkerListWhere(actor);
  return prisma.worker.findMany({
    where,
    select: workerListSelect,
    orderBy: { workerCode: "asc" },
  });
}

export async function findWorkerForActor(actor: SessionActor | null, workerId: string) {
  const scopedActor = requireRole(actor, UserRole.HR, UserRole.WORKER);
  const where = workerLookupWhere(scopedActor, workerId);
  if (!where) return null;
  return prisma.worker.findFirst({ where, select: workerListSelect });
}

export async function getWorkerSummaryForActor(actor: SessionActor | null) {
  const scopedActor = requireRole(actor, UserRole.WORKER);
  if (!scopedActor.workerId) throw new AuthorizationError(403, "Worker scope is missing.");

  return prisma.worker.findUnique({
    where: { id: scopedActor.workerId },
    select: {
      id: true,
      workerCode: true,
      displayName: true,
      company: { select: { name: true, externalCode: true } },
    },
  });
}

export async function listCompanySummariesForAuditor(actor: SessionActor | null) {
  requireRole(actor, UserRole.AUDITOR);
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      _count: { select: { workers: true } },
    },
    orderBy: { externalCode: "asc" },
  });

  return companies.map(({ id, name, _count }) => ({
    id,
    name,
    workerCount: _count.workers,
  }));
}
