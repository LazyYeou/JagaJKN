import { NextRequest, NextResponse } from "next/server";
import { authErrorResponse } from "@/auth/api-response";
import { getCurrentActor } from "@/auth/session";
import { InputValidationError } from "@/domain/errors";
import { assertPeriod } from "@/domain/period";
import { getHrWorkerEvidence } from "@/services/hr-evidence";

type RouteContext = { params: Promise<{ workerId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { workerId } = await context.params;
    const period = request.nextUrl.searchParams.get("period");
    if (!period) throw new InputValidationError("Parameter period wajib diisi.");
    assertPeriod(period);
    const evidence = await getHrWorkerEvidence(await getCurrentActor(), workerId, period);
    return NextResponse.json(evidence, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return authErrorResponse(error);
  }
}
