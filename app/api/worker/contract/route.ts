import { NextRequest, NextResponse } from "next/server";
import { authErrorResponse } from "@/auth/api-response";
import { getCurrentActor } from "@/auth/session";
import { getContractHistoryForWorker } from "@/services/p1-contract";

export async function GET(request: NextRequest) {
  try {
    const detail = await getContractHistoryForWorker(
      await getCurrentActor(),
      request.nextUrl.searchParams.get("period") ?? undefined,
    );
    return NextResponse.json(detail, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return authErrorResponse(error);
  }
}
