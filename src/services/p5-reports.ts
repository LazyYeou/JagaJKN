import { UserRole } from "@prisma/client";
import type { SessionActor } from "@/auth/authorization";
import { AuthorizationError, requireRole } from "@/auth/authorization";
import { ConflictError, InputValidationError, NotFoundError } from "@/domain/errors";
import { assertPeriod } from "@/domain/period";
import { isP5ReportCategory } from "@/domain/report-categories";
import { prisma } from "@/repositories/prisma";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_FIELDS = new Set(["submissionId", "period", "category"]);

export type P5SubmissionInput = {
  submissionId: string;
  period: string;
  category: string;
};

export function parseP5Submission(value: unknown): P5SubmissionInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new InputValidationError("Isi laporan harus berupa object JSON.");
  }
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => !ALLOWED_FIELDS.has(key))) {
    throw new InputValidationError("Laporan hanya menerima ID pengiriman, periode, dan kategori.");
  }
  if (typeof input.submissionId !== "string" || !UUID_V4.test(input.submissionId)) {
    throw new InputValidationError("ID pengiriman harus berupa UUID acak yang valid.");
  }
  assertPeriod(input.period);
  if (!isP5ReportCategory(input.category)) {
    throw new InputValidationError("Pilih kategori laporan yang tersedia.");
  }
  return { submissionId: input.submissionId, period: input.period, category: input.category };
}

export async function submitProtectedReport(actor: SessionActor | null, value: unknown) {
  const worker = requireRole(actor, UserRole.WORKER);
  if (!worker.workerId || !worker.companyId) throw new AuthorizationError(403, "Worker scope is missing.");
  const input = parseP5Submission(value);

  const workerExists = await prisma.worker.findFirst({
    where: { id: worker.workerId, companyId: worker.companyId },
    select: { id: true },
  });
  if (!workerExists) throw new NotFoundError("Data pekerja tidak ditemukan.");

  return prisma.$transaction(async (tx) => {
    const inserted = await tx.anonymousReport.createMany({
      data: [{
        id: input.submissionId,
        companyId: worker.companyId!,
        period: input.period,
        category: input.category,
      }],
      skipDuplicates: true,
    });
    const stored = await tx.anonymousReport.findUnique({
      where: { id: input.submissionId },
      select: { id: true, companyId: true, period: true, category: true, createdAt: true },
    });
    if (!stored) throw new Error("Protected report write did not produce a receipt.");
    if (stored.companyId !== worker.companyId || stored.period !== input.period || stored.category !== input.category) {
      throw new ConflictError("ID pengiriman sudah digunakan untuk laporan lain.");
    }
    return {
      receiptId: stored.id,
      period: stored.period,
      category: stored.category,
      acceptedAt: stored.createdAt,
      duplicate: inserted.count === 0,
    };
  });
}
