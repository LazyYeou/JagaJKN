import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from "@/auth/session";
import { demoModeEnabled } from "@/demo/environment";
import { prisma } from "@/repositories/prisma";

export async function POST(request: NextRequest) {
  if (!demoModeEnabled()) {
    return NextResponse.json({ error: "Demo sign-in is disabled." }, { status: 404 });
  }

  let userId: unknown;
  try {
    const body: unknown = await request.json();
    userId = body && typeof body === "object" ? (body as { userId?: unknown }).userId : undefined;
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  if (typeof userId !== "string" || userId.length < 1 || userId.length > 100) {
    return NextResponse.json({ error: "Pilih akun demo yang valid." }, { status: 400 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        role: { in: [UserRole.HR, UserRole.WORKER, UserRole.AUDITOR] },
      },
      select: {
        id: true,
        role: true,
        company: { select: { name: true } },
      },
    });
    if (!user) return NextResponse.json({ error: "Akun demo tidak ditemukan." }, { status: 404 });

    const response = NextResponse.json({
      role: user.role,
      redirectTo: user.role === UserRole.HR ? "/hr" : user.role === UserRole.WORKER ? "/worker" : "/auditor",
      companyName: user.company?.name ?? null,
    });
    response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "Sesi demo belum dapat dibuat. Periksa konfigurasi server." }, { status: 503 });
  }
}
