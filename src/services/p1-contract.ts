import { randomUUID } from "node:crypto";
import { Prisma, UserRole } from "@prisma/client";
import type { SessionActor } from "@/auth/authorization";
import { requireRole, workerLookupWhere } from "@/auth/authorization";
import { ConflictError, InputValidationError, NotFoundError } from "@/domain/errors";
import { assertPeriod, dateBefore, parseIsoDate } from "@/domain/period";
import { selectContractForPeriod } from "@/domain/contracts";
import { prisma } from "@/repositories/prisma";
import { evaluateWageCompanyPeriodInTransaction } from "@/services/p2-wage";

const MAX_IDR = 2_147_483_647;
const FEEDBACK_CATEGORIES = new Set([
  "STATUS_WORK_ARRANGEMENT_DISPUTE",
  "SCHEDULE_DISCREPANCY",
  "WAGE_OR_HOURS_CLARIFICATION",
]);

export type ContractDraft = {
  effectiveFrom: Date;
  employmentType: string;
  baseWage: number;
  fixedAllowance: number;
  expectedHoursPerMonth: number;
};

function objectValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new InputValidationError("Isi permintaan harus berupa object JSON.");
  }
  return value as Record<string, unknown>;
}

function nonNegativeIdr(value: unknown, field: string) {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > MAX_IDR) {
    throw new InputValidationError(`${field} harus berupa rupiah bulat non-negatif.`);
  }
  return value as number;
}

export function parseContractDraft(value: unknown): ContractDraft {
  const input = objectValue(value);
  if (typeof input.employmentType !== "string" || !input.employmentType.trim() || input.employmentType.length > 50) {
    throw new InputValidationError("Jenis hubungan kerja wajib diisi (maksimal 50 karakter).");
  }
  if (!Number.isSafeInteger(input.expectedHoursPerMonth)
    || (input.expectedHoursPerMonth as number) <= 0
    || (input.expectedHoursPerMonth as number) > MAX_IDR) {
    throw new InputValidationError("Jam kerja harapan per bulan harus bilangan bulat positif.");
  }
  return {
    effectiveFrom: parseIsoDate(input.effectiveFrom, { firstOfMonth: true }),
    employmentType: input.employmentType.trim(),
    baseWage: nonNegativeIdr(input.baseWage, "Upah pokok"),
    fixedAllowance: nonNegativeIdr(input.fixedAllowance, "Tunjangan tetap"),
    expectedHoursPerMonth: input.expectedHoursPerMonth as number,
  };
}

export async function publishContractVersion(actor: SessionActor | null, workerId: string, rawDraft: unknown) {
  const hr = requireRole(actor, UserRole.HR);
  const draft = parseContractDraft(rawDraft);
  const workerWhere = workerLookupWhere(hr, workerId);
  const worker = await prisma.worker.findFirst({ where: workerWhere!, select: { id: true, companyId: true } });
  if (!worker) throw new NotFoundError("Pekerja tidak ditemukan di perusahaan Anda.");

  return prisma.$transaction(async (tx) => {
    const versions = await tx.contractVersion.findMany({
      where: { workerId: worker.id },
      include: { closure: { select: { effectiveTo: true } } },
      orderBy: { versionNo: "asc" },
    });
    const latest = versions.at(-1);
    if (latest && draft.effectiveFrom <= latest.effectiveFrom) {
      throw new ConflictError("Tanggal efektif versi baru harus setelah awal versi sebelumnya.");
    }

    for (const version of versions) {
      const endDate = version.closure?.effectiveTo ?? version.effectiveTo;
      if (endDate === null && version.id !== latest?.id) {
        throw new ConflictError("Riwayat kontrak memiliki versi terbuka yang tidak konsisten.");
      }
      if (endDate && draft.effectiveFrom <= endDate) {
        throw new ConflictError("Tanggal efektif bertumpang tindih dengan versi kontrak sebelumnya.");
      }
    }

    const created = await tx.contractVersion.create({
      data: {
        id: randomUUID(),
        workerId: worker.id,
        versionNo: (latest?.versionNo ?? 0) + 1,
        effectiveFrom: draft.effectiveFrom,
        effectiveTo: null,
        employmentType: draft.employmentType,
        baseWage: draft.baseWage,
        fixedAllowance: draft.fixedAllowance,
        expectedHoursPerMonth: draft.expectedHoursPerMonth,
        createdById: hr.id,
      },
      select: {
        id: true,
        versionNo: true,
        effectiveFrom: true,
        employmentType: true,
        baseWage: true,
        fixedAllowance: true,
        expectedHoursPerMonth: true,
      },
    });

    let closedVersionNo: number | null = null;
    if (latest && !latest.closure && latest.effectiveTo === null) {
      const effectiveTo = dateBefore(draft.effectiveFrom);
      if (effectiveTo < latest.effectiveFrom) {
        throw new ConflictError("Versi baru harus dimulai setelah awal versi sebelumnya.");
      }
      await tx.contractClosure.create({
        data: {
          contractVersionId: latest.id,
          effectiveTo,
          supersededByVersionId: created.id,
          closedById: hr.id,
        },
      });
      closedVersionNo = latest.versionNo;
    }

    const firstAffectedPeriod = draft.effectiveFrom.toISOString().slice(0, 7);
    const payrollPeriods = await tx.payrollRecord.findMany({
      where: { workerId: worker.id, period: { gte: firstAffectedPeriod } },
      select: { period: true },
      distinct: ["period"],
      orderBy: { period: "asc" },
    });
    const wageReevaluations = [];
    for (const row of payrollPeriods) {
      wageReevaluations.push(await evaluateWageCompanyPeriodInTransaction(tx, worker.companyId, row.period));
    }

    return { workerId: worker.id, version: created, closedVersionNo, wageReevaluations };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function getContractHistoryForWorker(actor: SessionActor | null, period = "2026-09") {
  const worker = requireRole(actor, UserRole.WORKER);
  if (!worker.workerId) throw new NotFoundError("Akun pekerja tidak memiliki data pekerja.");
  assertPeriod(period);
  return readContractHistory(worker.workerId, period);
}

export async function getContractHistoryForHr(actor: SessionActor | null, workerId: string) {
  const hr = requireRole(actor, UserRole.HR);
  const where = workerLookupWhere(hr, workerId);
  const worker = await prisma.worker.findFirst({ where: where!, select: { id: true } });
  if (!worker) throw new NotFoundError("Pekerja tidak ditemukan di perusahaan Anda.");
  return readContractHistory(worker.id);
}

async function readContractHistory(workerId: string, period?: string) {
  const worker = await prisma.worker.findUnique({
    where: { id: workerId },
    select: {
      id: true,
      workerCode: true,
      displayName: true,
      company: { select: { name: true } },
      contracts: {
        orderBy: { versionNo: "desc" },
        include: { closure: { select: { effectiveTo: true } } },
      },
    },
  });
  if (!worker) throw new NotFoundError("Pekerja tidak ditemukan.");
  const versions = worker.contracts.map(({ closure, ...version }) => ({
    ...version,
    effectiveTo: closure?.effectiveTo ?? version.effectiveTo,
  }));
  const contractForPeriod = period
    ? selectContractForPeriod(versions, [], period)
    : undefined;
  return {
    worker: {
      id: worker.id,
      workerCode: worker.workerCode,
      displayName: worker.displayName,
      companyName: worker.company.name,
    },
    period: period ?? null,
    contractForPeriod: contractForPeriod ?? null,
    versions,
  };
}

export async function submitContractFeedback(actor: SessionActor | null, rawInput: unknown) {
  const worker = requireRole(actor, UserRole.WORKER);
  if (!worker.workerId) throw new NotFoundError("Akun pekerja tidak memiliki data pekerja.");
  const input = objectValue(rawInput);
  if (typeof input.contractVersionId !== "string" || input.contractVersionId.length > 100) {
    throw new InputValidationError("Pilih versi kontrak yang valid.");
  }
  if (typeof input.category !== "string" || !FEEDBACK_CATEGORIES.has(input.category)) {
    throw new InputValidationError("Kategori feedback tidak dikenal.");
  }
  if (input.claimedRegularSchedule !== undefined
    && (typeof input.claimedRegularSchedule !== "string" || input.claimedRegularSchedule.length > 300)) {
    throw new InputValidationError("Keterangan jadwal maksimal 300 karakter.");
  }

  const ownedContract = await prisma.contractVersion.findFirst({
    where: { id: input.contractVersionId, workerId: worker.workerId },
    select: { id: true },
  });
  if (!ownedContract) throw new NotFoundError("Versi kontrak tidak ditemukan.");

  const feedback = await prisma.contractFeedback.create({
    data: {
      workerId: worker.workerId,
      contractVersionId: ownedContract.id,
      category: input.category,
      claimedRegularSchedule: typeof input.claimedRegularSchedule === "string"
        ? input.claimedRegularSchedule.trim() || null
        : null,
    },
    select: { id: true, contractVersionId: true, category: true, status: true, createdAt: true },
  });
  return feedback;
}
