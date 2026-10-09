import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { authErrorResponse } from "@/auth/api-response";
import { requireRole } from "@/auth/authorization";
import { getCurrentActor } from "@/auth/session";
import { getContractHistoryForHr } from "@/services/p1-contract";

type RouteContext = { params: Promise<{ workerId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { workerId } = await context.params;
    const actor = requireRole(await getCurrentActor(), UserRole.HR);
    const detail = await getContractHistoryForHr(actor, workerId);
    return NextResponse.json(detail, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return authErrorResponse(error);
  }
}
