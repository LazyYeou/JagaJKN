import { NextResponse } from "next/server";
import { authErrorResponse } from "@/auth/api-response";
import { getCurrentActor } from "@/auth/session";
import { listWorkersForHr } from "@/repositories/scoped";

export async function GET() {
  try {
    const workers = await listWorkersForHr(await getCurrentActor());
    return NextResponse.json({ workers }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return authErrorResponse(error);
  }
}
