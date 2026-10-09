import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  constantTimeSecretMatches,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
} from "@/auth/session";
import { demoModeEnabled } from "@/demo/environment";
import { prisma } from "@/repositories/prisma";

export async function POST(request: NextRequest) {
  if (!demoModeEnabled()) {
    return NextResponse.json({ error: "Demo operator is disabled." }, { status: 404 });
  }

  let operatorKey: unknown;
  try {
    const body: unknown = await request.json();
    operatorKey = body && typeof body === "object"
      ? (body as { operatorKey?: unknown }).operatorKey
      : undefined;
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  if (!constantTimeSecretMatches(process.env.DEMO_OPERATOR_KEY, operatorKey)) {
    return NextResponse.json({ error: "Akses operator ditolak." }, { status: 403 });
  }

  try {
    const operator = await prisma.user.findFirst({
      where: { role: UserRole.DEMO_OPERATOR },
      select: { id: true },
    });
    if (!operator) return NextResponse.json({ error: "Akun operator demo belum tersedia." }, { status: 503 });

    const response = NextResponse.json({ authenticated: true, role: UserRole.DEMO_OPERATOR });
    response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(operator.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "Sesi operator belum dapat dibuat." }, { status: 503 });
  }
}
