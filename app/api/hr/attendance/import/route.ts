import { NextRequest, NextResponse } from "next/server";
import { authErrorResponse } from "@/auth/api-response";
import { getCurrentActor } from "@/auth/session";
import { importAttendance } from "@/services/hr-evidence";

export async function POST(request: NextRequest) {
  try {
    const result = await importAttendance(await getCurrentActor(), await request.json());
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return authErrorResponse(error);
  }
}
