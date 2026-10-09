import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { demoModeEnabled } from "@/demo/environment";
import { prisma } from "@/repositories/prisma";

export async function GET() {
  if (!demoModeEnabled()) {
    return NextResponse.json({ error: "Demo sign-in is disabled." }, { status: 404 });
  }

  try {
    const accounts = await prisma.user.findMany({
      where: { role: { in: [UserRole.HR, UserRole.WORKER, UserRole.AUDITOR] } },
      select: {
        id: true,
        displayName: true,
        role: true,
        company: { select: { name: true } },
      },
      orderBy: [{ role: "asc" }, { displayName: "asc" }],
    });

    return NextResponse.json({
      accounts: accounts.map((account) => ({
        id: account.id,
        displayName: account.displayName,
        role: account.role,
        companyName: account.company?.name ?? null,
      })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Akun demo belum tersedia. Siapkan database dan seed terlebih dahulu." }, { status: 503 });
  }
}
