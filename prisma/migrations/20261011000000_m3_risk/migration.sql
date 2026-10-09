-- Add stable scenario time separate from actual assessment/snapshot time.
ALTER TABLE "ReconciliationResult" ADD COLUMN "evaluationAsOf" TIMESTAMP(3);
UPDATE "ReconciliationResult" SET "evaluationAsOf" = "calculatedAt" WHERE "evaluationAsOf" IS NULL;
ALTER TABLE "ReconciliationResult" ALTER COLUMN "evaluationAsOf" SET NOT NULL;

ALTER TABLE "RiskAssessment"
    ADD COLUMN "evaluationAsOf" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "p2EvaluationId" TEXT,
    ADD COLUMN "p3ReconciliationId" TEXT,
    ADD COLUMN "p5EligibleReportCount" INTEGER;

ALTER TABLE "RiskIndicator"
    ADD COLUMN "categoryCode" TEXT NOT NULL DEFAULT 'LEGACY_UNMAPPED',
    ADD COLUMN "categoryWeight" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "scoreContribution" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "RiskIndicator"
    ALTER COLUMN "categoryCode" DROP DEFAULT,
    ALTER COLUMN "categoryWeight" DROP DEFAULT,
    ALTER COLUMN "scoreContribution" DROP DEFAULT;

ALTER TABLE "RiskAssessment"
    ADD CONSTRAINT "RiskAssessment_p2EvaluationId_fkey"
        FOREIGN KEY ("p2EvaluationId") REFERENCES "WageEvaluation"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "RiskAssessment_p3ReconciliationId_fkey"
        FOREIGN KEY ("p3ReconciliationId") REFERENCES "ReconciliationResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
