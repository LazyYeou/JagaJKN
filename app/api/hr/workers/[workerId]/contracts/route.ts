import { NextRequest, NextResponse } from "next/server";
import { authErrorResponse } from "@/auth/api-response";
import { getCurrentActor } from "@/auth/session";
import { publishContractVersion } from "@/services/p1-contract";

type RouteContext = { params: Promise<{ workerId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { workerId } = await context.params;
    const input: unknown = await request.json();
    const result = await publishContractVersion(await getCurrentActor(), workerId, input);
    return NextResponse.json({ published: true, ...result }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return authErrorResponse(error);
  }
}
