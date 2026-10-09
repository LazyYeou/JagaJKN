import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { UserRole } from "@prisma/client";
import { prisma } from "@/repositories/prisma";
import { demoModeEnabled } from "@/demo/environment";
import type { SessionActor } from "@/auth/authorization";

export const SESSION_COOKIE_NAME = "jagajkn_demo_session";
export const SESSION_TTL_SECONDS = 4 * 60 * 60;

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 bytes.");
  }
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: string, nowSeconds = Math.floor(Date.now() / 1000)) {
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    exp: nowSeconds + SESSION_TTL_SECONDS,
  })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string, nowSeconds = Math.floor(Date.now() / 1000)) {
  const [payload, signature, ...extra] = token.split(".");
  if (!payload || !signature || extra.length > 0) return null;

  let expected: Buffer;
  let actual: Buffer;
  try {
    expected = Buffer.from(sign(payload), "base64url");
    actual = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const decoded: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!decoded || typeof decoded !== "object") return null;
    const session = decoded as { sub?: unknown; exp?: unknown };
    if (typeof session.sub !== "string" || typeof session.exp !== "number") return null;
    if (session.exp <= nowSeconds) return null;
    return session.sub;
  } catch {
    return null;
  }
}

export function constantTimeSecretMatches(expectedSecret: string | undefined, candidate: unknown) {
  if (!expectedSecret || Buffer.byteLength(expectedSecret) < 32 || typeof candidate !== "string") return false;
  if (candidate.length > 256 || expectedSecret.length > 256) return false;
  const expected = Buffer.from(expectedSecret, "utf8");
  const actual = Buffer.from(candidate, "utf8");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function getCurrentActor(): Promise<SessionActor | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const userId = verifySessionToken(token);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      displayName: true,
      role: true,
      companyId: true,
      workerId: true,
      company: { select: { name: true } },
      worker: { select: { companyId: true, workerCode: true, company: { select: { name: true } } } },
    },
  });
  if (!user) return null;

  const isWorker = user.role === UserRole.WORKER;
  return {
    id: user.id,
    displayName: user.displayName,
    role: user.role,
    companyId: isWorker ? user.worker?.companyId ?? null : user.companyId,
    companyName: isWorker ? user.worker?.company.name ?? null : user.company?.name ?? null,
    workerId: isWorker ? user.workerId : null,
    workerCode: isWorker ? user.worker?.workerCode ?? null : null,
  };
}
