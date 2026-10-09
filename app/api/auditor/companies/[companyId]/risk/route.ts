import { NextRequest, NextResponse } from "next/server";
import { authErrorResponse } from "@/auth/api-response";
import { getCurrentActor } from "@/auth/session";
import { getAuditorCompanyRisk } from "@/services/auditor-risk";

type RouteContext = { params: Promise<{ companyId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { companyId } = await context.params;
    const period = request.nextUrl.searchParams.get("period") ?? "2026-09";
    const detail = await getAuditorCompanyRisk(await getCurrentActor(), companyId, period);
    return NextResponse.json(detail, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return authErrorResponse(error);
  }
}
