import { NextRequest, NextResponse } from "next/server";
import { authErrorResponse } from "@/auth/api-response";
import { getCurrentActor } from "@/auth/session";
import { submitProtectedReport } from "@/services/p5-reports";

export async function POST(request: NextRequest) {
  try {
    const receipt = await submitProtectedReport(await getCurrentActor(), await request.json());
    return NextResponse.json({ accepted: true, ...receipt }, {
      status: receipt.duplicate ? 200 : 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
