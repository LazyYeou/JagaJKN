-- Add persisted P2 evidence states and append-only contract end dates.
CREATE TYPE "WageRuleCode" AS ENUM (
    'P2_FIXED_COMPONENT_CONTRACT_DIFFERENCE',
    'P2_RECURRING_VARIABLE_COMPONENT'
);
CREATE TYPE "EvidenceDataStatus" AS ENUM ('EVALUATED', 'INSUFFICIENT_DATA');

DROP INDEX "ReconciliationResult_companyId_period_key";

ALTER TABLE "ReconciliationResult"
    ADD COLUMN "comparisonBasis" TEXT,
    ADD COLUMN "confirmationId" TEXT,
    ADD COLUMN "deductionRecordCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "ContractClosure" (
    "id" TEXT NOT NULL,
    "contractVersionId" TEXT NOT NULL,
    "effectiveTo" DATE NOT NULL,
    "supersededByVersionId" TEXT,
    "closedById" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContractClosure_pkey" PRIMARY KEY ("id")
);

-- Preserve M1's existing effective-end dates as immutable closure records.
INSERT INTO "ContractClosure" (
    "id", "contractVersionId", "effectiveTo", "supersededByVersionId", "closedById", "closedAt"
)
SELECT
    gen_random_uuid()::TEXT,
    old_version."id",
    old_version."effectiveTo",
    replacement."id",
    old_version."createdById",
    old_version."createdAt"
FROM "ContractVersion" AS old_version
LEFT JOIN LATERAL (
    SELECT next_version."id"
    FROM "ContractVersion" AS next_version
    WHERE next_version."workerId" = old_version."workerId"
      AND next_version."effectiveFrom" = old_version."effectiveTo" + 1
    ORDER BY next_version."versionNo" ASC
    LIMIT 1
) AS replacement ON TRUE
WHERE old_version."effectiveTo" IS NOT NULL;

-- Backfill aggregate provenance available from existing D3 source rows.
UPDATE "ReconciliationResult" AS result
SET
    "deductionRecordCount" = (
        SELECT COUNT(*)::INTEGER
        FROM "DeductionRecord" AS deduction
        WHERE deduction."companyId" = result."companyId"
          AND deduction."period" = result."period"
    ),
    "confirmationId" = (
        SELECT confirmation."id"
        FROM "DepositConfirmation" AS confirmation
        WHERE confirmation."companyId" = result."companyId"
          AND confirmation."period" = result."period"
        LIMIT 1
    ),
    "comparisonBasis" = CASE
        WHEN result."comparableConfirmedSum" IS NOT NULL THEN 'EMPLOYEE_SHARE_1_PERCENT'
        ELSE NULL
    END;

CREATE TABLE "WageEvaluation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "period" VARCHAR(7) NOT NULL,
    "ruleVersion" TEXT NOT NULL,
    "coverageState" "CoverageState" NOT NULL,
    "expectedWorkerCount" INTEGER NOT NULL,
    "attendanceRecordCount" INTEGER NOT NULL,
    "payrollRecordCount" INTEGER NOT NULL,
    "coveredContractCount" INTEGER NOT NULL,
    "rollingWindowComplete" BOOLEAN NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WageEvaluation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WageIndicator" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "ruleCode" "WageRuleCode" NOT NULL,
    "triggered" BOOLEAN NOT NULL,
    "affectedWorkerCount" INTEGER NOT NULL,
    "dataStatus" "EvidenceDataStatus" NOT NULL,
    "explanation" TEXT NOT NULL,
    CONSTRAINT "WageIndicator_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContractClosure_contractVersionId_key" ON "ContractClosure"("contractVersionId");
CREATE INDEX "ContractClosure_effectiveTo_idx" ON "ContractClosure"("effectiveTo");
CREATE INDEX "WageEvaluation_companyId_period_evaluatedAt_idx" ON "WageEvaluation"("companyId", "period", "evaluatedAt");
CREATE UNIQUE INDEX "WageIndicator_evaluationId_ruleCode_key" ON "WageIndicator"("evaluationId", "ruleCode");
CREATE INDEX "ReconciliationResult_companyId_period_calculatedAt_idx" ON "ReconciliationResult"("companyId", "period", "calculatedAt");

ALTER TABLE "ContractClosure"
    ADD CONSTRAINT "ContractClosure_contractVersionId_fkey"
        FOREIGN KEY ("contractVersionId") REFERENCES "ContractVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "ContractClosure_supersededByVersionId_fkey"
        FOREIGN KEY ("supersededByVersionId") REFERENCES "ContractVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "ContractClosure_closedById_fkey"
        FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ReconciliationResult"
    ADD CONSTRAINT "ReconciliationResult_confirmationId_fkey"
        FOREIGN KEY ("confirmationId") REFERENCES "DepositConfirmation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WageEvaluation"
    ADD CONSTRAINT "WageEvaluation_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WageIndicator"
    ADD CONSTRAINT "WageIndicator_evaluationId_fkey"
        FOREIGN KEY ("evaluationId") REFERENCES "WageEvaluation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
