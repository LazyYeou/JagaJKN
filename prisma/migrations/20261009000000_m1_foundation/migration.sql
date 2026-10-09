-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('HR', 'WORKER', 'AUDITOR', 'DEMO_OPERATOR');

-- CreateEnum
CREATE TYPE "DepositSourceType" AS ENUM ('MOCK_BPJS');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('MATCHED', 'MISMATCH', 'PENDING', 'UNVERIFIED');

-- CreateEnum
CREATE TYPE "ProcessCode" AS ENUM ('P1', 'P2', 'P3', 'P5');

-- CreateEnum
CREATE TYPE "CoverageState" AS ENUM ('COMPLETE', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'INSUFFICIENT_DATA');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "externalCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "companyId" TEXT,
    "workerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "workerCode" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractVersion" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "employmentType" TEXT NOT NULL,
    "baseWage" INTEGER NOT NULL,
    "fixedAllowance" INTEGER NOT NULL,
    "expectedHoursPerMonth" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "ContractVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractFeedback" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "contractVersionId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "claimedRegularSchedule" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContractFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "period" VARCHAR(7) NOT NULL,
    "actualHours" INTEGER NOT NULL,
    "overtimeHours" INTEGER NOT NULL,
    "sourceTag" TEXT NOT NULL DEFAULT 'Synthetic / Demo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRecord" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "period" VARCHAR(7) NOT NULL,
    "baseWageReported" INTEGER NOT NULL,
    "fixedAllowanceReported" INTEGER NOT NULL,
    "variableAllowanceReported" INTEGER NOT NULL,
    "reportedContributionBase" INTEGER NOT NULL,
    "sourceTag" TEXT NOT NULL DEFAULT 'Synthetic / Demo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PayrollRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeductionRecord" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "period" VARCHAR(7) NOT NULL,
    "employeeOnePercentAmount" INTEGER NOT NULL,
    "sourceTag" TEXT NOT NULL DEFAULT 'Synthetic / Demo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeductionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositConfirmation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "period" VARCHAR(7) NOT NULL,
    "confirmedEmployeeShareAmount" INTEGER,
    "confirmedTotalAmount" INTEGER,
    "confirmedAt" TIMESTAMP(3),
    "reference" TEXT NOT NULL,
    "sourceType" "DepositSourceType" NOT NULL DEFAULT 'MOCK_BPJS',
    "sourceTag" TEXT NOT NULL DEFAULT 'Synthetic / Demo',
    CONSTRAINT "DepositConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationResult" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "period" VARCHAR(7) NOT NULL,
    "status" "ReconciliationStatus" NOT NULL,
    "deductionSum" INTEGER NOT NULL,
    "comparableConfirmedSum" INTEGER,
    "delta" INTEGER,
    "reason" TEXT NOT NULL,
    "confirmationExpectedAt" TIMESTAMP(3),
    "calculatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReconciliationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnonymousReport" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "period" VARCHAR(7) NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnonymousReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAssessment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "period" VARCHAR(7) NOT NULL,
    "score" INTEGER NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "coverageState" "CoverageState" NOT NULL,
    "ruleVersion" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskIndicator" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "ruleCode" TEXT NOT NULL,
    "processCode" "ProcessCode" NOT NULL,
    "triggered" BOOLEAN NOT NULL,
    "explanation" TEXT NOT NULL,
    "evidenceSummary" TEXT NOT NULL,
    "dataStatus" TEXT NOT NULL,
    CONSTRAINT "RiskIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditReview" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AuditReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_externalCode_key" ON "Company"("externalCode");
CREATE UNIQUE INDEX "User_workerId_key" ON "User"("workerId");
CREATE INDEX "User_companyId_role_idx" ON "User"("companyId", "role");
CREATE INDEX "Worker_companyId_displayName_idx" ON "Worker"("companyId", "displayName");
CREATE UNIQUE INDEX "Worker_companyId_workerCode_key" ON "Worker"("companyId", "workerCode");
CREATE INDEX "ContractVersion_workerId_effectiveFrom_effectiveTo_idx" ON "ContractVersion"("workerId", "effectiveFrom", "effectiveTo");
CREATE UNIQUE INDEX "ContractVersion_workerId_versionNo_key" ON "ContractVersion"("workerId", "versionNo");
CREATE INDEX "ContractFeedback_workerId_createdAt_idx" ON "ContractFeedback"("workerId", "createdAt");
CREATE INDEX "ContractFeedback_contractVersionId_idx" ON "ContractFeedback"("contractVersionId");
CREATE INDEX "AttendanceRecord_period_idx" ON "AttendanceRecord"("period");
CREATE UNIQUE INDEX "AttendanceRecord_workerId_period_key" ON "AttendanceRecord"("workerId", "period");
CREATE INDEX "PayrollRecord_period_idx" ON "PayrollRecord"("period");
CREATE UNIQUE INDEX "PayrollRecord_workerId_period_key" ON "PayrollRecord"("workerId", "period");
CREATE INDEX "DeductionRecord_companyId_period_idx" ON "DeductionRecord"("companyId", "period");
CREATE UNIQUE INDEX "DeductionRecord_workerId_period_key" ON "DeductionRecord"("workerId", "period");
CREATE UNIQUE INDEX "DepositConfirmation_companyId_period_key" ON "DepositConfirmation"("companyId", "period");
CREATE UNIQUE INDEX "ReconciliationResult_companyId_period_key" ON "ReconciliationResult"("companyId", "period");
CREATE INDEX "AnonymousReport_companyId_period_createdAt_idx" ON "AnonymousReport"("companyId", "period", "createdAt");
CREATE INDEX "RiskAssessment_companyId_period_computedAt_idx" ON "RiskAssessment"("companyId", "period", "computedAt");
CREATE INDEX "RiskIndicator_assessmentId_processCode_idx" ON "RiskIndicator"("assessmentId", "processCode");
CREATE INDEX "AuditReview_companyId_updatedAt_idx" ON "AuditReview"("companyId", "updatedAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ContractVersion" ADD CONSTRAINT "ContractVersion_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ContractVersion" ADD CONSTRAINT "ContractVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ContractFeedback" ADD CONSTRAINT "ContractFeedback_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ContractFeedback" ADD CONSTRAINT "ContractFeedback_contractVersionId_fkey" FOREIGN KEY ("contractVersionId") REFERENCES "ContractVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PayrollRecord" ADD CONSTRAINT "PayrollRecord_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DeductionRecord" ADD CONSTRAINT "DeductionRecord_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DeductionRecord" ADD CONSTRAINT "DeductionRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DepositConfirmation" ADD CONSTRAINT "DepositConfirmation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReconciliationResult" ADD CONSTRAINT "ReconciliationResult_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AnonymousReport" ADD CONSTRAINT "AnonymousReport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RiskIndicator" ADD CONSTRAINT "RiskIndicator_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "RiskAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditReview" ADD CONSTRAINT "AuditReview_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditReview" ADD CONSTRAINT "AuditReview_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "RiskAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditReview" ADD CONSTRAINT "AuditReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
