import { NextRequest, NextResponse } from "next/server";
import { authErrorResponse } from "@/auth/api-response";
import { getCurrentActor } from "@/auth/session";
import { importDeductions } from "@/services/hr-evidence";

export async function POST(request: NextRequest) {
  try {
    const result = await importDeductions(await getCurrentActor(), await request.json());
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return authErrorResponse(error);
  }
}
