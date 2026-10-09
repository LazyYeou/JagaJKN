import { NextResponse } from "next/server";
import { authErrorResponse } from "@/auth/api-response";
import { getCurrentActor } from "@/auth/session";
import { getWorkerSummaryForActor } from "@/repositories/scoped";

export async function GET() {
  try {
    const worker = await getWorkerSummaryForActor(await getCurrentActor());
    if (!worker) return NextResponse.json({ error: "Data pekerja tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ worker }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return authErrorResponse(error);
  }
}
