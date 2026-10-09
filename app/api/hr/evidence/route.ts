import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { authErrorResponse } from "@/auth/api-response";
import { AuthorizationError, requireRole } from "@/auth/authorization";
import { getCurrentActor } from "@/auth/session";
import { assertPeriod } from "@/domain/period";
import { InputValidationError } from "@/domain/errors";
import { latestWageEvaluation } from "@/services/p2-wage";
import { latestReconciliation } from "@/services/p3-reconcile";

export async function GET(request: NextRequest) {
  try {
    const actor = requireRole(await getCurrentActor(), UserRole.HR);
    if (!actor.companyId) throw new AuthorizationError(403, "Company scope is missing.");
    const period = request.nextUrl.searchParams.get("period");
    if (!period) throw new InputValidationError("Parameter period wajib diisi.");
    assertPeriod(period);
    const [wage, reconciliation] = await Promise.all([
      latestWageEvaluation(actor.companyId, period),
      latestReconciliation(actor.companyId, period),
    ]);
    return NextResponse.json({ period, wage, reconciliation }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return authErrorResponse(error);
  }
}
