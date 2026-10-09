import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { authErrorResponse } from "@/auth/api-response";
import { requireRole } from "@/auth/authorization";
import { getCurrentActor } from "@/auth/session";
import { demoModeEnabled } from "@/demo/environment";
import { InputValidationError } from "@/domain/errors";
import { assertPeriod } from "@/domain/period";
import { recalculateRiskForPeriod } from "@/services/p4-risk";

export async function POST(request: NextRequest) {
  if (!demoModeEnabled()) {
    return NextResponse.json({ error: "Demo recalculation is disabled." }, { status: 404 });
  }

  try {
    const actor = requireRole(await getCurrentActor(), UserRole.DEMO_OPERATOR);
    let period = "2026-09";
    try {
      const body: unknown = await request.json();
      if (body && typeof body === "object" && !Array.isArray(body) && "period" in body) {
        const candidate = (body as { period?: unknown }).period;
        assertPeriod(candidate);
        period = candidate;
      }
    } catch (error) {
      if (error instanceof SyntaxError) throw new InputValidationError("Format JSON tidak valid.");
      throw error;
    }

    requireRole(actor, UserRole.DEMO_OPERATOR);
    const result = await recalculateRiskForPeriod(period);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return authErrorResponse(error);
  }
}
