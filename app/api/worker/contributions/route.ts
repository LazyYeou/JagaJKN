import { NextResponse } from "next/server";
import { authErrorResponse } from "@/auth/api-response";
import { getCurrentActor } from "@/auth/session";
import { getWorkerContributionTimeline } from "@/services/worker-self-service";

export async function GET() {
  try {
    const timeline = await getWorkerContributionTimeline(await getCurrentActor());
    return NextResponse.json(timeline, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return authErrorResponse(error);
  }
}
