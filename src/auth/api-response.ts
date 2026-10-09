import { NextResponse } from "next/server";
import { AuthorizationError } from "@/auth/authorization";
import { DomainError } from "@/domain/errors";

export function authErrorResponse(error: unknown) {
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "Format JSON tidak valid.", code: "VALIDATION_ERROR" }, { status: 400 });
  }
  if (error instanceof AuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof DomainError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  if (error && typeof error === "object" && "code" in error
    && ["P2002", "P2003", "P2034"].includes(String(error.code))) {
    return NextResponse.json({ error: "Perubahan bertentangan dengan data terbaru; muat ulang lalu coba kembali.", code: "CONFLICT" }, { status: 409 });
  }
  return NextResponse.json({ error: "Permintaan tidak dapat diproses." }, { status: 500 });
}
