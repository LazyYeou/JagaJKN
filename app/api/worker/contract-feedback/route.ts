import { NextRequest, NextResponse } from "next/server";
import { authErrorResponse } from "@/auth/api-response";
import { getCurrentActor } from "@/auth/session";
import { submitContractFeedback } from "@/services/p1-contract";

export async function POST(request: NextRequest) {
  try {
    const input: unknown = await request.json();
    const feedback = await submitContractFeedback(await getCurrentActor(), input);
    return NextResponse.json({ submitted: true, feedback }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return authErrorResponse(error);
  }
}
