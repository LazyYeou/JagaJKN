import { Prisma, UserRole } from "@prisma/client";
import { reconcileCompanyPeriodInTransaction } from "@/services/p3-reconcile";
import { evaluateCompanyRiskInTransaction } from "@/services/p4-risk";

const FIXED_CREATED_AT = new Date("2026-01-01T00:00:00.000Z");
const DEMO_PERIOD = "2026-09";
const PERIODS = ["2026-07", "2026-08", DEMO_PERIOD] as const;
const ASSESSED_AT = new Date("2026-10-09T09:00:00.000Z");

const companies = [
  { id: "company-a", name: "PT Sentra Karya Nusantara", externalCode: "DEMO-A" },
  { id: "company-b", name: "CV Pangan Sejahtera", externalCode: "DEMO-B" },
  { id: "company-c", name: "PT Lintas Usaha Mandiri", externalCode: "DEMO-C" },
  { id: "company-d", name: "PT Arta Bersih Indonesia", externalCode: "DEMO-D" },
  { id: "company-e", name: "Koperasi Karya Bersama", externalCode: "DEMO-E" },
] as const;

type SeedSummary = {
  companies: number;
  workers: number;
  users: number;
  contractVersions: number;
  attendanceRecords: number;
  payrollRecords: number;
  deductions: number;
  confirmations: number;
  reconciliationResults: number;
  protectedReports: number;
  wageEvaluations: number;
  riskAssessments: number;
};

function syntheticWorkerName(companyLetter: string, workerNumber: number) {
  return `Pekerja Simulasi ${companyLetter}-${String(workerNumber).padStart(3, "0")}`;
}

function periodDate(period: string, day: number) {
  return new Date(`${period}-${String(day).padStart(2, "0")}T00:00:00.000Z`);
}

async function clearDemoRows(tx: Prisma.TransactionClient) {
  await tx.riskIndicator.deleteMany();
  await tx.auditReview.deleteMany();
  await tx.riskAssessment.deleteMany();
  await tx.wageIndicator.deleteMany();
  await tx.wageEvaluation.deleteMany();
  await tx.anonymousReport.deleteMany();
  await tx.reconciliationResult.deleteMany();
  await tx.depositConfirmation.deleteMany();
  await tx.deductionRecord.deleteMany();
  await tx.payrollRecord.deleteMany();
  await tx.attendanceRecord.deleteMany();
  await tx.contractFeedback.deleteMany();
  await tx.contractClosure.deleteMany();
  await tx.contractVersion.deleteMany();
  await tx.user.deleteMany();
  await tx.worker.deleteMany();
  await tx.company.deleteMany();
}

export async function resetAndSeedDemoData(
  tx: Prisma.TransactionClient,
): Promise<SeedSummary> {
  await clearDemoRows(tx);

  await tx.company.createMany({
    data: companies.map((company) => ({ ...company, createdAt: FIXED_CREATED_AT })),
  });

  const workers = companies.flatMap((company) =>
    Array.from({ length: 20 }, (_, index) => {
      const workerNumber = index + 1;
      const letter = company.externalCode.at(-1)!;
      const workerCode = `${company.externalCode}-${String(workerNumber).padStart(3, "0")}`;
      return {
        id: `worker-${letter.toLowerCase()}-${String(workerNumber).padStart(3, "0")}`,
        companyId: company.id,
        workerCode,
        displayName: syntheticWorkerName(letter, workerNumber),
        createdAt: FIXED_CREATED_AT,
      };
    }),
  );
  await tx.worker.createMany({ data: workers });

  const users = [
    ...companies.flatMap((company) => {
      const letter = company.externalCode.at(-1)!.toLowerCase();
      const workerId = `worker-${letter}-001`;
      return [
        {
          id: `user-hr-${letter}`,
          displayName: `Demo HR — ${company.name}`,
          role: UserRole.HR,
          companyId: company.id,
          createdAt: FIXED_CREATED_AT,
        },
        {
          id: `user-worker-${letter}`,
          displayName: syntheticWorkerName(letter.toUpperCase(), 1),
          role: UserRole.WORKER,
          companyId: company.id,
          workerId,
          createdAt: FIXED_CREATED_AT,
        },
      ];
    }),
    {
      id: "user-auditor",
      displayName: "Auditor Demo",
      role: UserRole.AUDITOR,
      companyId: null,
      createdAt: FIXED_CREATED_AT,
    },
    {
      id: "user-demo-operator",
      displayName: "Operator Demo",
      role: UserRole.DEMO_OPERATOR,
      companyId: null,
      createdAt: FIXED_CREATED_AT,
    },
  ];
  await tx.user.createMany({ data: users });

  const contracts = workers.flatMap((worker, index) => {
    const companyLetter = worker.id.split("-")[1].toUpperCase();
    const company = companies.find((item) => item.externalCode.endsWith(companyLetter))!;
    const hrUserId = `user-hr-${companyLetter.toLowerCase()}`;
    const workerNumber = Number(worker.workerCode.slice(-3));
    const baseWage = companyLetter === "B" && workerNumber === 1
      ? 5_000_000
      : 5_000_000 + (workerNumber - 1) * 10_000;
    const fixedAllowance = 500_000;
    const v1EndsBeforeDemoPeriod = workerNumber === 1;
    const firstVersion = {
      id: `contract-${worker.id}-v1`,
      workerId: worker.id,
      versionNo: 1,
      effectiveFrom: new Date("2025-01-01T00:00:00.000Z"),
      effectiveTo: null,
      employmentType: "PKWTT",
      baseWage,
      fixedAllowance,
      expectedHoursPerMonth: 160,
      createdAt: FIXED_CREATED_AT,
      createdById: hrUserId,
    };

    if (!v1EndsBeforeDemoPeriod) return [firstVersion];

    return [
      firstVersion,
      {
        ...firstVersion,
        id: `contract-${worker.id}-v2`,
        versionNo: 2,
        effectiveFrom: new Date("2026-08-01T00:00:00.000Z"),
        effectiveTo: null,
        createdAt: new Date("2026-08-01T00:00:00.000Z"),
        baseWage: baseWage + (companyLetter === "D" ? 100_000 : 0),
      },
    ];
  });
  await tx.contractVersion.createMany({ data: contracts });
  await tx.contractClosure.createMany({
    data: workers.filter((worker) => worker.workerCode.endsWith("-001")).map((worker) => {
      const letter = worker.id.split("-")[1].toUpperCase();
      return {
        contractVersionId: `contract-${worker.id}-v1`,
        effectiveTo: new Date("2026-07-31T00:00:00.000Z"),
        supersededByVersionId: `contract-${worker.id}-v2`,
        closedById: `user-hr-${letter.toLowerCase()}`,
        closedAt: new Date("2026-08-01T00:00:00.000Z"),
      };
    }),
  });

  const attendanceRecords = workers.flatMap((worker) =>
    PERIODS.map((period) => ({
      id: `attendance-${worker.id}-${period}`,
      workerId: worker.id,
      period,
      actualHours: 160,
      overtimeHours: 8,
      sourceTag: "Synthetic / Demo",
      createdAt: periodDate(period, 28),
    })),
  );
  await tx.attendanceRecord.createMany({ data: attendanceRecords });

  const payrollRecords = workers.flatMap((worker, index) => {
    const companyLetter = worker.id.split("-")[1].toUpperCase();
    const workerNumber = Number(worker.workerCode.slice(-3));
    const baseWage = companyLetter === "B" && workerNumber === 1
      ? 5_000_000
      : 5_000_000 + (workerNumber - 1) * 10_000;

    return PERIODS.map((period, periodIndex) => {
      const fixedAllowanceReported = companyLetter === "B" && workerNumber === 1 && period === DEMO_PERIOD
        ? 650_000
        : 500_000;
      const baseWageReported = baseWage + (companyLetter === "D" && workerNumber === 1 && period !== "2026-07" ? 100_000 : 0);
      const variableAllowanceReported = 80_000 + (index % 20) * 1_000 + periodIndex * 500;
      return {
        id: `payroll-${worker.id}-${period}`,
        workerId: worker.id,
        period,
        baseWageReported,
        fixedAllowanceReported,
        variableAllowanceReported,
        reportedContributionBase: baseWageReported + fixedAllowanceReported + variableAllowanceReported,
        sourceTag: "Synthetic / Demo",
        createdAt: periodDate(period, 28),
      };
    });
  });
  await tx.payrollRecord.createMany({ data: payrollRecords });

  const deductionRecords = workers.flatMap((worker) => {
    const companyLetter = worker.id.split("-")[1].toUpperCase();
    const employeeOnePercentAmount = companyLetter === "A" ? 5_000 : 4_000;
    return PERIODS.map((period) => ({
      id: `deduction-${worker.id}-${period}`,
      workerId: worker.id,
      companyId: worker.companyId,
      period,
      employeeOnePercentAmount,
      sourceTag: "Synthetic / Demo",
      createdAt: periodDate(period, 28),
    }));
  });
  await tx.deductionRecord.createMany({ data: deductionRecords });

  const confirmations = companies.flatMap((company) => {
    const letter = company.externalCode.at(-1)!;
    return PERIODS.flatMap((period) => {
      if (letter === "C" && period !== "2026-07") return [];
      const deductionSum = letter === "A" ? 100_000 : 80_000;
      const confirmedEmployeeShareAmount = letter === "A" && period === DEMO_PERIOD
        ? 90_000
        : deductionSum;
      return [{
        id: `confirmation-${letter.toLowerCase()}-${period}`,
        companyId: company.id,
        period,
        confirmedEmployeeShareAmount,
        confirmedTotalAmount: confirmedEmployeeShareAmount * 5,
        confirmedAt: periodDate(period, 30),
        reference: `MOCK-${company.externalCode}-${period}`,
        sourceType: "MOCK_BPJS" as const,
        sourceTag: "Synthetic / Demo",
      }];
    });
  });
  await tx.depositConfirmation.createMany({ data: confirmations });

  const feedbackVersionId = "contract-worker-a-001-v2";
  await tx.contractFeedback.create({
    data: {
      id: "feedback-company-a-worker-001",
      workerId: "worker-a-001",
      contractVersionId: feedbackVersionId,
      category: "STATUS_WORK_ARRANGEMENT_DISPUTE",
      claimedRegularSchedule: "Jadwal kerja rutin sesuai skenario simulasi",
      status: "SUBMITTED",
      createdAt: ASSESSED_AT,
    },
  });

  await reconcileCompanyPeriodInTransaction(
    tx,
    "company-c",
    "2026-08",
    new Date("2026-09-05T09:00:00.000Z"),
    new Date("2026-09-05T09:00:00.000Z"),
  );

  // Fixed opaque IDs keep the synthetic protected-report fixture repeatable.
  await tx.anonymousReport.createMany({
    data: [1, 2, 3].map((number) => ({
      id: `e5000000-0000-4000-8000-00000000000${number}`,
      companyId: "company-e",
      period: DEMO_PERIOD,
      category: "POTONGAN_TIDAK_JELAS",
      createdAt: new Date(`2026-09-${String(20 + number).padStart(2, "0")}T08:00:00.000Z`),
    })),
  });

  for (const company of companies) {
    await evaluateCompanyRiskInTransaction(
      tx,
      company.id,
      DEMO_PERIOD,
      ASSESSED_AT,
      ASSESSED_AT,
    );
  }

  const summary: SeedSummary = {
    companies: companies.length,
    workers: workers.length,
    users: users.length,
    contractVersions: contracts.length,
    attendanceRecords: attendanceRecords.length,
    payrollRecords: payrollRecords.length,
    deductions: deductionRecords.length,
    confirmations: confirmations.length,
    reconciliationResults: companies.length + 1,
    protectedReports: 3,
    wageEvaluations: companies.length,
    riskAssessments: companies.length,
  };

  if (summary.companies !== 5 || summary.workers !== 100) {
    throw new Error("Demo seed invariant failed: expected 5 companies and 100 workers.");
  }

  return summary;
}

export type { SeedSummary };
