import { NextRequest, NextResponse } from "next/server";
import { authErrorResponse } from "@/auth/api-response";
import { getCurrentActor } from "@/auth/session";
import { getAuditorLeaderboard } from "@/services/auditor-risk";

export async function GET(request: NextRequest) {
  try {
    const period = request.nextUrl.searchParams.get("period") ?? "2026-09";
    const leaderboard = await getAuditorLeaderboard(await getCurrentActor(), period);
    return NextResponse.json(leaderboard, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return authErrorResponse(error);
  }
}
