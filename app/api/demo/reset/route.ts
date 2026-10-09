import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { authErrorResponse } from "@/auth/api-response";
import { requireRole } from "@/auth/authorization";
import { getCurrentActor } from "@/auth/session";
import { demoModeEnabled } from "@/demo/environment";
import { prisma } from "@/repositories/prisma";
import { resetAndSeedDemoData } from "@/demo/seed-data";

export async function POST() {
  if (!demoModeEnabled()) {
    return NextResponse.json({ error: "Demo reset is disabled." }, { status: 404 });
  }

  try {
    requireRole(await getCurrentActor(), UserRole.DEMO_OPERATOR);
    const seed = await prisma.$transaction((tx) => resetAndSeedDemoData(tx));
    return NextResponse.json({ reset: true, seed }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return authErrorResponse(error);
  }
}
